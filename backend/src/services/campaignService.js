import { levels, simulate } from '../../../shared/game.js';
import CampaignProgress from '../models/CampaignProgress.js';
import CampaignAttempt from '../models/CampaignAttempt.js';
import User from '../models/User.js';
import {
  calculateLevel,
  calculateStreak,
  canUseTransactions,
  withTransaction
} from './rewardService.js';
import { AppError } from '../middleware/errorHandler.js';

export const CAMPAIGN_VERSION = 'v1';
export const FIRST_CLEAR_XP = 100;
export const FIRST_CLEAR_COINS = 25;

/**
 * Confirms whether an error is an E11000 duplicate-key error belonging to the
 * expected completion unique constraint: { user: 1, levelId: 1, campaignVersion: 1 }.
 *
 * @param {any} err
 * @returns {boolean}
 */
export function isExpectedCompletionDuplicateKey(err) {
  if (!err || (err.code !== 11000 && err.codeName !== 'DuplicateKey')) {
    return false;
  }
  if (err.keyPattern) {
    return Boolean(err.keyPattern.user && err.keyPattern.levelId && err.keyPattern.campaignVersion);
  }
  if (typeof err.message === 'string') {
    return (
      err.message.includes('unique_user_level_campaign_version') ||
      err.message.includes('user_1_levelId_1_campaignVersion_1') ||
      (err.message.includes('levelId') && err.message.includes('campaignVersion'))
    );
  }
  return false;
}

/**
 * Atomically recovers from a duplicate-key race condition by updating the winning
 * completion document using $max for stars and $inc for attempts.
 * Performs bounded retries if the winning transaction commit is still in flight.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {number} params.levelId
 * @param {number} params.stars
 * @param {Date} params.now
 * @param {number} [params.maxRetries=3]
 * @returns {Promise<object | null>} Resulting committed document, or null if uncommitted
 */
export async function recoverFromDuplicateKey({ userId, levelId, stars, now, maxRetries = 3 }) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const committedDoc = await CampaignProgress.findOneAndUpdate(
      { user: userId, levelId, campaignVersion: CAMPAIGN_VERSION },
      {
        $max: { stars },
        $inc: { attempts: 1 },
        $set: { lastCompletedAt: now }
      },
      {
        returnDocument: 'after',
        lean: true
      }
    );

    if (committedDoc) {
      return committedDoc;
    }

    // Bounded backoff wait if the concurrent write has not surfaced yet
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }

  return null;
}

/**
 * Retrieves the full list of campaign sectors with player-specific unlock and completion state.
 *
 * @param {string} userId - Authenticated player ObjectId
 * @returns {Promise<Array<object>>}
 */
export async function getCampaignLevels(userId) {
  const progressList = await CampaignProgress.find({
    user: userId,
    campaignVersion: CAMPAIGN_VERSION
  }).lean();

  const completedMap = new Map();
  for (const prog of progressList) {
    completedMap.set(prog.levelId, prog);
  }

  return levels.map(level => {
    const progress = completedMap.get(level.id);
    const isCompleted = Boolean(progress);
    const isUnlocked = level.id === 1 || completedMap.has(level.id - 1);

    return {
      id: level.id,
      title: level.title,
      zone: level.zone,
      concept: level.concept,
      briefing: level.briefing,
      hint: level.hint,
      map: level.map,
      direction: level.direction,
      par: level.par,
      difficulty: level.difficulty ?? level.id,
      bossHealth: level.bossHealth ?? (level.map.some((r) => r.includes('X')) ? 3 : 0),
      maxBlocks: level.maxBlocks ?? null,
      maxActions: level.maxActions ?? null,
      requireLoops: Boolean(level.requireLoops),
      requireSensors: Boolean(level.requireSensors),
      completed: isCompleted,
      stars: progress ? progress.stars : 0,
      unlocked: isUnlocked
    };
  });
}

/**
 * Authoritatively executes a player program against a canonical sector and persists
 * progress, best stars, and one-time rewards with database-enforced concurrency safety.
 *
 * @param {object} params
 * @param {string} params.userId - Authenticated player ID
 * @param {number} params.levelId - Target sector ID
 * @param {Array} params.program - Command AST
 * @returns {Promise<object>} Authoritative simulation outcome, frames, and refreshed progress
 */
export async function runCampaignLevel({ userId, levelId, program }) {
  const level = levels.find(l => l.id === levelId);
  if (!level) {
    throw new AppError(`Level ${levelId} not found.`, 404, 'LEVEL_NOT_FOUND');
  }

  // Enforce sequential unlock order
  if (level.id > 1) {
    const prevCompleted = await CampaignProgress.exists({
      user: userId,
      levelId: level.id - 1,
      campaignVersion: CAMPAIGN_VERSION
    });
    if (!prevCompleted) {
      throw new AppError(
        `Sector ${level.id} is locked. Complete Sector ${level.id - 1} before attempting this level.`,
        403,
        'LEVEL_LOCKED'
      );
    }
  }

  // Execute canonical simulation
  let simResult;
  try {
    simResult = simulate(level, program);
  } catch (err) {
    throw new AppError(err.message, 400, 'INVALID_PROGRAM');
  }

  const now = new Date();

  // Always persist the run attempt for auditing and telemetry
  try {
    await CampaignAttempt.create({
      user: userId,
      levelId,
      campaignVersion: CAMPAIGN_VERSION,
      passed: simResult.passed,
      stars: simResult.stars,
      steps: simResult.state.steps,
      programBlocks: simResult.programBlocks,
      reason: simResult.message
    });
  } catch {
    // Non-fatal telemetry write failure
  }

  // Handle failed run
  if (!simResult.passed) {
    const user = await User.findById(userId);
    return {
      passed: false,
      stars: 0,
      frames: simResult.frames,
      state: simResult.state,
      message: simResult.message,
      earned: {
        xp: 0,
        coins: 0
      },
      unlockedNext: false,
      user: user ? user.toSafeObject() : null
    };
  }

  // Handle successful run: fail-fast if multi-document transactions are unavailable
  if (!canUseTransactions()) {
    throw new AppError(
      'Multi-document database transactions are unavailable. A MongoDB replica set is required for reward-bearing campaign progression.',
      503,
      'TRANSACTIONS_UNAVAILABLE'
    );
  }

  let awardedXp = 0;
  let awardedCoins = 0;
  let updatedUser = null;
  let finalStars = simResult.stars;

  try {
    const txResult = await withTransaction(async (session) => {
      const existing = await CampaignProgress.findOne(
        { user: userId, levelId, campaignVersion: CAMPAIGN_VERSION },
        null,
        { session }
      );

      if (existing) {
        // Replay: update best stars only
        if (simResult.stars > existing.stars) {
          existing.stars = simResult.stars;
        }
        existing.attempts += 1;
        existing.lastCompletedAt = now;
        await existing.save({ session });

        const user = await User.findById(userId, null, { session });
        return {
          isFirstClear: false,
          stars: existing.stars,
          awardedXp: 0,
          awardedCoins: 0,
          user
        };
      }

      // First-time completion: atomically create progress and award player currencies
      await CampaignProgress.create(
        [
          {
            user: userId,
            levelId,
            campaignVersion: CAMPAIGN_VERSION,
            stars: simResult.stars,
            attempts: 1,
            firstCompletedAt: now,
            lastCompletedAt: now,
            xpAwarded: FIRST_CLEAR_XP,
            coinsAwarded: FIRST_CLEAR_COINS,
            rewardClaimed: true
          }
        ],
        { session }
      );

      const user = await User.findById(userId, null, { session });
      if (!user) {
        throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
      }

      const newTotalXp = (user.totalXp || 0) + FIRST_CLEAR_XP;
      const newLevel = calculateLevel(newTotalXp);
      const { currentStreak, lastActiveDate } = calculateStreak(
        user.lastActiveDate,
        user.currentStreak,
        now
      );

      user.totalXp = newTotalXp;
      user.level = newLevel;
      user.coins = (user.coins || 0) + FIRST_CLEAR_COINS;
      user.currentStreak = currentStreak;
      user.lastActiveDate = lastActiveDate;

      const savedUser = await user.save({ session });
      return {
        isFirstClear: true,
        stars: simResult.stars,
        awardedXp: FIRST_CLEAR_XP,
        awardedCoins: FIRST_CLEAR_COINS,
        user: savedUser
      };
    });

    awardedXp = txResult.awardedXp;
    awardedCoins = txResult.awardedCoins;
    updatedUser = txResult.user;
    finalStars = txResult.stars;
  } catch (err) {
    if (isExpectedCompletionDuplicateKey(err)) {
      // Duplicate key error aborted the transaction.
      // Another concurrent request won the race to insert the first clear.
      // Atomically update best stars and attempts outside the aborted session.
      const recoveredDoc = await recoverFromDuplicateKey({
        userId,
        levelId,
        stars: simResult.stars,
        now
      });

      if (!recoveredDoc) {
        throw new AppError(
          'Concurrent completion collision detected, but no committed completion record was found. Please retry your submission.',
          409,
          'CONCURRENT_CONFLICT'
        );
      }

      finalStars = recoveredDoc.stars;
      awardedXp = 0;
      awardedCoins = 0;
      updatedUser = await User.findById(userId);
    } else {
      throw err;
    }
  }

  const nextLevelExists = levels.some(l => l.id === level.id + 1);

  return {
    passed: true,
    stars: finalStars,
    frames: simResult.frames,
    state: simResult.state,
    message: simResult.message,
    earned: {
      xp: awardedXp,
      coins: awardedCoins
    },
    unlockedNext: nextLevelExists,
    user: updatedUser ? updatedUser.toSafeObject() : null
  };
}

/**
 * Retrieves the authenticated player's recent campaign run attempts.
 * Bounded query strictly scoped to the requesting player's userId.
 *
 * @param {string} userId - Authenticated user identifier
 * @param {number} [limit=10] - Number of recent records to retrieve (1..50)
 * @returns {Promise<Array<object>>}
 */
export async function getPlayerRunHistory(userId, limit = 10) {
  const boundedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);

  const history = await CampaignAttempt.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(boundedLimit)
    .lean();

  return history.map((h) => ({
    id: h._id.toString(),
    levelId: h.levelId,
    passed: h.passed,
    stars: h.stars,
    steps: h.steps,
    actionsCount: h.steps,
    programBlocks: h.programBlocks,
    reason: h.reason,
    createdAt: h.createdAt
  }));
}
