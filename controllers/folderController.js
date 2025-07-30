const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

// List all folders
exports.getFolders = async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [folders] = await connection.execute('SELECT * FROM folders');
        res.json(folders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching folders', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// Create a folder
exports.createFolder = async (req, res) => {
    let connection;
    try {
        const { name, parent_id } = req.body;
        const created_by = req.user.userId;
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO folders (name, parent_id, created_by) VALUES (?, ?, ?)',
            [name, parent_id || null, created_by]
        );
        res.status(201).json({ folderId: result.insertId, message: 'Folder created' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating folder', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// Update a folder
exports.updateFolder = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { name } = req.body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE folders SET name = ? WHERE id = ?',
            [name, id]
        );
        res.json({ message: 'Folder updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating folder', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// Delete a folder
exports.deleteFolder = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM folders WHERE id = ?', [id]);
        res.json({ message: 'Folder deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting folder', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

// Get folder contents (files + subfolders)
exports.getFolderContents = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await mysql.createConnection(dbConfig);
        const [folders] = await connection.execute('SELECT * FROM folders WHERE parent_id = ?', [id]);
        const [files] = await connection.execute('SELECT * FROM files WHERE folder_id = ?', [id]);
        res.json({ folders, files });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching folder contents', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};