const sequelize = require('../config/database');

async function testDatabaseConnection() {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('✓ Database connection has been established successfully.');

    // Get database information
    const [results] = await sequelize.query('SELECT version() as version');
    console.log('✓ MySQL Version:', results[0].version);

    // Test database credentials
    console.log('✓ Current database configuration:');
    console.log('  - Host:', process.env.DB_HOST || 'localhost');
    console.log('  - Database:', process.env.DB_NAME || 'plantechx');
    console.log('  - User:', process.env.DB_USER || 'root');
    console.log('  - Port:', process.env.DB_PORT || '3306');

  } catch (error) {
    console.error('✗ Unable to connect to the database:');
    console.error('  Error type:', error.name);
    console.error('  Message:', error.message);
    
    if (error.original) {
      console.error('  Original error:', error.original.message);
      console.error('  Error code:', error.original.code);
      
      // Provide specific guidance based on error codes
      switch(error.original.code) {
        case 'ECONNREFUSED':
          console.error('  → MySQL server might not be running or is inaccessible');
          console.error('  → Check if MySQL service is running');
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          console.error('  → Invalid database credentials');
          console.error('  → Verify username and password in .env file');
          break;
        case 'ER_BAD_DB_ERROR':
          console.error('  → Database does not exist');
          console.error('  → Check database name in configuration');
          break;
      }
    }
  } finally {
    // Close the connection
    await sequelize.close();
    process.exit();
  }
}

testDatabaseConnection();