const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

exports.getStreams = async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [streams] = await connection.execute('SELECT * FROM streams');
        res.json(streams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching streams', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.createStream = async (req, res) => {
    let connection;
    try {
        const { name, college_id } = req.body;
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO streams (name, college_id) VALUES (?, ?)',
            [name, college_id]
        );
        res.status(201).json({ streamId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating stream', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.updateStream = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { name } = req.body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE streams SET name = ? WHERE stream_id = ?',
            [name, id]
        );
        res.json({ message: 'Stream updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating stream', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.deleteStream = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM streams WHERE stream_id = ?', [id]);
        res.json({ message: 'Stream deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting stream', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.getStreamYears = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await mysql.createConnection(dbConfig);
        const [years] = await connection.execute(
            'SELECT * FROM years WHERE stream_id = ?',
            [id]
        );
        res.json(years);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching years', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.getStreamSections = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await mysql.createConnection(dbConfig);
        const [sections] = await connection.execute(
            'SELECT * FROM sections WHERE stream_id = ?',
            [id]
        );
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sections', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};