const mysql = require('mysql2/promise');

async function initializeDatabase() {
  let connection;
  try {
    // Create initial connection without database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Lasya@2003'
    });

    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS plantechx');
    console.log('Database created successfully');

    // Close initial connection
    await connection.end();

    // Run the setup script
    require('./setup_database');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();