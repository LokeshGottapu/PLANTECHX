const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Configure AWS S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// S3 bucket configurations
const bucketConfig = {
    userUploads: process.env.AWS_BUCKET_USER_UPLOADS || 'user-uploads',
    questionBank: process.env.AWS_BUCKET_QUESTION_BANK || 'question-bank',
    reports: process.env.AWS_BUCKET_REPORTS || 'analytics-reports'
};

// Helper function to upload file to S3
const uploadToS3 = async (file, bucket, key) => {
    try {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        });

        await s3Client.send(command);
        return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error('Failed to upload file to S3');
    }
};

// Helper function to delete file from S3
const deleteFromS3 = async (bucket, key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        });

        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error('S3 delete error:', error);
        throw new Error('Failed to delete file from S3');
    }
};

module.exports = {
    s3Client,
    bucketConfig,
    uploadToS3,
    deleteFromS3
};