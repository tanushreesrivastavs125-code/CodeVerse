import * as mentorService from '../services/mentorService.js';
import { validateMentorPayload } from '../validators/mentor.validator.js';

/**
 * POST /api/ai/mentor
 * Authenticated, rate-limited consultation endpoint for contextual game guidance.
 *
 * @type {import('express').RequestHandler}
 */
export async function askMentor(req, res, next) {
  try {
    const validated = validateMentorPayload(req.body);

    const guidance = await mentorService.askMentor({
      userId: req.user.id,
      mode: validated.mode,
      levelId: validated.levelId,
      message: validated.message,
      program: validated.program
    });

    res.status(200).json({
      success: true,
      data: guidance
    });
  } catch (err) {
    next(err);
  }
}

