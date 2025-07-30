const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BatchesList = () => {
    const [batches, setBatches] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const response = await axios.get('/api/batches');
                setBatches(response.data);
            } catch (err) {
                setError('Error fetching batches');
            }
        };

        fetchBatches();
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Batches</h1>
            <ul>
                {batches.map(batch => (
                    <li key={batch.id}>{batch.name}</li>
                ))}
            </ul>
        </div>
    );
};

export { BatchesList };

const CreateBatch = ({ onCreate }) => {
    const [name, setName] = useState('');
    const [collegeId, setCollegeId] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async event => {
        event.preventDefault();
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            const [result] = await connection.execute(
                'INSERT INTO batches (name, college_id, start_year, end_year) VALUES (?, ?, ?, ?)',
                [name, collegeId, startYear, endYear]
            );
            onCreate(result.insertId);
        } catch (error) {
            setError('Error creating batch');
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Name:
                <input type="text" value={name} onChange={event => setName(event.target.value)} />
            </label>
            <label>
                College ID:
                <input type="text" value={collegeId} onChange={event => setCollegeId(event.target.value)} />
            </label>
            <label>
                Start Year:
                <input type="text" value={startYear} onChange={event => setStartYear(event.target.value)} />
            </label>
            <label>
                End Year:
                <input type="text" value={endYear} onChange={event => setEndYear(event.target.value)} />
            </label>
            <button type="submit">Create Batch</button>
            {error && <div>{error}</div>}
        </form>
    );
};

import React, { useState } from 'react';
import axios from 'axios';

const UpdateBatch = ({ batchId, onUpdate }) => {
    const [name, setName] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async event => {
        event.preventDefault();
        try {
            await axios.put(`/api/batches/${batchId}`, {
                name,
                start_year: startYear,
                end_year: endYear
            });
            onUpdate();
        } catch (error) {
            setError('Error updating batch');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Name:
                <input type="text" value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label>
                Start Year:
                <input type="text" value={startYear} onChange={e => setStartYear(e.target.value)} />
            </label>
            <label>
                End Year:
                <input type="text" value={endYear} onChange={e => setEndYear(e.target.value)} />
            </label>
            <button type="submit">Update Batch</button>
            {error && <div>{error}</div>}
        </form>
    );
};

export { UpdateBatch };

const DeleteBatch = ({ id }) => {
    const [error, setError] = useState(null);

    const handleDelete = async () => {
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute('DELETE FROM batches WHERE batch_id = ?', [id]);
        } catch (error) {
            setError('Error deleting batch');
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <div>
            {error && <div>{error}</div>}
            <button onClick={handleDelete}>Delete Batch</button>
        </div>
    );
};

const GetBatchStreams = ({ id }) => {
    const [streams, setStreams] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let connection;
        (async () => {
            try {
                connection = await mysql.createConnection(dbConfig);
                const [streams] = await connection.execute(
                    'SELECT * FROM streams WHERE college_id = (SELECT college_id FROM batches WHERE batch_id = ?)',
                    [id]
                );
                setStreams(streams);
            } catch (error) {
                setError('Error fetching streams');
            } finally {
                if (connection) await connection.end();
            }
        })();
    }, [id]);

    if (error) return <div>{error}</div>;
    if (!streams) return <div>Loading...</div>;
    return (
        <ul>
            {streams.map(stream => <li key={stream.stream_id}>{stream.name}</li>)}
        </ul>
    );
};

const GetBatchStudents = ({ id }) => {
    const [students, setStudents] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let connection;
        (async () => {
            try {
                connection = await mysql.createConnection(dbConfig);
                const [students] = await connection.execute(
                    'SELECT * FROM users WHERE batch_id = ? AND role = "student"',
                    [id]
                );
                setStudents(students);
            } catch (error) {
                setError('Error fetching students');
            } finally {
                if (connection) await connection.end();
            }
        })();
    }, [id]);

    if (error) return <div>{error}</div>;
    if (!students) return <div>Loading...</div>;
    return (
        <ul>
            {students.map(student => <li key={student.id}>{student.name}</li>)}
        </ul>
    );
};

const GetBatchSections = ({ id }) => {
    const [sections, setSections] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let connection;
        (async () => {
            try {
                connection = await mysql.createConnection(dbConfig);
                const [sections] = await connection.execute(
                    'SELECT * FROM sections WHERE batch_id = ?',
                    [id]
                );
                setSections(sections);
            } catch (error) {
                setError('Error fetching sections');
            } finally {
                if (connection) await connection.end();
            }
        })();
    }, [id]);

    if (error) return <div>{error}</div>;
    if (!sections) return <div>Loading...</div>;
    return (
        <ul>
            {sections.map(section => <li key={section.section_id}>{section.name}</li>)}
        </ul>
    );
};

exports.getBatchSections = GetBatchSections;
