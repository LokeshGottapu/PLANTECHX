// BatchExam model (MySQL table: batch_exams)
// Fields: id, batchId, examId

module.exports = {
  table: 'batch_exams',
  fields: [
    'id INT AUTO_INCREMENT PRIMARY KEY',
    'batchId INT NOT NULL',
    'examId INT NOT NULL'
  ]
};
