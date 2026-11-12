import { validateLeaderboardQuery } from '../validators/leaderboard.validator.js';
import * as leaderboardService from '../services/leaderboardService.js';

/**
 * GET /api/leaderboard?range=all|weekly&limit=20
 * Retrieves authoritative player rankings for all-time XP or weekly sprint.
 *
 * @type {import('express').RequestHandler}
 */
export async function getLeaderboard(req, res, next) {
  try {
    const { range, limit } = validateLeaderboardQuery(req.query);
    const currentUserId = req.user?.id || null;

    const data = await leaderboardService.getLeaderboard({
      range,
      limit,
      currentUserId
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

