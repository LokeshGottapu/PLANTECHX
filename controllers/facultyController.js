const facultyModel = require('../models/facultyModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

module.exports = {
    // Faculty Performance Analytics
    getFacultyPerformance: async (req, res) => {
        try {
            const facultyId = req.params.facultyId;
            const contributions = await facultyModel.getFacultyContributions(facultyId);
            const examStats = await facultyModel.getFacultyExamStats(facultyId);

            res.json({
                contributions,
                examStats
            });
        } catch (error) {
            console.error('Faculty performance error:', error);
            res.status(500).json({ message: 'Error fetching faculty performance' });
        }
    },

    // LSRW Analytics
    getLSRWAnalytics: async (req, res) => {
        try {
            const { examId } = req.params;
            const analytics = await facultyModel.getLSRWAnalytics(examId);
            res.json(analytics);
        } catch (error) {
            console.error('LSRW analytics error:', error);
            res.status(500).json({ message: 'Error fetching LSRW analytics' });
        }
    },

    // Batch Comparison
    getBatchComparison: async (req, res) => {
        try {
            const { batchYear, examType } = req.query;
            const comparison = await facultyModel.getBatchComparison(batchYear, examType);
            res.json(comparison);
        } catch (error) {
            console.error('Batch comparison error:', error);
            res.status(500).json({ message: 'Error fetching batch comparison' });
        }
    },

    // Generate PDF Report
    generatePDFReport: async (req, res) => {
        try {
            const { facultyId } = req.params;
            const contributions = await facultyModel.getFacultyContributions(facultyId);
            const examStats = await facultyModel.getFacultyExamStats(facultyId);

            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=faculty_report_${facultyId}.pdf`);
            doc.pipe(res);

            // Add content to PDF
            doc.fontSize(20).text('Faculty Performance Report', { align: 'center' });
            doc.moveDown();
            
            doc.fontSize(16).text('Contributions Summary');
            doc.fontSize(12).text(`Exams Created: ${contributions.exams_created}`);
            doc.text(`Questions Contributed: ${contributions.questions_contributed}`);
            doc.text(`Students Assessed: ${contributions.students_assessed}`);
            doc.moveDown();

            doc.fontSize(16).text('Exam Statistics');
            examStats.forEach(stat => {
                doc.fontSize(14).text(stat.exam_name);
                doc.fontSize(12).text(`Total Participants: ${stat.total_participants}`);
                doc.text(`Average Score: ${stat.average_score.toFixed(2)}%`);
                doc.text(`Passing Count: ${stat.passing_count}`);
                doc.moveDown();
            });

            doc.end();
        } catch (error) {
            console.error('PDF generation error:', error);
            res.status(500).json({ message: 'Error generating PDF report' });
        }
    },

    // Generate Excel Report
    generateExcelReport: async (req, res) => {
        try {
            const { facultyId } = req.params;
            const contributions = await facultyModel.getFacultyContributions(facultyId);
            const examStats = await facultyModel.getFacultyExamStats(facultyId);

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Faculty Report');

            // Contributions Summary
            worksheet.addRow(['Faculty Performance Report']);
            worksheet.addRow([]);
            worksheet.addRow(['Contributions Summary']);
            worksheet.addRow(['Exams Created', contributions.exams_created]);
            worksheet.addRow(['Questions Contributed', contributions.questions_contributed]);
            worksheet.addRow(['Students Assessed', contributions.students_assessed]);
            worksheet.addRow([]);

            // Exam Statistics
            worksheet.addRow(['Exam Statistics']);
            worksheet.addRow(['Exam Name', 'Total Participants', 'Average Score', 'Passing Count']);
            examStats.forEach(stat => {
                worksheet.addRow([
                    stat.exam_name,
                    stat.total_participants,
                    `${stat.average_score.toFixed(2)}%`,
                    stat.passing_count
                ]);
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=faculty_report_${facultyId}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.error('Excel generation error:', error);
            res.status(500).json({ message: 'Error generating Excel report' });
        }
    }
};