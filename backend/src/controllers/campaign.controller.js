import * as campaignService from '../services/campaignService.js';
import { validateLevelId, validateRunPayload } from '../validators/campaign.validator.js';

/**
 * GET /api/game/levels
 * Retrieves all campaign sectors with player-specific unlock, completion, and star states.
 *
 * @type {import('express').RequestHandler}
 */
export async function getLevels(req, res, next) {
  try {
    const levelsData = await campaignService.getCampaignLevels(req.user.id);
    res.status(200).json({
      success: true,
      data: levelsData
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/game/levels/:id/run
 * Authoritatively executes a player program, verifies outcomes, and persists rewards.
 *
 * @type {import('express').RequestHandler}
 */
export async function runLevel(req, res, next) {
  try {
    const levelId = validateLevelId(req.params.id);
    const { program, idempotencyKey } = validateRunPayload(req.body);

    const outcome = await campaignService.runCampaignLevel({
      userId: req.user.id,
      levelId,
      program,
      idempotencyKey
    });

    res.status(200).json({
      success: true,
      data: outcome
    });
  } catch (err) {
    next(err);
  }
}
