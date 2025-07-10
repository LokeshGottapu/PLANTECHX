// ExamResult model (MySQL table: exam_results)
// Fields: id, userId, examId, answers (JSON), score, submittedAt, timeSpent

module.exports = {
  table: 'exam_results',
  fields: [
    'id INT AUTO_INCREMENT PRIMARY KEY',
    'userId INT NOT NULL',
    'examId INT NOT NULL',
    'answers JSON',
    'score FLOAT',
    'submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'timeSpent INT'
  ]
};
