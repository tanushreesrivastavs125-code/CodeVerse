import { AppError } from '../middleware/errorHandler.js';

const FORBIDDEN_FIELDS = [
  'success',
  'stars',
  'score',
  'xp',
  'totalXp',
  'coins',
  'userId',
  'user',
  'unlocked',
  'level',
  'role'
];

const ALLOWED_TOP_LEVEL_KEYS = new Set(['program', 'idempotencyKey']);

/**
 * Validates level identifier route parameter.
 * Must be a positive integer between 1 and 1000.
 *
 * @param {any} rawId
 * @returns {number} Parsed level ID
 */
export function validateLevelId(rawId) {
  if (rawId === undefined || rawId === null || rawId === '') {
    throw new AppError('Level identifier is required.', 400, 'VALIDATION_ERROR');
  }

  const num = Number(rawId);
  if (!Number.isInteger(num) || num < 1 || num > 1000) {
    throw new AppError(
      'Invalid level identifier. Must be a positive integer between 1 and 1000.',
      400,
      'VALIDATION_ERROR'
    );
  }

  return num;
}

/**
 * Validates POST /api/game/levels/:id/run request payload.
 * Strictly rejects client-supplied rewards, unlocks, scores, and unknown fields.
 *
 * @param {any} body
 * @returns {{ program: Array, idempotencyKey?: string }}
 */
export function validateRunPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(
      'Invalid request payload. Request body must be a JSON object.',
      400,
      'VALIDATION_ERROR'
    );
  }

  // Check for client attempts to inject reward or outcome fields
  for (const field of FORBIDDEN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      throw new AppError(
        `Forbidden client-provided field: "${field}". Game outcomes, rewards, and player state are server-authoritative.`,
        400,
        'VALIDATION_ERROR'
      );
    }
  }

  // Check for unrecognized fields
  for (const key of Object.keys(body)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      throw new AppError(
        `Unrecognized payload field: "${key}".`,
        400,
        'VALIDATION_ERROR'
      );
    }
  }

  if (!Array.isArray(body.program)) {
    throw new AppError(
      'Missing or invalid "program" field. Program must be a list of commands.',
      400,
      'VALIDATION_ERROR'
    );
  }

  return {
    program: body.program,
    idempotencyKey:
      typeof body.idempotencyKey === 'string' && body.idempotencyKey.trim().length > 0
        ? body.idempotencyKey.trim()
        : undefined
  };
}
