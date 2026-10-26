import * as topicService from '../services/topicService.js';
import { validateTopicQuery } from '../validators/topic.validator.js';

/**
 * GET /api/topics
 * Retrieves curriculum roadmap topics in deterministic order.
 * Strictly validates query parameters and guarantees active-only public exposure.
 * Returns standardized success envelope: { success: true, data: [...] }
 *
 * @type {import('express').RequestHandler}
 */
export async function getTopics(req, res, next) {
  try {
    const validatedQuery = validateTopicQuery(req.query);
    const topics = await topicService.getTopics(validatedQuery);
    res.status(200).json({
      success: true,
      data: topics
    });
  } catch (err) {
    next(err);
  }
}
