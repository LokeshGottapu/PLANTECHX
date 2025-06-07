const { uploadToS3, deleteFromS3, bucketConfig } = require('../config/s3Config');
const path = require('path');

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
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Validate AWS S3 configuration
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
            throw new Error('AWS S3 configuration is incomplete');
        }

        const uploadResults = await Promise.all(
            req.files.map(async (file) => {
                try {
                    const fileKey = generateFileKey(file, 'user-uploads');
                    const fileUrl = await uploadToS3(file, bucketConfig.userUploads, fileKey);
                    return { fileName: file.originalname, fileUrl, status: 'success' };
                } catch (uploadError) {
                    console.error(`Error uploading ${file.originalname}:`, uploadError);
                    return {
                        fileName: file.originalname,
                        status: 'error',
                        error: uploadError.code === 'NoSuchBucket' ? 'Invalid bucket configuration' : 'Upload failed'
                    };
                }
            })
        );

        const hasErrors = uploadResults.some(result => result.status === 'error');
        res.status(hasErrors ? 207 : 200).json({
            message: hasErrors ? 'Some files failed to upload' : 'Files uploaded successfully',
            files: uploadResults
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            message: 'Error uploading files',
            error: error.message === 'AWS S3 configuration is incomplete' ? 
                'Server configuration error' : 'Internal server error'
        });
    }
};

// Handle question bank uploads
const handleQuestionBankUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadResults = await Promise.all(
            req.files.map(async (file) => {
                const fileKey = generateFileKey(file, 'question-bank');
                const fileUrl = await uploadToS3(file, bucketConfig.questionBank, fileKey);
                return { fileName: file.originalname, fileUrl };
            })
        );

        res.status(200).json({
            message: 'Question bank files uploaded successfully',
            files: uploadResults
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading question bank files' });
    }
};

// Handle reports and analytics exports
const handleReportUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadResults = await Promise.all(
            req.files.map(async (file) => {
                const fileKey = generateFileKey(file, 'reports');
                const fileUrl = await uploadToS3(file, bucketConfig.reports, fileKey);
                return { fileName: file.originalname, fileUrl };
            })
        );

        res.status(200).json({
            message: 'Report files uploaded successfully',
            files: uploadResults
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading report files' });
    }
};

// Delete file from S3
const deleteFile = async (req, res) => {
    try {
        const { bucket, key } = req.body;
        
        if (!bucket || !key) {
            return res.status(400).json({ message: 'Bucket and key are required' });
        }

        await deleteFromS3(bucket, key);
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
};

module.exports = {
    handleUserUpload,
    handleQuestionBankUpload,
    handleReportUpload,
    deleteFile
};