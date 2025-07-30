const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const unzipper = require('unzipper');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { uploadToS3, deleteFromS3, bucketConfig } = require('../config/s3Config');

// Helper function to generate unique file key
const generateFileKey = (file, uploadType) => {
    if (!file) {
        throw new Error('generateFileKey: File is null/undefined');
    }
    if (!file.originalname) {
        throw new Error('generateFileKey: file.originalname is null/undefined');
    }
    if (!uploadType) {
        throw new Error('generateFileKey: uploadType is null/undefined');
    }

    try {
        const timestamp = Date.now();
        const uniqueSuffix = `${timestamp}-${Math.round(Math.random() * 1E9)}`;
        return `${uploadType}/${uniqueSuffix}-${file.originalname}`;
    } catch (error) {
        console.error('generateFileKey error:', error);
        throw error;
    }
};

// Handle user bulk uploads
const handleUserUpload = async (req, res) => {
    try {
        if (!req || !req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ 
                message: 'No files uploaded',
                requestId: crypto.randomUUID()
            });
        }

        const uploadedFiles = await Promise.all(req.files.map(async (file) => {
            if (!file || !file.originalname || typeof file.originalname !== 'string') {
                throw new Error('handleUserUpload: File or file.originalname is null/undefined or not a string');
            }

            const key = generateFileKey(file, 'user-uploads');
            const url = await uploadToS3(file, bucketConfig.userUploads, key);
            
            return {
                filename: file.originalname,
                key: key,
                size: file.size,
                url: url
            };
        }));

        if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
            throw new Error('handleUserUpload: No files uploaded successfully');
        }

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
        if (!req || !req.files || req.files.length === 0) {
            return res.status(400).json({ 
                message: 'No files uploaded',
                requestId: crypto.randomUUID()
            });
        }

        const uploadedFiles = await Promise.all(req.files.map(async (file) => {
            if (!file || !file.originalname || typeof file.originalname !== 'string') {
                throw new Error(`handleQuestionBankUpload: File or file.originalname is null/undefined or not a string for file ${file.originalname}`);
            }

            const key = generateFileKey(file, 'question-bank');
            const url = await uploadToS3(file, bucketConfig.questionBank, key);
            
            return {
                filename: file.originalname,
                key: key,
                size: file.size,
                url: url
            };
        }));

        if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
            throw new Error('handleQuestionBankUpload: No files uploaded successfully');
        }

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
        if (!req || !req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({ 
                message: 'No files uploaded',
                requestId: crypto.randomUUID()
            });
        }

        const uploadedFiles = await Promise.all(req.files.map(async (file) => {
            if (!file || !file.originalname || typeof file.originalname !== 'string') {
                throw new Error('handleReportUpload: File or file.originalname is null/undefined or not a string');
            }

            const key = generateFileKey(file, 'reports');
            const url = await uploadToS3(file, bucketConfig.reports, key);

            return {
                filename: file.originalname,
                key: key,
                size: file.size,
                url: url
            };
        }));

        if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
            throw new Error('handleReportUpload: No files uploaded successfully');
        }

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
        if (!req || !req.body) {
            return res.status(400).json({
                message: 'Invalid request',
                requestId: crypto.randomUUID()
            });
        }

        const { key, bucket } = req.body;

        if (!key || !bucket) {
            return res.status(400).json({
                message: 'File key and bucket are required',
                requestId: crypto.randomUUID()
            });
        }

        if (typeof key !== 'string' || typeof bucket !== 'string') {
            return res.status(400).json({
                message: 'File key and bucket must be strings',
                requestId: crypto.randomUUID()
            });
        }

        if (!bucketConfig || !bucketConfig[bucket]) {
            return res.status(400).json({
                message: `Invalid bucket: ${bucket}`,
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
            error: error?.message || 'Unknown error',
            requestId: crypto.randomUUID()
        });
    }
};

// Helper: Save file metadata to DB
const saveFileMetadata = async (metadata) => {
    if (!metadata || !metadata.key || !metadata.filename || !metadata.url || !metadata.size || !metadata.uploader_id || !metadata.uploader_role || !metadata.type) {
        throw new Error('saveFileMetadata: Missing required metadata');
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            `INSERT INTO files (key, filename, url, size, uploader_id, uploader_role, type, tags, access, topic, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                metadata.key,
                metadata.filename,
                metadata.url,
                metadata.size,
                metadata.uploader_id,
                metadata.uploader_role,
                metadata.type,
                metadata.tags || null,
                metadata.access || 'public',
                metadata.topic || null
            ]
        );
    } catch (error) {
        console.error('Error saving file metadata:', error);
        throw new Error('Failed to save file metadata');
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Helper: Check file access
const checkFileAccess = (user, file) => {
    if (!user) {
        throw new Error('checkFileAccess: User is null or undefined');
    }
    if (!file) {
        throw new Error('checkFileAccess: File is null or undefined');
    }

    if (user.role === 'admin') return true;

    if (user.role === 'faculty') {
        if (file.uploader_role === 'faculty' && user.id === file.uploader_id) return true;
        if (file.access === 'faculty' && user.collegeId === file.uploader_college_id) return true;
    }

    if (user.role === 'student') {
        if (file.access === 'public') return true;
        if (file.access === 'restricted' && Array.isArray(file.allowed_users) && file.allowed_users.includes(user.id)) return true;
    }
    return false;
};

// Fetch all files (with role-based access)
const getFiles = async (req, res) => {
    let connection = null;
    try {
        const user = req.user;
        if (!user || !user.role || !user.id || !user.collegeId) {
            throw new Error('User is null or undefined or missing required fields');
        }

        const { role, id, collegeId } = user;
        connection = await mysql.createConnection(dbConfig);
        let query = 'SELECT * FROM files';
        let params = [];
        if (role === 'faculty') {
            query += ' WHERE uploader_id = ? OR access IN ("public", "faculty")';
            params.push(id);
        } else if (role === 'student') {
            query += ' WHERE access = "public" OR FIND_IN_SET(?, allowed_users)';
            params.push(id);
        }
        // Admin sees all
        const [files] = await connection.execute(query, params);
        if (!files || files.length === 0) {
            throw new Error('No files found');
        }
        await connection.end();
        res.json(files);
    } catch (error) {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
        res.status(500).json({ message: 'Error fetching files', error: error.message });
    }
};

// Fetch a specific file’s metadata or download link (with access check)
const getFileById = async (req, res) => {
    let connection = null;
    try {
        const { fileId } = req.params;
        const user = req.user;
        if (!fileId || !user || !user.id || !user.role || !user.collegeId) {
            return res.status(400).json({ message: 'File ID and user data are required' });
        }
        
        connection = await mysql.createConnection(dbConfig);
        const [files] = await connection.execute('SELECT * FROM files WHERE id = ?', [fileId]);
        
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        const file = files[0];
        if (!file || !file.uploader_id || !file.access || !file.allowed_users) {
            throw new Error('File data is incomplete');
        }
        
        if (!checkFileAccess(user, file)) {
            return res.status(403).json({ message: 'Not authorized to access this file' });
        }
        
        res.json(file);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'Error fetching file', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Update file metadata (rename or update tags)
const updateFileMetadata = async (req, res) => {
    let connection = null;
    try {
        const { fileId } = req.params || {};
        const { filename, tags, topic } = req.body || {};
        const user = req.user;
        
        if (!fileId || !user) {
            return res.status(400).json({ message: 'File ID and user are required' });
        }

        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            return res.status(500).json({ message: 'Database connection failed' });
        }

        const [files] = await connection.execute('SELECT * FROM files WHERE id = ?', [fileId]);
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        const file = files[0];
        if (user.role !== 'admin' && file.uploader_id !== user.id) {
            return res.status(403).json({ message: 'Not authorized to update this file' });
        }

        const fields = [];
        const values = [];
        if (filename) { fields.push('filename = ?'); values.push(filename); }
        if (tags) { fields.push('tags = ?'); values.push(tags); }
        if (topic) { fields.push('topic = ?'); values.push(topic); }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(fileId);
        await connection.execute(
            `UPDATE files SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'File metadata updated' });
    } catch (error) {
        console.error('Error updating file metadata:', error);
        res.status(500).json({ message: 'Error updating file metadata', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Filter files by type or tag
const getFilesByTypeOrTag = async (req, res) => {
    let connection;
    try {
        const { type, tag } = req.query;
        if (!type && !tag) {
            return res.status(400).json({ message: 'type or tag is required' });
        }

        let query = 'SELECT * FROM files WHERE 1=1';
        const params = [];
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }
        if (tag) {
            query += ' AND FIND_IN_SET(?, tags)';
            params.push(tag);
        }

        connection = await mysql.createConnection(dbConfig);
        const [files] = await connection.execute(query, params);

        if (!files) {
            throw new Error('No files found');
        }

        await connection.end();
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Error filtering files', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Grant access to a file for specific users/faculty
const grantAccessToFile = async (req, res) => {
    let connection = null;
    try {
        const { fileId } = req.params;
        const { userIds } = req.body; // Array of user IDs
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'userIds required' });
        }
        connection = await mysql.createConnection(dbConfig);
        const [files] = await connection.execute('SELECT * FROM files WHERE id = ?', [fileId]);
        if (!files || files.length === 0) {
            throw new Error('File not found');
        }
        const file = files[0];
        if (!file || !file.allowed_users) {
            throw new Error('File allowed_users field is null or undefined');
        }
        let allowedUsers = file.allowed_users.split(',').map(String);
        allowedUsers = Array.from(new Set([...allowedUsers, ...userIds]));
        if (!allowedUsers || allowedUsers.length === 0) {
            throw new Error('No users to grant access to');
        }
        await connection.execute(
            'UPDATE files SET allowed_users = ?, access = "restricted" WHERE id = ?',
            [allowedUsers.join(','), fileId]
        );
    } catch (error) {
        console.error('Error granting access:', error);
        res.status(500).json({ message: 'Error granting access', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Download a file with permission checks
const downloadFile = async (req, res) => {
    let connection = null;
    try {
        const { fileId } = req.params;
        const user = req.user;
        if (!user || !user.id || !user.role || !user.collegeId) {
            return res.status(400).json({ message: 'User is null or undefined or missing required fields' });
        }
        connection = await mysql.createConnection(dbConfig);
        const [files] = await connection.execute('SELECT * FROM files WHERE id = ?', [fileId]);
        if (!files || files.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'File not found' });
        }
        const file = files[0];
        if (!file || !file.uploader_id || !file.access || !file.allowed_users) {
            await connection.end();
            return res.status(400).json({ message: 'File data is incomplete' });
        }
        if (!checkFileAccess(user, file)) {
            await connection.end();
            return res.status(403).json({ message: 'Not authorized to download this file' });
        }
        // Redirect to S3 URL or stream file
        if (!file.url || typeof file.url !== 'string') {
            await connection.end();
            return res.status(400).json({ message: 'File URL is undefined or not a string' });
        }
        res.redirect(file.url);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Error downloading file', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// AI/manual file tagging (topic-wise)
const tagFileAI = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { filename } = req.body;
        if (!fileId || !filename) {
            return res.status(400).json({ message: 'fileId and filename are required' });
        }
        // Use OpenAI or similar to generate tags/topic
        const prompt = `Suggest a topic and tags for the file: ${filename}`;
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        if (!response || !response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
            throw new Error('Invalid response structure from OpenAI');
        }
        const aiResponse = response.data.choices[0].message.content;
        if (!aiResponse) {
            throw new Error('AI response is null or empty');
        }
        let tags = '';
        let topic = '';
        try {
            const ai = JSON.parse(aiResponse);
            if (!ai.tags || !ai.topic) {
                throw new Error('Missing tags or topic in AI response');
            }
            tags = ai.tags;
            topic = ai.topic;
        } catch (parseError) {
            tags = aiResponse;
            console.error('Error parsing AI response:', parseError);
        }
        // Save to DB
        let connection = null;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute(
                'UPDATE files SET tags = ?, topic = ? WHERE id = ?',
                [tags, topic, fileId]
            );
        } catch (dbError) {
            throw new Error('Database error: ' + dbError.message);
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
        res.json({ message: 'File tagged', tags, topic });
    } catch (error) {
        console.error('Error tagging file:', error);
        res.status(500).json({ message: 'Error tagging file', error: error.message });
    }
};

// Bulk upload via ZIP
const bulkUploadZip = async (req, res) => {
    try {
        if (!req || !req.file) {
            return res.status(400).json({ message: 'No ZIP file uploaded' });
        }
        const zipPath = req.file.path;
        const files = [];
        await new Promise((resolve, reject) => {
            if (!fs.existsSync(zipPath)) {
                return reject(new Error('ZIP file not found'));
            }
            fs.createReadStream(zipPath)
                .pipe(unzipper.Parse())
                .on('entry', async (entry) => {
                    if (!entry) {
                        return reject(new Error('Invalid ZIP entry'));
                    }
                    const fileName = entry.path;
                    const type = entry.type; // 'File' or 'Directory'
                    if (type !== 'File') {
                        return entry.autodrain();
                    }
                    const tempPath = path.join(__dirname, '../tmp', uuidv4() + '-' + fileName);
                    entry.pipe(fs.createWriteStream(tempPath)).on('finish', async () => {
                        // Upload to S3
                        const fileBuffer = fs.readFileSync(tempPath);
                        const key = generateFileKey({ originalname: fileName }, 'bulk-zip');
                        const url = await uploadToS3({ buffer: fileBuffer, originalname: fileName }, bucketConfig.userUploads, key);
                        files.push({ filename: fileName, key, url });
                        fs.unlinkSync(tempPath);
                    }).on('error', (err) => {
                        console.error('Error writing file to temp:', err);
                        reject(err);
                    });
                })
                .on('close', () => {
                    fs.unlinkSync(zipPath);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error processing ZIP upload:', err);
                    reject(err);
                });
        }).catch((err) => {
            res.status(500).json({ message: 'Error processing ZIP upload', error: err.message });
        });
        res.json({ message: 'Bulk upload complete', files });
    } catch (error) {
        console.error('Error processing ZIP upload:', error);
        res.status(500).json({ message: 'Error processing ZIP upload', error: error.message });
    }
};

// Generate shareable short URL (dummy implementation)
const generateShortUrl = async (req, res) => {
    try {
        if (!req || !req.params) {
            return res.status(400).json({ message: 'Invalid request object' });
        }
        
        const { fileId } = req.params;
        if (!fileId) {
            return res.status(400).json({ message: 'No file ID provided' });
        }
        
        const frontEndUrl = process.env.FRONTEND_URL;
        if (!frontEndUrl) {
            return res.status(500).json({ message: 'No frontend URL set in environment variables' });
        }
        
        const shortUrl = `${frontEndUrl}/f/${fileId}`;
        return res.json({ shortUrl });
    } catch (error) {
        console.error('Error generating short URL:', error);
        return res.status(500).json({ message: 'Error generating short URL', error: error.message });
    }
};

module.exports = {
    handleUserUpload,
    handleQuestionBankUpload,
    handleReportUpload,
    deleteFile,
    getFiles,
    getFileById,
    updateFileMetadata,
    getFilesByTypeOrTag,
    grantAccessToFile,
    downloadFile,
    tagFileAI,
    bulkUploadZip,
    generateShortUrl
};