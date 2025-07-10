// Exam model (MySQL table: exams)
// Fields: id, name, type, category, topic, companyName, duration, questions (JSON), createdBy, createdAt

module.exports = {
  table: 'exams',
  fields: [
    'id INT AUTO_INCREMENT PRIMARY KEY',
    'name VARCHAR(255) NOT NULL',
    'type ENUM("practice","assessment","company") NOT NULL',
    'category ENUM("arithmetic","reasoning","verbal","coding") NOT NULL',
    'topic VARCHAR(255)',
    'companyName VARCHAR(255)',
    'duration INT',
    'questions JSON',
    'createdBy INT',
    'createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  ]
};
