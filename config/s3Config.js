const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Create S3 instance
const s3 = new AWS.S3();

// S3 bucket configurations
const bucketConfig = {
    userUploads: process.env.AWS_BUCKET_USER_UPLOADS || 'user-uploads',
    questionBank: process.env.AWS_BUCKET_QUESTION_BANK || 'question-bank',
    reports: process.env.AWS_BUCKET_REPORTS || 'analytics-reports'
};

// Helper function to upload file to S3
const uploadToS3 = async (file, bucket, key) => {
    try {
        const params = {
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        };

        const result = await s3.upload(params).promise();
        return result.Location;
    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error('Failed to upload file to S3');
    }
};

// Helper function to delete file from S3
const deleteFromS3 = async (bucket, key) => {
    try {
        const params = {
            Bucket: bucket,
            Key: key
        };

        await s3.deleteObject(params).promise();
        return true;
    } catch (error) {
        console.error('S3 delete error:', error);
        throw new Error('Failed to delete file from S3');
    }
};

module.exports = {
    s3,
    bucketConfig,
    uploadToS3,
    deleteFromS3
};