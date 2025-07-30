const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const questionController = require('../controllers/questionController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const csv = require('csv-parser');
const fs = require('fs');

router.use(authenticateToken);

// Test CRUD
router.get('/', testController.getTests);
router.post(
  '/',
  authorizeRole('admin'),
  [
    body('name').notEmpty().withMessage('Test name is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer')
  ],
  testController.createTest
);
router.put('/:id', authorizeRole('admin'), testController.updateTest);
router.delete('/:id', authorizeRole('admin'), testController.deleteTest);

// Questions under a test
router.get('/:id/questions', questionController.getQuestionsByTestId);
router.post(
  '/:id/questions',
  authorizeRole('admin'),
  [
    body('question_text').notEmpty().withMessage('Question text is required')
    // Add more validation as needed
  ],
  questionController.addQuestionToTest
);

// Question CRUD
router.put('/questions/:id', authorizeRole('admin'), questionController.updateQuestion);
router.delete('/questions/:id', authorizeRole('admin'), questionController.deleteQuestion);

// Bulk upload questions to a test
router.post(
  '/bulk-upload',
  authorizeRole('admin'),
  upload.single('file'),
  testController.bulkUploadQuestions
);

// Filter tests
router.get('/filter', testController.filterTests);

module.exports = router;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TestList = () => {
    const [tests, setTests] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const response = await axios.get('/api/tests');
                setTests(response.data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchTests();
    }, []);

    if (error) {
        return <div>Error fetching tests: {error}</div>;
    }

    return (
        <div>
            <h1>Test List</h1>
            <ul>
                {tests.map(test => (
                    <li key={test.test_id}>{test.name}</li>
                ))}
            </ul>
        </div>
    );
};

export { TestList };

// Create a test
const CreateTest = () => {
    const [name, setName] = React.useState('');
    const [duration, setDuration] = React.useState(0);
    const [error, setError] = React.useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            const [result] = await connection.execute(
                'INSERT INTO tests (name, duration) VALUES (?, ?)',
                [name, duration]
            );
            setError(null);
            setName('');
            setDuration(0);
        } catch (error) {
            setError(error.message);
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <label>
                Name:
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </label>
            <br />
            <label>
                Duration (in minutes):
                <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                />
            </label>
            <br />
            <button type="submit">Create</button>
        </form>
    );
};

// Update a test
const UpdateTest = ({ id, name: initialName, duration: initialDuration }) => {
    const [name, setName] = React.useState(initialName);
    const [duration, setDuration] = React.useState(initialDuration);
    const [error, setError] = React.useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute(
                'UPDATE tests SET name = ?, duration = ? WHERE test_id = ?',
                [name, duration, id]
            );
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <label>
                Name:
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </label>
            <br />
            <label>
                Duration (in minutes):
                <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                />
            </label>
            <br />
            <button type="submit">Update</button>
        </form>
    );
};

const DeleteTest = ({ id, onDelete }) => {
    const [error, setError] = React.useState(null);

    const handleDelete = async () => {
        if (!id) {
            return setError('Test ID is required');
        }
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute('DELETE FROM tests WHERE test_id = ?', [id]);
            await connection.end();
            onDelete({ message: 'Test deleted' });
        } catch (error) {
            setError(error.message);
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

    return (
        <div>
            <button onClick={handleDelete}>Delete Test</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

import React from 'react';
import axios from 'axios';

const BulkUploadQuestions = () => {
    const [file, setFile] = React.useState(null);
    const [message, setMessage] = React.useState('');
    const [error, setError] = React.useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setError('CSV file is required');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/api/upload/questions', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage(response.data.message);
            setError(null);
        } catch (uploadError) {
            setError(uploadError.response?.data?.message || 'Bulk upload error');
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="file" accept=".csv" onChange={handleFileChange} />
                <button type="submit">Upload</button>
            </form>
            {message && <div style={{ color: 'green' }}>{message}</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

export { BulkUploadQuestions };

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FilterTests = ({ name: initialName, duration: initialDuration }) => {
    const [tests, setTests] = useState([]);
    const [name, setName] = useState(initialName);
    const [duration, setDuration] = useState(initialDuration);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFilteredTests = async () => {
            try {
                const response = await axios.get('/api/tests/filter', {
                    params: { name, duration }
                });
                setTests(response.data);
                setError(null);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchFilteredTests();
    }, [name, duration]);

    return (
        <div>
            <h1>Filter Tests</h1>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Filter by name"
            />
            <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Filter by duration"
            />
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <ul>
                {tests.map(test => (
                    <li key={test.test_id}>{test.name} - {test.duration} mins</li>
                ))}
            </ul>
        </div>
    );
};

export { FilterTests };

const GetQuestionsByTestId = ({ id }) => {
    const [questions, setQuestions] = React.useState([]);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const connection = await mysql.createConnection(dbConfig);
                const [questions] = await connection.execute(
                    'SELECT * FROM questions WHERE test_id = ?',
                    [id]
                );
                setQuestions(questions);
                setError(null);
            } catch (error) {
                setError(error.message);
            } finally {
                if (connection) await connection.end();
            }
        };

        fetchQuestions();
    }, [id]);

    return (
        <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <ul>
                {questions.map(question => (
                    <li key={question.question_id}>{question.question_text}</li>
                ))}
            </ul>
        </div>
    );
};

export { GetQuestionsByTestId };

// Add a question to a test
const AddQuestionToTest = ({ id }) => {
    const [error, setError] = React.useState(null);
    const [questionId, setQuestionId] = React.useState(null);

    const handleSubmit = async event => {
        event.preventDefault();
        const { question_text, options, correct_answer } = event.target;
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            const [result] = await connection.execute(
                'INSERT INTO questions (test_id, question_text, options, correct_answer) VALUES (?, ?, ?, ?)',
                [id, question_text.value, options.value, correct_answer.value]
            );
            setQuestionId(result.insertId);
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <label>
                Question text:
                <input type="text" name="question_text" />
            </label>
            <br />
            <label>
                Options:
                <input type="text" name="options" />
            </label>
            <br />
            <label>
                Correct answer:
                <input type="text" name="correct_answer" />
            </label>
            <br />
            <button type="submit">Add question</button>
            {questionId && <div>Question {questionId} added successfully</div>}
        </form>
    );
};

const UpdateQuestion = ({ id }) => {
    const [error, setError] = React.useState(null);

    const handleSubmit = async event => {
        event.preventDefault();
        const { question_text, options, correct_answer } = event.target;
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute(
                'UPDATE questions SET question_text = ?, options = ?, correct_answer = ? WHERE question_id = ?',
                [question_text.value, options.value, correct_answer.value, id]
            );
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <label>
                Question text:
                <input type="text" name="question_text" />
            </label>
            <br />
            <label>
                Options:
                <input type="text" name="options" />
            </label>
            <br />
            <label>
                Correct answer:
                <input type="text" name="correct_answer" />
            </label>
            <br />
            <button type="submit">Update question</button>
        </form>
    );
};

// Delete a question
const DeleteQuestion = ({ id }) => {
    const [error, setError] = React.useState(null);

    const handleSubmit = async event => {
        event.preventDefault();
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute('DELETE FROM questions WHERE question_id = ?', [id]);
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit">Delete question</button>
        </form>
    );
};
