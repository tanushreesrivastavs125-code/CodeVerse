import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/leaderboard?range=all|weekly&limit=20
// Uses optional authentication so visitors can view public ranks while logged-in players get highlighted
router.get('/', optionalAuthMiddleware, getLeaderboard);

export default router;

