const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const FileType = require('file-type');
const ClamScan = require('clamscan');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Initialize ClamAV scanner with proper error handling
let ClamAV;
try {
    const logDir = path.join(process.cwd(), 'logs');
    const quarantineDir = path.join(process.cwd(), 'quarantine');
    
    // Ensure directories exist
    [logDir, quarantineDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    ClamAV = new ClamScan({
        removeInfected: true,
        quarantineInfected: quarantineDir,
        scanLog: path.join(logDir, 'scan.log'),
        debugMode: process.env.NODE_ENV === 'development',
        preference: 'clamdscan',
        clamscan: {
            path: '/usr/bin/clamscan',
            db: '/var/lib/clamav',
            removeInfected: true
        },
        clamdscan: {
            socket: '/var/run/clamav/clamd.ctl',
            host: 'localhost',
            port: 3310
        }
    });
} catch (error) {
    console.error('ClamAV initialization error:', error);
    throw new Error('Virus scanner initialization failed');
}

// Configure multer storage with proper temp file handling
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            if (!fs.existsSync(tempDir)) {
                await fs.promises.mkdir(tempDir, { recursive: true });
            }
            cb(null, tempDir);
        } catch (error) {
            cb(new Error('Failed to create temp directory'));
        }
    },
    filename: (req, file, cb) => {
        try {
            const uniqueSuffix = crypto.randomBytes(16).toString('hex');
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            cb(null, `${uniqueSuffix}-${sanitizedName}`);
        } catch (error) {
            cb(new Error('Failed to generate filename'));
        }
    }
});

// File size limits with proper validation
const fileSizeLimits = {
    'user-uploads': 5 * 1024 * 1024, // 5MB
    'question-bank': 10 * 1024 * 1024, // 10MB
    'reports': 15 * 1024 * 1024, // 15MB
    'profile-images': 2 * 1024 * 1024 // 2MB
};

// File validation middleware
const fileFilter = (req, file, cb) => {
    let tempFilePath = null;
    let writeStream = null;

    const cleanup = async () => {
        if (writeStream) {
            writeStream.end();
        }
        if (tempFilePath) {
            await unlink(tempFilePath).catch(console.error);
        }
    };

    try {
        const uploadType = req.params.uploadType || req.path.split('/')[2] || 'user-uploads';
        
        if (!mimeTypes[uploadType]) {
            throw new Error(`Invalid upload type: ${uploadType}`);
        }

        const sizeLimit = fileSizeLimits[uploadType];
        if (!file.size) {
            file.size = 0;
        }

        if (file.size > sizeLimit) {
            throw new Error(`File size exceeds limit of ${sizeLimit / (1024 * 1024)}MB`);
        }

        // Store the file temporarily for validation
        tempFilePath = path.join(tempDir, `temp-${Date.now()}-${file.originalname}`);
        writeStream = fs.createWriteStream(tempFilePath);
        const chunks = [];

    file.stream.on('data', chunk => {
        chunks.push(chunk);
        writeStream.write(chunk);
        file.size += chunk.length;

        if (file.size > sizeLimit) {
            file.stream.destroy(new Error(`File size exceeds limit of ${sizeLimit / (1024 * 1024)}MB`));
        }
    });

    file.stream.on('end', async () => {
        writeStream.end();
        const buffer = Buffer.concat(chunks);

        try {
            // Validate actual file content type
            const actualMimeType = await validateFileType(tempFilePath);
            if (!actualMimeType || !mimeTypes[uploadType].includes(actualMimeType)) {
                await unlink(tempFilePath).catch(console.error);
                cb(new Error(`Invalid file type. Allowed types for ${uploadType}: ${mimeTypes[uploadType].join(', ')}`), false);
                return;
            }

            // Scan for malware
            if (ClamAV) {
                const isSafe = await scanFile(tempFilePath);
                if (!isSafe) {
                    await unlink(tempFilePath).catch(console.error);
                    cb(new Error('File failed security scan'), false);
                    return;
                }
            }

            // Calculate file hash for integrity check
            const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
            file.hash = fileHash;

            await unlink(tempFilePath).catch(console.error);
            cb(null, true);
        } catch (error) {
            await unlink(tempFilePath).catch(console.error);
            console.error('File validation error:', error);
            cb(error, false);
        }
    });

    file.stream.on('error', async (error) => {
        await cleanup();
        cb(error, false);
    });
});

// Strict MIME type validation map
const mimeTypes = {
    'user-uploads': ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'question-bank': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'reports': ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'profile-images': ['image/jpeg', 'image/png']
};

// Enhanced file type validation with magic numbers
async function validateFileType(filePath) {
    try {
        const buffer = await promisify(fs.readFile)(filePath);
        const fileInfo = await FileType.fromBuffer(buffer);
        if (!fileInfo) return null;

        // Additional magic number validation for common file types
        const magicNumbers = {
            'image/jpeg': ['FFD8FF'],
            'image/png': ['89504E47'],
            'application/pdf': ['25504446'],
            'application/msword': ['D0CF11E0'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504B0304'],
            'application/vnd.ms-excel': ['D0CF11E0'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['504B0304'],
            'text/csv': ['EFBBBF', '2C', '0D0A']
        };

        const fileType = fileInfo.mime;
        const magicNumber = magicNumbers[fileType];

        // For CSV files or if no magic number validation is needed
        if (!magicNumber) return fileType;

        // Convert buffer to hex for comparison
        const fileHeader = buffer.slice(0, 4).toString('hex').toUpperCase();
        return magicNumber.some(magic => fileHeader.startsWith(magic)) ? fileType : null;
    } catch (error) {
        console.error('File type validation error:', error);
        return null;
    }
}

// Enhanced malware scanning with proper cleanup
async function scanFile(filePath) {
    if (!ClamAV) {
        console.warn('ClamAV not initialized, skipping virus scan');
        return true;
    }

    try {
        const { isInfected, viruses } = await ClamAV.isInfected(filePath);
        if (isInfected) {
            const virusNames = viruses.join(', ');
            console.error(`Malware detected in file: ${virusNames}`);
            await unlink(filePath).catch(error => {
                console.error('Error deleting infected file:', error);
            });
            throw new Error(`Security threat detected: ${virusNames}`);
        }
        return true;
    } catch (error) {
        if (error.message.includes('Security threat detected')) {
            throw error;
        }
        console.error('Malware scan error:', error);
        await unlink(filePath).catch(console.error);
        throw new Error('File security scan failed');
    }
}

// Configure multer upload settings with enhanced error handling
const upload = multer({
    storage,
    fileFilter,
    limits: {
        files: 5, // Maximum 5 files per upload
        fileSize: Math.max(...Object.values(fileSizeLimits)) // Set to largest allowed size
    }
});

// Enhanced error handling middleware with detailed messages
upload.onError = function (err, next) {
    let errorMessage = '';
    
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_COUNT':
                errorMessage = 'Upload limit exceeded. Maximum 5 files allowed per upload.';
                break;
            case 'LIMIT_FILE_SIZE':
                errorMessage = `File size too large. Please check size limits for your upload type: ${Object.entries(fileSizeLimits)
                    .map(([type, size]) => `${type}: ${size / (1024 * 1024)}MB`)
                    .join(', ')}`;
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                errorMessage = 'Invalid form field. Please use "files" as the field name for uploads.';
                break;
            default:
                errorMessage = `Upload error: ${err.message}. Please verify upload requirements.`;
        }
    } else if (err.message.includes('Security threat')) {
        errorMessage = 'File rejected: Security scan failed. Please ensure your file is safe and try again.';
    } else if (err.message.includes('Invalid file type')) {
        errorMessage = err.message;
    } else if (err.message.includes('File size exceeds')) {
        errorMessage = err.message;
    } else {
        errorMessage = `Upload failed: ${err.message}. If this persists, please contact support.`;
    }

    console.error('File upload error:', { error: err, details: errorMessage });
    next(new Error(errorMessage));
};

module.exports = upload;