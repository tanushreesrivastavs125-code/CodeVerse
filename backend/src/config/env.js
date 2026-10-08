import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/codeverse',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_for_local_development_only_replace_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
};
