const { sequelize, User, College, Exam, Question, UserResult, Faculty, FacultyDepartment } = require('../models');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    // Sync database models
    await sequelize.sync({ force: true });
    console.log('Database tables created successfully');

    // Read and execute test data SQL
    const testDataPath = path.join(__dirname, '../tests/test_data.sql');
    const testData = fs.readFileSync(testDataPath, 'utf8');
    
    // Split SQL statements and execute them
    const statements = testData
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim());

    for (const statement of statements) {
      await sequelize.query(statement + ';');
    }

    console.log('Test data inserted successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupDatabase();