const { uploadToS3, deleteFromS3, bucketConfig } = require('../config/s3Config');
const path = require('path');
const crypto = require('crypto');

// Helper function to generate unique file key
const generateFileKey = (file, uploadType) => {
    const timestamp = Date.now();
    const uniqueSuffix = `${timestamp}-${Math.round(Math.random() * 1E9)}`;
    return `${uploadType}/${uniqueSuffix}-${file.originalname}`;
};

// Handle user bulk uploads
const handleUserUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                message: 'No files uploaded',
                requestId: crypto.randomUUID()
            });
        }

        const uploadedFiles = await Promise.all(req.files.map(async (file) => {
            const key = generateFileKey(file, 'user-uploads');
            const url = await uploadToS3(file, bucketConfig.userUploads, key);
            
            return {
                filename: file.originalname,
                key: key,
                size: file.size,
                url: url
            };
        }));

        res.status(200).json({
            message: 'Files uploaded successfully',
            files: uploadedFiles,
            requestId: crypto.randomUUID()
        });
    } catch (error) {
        console.error('Error handling user upload:', error);
        res.status(500).json({ 
            message: 'Error processing file upload',
            error: error.message,
            requestId: crypto.randomUUID()
        });
    }
};

// Handle question bank uploads
const handleQuestionBankUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                message: 'No files uploaded',
                requestId: crypto.randomUUID()
            });
        }

        const uploadedFiles = await Promise.all(req.files.map(async (file) => {
            const key = generateFileKey(file, 'question-bank');
            const url = await uploadToS3(file, bucketConfig.questionBank, key);
            
            return {
                filename: file.originalname,
                key: key,
                size: file.size,
                url: url
            };
        }));

        res.status(200).json({
            message: 'Question bank files uploaded successfully',
            files: uploadedFiles,
            requestId: crypto.randomUUID()
        });
    } catch (error) {
        console.error('Error handling question bank upload:', error);
        res.status(500).json({ 
            message: 'Error processing question bank upload',
            error: error.message,
            requestId: crypto.randomUUID()
        });
    }
};

// Handle reports and analytics exports
const handleReportUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                message: 'No files uploaded',
                requestId: crypto.randomUUID()
            });
        }

        const uploadedFiles = await Promise.all(req.files.map(async (file) => {
            const key = generateFileKey(file, 'reports');
            const url = await uploadToS3(file, bucketConfig.reports, key);
            
            return {
                filename: file.originalname,
                key: key,
                size: file.size,
                url: url
            };
        }));

        res.status(200).json({
            message: 'Report files uploaded successfully',
            files: uploadedFiles,
            requestId: crypto.randomUUID()
        });
    } catch (error) {
        console.error('Error handling report upload:', error);
        res.status(500).json({ 
            message: 'Error processing report upload',
            error: error.message,
            requestId: crypto.randomUUID()
        });
    }
};

// Delete file from S3
const deleteFile = async (req, res) => {
    try {
        const { key, bucket } = req.body;
        if (!key || !bucket) {
            return res.status(400).json({ 
                message: 'File key and bucket are required',
                requestId: crypto.randomUUID()
            });
        }

        await deleteFromS3(bucket, key);
        res.status(200).json({ 
            message: 'File deleted successfully',
            requestId: crypto.randomUUID()
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ 
            message: 'Error deleting file',
            error: error.message,
            requestId: crypto.randomUUID()
        });
    }
};

module.exports = {
    handleUserUpload,
    handleQuestionBankUpload,
    handleReportUpload,
    deleteFile
};