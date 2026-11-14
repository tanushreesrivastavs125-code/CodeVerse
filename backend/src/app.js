import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { getDatabaseStatus } from './config/database.js';
import { canUseTransactions } from './services/rewardService.js';
import { csrfProtection, isAllowedOrigin } from './middleware/csrfProtection.js';
import { errorHandler, notFoundHandler, AppError } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import topicRoutes from './routes/topic.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import mentorRoutes from './routes/mentor.routes.js';
import guildRoutes from './routes/guild.routes.js';

const app = express();

// Security and CORS middleware
app.use(cors({
  origin: (requestOrigin, callback) => {
    // If no origin header (e.g. server-to-server, curl, same-origin), allow
    if (!requestOrigin) {
      return callback(null, true);
    }
    if (isAllowedOrigin(requestOrigin, config.corsOrigins, config.nodeEnv)) {
      return callback(null, true);
    }
    return callback(new AppError(`CORS origin denied for "${requestOrigin}".`, 403, 'CORS_ORIGIN_DENIED'));
  },
  credentials: true
}));

// Body and cookie parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Cross-Site Request Forgery origin validation for browser mutations
app.use(csrfProtection);

/**
 * Health probe endpoint
 * GET /api/health
 * Returns immediate process liveliness, uptime, and database connectivity state.
 */
app.get('/api/health', (_req, res) => {
  const dbStatus = getDatabaseStatus();
  res.status(200).json({
    status: 'ok',
    service: 'CodeVerse API Gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus.state,
    transactions: canUseTransactions()
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Curriculum and Topics routes
app.use('/api/topics', topicRoutes);

// Game Campaign routes
app.use('/api/game', campaignRoutes);

// Global Leaderboard routes
app.use('/api/leaderboard', leaderboardRoutes);

// AI Flight Mentor routes
app.use('/api/ai', mentorRoutes);

// Persistent Guilds routes
app.use('/api/guilds', guildRoutes);

// Fallback for unmapped routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
