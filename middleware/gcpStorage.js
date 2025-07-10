const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { format } = require('util');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'storage-operations.log' })
    ]
});

// Define folder structure
const FOLDERS = {
    STUDY_MATERIALS: 'study-materials',
    EXAM_PAPERS: 'exam-papers',
    CERTIFICATES: 'certificates',
    REPORTS: 'reports',
    USER_UPLOADS: 'user-uploads',
    VIDEOS: 'videos'
};

// Initialize storage
const storage = new Storage({
    keyFilename: process.env.GCP_KEY_FILE,
    projectId: process.env.GCP_PROJECT_ID
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);

/**
 * Uploads a file to Google Cloud Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} folder - Destination folder in GCS
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadFileToGCS = async (buffer, filename, folder) => {
    try {
        const sanitizedFilename = filename.replace(/\s+/g, '-');
        const destination = `${folder}/${Date.now()}-${sanitizedFilename}`;
        const file = bucket.file(destination);

        await file.save(buffer, {
            metadata: {
                contentType: path.extname(filename).toLowerCase() === '.pdf' ? 'application/pdf' : 'application/octet-stream'
            }
        });

        await file.makePublic();
        const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${file.name}`);

        logger.info('File uploaded successfully', {
            filename: sanitizedFilename,
            folder,
            destination,
            size: buffer.length
        });

        return publicUrl;
    } catch (error) {
        logger.error('File upload failed', {
            filename,
            folder,
            error: error.message
        });
        throw error;
    }
};

/**
 * Gets the public URL of a file
 * @param {string} filename - File name
 * @param {string} folder - Folder name
 * @returns {string|undefined} Public URL
 */
const getPublicUrl = (filename, folder) => {
    if (!bucket || !bucket.name || !filename || !folder) {
        logger.warn('Missing parameters for getPublicUrl', {
            bucket: !!bucket,
            name: !!bucket && !!bucket.name,
            filename: !!filename,
            folder: !!folder
        });
        return undefined;
    }
    return format(`https://storage.googleapis.com/${bucket.name}/${folder}/${filename}`);
};

/**
 * Deletes a file from Google Cloud Storage
 * @param {string} filename - File name
 * @param {string} folder - Folder name
 * @returns {Promise<void>}
 */
const deleteFile = async (filename, folder) => {
    if (!bucket || !filename || !folder) {
        logger.warn('Missing parameters for deleteFile', {
            bucket: !!bucket,
            filename: !!filename,
            folder: !!folder
        });
        throw new Error('Missing parameters for deleteFile');
    }

    try {
        const file = bucket.file(`${folder}/${filename}`);
        const [exists] = await file.exists();

        if (!exists) {
            logger.warn('File not found', {
                filename,
                folder
            });
            throw new Error('File not found');
        }

        await file.delete();

        logger.info('File deleted successfully', {
            filename,
            folder
        });
    } catch (error) {
        logger.error('File deletion failed', {
            filename,
            folder,
            error: error.message
        });
        throw error;
    }
};

/**
 * Streams a file to the client
 * @param {Object} res - Express response object
 * @param {string} filename - File name
 * @param {string} folder - Folder name
 * @returns {Promise<void>}
 */
const streamFile = async (res, filename, folder) => {
    try {
        if (!bucket) {
            throw new Error('Missing bucket');
        }

        if (!filename || !folder) {
            throw new Error('Missing filename or folder');
        }

        const file = bucket.file(`${folder}/${filename}`);
        const [exists] = await file.exists();

        if (!exists) {
            throw new Error('File not found');
        }

        const stream = file.createReadStream();
        const fileMetadata = await file.getMetadata();

        if (!fileMetadata || !fileMetadata[0] || !fileMetadata[0].contentType) {
            throw new Error('Missing file metadata');
        }

        res.setHeader('Content-Type', fileMetadata[0].contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        stream.pipe(res);

        logger.info('File streaming started', {
            filename,
            folder,
            contentType: fileMetadata[0].contentType
        });
    } catch (error) {
        logger.error('File streaming failed', {
            filename,
            folder,
            error: error.message
        });
        throw error;
    }
};

/**
 * Generates a signed URL for temporary access
 * @param {string} filename - File name
 * @param {string} folder - Folder name
 * @param {number} expiresInHours - URL expiration time in hours
 * @returns {Promise<string>} Signed URL
 */
const generateSignedUrl = async (filename, folder, expiresInHours = 1) => {
    try {
        if (!bucket) {
            throw new Error('Bucket is null or undefined');
        }

        if (!filename || !folder) {
            throw new Error('Missing filename or folder');
        }

        const file = bucket.file(`${folder}/${filename}`);
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiresInHours * 60 * 60 * 1000
        });

        if (!url) {
            throw new Error('Signed URL is null or undefined');
        }

        logger.info('Signed URL generated', {
            filename,
            folder,
            expiresInHours
        });

        return url;
    } catch (error) {
        logger.error('Signed URL generation failed', {
            filename,
            folder,
            error: error.message
        });
        throw error;
    }
};

/**
 * Middleware for handling file uploads to GCS
 * @param {string} folderName - Destination folder
 * @returns {Function} Express middleware
 */
const uploadToGCP = (folderName) => {
    return async (req, res, next) => {
        if (!req || !req.file) {
            logger.warn('Request or file is null or undefined', { reqExists: !!req, fileExists: !!req?.file });
            return next();
        }

        try {
            const publicUrl = await uploadFileToGCS(
                req.file.buffer,
                req.file.originalname,
                folderName
            );

            if (!publicUrl) {
                throw new Error('Failed to obtain public URL');
            }

            req.fileUrl = publicUrl;
            next();
        } catch (error) {
            logger.error('Upload middleware error', {
                folderName,
                filename: req.file?.originalname,
                error: error.message
            });

            return res.status(500).json({
                status: 'error',
                message: 'File upload failed',
                code: 'STORAGE_ERROR',
                details: error.message
            });
        }
    };
};

module.exports = {
    uploadToGCP,
    uploadFileToGCS,
    getPublicUrl,
    deleteFile,
    streamFile,
    generateSignedUrl,
    FOLDERS
};