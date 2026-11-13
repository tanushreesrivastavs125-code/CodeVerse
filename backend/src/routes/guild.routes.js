import { Router } from 'express';
import {
  getGuilds,
  getMyGuild,
  getGuildById,
  createGuild,
  joinGuild,
  leaveGuild
} from '../controllers/guild.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { guildRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public / optionally authenticated guild browsing
router.get('/', optionalAuthMiddleware, getGuilds);

// Current player's active guild (must be declared before /:id)
router.get('/me', authMiddleware, getMyGuild);

// Player leave active guild (must be declared before /:id/join)
router.post('/leave', authMiddleware, guildRateLimiter, leaveGuild);

// Specific guild details
router.get('/:id', optionalAuthMiddleware, getGuildById);

// Create a new guild
router.post('/', authMiddleware, guildRateLimiter, createGuild);

// Join an existing guild
router.post('/:id/join', authMiddleware, guildRateLimiter, joinGuild);

export default router;
