import { AppError } from '../middleware/errorHandler.js';
import { levels, validateProgram } from '../../../shared/game.js';

export const VALID_MENTOR_MODES = new Set(['hint', 'explain', 'debug', 'recommend']);
export const MAX_MESSAGE_LENGTH = 500;

/**
 * Validates and sanitizes the incoming request body for POST /api/ai/mentor.
 *
 * @param {any} body - Raw request body
 * @returns {{
 *   mode: 'hint' | 'explain' | 'debug' | 'recommend',
 *   levelId: number | null,
 *   message: string,
 *   program: Array | null
 * }}
 */
export function validateMentorPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request payload must be a JSON object.', 400, 'VALIDATION_ERROR');
  }

  // 1. Mode validation
  const { mode } = body;
  if (!mode || typeof mode !== 'string' || !VALID_MENTOR_MODES.has(mode)) {
    throw new AppError(
      'Mode is required and must be one of: hint, explain, debug, recommend.',
      400,
      'VALIDATION_ERROR'
    );
  }

  // 2. Level identifier validation
  let levelId = null;
  const isLevelRequired = mode === 'hint' || mode === 'explain' || mode === 'debug';

  if (body.levelId !== undefined && body.levelId !== null && body.levelId !== '') {
    const parsedId = Number(body.levelId);
    if (!Number.isInteger(parsedId) || parsedId < 1 || parsedId > levels.length) {
      throw new AppError(
        `Invalid levelId. Must be an integer between 1 and ${levels.length}.`,
        400,
        'VALIDATION_ERROR'
      );
    }
    levelId = parsedId;
  } else if (isLevelRequired) {
    throw new AppError(
      `levelId is required for mode "${mode}".`,
      400,
      'VALIDATION_ERROR'
    );
  }

  // 3. Message validation (bounded string)
  let message = '';
  if (body.message !== undefined && body.message !== null) {
    if (typeof body.message !== 'string') {
      throw new AppError('Message must be a string.', 400, 'VALIDATION_ERROR');
    }
    const trimmed = body.message.trim();
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new AppError(
        `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`,
        400,
        'VALIDATION_ERROR'
      );
    }
    message = trimmed;
  }

  // 4. Program validation (bounded AST tree via shared canonical validator)
  let program = null;
  if (body.program !== undefined && body.program !== null) {
    if (!Array.isArray(body.program)) {
      throw new AppError('Program must be an array of AST commands.', 400, 'INVALID_PROGRAM');
    }
    try {
      validateProgram(body.program);
      program = body.program;
    } catch (err) {
      throw new AppError(
        err.message || 'Invalid program AST structure.',
        400,
        'INVALID_PROGRAM'
      );
    }
  }

  return {
    mode,
    levelId,
    message,
    program
  };
}

