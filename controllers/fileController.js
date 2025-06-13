const { uploadToS3, deleteFromS3, bucketConfig } = require('../config/s3Config');
const path = require('path');
const fs = require('fs').promises;

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

        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            path: file.path
        }));

        res.status(200).json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error handling user upload:', error);
        res.status(500).json({ message: 'Error processing file upload' });
    }
};

// Handle question bank uploads
const handleQuestionBankUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            path: file.path
        }));

        // TODO: Process question bank files and extract questions

        res.status(200).json({
            message: 'Question bank files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error handling question bank upload:', error);
        res.status(500).json({ message: 'Error processing question bank upload' });
    }
};

// Handle reports and analytics exports
const handleReportUpload = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            path: file.path
        }));

        res.status(200).json({
            message: 'Report files uploaded successfully',
            files: uploadedFiles
        });
    } catch (error) {
        console.error('Error handling report upload:', error);
        res.status(500).json({ message: 'Error processing report upload' });
    }
};

// Delete file from S3
const deleteFile = async (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ message: 'Filename is required' });
        }

        const filePath = path.join('uploads', filename);
        await fs.unlink(filePath);

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'File not found' });
        }
        res.status(500).json({ message: 'Error deleting file' });
    }
};

module.exports = {
    handleUserUpload,
    handleQuestionBankUpload,
    handleReportUpload,
    deleteFile
};