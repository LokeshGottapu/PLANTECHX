const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const axios = require('axios');

const SubmitAITestRequest = ({ user, onSubmit }) => {
    const [content, setContent] = React.useState('');
    const [error, setError] = React.useState(null);

    const handleSubmit = async event => {
        event.preventDefault();

        if (!user || !user.id) {
            return setError('Unauthorized');
        }

        if (!content) {
            return setError('Content is required');
        }

        try {
            const connection = await mysql.createConnection(dbConfig);
            await connection.execute(
                'INSERT INTO ai_test_requests (requested_by, content) VALUES (?, ?)',
                [user.id, content]
            );
            await connection.end();
            onSubmit({ message: 'AI test generation request submitted.' });
        } catch (error) {
            console.error('Error submitting AI test request:', error);
            setError(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Content:
                <textarea value={content} onChange={event => setContent(event.target.value)} />
            </label>
            <button type="submit">Submit</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </form>
    );
};

const PendingAITestRequests = async () => {
    const [requests, setRequests] = React.useState([]);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        (async () => {
            try {
                const connection = await mysql.createConnection(dbConfig);
                const [requests] = await connection.execute(
                    'SELECT * FROM ai_test_requests WHERE status = "pending"'
                );
                if (!requests) {
                    throw new Error('No AI test requests found');
                }
                await connection.end();
                setRequests(requests);
            } catch (error) {
                console.error('Error fetching AI test requests:', error);
                setError(error.message);
            }
        })();
    }, []);

    return (
        <div>
            <h2>Pending AI Test Requests</h2>
            {requests.map(request => (
                <div key={request.id}>{request.content}</div>
            ))}
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

const GenerateCustomTest = async ({ id }) => {
    const [aiTest, setAITest] = React.useState(null);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        (async () => {
            try {
                const connection = await mysql.createConnection(dbConfig);
                if (!connection) {
                    throw new Error('Unable to connect to database');
                }
                const [[request]] = await connection.execute(
                    'SELECT * FROM ai_test_requests WHERE id = ?', [id]
                );
                if (!request) {
                    await connection.end();
                    return setError('Request not found');
                }
                const prompt = `Generate a custom test based on the following content/requirements: ${request.content}`;
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
                if (!response || !response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
                    throw new Error('Invalid response structure from OpenAI');
                }
                let aiTest;
                try {
                    aiTest = JSON.parse(response.data.choices[0].message.content);
                } catch (parseError) {
                    aiTest = { raw: response.data.choices[0].message.content };
                    console.log('Error parsing AI response:', parseError);
                }
                await connection.execute(
                    'UPDATE ai_test_requests SET status = "completed", generated_test = ? WHERE id = ?',
                    [JSON.stringify(aiTest), id]
                );
                await connection.end();
                setAITest(aiTest);
            } catch (error) {
                console.error('Error generating AI test:', error);
                setError(error.message);
            }
        })();
    }, [id]);

    return (
        <div>
            {aiTest ? (
                <div>
                    <h2>AI Test Generated</h2>
                    <pre>{JSON.stringify(aiTest, null, 2)}</pre>
                </div>
            ) : (
                <div>
                    <h2>Generating AI Test...</h2>
                </div>
            )}
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

import React from 'react';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

const DefaultReject = ({ id, onReject }) => {
    const [error, setError] = React.useState(null);

    const handleReject = async () => {
        if (!id) {
            return setError('Request ID is required');
        }
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Unable to connect to database');
            }
            const [result] = await connection.execute(
                'UPDATE ai_test_requests SET status = "rejected" WHERE id = ?', [id]
            );
            if (result.affectedRows === 0) {
                return setError('Request not found');
            }
            await connection.end();
            onReject({ message: 'Request rejected.' });
        } catch (error) {
            console.error('Error rejecting request:', error);
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
            <button onClick={handleReject}>Reject Request</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

// export default DefaultReject;

const UpdateTestRequestStatus = ({ id, status, onStatusUpdate }) => {
    const [error, setError] = React.useState(null);

    const handleStatusUpdate = async () => {
        if (!id || !status) {
            return setError('id and status are required');
        }
        onStatusUpdate({ message: 'AI test request status updated', id, status });
    };

    return (
        <div>
            <button onClick={handleStatusUpdate}>Update Status</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

// List all AI requests (master admin)
const GetAllRequests = () => {
    const [requests, setRequests] = React.useState([]);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        (async () => {
            try {
                const connection = await mysql.createConnection(dbConfig);
                const [requests] = await connection.execute('SELECT * FROM ai_test_requests');
                setRequests(requests);
            } catch (error) {
                setError(error.message);
            } finally {
                if (connection) await connection.end();
            }
        })();
    }, []);

    return (
        <div>
            {requests.map(request => (
                <div key={request.id}>
                    {request.content}
                </div>
            ))}
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

const UpdateTestRequest = ({ id, content, status, onUpdated }) => {
    const [error, setError] = React.useState(null);

    const handleUpdate = async () => {
        if (!id) {
            return setError('Request ID is required');
        }
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute(
                'UPDATE ai_test_requests SET content = ?, status = ? WHERE id = ?',
                [content, status, id]
            );
            await connection.end();
            onUpdated({ message: 'AI test request updated' });
        } catch (error) {
            setError(error.message);
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <div>
            <button onClick={handleUpdate}>Update</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

import React from 'react';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

const DeleteTestRequest = ({ id, onDeleted }) => {
    const [error, setError] = React.useState(null);

    const handleDelete = async () => {
        if (!id) {
            return setError('Request ID is required');
        }
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute('DELETE FROM ai_test_requests WHERE id = ?', [id]);
            await connection.end();
            onDeleted({ message: 'AI test request deleted' });
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
            <button onClick={handleDelete}>Delete Request</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

// export default DeleteTestRequest;

const ApproveTestRequest = ({ id, onApproved }) => {
    const [error, setError] = React.useState(null);

    const handleApprove = async () => {
        if (!id) {
            return setError('Request ID is required');
        }
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);
            await connection.execute(
                'UPDATE ai_test_requests SET status = "approved" WHERE id = ?',
                [id]
            );
            await connection.end();
            onApproved({ message: 'AI test request approved' });
        } catch (error) {
            setError(error.message);
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <div>
            <button onClick={handleApprove}>Approve</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

import React from 'react';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';

const UploadSyllabus = ({ id, onUpload }) => {
    const [error, setError] = React.useState(null);

    const handleUpload = async (file) => {
        if (!id) {
            return setError('Request ID is required');
        }
        if (!file) {
            return setError('No file uploaded');
        }
        let connection;
        try {
            const filePath = file.path;
            connection = await mysql.createConnection(dbConfig);
            await connection.execute(
                'UPDATE ai_test_requests SET syllabus_path = ? WHERE id = ?',
                [filePath, id]
            );
            await connection.end();
            onUpload({ message: 'Syllabus uploaded', path: filePath });
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
            <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};
const aiTestRequestController = {
    submitAITestRequest: SubmitAITestRequest,
    getPendingAITestRequests: PendingAITestRequests,
    generateCustomTest: GenerateCustomTest,
    defaultReject: DefaultReject,
    updateTestRequestStatus: UpdateTestRequestStatus,
    getAllRequests: GetAllRequests,
    updateTestRequest: UpdateTestRequest,
    deleteTestRequest: DeleteTestRequest,
    approveTestRequest: ApproveTestRequest,
    uploadSyllabus: UploadSyllabus
};

module.exports = {
    submitAITestRequest,
    getPendingAITestRequests,
    generateCustomTest,
    defaultReject,
    updateTestRequestStatus,
    getAllRequests,
    updateTestRequest,
    deleteTestRequest,
    approveTestRequest,
    uploadSyllabus
};
