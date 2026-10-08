import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { getDBStatus } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security and CORS middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/**
 * Health probe endpoint
 * GET /api/health
 * Returns immediate liveliness status, process uptime, and database connectivity.
 */
app.get('/api/health', (_req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'ok',
    service: 'CodeVerse API Gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus.state
  });
});

// Fallback for unmapped routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
