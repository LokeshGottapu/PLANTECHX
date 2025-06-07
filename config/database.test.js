module.exports = {
    development: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'plantech_test',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false // Disable logging in test environment
    },
    test: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'plantech_test',
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
}; 