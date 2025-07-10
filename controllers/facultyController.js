const facultyModel = require('../models/facultyModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

module.exports = {
    // Faculty Performance Analytics
    getFacultyPerformance: async (req, res) => {
        let connection = null;
        try {
            const { facultyId } = req.params;
            if (!facultyId) {
                return res.status(400).json({ message: 'facultyId is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const contributions = await facultyModel.getFacultyContributions(facultyId);
            if (!contributions) {
                await connection.end();
                return res.status(404).json({ message: 'No faculty contributions found' });
            }

            const examStats = await facultyModel.getFacultyExamStats(facultyId);
            if (!examStats) {
                await connection.end();
                return res.status(404).json({ message: 'No faculty exam statistics found' });
            }

            await connection.end();
            res.json({
                contributions,
                examStats
            });
        } catch (error) {
            console.error('Faculty performance error:', error);
            res.status(500).json({ message: 'Error fetching faculty performance' });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // LSRW Analytics
    getLSRWAnalytics: async (req, res) => {
        try {
            const { examId } = req.params;
            if (!examId) {
                return res.status(400).json({ message: 'examId is required' });
            }

            const analytics = await facultyModel.getLSRWAnalytics(examId);
            if (!analytics) {
                return res.status(404).json({ message: 'No LSRW analytics found' });
            }

            if (!Array.isArray(analytics) || analytics.length === 0) {
                throw new Error('No LSRW analytics found');
            }

            const firstElement = analytics[0];
            if (!firstElement || !firstElement.topic || !firstElement.average_score || !firstElement.total_assessments) {
                throw new Error('Invalid LSRW analytics structure');
            }

            res.json(analytics);
        } catch (error) {
            console.error('LSRW analytics error:', error);
            res.status(500).json({ message: 'Error fetching LSRW analytics', error: error.message });
        }
    },

    // Batch Comparison
    getBatchComparison: async (req, res) => {
        try {
            const { batchYear, examType } = req.query;

            if (!batchYear || !examType) {
                return res.status(400).json({ message: 'batchYear and examType are required' });
            }

            const comparison = await facultyModel.getBatchComparison(batchYear, examType);

            if (!comparison || !Array.isArray(comparison) || comparison.length === 0) {
                return res.status(404).json({ message: 'No batch comparison found' });
            }

            res.json(comparison);
        } catch (error) {
            console.error('Batch comparison error:', error);
            res.status(500).json({ message: 'Error fetching batch comparison', error: error.message });
        }
    },

    // Generate PDF Report
    generatePDFReport: async (req, res) => {
        let connection = null;
        try {
            const { facultyId } = req.params;
            if (!facultyId) {
                return res.status(400).json({ message: 'facultyId is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const contributions = await facultyModel.getFacultyContributions(facultyId);
            const examStats = await facultyModel.getFacultyExamStats(facultyId);

            if (!contributions || !Array.isArray(examStats)) {
                await connection.end();
                return res.status(404).json({ message: 'No faculty data found' });
            }

            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=faculty_report_${facultyId}.pdf`);
            doc.pipe(res);

            // Add content to PDF
            doc.fontSize(20).text('Faculty Performance Report', { align: 'center' });
            doc.moveDown();

            doc.fontSize(16).text('Contributions Summary');
            doc.fontSize(12).text(`Exams Created: ${contributions.exams_created ?? 0}`);
            doc.text(`Questions Contributed: ${contributions.questions_contributed ?? 0}`);
            doc.text(`Students Assessed: ${contributions.students_assessed ?? 0}`);
            doc.moveDown();

            doc.fontSize(16).text('Exam Statistics');
            examStats.forEach(stat => {
                doc.fontSize(14).text(stat.exam_name ?? 'Unknown');
                doc.fontSize(12).text(`Total Participants: ${stat.total_participants ?? 0}`);
                doc.text(`Average Score: ${stat.average_score ? `${stat.average_score.toFixed(2)}%` : 'N/A'}`);
                doc.text(`Passing Count: ${stat.passing_count ?? 0}`);
                doc.moveDown();
            });

            doc.end();
        } catch (error) {
            console.error('PDF generation error:', error);
            res.status(500).json({ message: 'Error generating PDF report' });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Generate Excel Report
    generateExcelReport: async (req, res) => {
        try {
            const { facultyId } = req.params;
            const contributions = await facultyModel.getFacultyContributions(facultyId);
            const examStats = await facultyModel.getFacultyExamStats(facultyId);

            if (!contributions || !examStats) {
                return res.status(404).json({ message: 'No faculty data found' });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Faculty Report');

            // Contributions Summary
            worksheet.addRow(['Faculty Performance Report']);
            worksheet.addRow([]);
            worksheet.addRow(['Contributions Summary']);

            if (contributions) {
                worksheet.addRow(['Exams Created', contributions.exams_created ?? 0]);
                worksheet.addRow(['Questions Contributed', contributions.questions_contributed ?? 0]);
                worksheet.addRow(['Students Assessed', contributions.students_assessed ?? 0]);
            }
            worksheet.addRow([]);

            // Exam Statistics
            worksheet.addRow(['Exam Statistics']);
            worksheet.addRow(['Exam Name', 'Total Participants', 'Average Score', 'Passing Count']);

            if (examStats) {
                examStats.forEach(stat => {
                    worksheet.addRow([
                        stat.exam_name ?? 'Unknown',
                        stat.total_participants ?? 0,
                        stat.average_score ? `${stat.average_score.toFixed(2)}%` : 'N/A',
                        stat.passing_count ?? 0
                    ]);
                });
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=faculty_report_${facultyId}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('Excel generation error:', error);
            res.status(500).json({ message: 'Error generating Excel report' });
        }
    },

    // Add a new faculty member under a college
    addFaculty: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId } = req.user;
            const { name, email, subject, collegeId } = req.body;

            if (role === 'faculty') {
                return res.status(403).json({ message: 'Not authorized to add faculty' });
            }
            if (role === 'college_admin' && collegeId !== userCollegeId) {
                return res.status(403).json({ message: 'Not authorized to add faculty to this college' });
            }
            if (!name || !email || !subject || !collegeId) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const [existing] = await connection.execute(
                'SELECT id FROM faculty WHERE email = ?',
                [email]
            );
            if (existing && existing.length > 0) {
                await connection.end();
                return res.status(409).json({ message: 'Faculty already exists' });
            }

            const [result] = await connection.execute(
                'INSERT INTO faculty (name, email, subject, college_id) VALUES (?, ?, ?, ?)',
                [name, email, subject, collegeId]
            );

            if (!result || !result.insertId) {
                throw new Error('Error adding faculty');
            }

            await connection.end();
            res.json({ message: 'Faculty added successfully' });
        } catch (error) {
            console.error('Error adding faculty:', error);
            res.status(500).json({ message: 'Error adding faculty', error: error.message });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    // List all faculty under a specific college
    getAllFaculty: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId, id: userId } = req.user;
            let collegeId = req.query.collegeId;

            if (role === 'faculty') {
                if (!userCollegeId) {
                    return res.status(400).json({ message: 'User college ID is required' });
                }
                collegeId = userCollegeId;
            } else if (role === 'college_admin') {
                if (!userCollegeId) {
                    return res.status(400).json({ message: 'User college ID is required' });
                }
                collegeId = userCollegeId;
            }

            if (!collegeId && role !== 'super_admin') {
                return res.status(403).json({ message: 'Not authorized to view faculty' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                return res.status(500).json({ message: 'Error connecting to database' });
            }

            let query = 'SELECT * FROM faculty';
            let params = [];
            if (role !== 'super_admin') {
                query += ' WHERE college_id = ?';
                params.push(collegeId);
            }
            const [faculty] = await connection.execute(query, params);
            if (!faculty || faculty.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'No faculty found' });
            }
            await connection.end();
            res.json(faculty);
        } catch (error) {
            console.error('Error fetching faculty:', error);
            res.status(500).json({ message: 'Error fetching faculty', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Get details of a specific faculty member
    getFacultyById: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId, id: userId } = req.user;
            const { facultyId } = req.params;
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                return res.status(500).json({ message: 'Error connecting to database' });
            }
            const [faculty] = await connection.execute(
                'SELECT * FROM faculty WHERE id = ?',
                [facultyId]
            );
            if (!faculty || faculty.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'Faculty not found' });
            }
            const facultyMember = faculty[0];
            if (role === 'faculty' && facultyMember.id !== userId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to view this faculty' });
            }
            if (role === 'college_admin' && facultyMember.college_id !== userCollegeId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to view this faculty' });
            }
            await connection.end();
            res.json(facultyMember);
        } catch (error) {
            console.error('Error fetching faculty:', error);
            res.status(500).json({ message: 'Error fetching faculty', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Edit faculty profile
    updateFaculty: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId, id: userId } = req.user;
            const { facultyId } = req.params;
            const { name, email, subject } = req.body;
            if (!name && !email && !subject) {
                return res.status(400).json({ message: 'No fields to update' });
            }
            if (!facultyId) {
                return res.status(400).json({ message: 'Faculty ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                return res.status(500).json({ message: 'Error connecting to database' });
            }

            const [faculty] = await connection.execute(
                'SELECT * FROM faculty WHERE id = ?',
                [facultyId]
            );
            if (!faculty || faculty.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'Faculty not found' });
            }
            if (role === 'faculty' && faculty[0].id !== userId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to update this faculty' });
            }
            if (role === 'college_admin' && faculty[0].college_id !== userCollegeId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to update this faculty' });
            }

            const fields = [];
            const values = [];
            if (name) { fields.push('name = ?'); values.push(name); }
            if (email) { fields.push('email = ?'); values.push(email); }
            if (subject) { fields.push('subject = ?'); values.push(subject); }
            values.push(facultyId);
            const [result] = await connection.execute(
                `UPDATE faculty SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            await connection.end();
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Faculty not found or no changes made' });
            }
            res.json({ message: 'Faculty updated successfully' });
        } catch (error) {
            console.error('Error updating faculty:', error);
            res.status(500).json({ message: 'Error updating faculty', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Remove or deactivate a faculty account
    deleteFaculty: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId, id: userId } = req.user;
            const { facultyId } = req.params;
            if (!facultyId) {
                return res.status(400).json({ message: 'Faculty ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const [faculty] = await connection.execute(
                'SELECT * FROM faculty WHERE id = ?',
                [facultyId]
            );
            if (!faculty || faculty.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'Faculty not found' });
            }
            if (role === 'faculty' && faculty[0].id !== userId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to delete this faculty' });
            }
            if (role === 'college_admin' && faculty[0].college_id !== userCollegeId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to delete this faculty' });
            }
            const result = await connection.execute(
                'DELETE FROM faculty WHERE id = ?',
                [facultyId]
            );
            await connection.end();
            if (!result || result.affectedRows === 0) {
                return res.status(404).json({ message: 'Faculty not found' });
            }
            res.json({ message: 'Faculty deleted successfully' });
        } catch (error) {
            console.error('Error deleting faculty:', error);
            res.status(500).json({ message: 'Error deleting faculty', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Link faculty with subject(s) or course
    assignSubjectToFaculty: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId } = req.user;
            const { facultyId, subject } = req.body;
            if (!facultyId || !subject) {
                return res.status(400).json({ message: 'Required fields missing' });
            }
            if (role === 'faculty') {
                return res.status(403).json({ message: 'Not authorized to assign subject' });
            }
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }
            const [faculty] = await connection.execute(
                'SELECT * FROM faculty WHERE id = ?',
                [facultyId]
            );
            if (!faculty || faculty.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'Faculty not found' });
            }
            if (role === 'college_admin' && faculty[0].college_id !== userCollegeId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to assign subject to this faculty' });
            }
            if (!faculty[0].subject) {
                faculty[0].subject = [];
            }
            faculty[0].subject.push(subject);
            await connection.execute(
                'UPDATE faculty SET subject = ? WHERE id = ?',
                [faculty[0].subject, facultyId]
            );
            await connection.end();
            res.json({ message: 'Subject assigned to faculty' });
        } catch (error) {
            console.error('Assign subject to faculty error:', error);
            res.status(500).json({ message: 'Error assigning subject', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Exam creation by faculty
    createExamByFaculty: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId } = req.user;
            const { title, description } = req.body;
            if (role !== 'faculty') {
                return res.status(403).json({ message: 'Not authorized to create exam' });
            }
            if (!title || !description) {
                return res.status(400).json({ message: 'Title and description are required' });
            }
            if (!userCollegeId) {
                return res.status(400).json({ message: 'College ID is required' });
            }
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }
            const [result] = await connection.execute(
                'INSERT INTO exams (exam_name, exam_type, created_by, college_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
                [title, 'faculty', req.user.id, userCollegeId]
            );
            if (!result || !result.insertId) {
                throw new Error('Error creating exam');
            }
            await connection.end();
            res.json({ message: 'Exam created by faculty', examId: result.insertId });
        } catch (error) {
            console.error('Create exam by faculty error:', error);
            res.status(500).json({ message: 'Error creating exam', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Content upload by faculty
    uploadContentByFaculty: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId } = req.user;
            const { title, description, type, url } = req.body;
            if (role !== 'faculty') {
                return res.status(403).json({ message: 'Not authorized to upload content' });
            }
            if (!title || !description || !type || !url) {
                return res.status(400).json({ message: 'Title, description, type and url are required' });
            }
            if (!userCollegeId) {
                return res.status(400).json({ message: 'College ID is required' });
            }
            if (typeof title !== 'string' || typeof description !== 'string' || typeof type !== 'string' || typeof url !== 'string') {
                return res.status(400).json({ message: 'Title, description, type and url must be strings' });
            }
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }
            const [result] = await connection.execute(
                'INSERT INTO study_materials (title, description, type, url, college_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
                [title, description, type, url, userCollegeId, req.user.id]
            );
            if (!result || !result.insertId) {
                throw new Error('Error uploading content');
            }
            await connection.end();
            res.json({ message: 'Content uploaded by faculty', contentId: result.insertId });
        } catch (error) {
            console.error('Upload content by faculty error:', error);
            res.status(500).json({ message: 'Error uploading content', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Let faculty manage or evaluate a specific exam
    assignExamToFaculty: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId } = req.user;
            const { facultyId, examId } = req.body;
            if (role === 'faculty') {
                return res.status(403).json({ message: 'Not authorized to assign exam' });
            }

            if (!facultyId || !examId || typeof facultyId !== 'number' || typeof examId !== 'number') {
                return res.status(400).json({ message: 'Required fields missing or invalid' });
            }

            connection = await mysql.createConnection(dbConfig);

            const [faculty] = await connection.execute(
                'SELECT * FROM faculty WHERE id = ?',
                [facultyId]
            );

            if (!faculty || faculty.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'Faculty not found' });
            }

            if (role === 'college_admin' && faculty[0].college_id !== userCollegeId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to assign exam to this faculty' });
            }

            const [result] = await connection.execute(
                'INSERT INTO faculty_exams (faculty_id, exam_id) VALUES (?, ?)',
                [facultyId, examId]
            );

            if (!result || !result.insertId) {
                throw new Error('Error assigning exam');
            }

            await connection.end();

            res.json({ message: 'Exam assigned to faculty' });
        } catch (error) {
            console.error('Assign exam to faculty error:', error);
            res.status(500).json({ message: 'Error assigning exam', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Track what exams/materials faculty manage (optional)
    trackFacultyActivity: async (req, res) => {
        let connection;
        try {
            const { role, collegeId: userCollegeId, id: userId } = req.user;
            const { facultyId } = req.params;

            if (!facultyId) {
                return res.status(400).json({ message: 'Faculty ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const [faculty] = await connection.execute(
                'SELECT * FROM faculty WHERE id = ?',
                [facultyId]
            );

            if (!faculty || faculty.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'Faculty not found' });
            }

            if (role === 'faculty' && faculty[0].id !== userId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to view this activity' });
            }
            if (role === 'college_admin' && faculty[0].college_id !== userCollegeId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to view this activity' });
            }

            const [activity] = await connection.execute(
                `SELECT e.exam_name, fe.assigned_at
                 FROM faculty_exams fe
                 JOIN exams e ON fe.exam_id = e.exam_id
                 WHERE fe.faculty_id = ?`,
                [facultyId]
            );

            if (!activity || activity.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'No activity found for this faculty' });
            }

            res.json({ activity });
        } catch (error) {
            console.error('Error tracking faculty activity:', error);
            res.status(500).json({ message: 'Error tracking activity', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Show total students guided, exams handled, etc.
    getFacultyDashboardStats: async (req, res) => {
        let connection = null;
        try {
            const { role, collegeId: userCollegeId, id: userId } = req.user;
            const { facultyId } = req.params;

            if (!facultyId) {
                return res.status(400).json({ message: 'Required fields missing' });
            }

            connection = await mysql.createConnection(dbConfig);

            const [faculty] = await connection.execute(
                'SELECT * FROM faculty WHERE id = ?',
                [facultyId]
            );

            if (!faculty || faculty.length === 0) {
                await connection.end();
                return res.status(404).json({ message: 'Faculty not found' });
            }

            if (role === 'faculty' && faculty[0].id !== userId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to view this dashboard' });
            }
            if (role === 'college_admin' && faculty[0].college_id !== userCollegeId) {
                await connection.end();
                return res.status(403).json({ message: 'Not authorized to view this dashboard' });
            }

            const [[{ examsHandled }]] = await connection.execute(
                'SELECT COUNT(*) AS examsHandled FROM faculty_exams WHERE faculty_id = ?',
                [facultyId]
            );
            const [[{ studentsAssessed }]] = await connection.execute(
                `SELECT COUNT(DISTINCT ur.user_id) AS studentsAssessed
                 FROM user_results ur
                 JOIN exams e ON ur.exam_id = e.exam_id
                 JOIN faculty_exams fe ON fe.exam_id = e.exam_id
                 WHERE fe.faculty_id = ?`,
                [facultyId]
            );

            if (!examsHandled || examsHandled === null || !studentsAssessed || studentsAssessed === null) {
                await connection.end();
                return res.status(404).json({ message: 'No dashboard stats found for this faculty' });
            }

            await connection.end();

            res.json({
                examsHandled,
                studentsAssessed
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Bulk upload questions via Excel
    uploadQuestionBank: async (req, res) => {
        let connection = null;
        try {
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ message: 'Excel file required' });
            }
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(req.file.buffer);

            if (!workbook.worksheets || workbook.worksheets.length === 0) {
                return res.status(400).json({ message: 'No worksheets found in the Excel file' });
            }

            const sheet = workbook.worksheets[0];
            const questions = [];

            sheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // skip header
                const [question, optionA, optionB, optionC, optionD, correct, marks] = row.values.slice(1);

                if (!question || !optionA || !optionB || !optionC || !optionD || !correct) {
                    console.warn(`Invalid question format at row ${rowNumber}, skipping.`);
                    return;
                }

                questions.push({ question, optionA, optionB, optionC, optionD, correct, marks: marks || 1 });
            });

            if (questions.length === 0) {
                return res.status(400).json({ message: 'No valid questions found' });
            }

            connection = await mysql.createConnection(dbConfig);

            for (const q of questions) {
                await connection.execute(
                    'INSERT INTO questions (question, optionA, optionB, optionC, optionD, correct, marks) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [q.question, q.optionA, q.optionB, q.optionC, q.optionD, q.correct, q.marks]
                );
            }
            
            res.json({ message: `${questions.length} questions uploaded successfully` });
        } catch (error) {
            console.error('Error uploading question bank:', error);
            res.status(500).json({ message: 'Error uploading question bank', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing database connection:', endError);
                }
            }
        }
    }

};