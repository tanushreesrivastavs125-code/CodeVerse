import Topic from '../models/Topic.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_SORT_FIELDS = new Set(['order', 'title', 'difficulty', 'category', 'createdAt']);

/**
 * Retrieves curriculum topics matching query criteria with deterministic sorting.
 * Strictly guarantees that public requests can never access inactive topics.
 * Deterministic ordering is guaranteed with `_id: 1` as a secondary tie-breaker.
 *
 * @param {object} [options={}] - Validated query and filtering options
 * @param {string} [options.category] - Filter by realm/category (e.g. 'frontend', 'dsa')
 * @param {string} [options.difficulty] - Filter by difficulty tier ('beginner', 'intermediate', 'advanced')
 * @param {string} [options.search] - Case-insensitive text search on title or description
 * @param {string} [options.sortBy] - Sort field ('order', 'title', 'difficulty', 'category', 'createdAt')
 * @param {string} [options.sortOrder] - 'asc' or 'desc' (default: 'asc')
 * @returns {Promise<Array<object>>} Array of safe topic objects
 */
export async function getTopics(options = {}) {
  // Public curriculum queries are strictly locked to active topics only
  const query = { isActive: true };

  // 1. Category / Realm filtering
  if (options.category && typeof options.category === 'string') {
    const trimmedCategory = options.category.trim().toLowerCase();
    if (trimmedCategory.length > 0) {
      query.category = trimmedCategory;
    }
  }

  // 2. Difficulty filtering
  if (options.difficulty && typeof options.difficulty === 'string') {
    const trimmedDifficulty = options.difficulty.trim().toLowerCase();
    if (trimmedDifficulty.length > 0) {
      query.difficulty = trimmedDifficulty;
    }
  }

  // 3. Keyword search (title / description) with safe regex escaping
  if (options.search && typeof options.search === 'string') {
    const trimmedSearch = options.search.trim();
    if (trimmedSearch.length > 0) {
      const escaped = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } }
      ];
    }
  }

  // 4. Deterministic sorting
  const sortOptions = {};
  const requestedSortBy = options.sortBy && typeof options.sortBy === 'string'
    ? options.sortBy.trim()
    : 'order';
  const sortField = ALLOWED_SORT_FIELDS.has(requestedSortBy) ? requestedSortBy : 'order';
  const sortDirection = String(options.sortOrder || '').toLowerCase() === 'desc' ? -1 : 1;

  sortOptions[sortField] = sortDirection;
  // Tie-breaker to ensure strictly deterministic ordering
  if (sortField !== '_id') {
    sortOptions._id = 1;
  }

  try {
    const queryBuilder = Topic.find(query).sort(sortOptions);
    const topics = await queryBuilder;

    return topics.map((topic) => {
      if (typeof topic.toSafeObject === 'function') {
        return topic.toSafeObject();
      }
      return {
        id: topic._id ? topic._id.toString() : (topic.id || undefined),
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        category: topic.category,
        difficulty: topic.difficulty,
        order: topic.order,
        concepts: Array.isArray(topic.concepts)
          ? topic.concepts.map((c) => ({
              id: c._id ? c._id.toString() : (c.id || undefined),
              title: c.title,
              slug: c.slug,
              description: c.description,
              order: c.order
            }))
          : [],
        isActive: topic.isActive,
        isLocked: topic.isLocked,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt
      };
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    // Database or infrastructure failure
    throw new AppError('Unable to retrieve curriculum topics due to a database error.', 500, 'DATABASE_ERROR');
  }
}
