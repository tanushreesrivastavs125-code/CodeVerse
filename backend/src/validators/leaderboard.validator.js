import { AppError } from '../middleware/errorHandler.js';

const VALID_RANGES = ['all', 'weekly'];

/**
 * Validates and normalizes query parameters for the leaderboard endpoint.
 *
 * @param {Record<string, any>} query
 * @returns {{ range: 'all' | 'weekly', limit: number }}
 */
export function validateLeaderboardQuery(query = {}) {
  let range = 'all';
  if (query.range !== undefined && query.range !== null && query.range !== '') {
    if (typeof query.range !== 'string' || !VALID_RANGES.includes(query.range.trim().toLowerCase())) {
      throw new AppError(
        'Invalid range parameter. Allowed values are "all" or "weekly".',
        400,
        'VALIDATION_ERROR'
      );
    }
    range = query.range.trim().toLowerCase();
  }

  let limit = 20;
  if (query.limit !== undefined && query.limit !== null && query.limit !== '') {
    const parsedLimit = Number(query.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new AppError(
        'Invalid limit parameter. Must be an integer between 1 and 100.',
        400,
        'VALIDATION_ERROR'
      );
    }
    limit = parsedLimit;
  }

  return { range, limit };
}

