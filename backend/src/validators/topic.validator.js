import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_QUERY_KEYS = new Set(['category', 'difficulty', 'sortBy', 'sortOrder', 'isActive', 'search', 'q']);
const ALLOWED_CATEGORIES = new Set(['frontend', 'backend', 'dsa', 'core', 'general']);
const ALLOWED_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
const ALLOWED_SORT_FIELDS = new Set(['order', 'title', 'difficulty', 'category', 'createdAt']);
const ALLOWED_SORT_ORDERS = new Set(['asc', 'desc']);
const MAX_SEARCH_LENGTH = 100;

/**
 * Validates and normalizes query parameters for public GET /api/topics requests.
 * Enforces strict allowlisting, prevents NoSQL query object injection,
 * and guards active-only public access.
 *
 * @param {unknown} query - Raw req.query object
 * @returns {object} Sanitized and validated query parameters
 */
export function validateTopicQuery(query = {}) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw new AppError('Query parameters must be a valid object.', 400, 'VALIDATION_ERROR');
  }

  // 1. Reject unrecognized query parameters to prevent parameter pollution
  for (const key of Object.keys(query)) {
    if (!ALLOWED_QUERY_KEYS.has(key)) {
      throw new AppError(`Unrecognized query parameter: "${key}".`, 400, 'VALIDATION_ERROR');
    }
  }

  const normalized = {};

  // 2. Active status access control: public API strictly serves active topics only
  if (query.isActive !== undefined) {
    if (typeof query.isActive !== 'string') {
      throw new AppError('Invalid isActive parameter format.', 400, 'VALIDATION_ERROR');
    }
    const val = query.isActive.trim().toLowerCase();
    if (val === 'false' || val === 'all' || val === '*') {
      throw new AppError('Public curriculum only supports active topics.', 400, 'VALIDATION_ERROR');
    }
    if (val !== 'true') {
      throw new AppError('Invalid isActive parameter value. Must be "true".', 400, 'VALIDATION_ERROR');
    }
    normalized.isActive = true;
  } else {
    normalized.isActive = true;
  }

  // 3. Category validation
  if (query.category !== undefined) {
    if (typeof query.category !== 'string') {
      throw new AppError('Invalid category query parameter format.', 400, 'VALIDATION_ERROR');
    }
    const cat = query.category.trim().toLowerCase();
    if (!ALLOWED_CATEGORIES.has(cat)) {
      throw new AppError(
        `Invalid category filter: "${query.category}". Allowed: ${Array.from(ALLOWED_CATEGORIES).join(', ')}.`,
        400,
        'VALIDATION_ERROR'
      );
    }
    normalized.category = cat;
  }

  // 4. Difficulty validation
  if (query.difficulty !== undefined) {
    if (typeof query.difficulty !== 'string') {
      throw new AppError('Invalid difficulty query parameter format.', 400, 'VALIDATION_ERROR');
    }
    const diff = query.difficulty.trim().toLowerCase();
    if (!ALLOWED_DIFFICULTIES.has(diff)) {
      throw new AppError(
        `Invalid difficulty filter: "${query.difficulty}". Allowed: ${Array.from(ALLOWED_DIFFICULTIES).join(', ')}.`,
        400,
        'VALIDATION_ERROR'
      );
    }
    normalized.difficulty = diff;
  }

  // 5. Sort field validation
  if (query.sortBy !== undefined) {
    if (typeof query.sortBy !== 'string') {
      throw new AppError('Invalid sortBy parameter format.', 400, 'VALIDATION_ERROR');
    }
    const sortField = query.sortBy.trim();
    if (!ALLOWED_SORT_FIELDS.has(sortField)) {
      throw new AppError(
        `Invalid sortBy field: "${query.sortBy}". Allowed: ${Array.from(ALLOWED_SORT_FIELDS).join(', ')}.`,
        400,
        'VALIDATION_ERROR'
      );
    }
    normalized.sortBy = sortField;
  } else {
    normalized.sortBy = 'order';
  }

  // 6. Sort direction validation
  if (query.sortOrder !== undefined) {
    if (typeof query.sortOrder !== 'string') {
      throw new AppError('Invalid sortOrder parameter format.', 400, 'VALIDATION_ERROR');
    }
    const order = query.sortOrder.trim().toLowerCase();
    if (!ALLOWED_SORT_ORDERS.has(order)) {
      throw new AppError('Invalid sortOrder parameter. Must be "asc" or "desc".', 400, 'VALIDATION_ERROR');
    }
    normalized.sortOrder = order;
  } else {
    normalized.sortOrder = 'asc';
  }

  // 7. Search query validation & ReDoS protection
  const rawSearch = query.search !== undefined ? query.search : query.q;
  if (rawSearch !== undefined) {
    if (typeof rawSearch !== 'string') {
      throw new AppError('Invalid search query parameter format.', 400, 'VALIDATION_ERROR');
    }
    const trimmedSearch = rawSearch.trim();
    if (trimmedSearch.length > MAX_SEARCH_LENGTH) {
      throw new AppError(
        `Search query exceeds maximum allowed length of ${MAX_SEARCH_LENGTH} characters.`,
        400,
        'VALIDATION_ERROR'
      );
    }
    if (trimmedSearch.length > 0) {
      normalized.search = trimmedSearch;
    }
  }

  return normalized;
}
