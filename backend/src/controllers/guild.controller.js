import * as guildService from '../services/guildService.js';
import {
  validateCreateGuildPayload,
  validateGuildId,
  validateGuildQuery
} from '../validators/guild.validator.js';

/**
 * GET /api/guilds
 * Retrieves a list of public guilds with member count, owner, and combined XP.
 * Supports optional search filter and limit.
 *
 * @type {import('express').RequestHandler}
 */
export async function getGuilds(req, res, next) {
  try {
    const { limit, search } = validateGuildQuery(req.query);
    const guilds = await guildService.listGuilds({ limit, search });

    res.status(200).json({
      success: true,
      data: guilds
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/guilds/me
 * Retrieves the authenticated player's current guild details, or null if unaffiliated.
 *
 * @type {import('express').RequestHandler}
 */
export async function getMyGuild(req, res, next) {
  try {
    const result = await guildService.getMyGuild(req.user.id);

    res.status(200).json({
      success: true,
      data: result.guild
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/guilds/:id
 * Retrieves full details for a specific guild by ID, including member roster and combined XP.
 * Optional authentication marks player's own membership / ownership status.
 *
 * @type {import('express').RequestHandler}
 */
export async function getGuildById(req, res, next) {
  try {
    const guildId = validateGuildId(req.params.id);
    const userId = req.user?.id || null;
    const guild = await guildService.getGuildDetailsById(guildId, userId);

    res.status(200).json({
      success: true,
      data: guild
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/guilds
 * Creates a new guild, atomically assigning the creator as owner and first member.
 *
 * @type {import('express').RequestHandler}
 */
export async function createGuild(req, res, next) {
  try {
    const validated = validateCreateGuildPayload(req.body);
    const guild = await guildService.createGuild({
      userId: req.user.id,
      name: validated.name,
      description: validated.description
    });

    res.status(201).json({
      success: true,
      data: guild
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/guilds/:id/join
 * Joins a specified guild. Idempotent if already a member of this guild;
 * rejects if player already belongs to another guild.
 *
 * @type {import('express').RequestHandler}
 */
export async function joinGuild(req, res, next) {
  try {
    const guildId = validateGuildId(req.params.id);
    const guild = await guildService.joinGuild({
      userId: req.user.id,
      guildId
    });

    res.status(200).json({
      success: true,
      data: guild
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/guilds/leave
 * Leaves the player's active guild. Atomically transfers ownership to the oldest
 * remaining member if the departing player was the owner, or disbands the guild
 * if the departing player was the final member.
 *
 * @type {import('express').RequestHandler}
 */
export async function leaveGuild(req, res, next) {
  try {
    const result = await guildService.leaveGuild({
      userId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}
