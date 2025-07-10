// Batch model (MySQL table: batches)
// Fields: id, name, collegeId, createdAt

module.exports = {
  table: 'batches',
  fields: [
    'id INT AUTO_INCREMENT PRIMARY KEY',
    'name VARCHAR(255) NOT NULL',
    'collegeId INT NOT NULL',
    'createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  ]
};
