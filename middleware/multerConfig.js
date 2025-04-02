const multer = require('multer');

// Configure multer storage
const storage = multer.memoryStorage(); // Use memory storage for S3 uploads

// File size limits for different upload types (in bytes)
const fileSizeLimits = {
    'user-uploads': 5 * 1024 * 1024, // 5MB
    'question-bank': 10 * 1024 * 1024, // 10MB
    'reports': 15 * 1024 * 1024 // 15MB
};

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
    // Define allowed file types for different upload types
    const allowedTypes = {
        'user-uploads': ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'question-bank': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'reports': ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    };

    const uploadType = req.params.uploadType || 'user-uploads';
    
    if (!allowedTypes[uploadType]) {
        cb(new Error('Invalid upload type'), false);
        return;
    }

    if (!allowedTypes[uploadType].includes(file.mimetype)) {
        cb(new Error(`Invalid file type. Allowed types for ${uploadType}: ${allowedTypes[uploadType].join(', ')}`), false);
        return;
    }

    const sizeLimit = fileSizeLimits[uploadType];
    if (file.size > sizeLimit) {
        cb(new Error(`File size exceeds limit of ${sizeLimit / (1024 * 1024)}MB`), false);
        return;
    }

    cb(null, true);
};

// Configure multer upload settings
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        files: 5 // Maximum 5 files per upload
    }
});

// Error handling middleware
upload.onError = function (err, next) {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_COUNT':
                next(new Error('Too many files uploaded. Maximum is 5 files per upload.'));
                break;
            case 'LIMIT_FILE_SIZE':
                next(new Error(`File size exceeds the allowed limit. Please check the size limits for your upload type.`));
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                next(new Error('Unexpected field name in upload form. Please use "files" as the field name.'));
                break;
            default:
                next(new Error(`Upload error: ${err.message}. Please ensure your upload meets all requirements.`));
        }
    } else if (err.message.includes('Invalid file type')) {
        next(new Error(`File type validation failed: ${err.message}`));
    } else if (err.message.includes('File size exceeds')) {
        next(new Error(`File size validation failed: ${err.message}`));
    } else {
        next(new Error(`File upload failed: ${err.message}. Please try again or contact support if the issue persists.`));
    }
};

module.exports = upload;