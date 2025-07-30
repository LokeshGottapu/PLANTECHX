const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const bcrypt = require('bcrypt');
const csv = require('csv-parser');
const fs = require('fs');

exports.getStudents = async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [students] = await connection.execute('SELECT * FROM users WHERE role = "student"');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.createStudent = async (req, res) => {
    let connection;
    try {
        const { name, email, password, batch_id, stream_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role, batch_id, stream_id) VALUES (?, ?, ?, "student", ?, ?)',
            [name, email, hashedPassword, batch_id, stream_id]
        );
        res.status(201).json({ studentId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating student', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.updateStudent = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { name, email, batch_id, stream_id } = req.body;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE users SET name = ?, email = ?, batch_id = ?, stream_id = ? WHERE userId = ? AND role = "student"',
            [name, email, batch_id, stream_id, id]
        );
        res.json({ message: 'Student updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.deleteStudent = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM users WHERE userId = ? AND role = "student"', [id]);
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};

exports.bulkImportStudents = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let connection;
            try {
                connection = await mysql.createConnection(dbConfig);
                for (const student of results) {
                    const hashedPassword = await bcrypt.hash(student.password, 10);
                    await connection.execute(
                        'INSERT INTO users (name, email, password, role, batch_id, stream_id) VALUES (?, ?, ?, "student", ?, ?)',
                        [student.name, student.email, hashedPassword, student.batch_id, student.stream_id]
                    );
                }
                res.json({ message: 'Bulk import successful', count: results.length });
            } catch (error) {
                res.status(500).json({ message: 'Bulk import error', error: error.message });
            } finally {
                if (connection) await connection.end();
                fs.unlinkSync(req.file.path); // Clean up uploaded file
            }
        });
};

exports.filterStudents = async (req, res) => {
    let connection;
    try {
        const { batch_id, stream_id, name } = req.query;
        let query = 'SELECT * FROM users WHERE role = "student"';
        const params = [];
        if (batch_id) {
            query += ' AND batch_id = ?';
            params.push(batch_id);
        }
        if (stream_id) {
            query += ' AND stream_id = ?';
            params.push(stream_id);
        }
        if (name) {
            query += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }
        connection = await mysql.createConnection(dbConfig);
        const [students] = await connection.execute(query, params);
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error filtering students', error: error.message });
    } finally {
        if (connection) await connection.end();
    }
};