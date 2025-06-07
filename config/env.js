const dotenv = require('dotenv');
const path = require('path');

// Load environment-specific .env file
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Environment validation schema
const requiredEnvVars = {
  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || 'plantechx',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),

  // Server Configuration
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-default-jwt-secret-key-development-only',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',

  // Email Configuration
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'smtp',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // AWS Configuration
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_BUCKET_USER_UPLOADS: process.env.AWS_BUCKET_USER_UPLOADS || 'user-uploads',
  AWS_BUCKET_QUESTION_BANK: process.env.AWS_BUCKET_QUESTION_BANK || 'question-bank',
  AWS_BUCKET_REPORTS: process.env.AWS_BUCKET_REPORTS || 'analytics-reports',

  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
};

// Validate required environment variables
const validateEnv = () => {
  const missingVars = [];
  const requiredVars = [
    'DB_PASSWORD',
    'JWT_SECRET',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'OPENAI_API_KEY'
  ];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Validate environment variables on module load
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

module.exports = {
  ...requiredEnvVars,
  validateEnv
};