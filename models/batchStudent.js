// BatchStudent model (MySQL table: batch_students)
// Fields: id, batchId, studentId

module.exports = {
  table: 'batch_students',
  fields: [
    'id INT AUTO_INCREMENT PRIMARY KEY',
    'batchId INT NOT NULL',
    'studentId INT NOT NULL'
  ]
};
