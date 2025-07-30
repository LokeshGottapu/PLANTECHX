const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Dashboard summary (example: total users, tests, average score)
exports.getDashboardReport = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [[{ userCount }]] = await connection.execute('SELECT COUNT(*) as userCount FROM users');
        if (!userCount || userCount === null) {
            throw new Error('Null user count');
        }
        const [[{ testCount }]] = await connection.execute('SELECT COUNT(*) as testCount FROM tests');
        if (!testCount || testCount === null) {
            throw new Error('Null test count');
        }
        const [[{ avgScore }]] = await connection.execute('SELECT AVG(score) as avgScore FROM user_results');
        if (!avgScore || avgScore === null) {
            throw new Error('Null average score');
        }
        res.json({ userCount, testCount, avgScore });
    } catch (error) {
        console.error('Error fetching dashboard report:', error);
        res.status(500).json({ message: 'Error fetching dashboard report', error: error.message });
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

// College performance (example: average score per college)
exports.getCollegePerformance = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [rows] = await connection.execute(`
            SELECT c.name as college, AVG(r.score) as avgScore
            FROM user_results r
            JOIN users u ON r.user_id = u.userId
            JOIN colleges c ON u.college_id = c.college_id
            GROUP BY c.college_id
        `);
        if (!rows || rows.length === 0) {
            throw new Error('No college performance data found');
        }
        res.json(rows);
    } catch (error) {
        console.error('Error fetching college performance:', error);
        res.status(500).json({ message: 'Error fetching college performance', error: error.message });
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

// Student performance (example: scores for a student)
exports.getStudentPerformance = async (req, res) => {
    let connection = null;
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({ message: 'studentId is required' });
        }
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [rows] = await connection.execute(
            'SELECT exam_id, score, started_at, completed_at FROM user_results WHERE user_id = ?',
            [studentId]
        );
        if (!rows || rows.length === 0) {
            throw new Error('No student performance data found');
        }
        res.json(rows);
    } catch (error) {
        console.error('Error fetching student performance:', error);
        res.status(500).json({ message: 'Error fetching student performance', error: error.message });
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

// Test analytics (example: average, min, max score per test)
exports.getTestAnalytics = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [rows] = await connection.execute(`
            SELECT t.test_id, t.name, AVG(r.score) as avgScore, MIN(r.score) as minScore, MAX(r.score) as maxScore
            FROM tests t
            LEFT JOIN user_results r ON t.test_id = r.exam_id
            GROUP BY t.test_id
        `);
        if (!rows || rows.length === 0) {
            throw new Error('No test analytics data found');
        }
        res.json(rows);
    } catch (error) {
        console.error('Error fetching test analytics:', error);
        res.status(500).json({ message: 'Error fetching test analytics', error: error.message });
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

// Usage statistics (example: logins, tests taken)
exports.getUsageStatistics = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [[{ loginCount }]] = await connection.execute('SELECT COUNT(*) as loginCount FROM user_logins');
        if (!loginCount) {
            throw new Error('No login count data found');
        }
        const [[{ testsTaken }]] = await connection.execute('SELECT COUNT(DISTINCT exam_id) as testsTaken FROM user_results');
        if (!testsTaken) {
            throw new Error('No test taken data found');
        }
        res.json({ loginCount, testsTaken });
    } catch (error) {
        console.error('Error fetching usage statistics:', error);
        res.status(500).json({ message: 'Error fetching usage statistics', error: error.message });
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

const ExportReport = () => {
};

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!data) return null;

    const csvRows = ['Test ID,Test Name,Average Score,Min Score,Max Score'];
    data.forEach(r => {
        csvRows.push(`${r.test_id},"${r.name}",${r.avgScore || 0},${r.minScore || 0},${r.maxScore || 0}`);
    });
    const csvContent = csvRows.join('\n');
    const filePath = path.join(__dirname, '../exports/test_analytics.csv');
    fs.writeFileSync(filePath, csvContent);
    const fileUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));

    return (
        <a href={fileUrl} download="test_analytics.csv">
            Download report
        </a>
    );
// Removed duplicate default export for ExportReport to avoid multiple default exports error.

// filepath: components/analytics/RealTimeAnalytics.js
const RealTimeAnalytics = ({ examId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        setLoading(true);
        let connection;
        (async () => {
            try {
                connection = await mysql.createConnection(dbConfig);
                if (!connection) {
                    throw new Error('Database connection failed');
                }
                const [rows] = await connection.execute(`
                    SELECT AVG(score) as avgScore, MIN(score) as minScore, MAX(score) as maxScore
                    FROM results
                    WHERE exam_id = ?
                    GROUP BY SUBDATE(CURDATE(), INTERVAL DAYOFMONTH(CURDATE()) - 1 DAY)
                `, [examId]);
                setData(rows);
            } catch (error) {
                setError(error);
            } finally {
                if (connection) await connection.end();
                setLoading(false);
            }
        })();
    }, [examId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!data) return null;

    return (
        <div>
            {data.map((r, i) => (
                <p key={i}>
                    {r.avgScore || 0} ({r.minScore || 0} - {r.maxScore || 0})
                </p>
            ))}
        </div>
    );
};

export default RealTimeAnalytics;
exports.getRealTime = async (req, res) => { /* ... */ };