import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler.js';

export const GUILD_NAME_MIN_LENGTH = 3;
export const GUILD_NAME_MAX_LENGTH = 30;
export const GUILD_DESC_MAX_LENGTH = 250;
const GUILD_NAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

/**
 * Validates the payload for POST /api/guilds.
 *
 * @param {any} body
 * @returns {{ name: string, normalizedName: string, description: string }}
 */
export function validateCreateGuildPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request payload must be a JSON object.', 400, 'VALIDATION_ERROR');
  }

  // Reject client-supplied authority or derived fields
  const forbiddenKeys = ['owner', 'members', 'combinedXp', 'id', '_id', 'joinedAt', 'user'];
  for (const key of forbiddenKeys) {
    if (body[key] !== undefined) {
      throw new AppError(
        `Field "${key}" is not permitted in guild creation payload.`,
        400,
        'VALIDATION_ERROR'
      );
    }
  }

  // 1. Guild name validation
  const { name } = body;
  if (!name || typeof name !== 'string') {
    throw new AppError('Guild name is required and must be a string.', 400, 'VALIDATION_ERROR');
  }

  const trimmedName = name.trim();
  if (trimmedName.length < GUILD_NAME_MIN_LENGTH || trimmedName.length > GUILD_NAME_MAX_LENGTH) {
    throw new AppError(
      `Guild name must be between ${GUILD_NAME_MIN_LENGTH} and ${GUILD_NAME_MAX_LENGTH} characters.`,
      400,
      'VALIDATION_ERROR'
    );
  }

  if (!GUILD_NAME_REGEX.test(trimmedName)) {
    throw new AppError(
      'Guild name may only contain alphanumeric characters, spaces, hyphens, and underscores.',
      400,
      'VALIDATION_ERROR'
    );
  }

  const normalizedName = trimmedName.toLowerCase().replace(/\s+/g, ' ');

  // 2. Guild description validation (optional)
  let description = '';
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      throw new AppError('Guild description must be a string.', 400, 'VALIDATION_ERROR');
    }
    const trimmedDesc = body.description.trim();
    if (trimmedDesc.length > GUILD_DESC_MAX_LENGTH) {
      throw new AppError(
        `Guild description cannot exceed ${GUILD_DESC_MAX_LENGTH} characters.`,
        400,
        'VALIDATION_ERROR'
      );
    }
    description = trimmedDesc;
  }

  return {
    name: trimmedName,
    normalizedName,
    description
  };
}

/**
 * Validates a MongoDB ObjectId string for guild routes.
 *
 * @param {any} id
 * @returns {string}
 */
export function validateGuildId(id) {
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid guild identifier.', 400, 'VALIDATION_ERROR');
  }
  return id;
}

/**
 * Validates query parameters for GET /api/guilds.
 *
 * @param {Record<string, any>} query
 * @returns {{ limit: number, search: string }}
 */
export function validateGuildQuery(query = {}) {
  let limit = 20;
  if (query.limit !== undefined && query.limit !== '') {
    const parsed = Number(query.limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
      throw new AppError('Query parameter limit must be an integer between 1 and 50.', 400, 'VALIDATION_ERROR');
    }
    limit = parsed;
  }

  let search = '';
  const rawSearch = query.search || query.q;
  if (rawSearch !== undefined && rawSearch !== null) {
    if (typeof rawSearch !== 'string') {
      throw new AppError('Search parameter must be a string.', 400, 'VALIDATION_ERROR');
    }
    search = rawSearch.trim().slice(0, 50);
  }

  return { limit, search };
}
