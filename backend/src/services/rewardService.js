import mongoose from 'mongoose';

/**
 * Calculates current level tier from accumulated total XP based on CodeVerse formula:
 * XP Required for Level N = ceil(100 * N^1.5)
 *
 * Tier thresholds:
 * - Level 1: 0 - 99 XP
 * - Level 2: 100 - 282 XP
 * - Level 3: 283 - 519 XP
 * - Level 4: 520 - 799 XP
 *
 * @param {number} totalXp - User's cumulative XP
 * @returns {number} Calculated level tier (minimum 1)
 */
export function calculateLevel(totalXp) {
  if (!totalXp || typeof totalXp !== 'number' || totalXp <= 0) {
    return 1;
  }

  let level = 1;
  while (totalXp >= Math.ceil(100 * Math.pow(level, 1.5))) {
    level++;
  }
  return level;
}

/**
 * Normalizes a date to UTC calendar day timestamp (start of day at midnight UTC).
 *
 * @param {Date | string | number} date
 * @returns {number}
 */
export function getUtcDayTimestamp(date) {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Computes updated streak count and activity date based on UTC calendar day differences.
 * - Same day: streak preserved.
 * - Exactly 1 day since last activity: streak incremented.
 * - 2+ days or initial activity: streak reset to 1.
 *
 * @param {Date | null} lastActiveDate - Previous recorded active date
 * @param {number} currentStreak - Previous streak count
 * @param {Date} [now=new Date()] - Reference timestamp
 * @returns {{ currentStreak: number, lastActiveDate: Date }}
 */
export function calculateStreak(lastActiveDate, currentStreak = 0, now = new Date()) {
  if (!lastActiveDate) {
    return {
      currentStreak: 1,
      lastActiveDate: now
    };
  }

  const prevDay = getUtcDayTimestamp(lastActiveDate);
  const currentDay = getUtcDayTimestamp(now);
  const diffDays = Math.floor((currentDay - prevDay) / MS_PER_DAY);

  if (diffDays === 0) {
    return {
      currentStreak: Math.max(1, currentStreak),
      lastActiveDate: now
    };
  }

  if (diffDays === 1) {
    return {
      currentStreak: currentStreak + 1,
      lastActiveDate: now
    };
  }

  // 2+ days elapsed or clock moved backwards
  return {
    currentStreak: 1,
    lastActiveDate: now
  };
}

/**
 * Checks whether Mongoose is connected to a replica set or sharded cluster.
 *
 * @returns {boolean}
 */
export function isReplicaSetConnected() {
  const readyState = mongoose.connection?.readyState;
  const client = mongoose.connection?.client;
  const topologyType = client?.topology?.description?.type;

  return (
    readyState === 1 &&
    (topologyType === 'ReplicaSetWithPrimary' ||
      topologyType === 'ReplicaSetNoPrimary' ||
      topologyType === 'Sharded')
  );
}

/**
 * Determines whether MongoDB multi-document transactions can be executed.
 *
 * @returns {boolean}
 */
export function canUseTransactions() {
  return isReplicaSetConnected() || Boolean(mongoose.connection?._forceTransactionSupport);
}

/**
 * Checks if an error has the MongoDB UnknownTransactionCommitResult label.
 *
 * @param {any} err
 * @returns {boolean}
 */
export function hasUnknownCommitResultLabel(err) {
  if (!err) return false;
  if (typeof err.hasErrorLabel === 'function') {
    return err.hasErrorLabel('UnknownTransactionCommitResult');
  }
  if (Array.isArray(err.errorLabels)) {
    return err.errorLabels.includes('UnknownTransactionCommitResult');
  }
  return false;
}

/**
 * Commits a MongoDB transaction with bounded retry for ambiguous commit outcomes.
 *
 * @param {import('mongoose').ClientSession} session
 * @param {number} [maxRetries=3]
 * @returns {Promise<void>}
 */
export async function commitWithRetry(session, maxRetries = 3) {
  let attempts = 0;
  while (true) {
    try {
      await session.commitTransaction();
      break;
    } catch (err) {
      attempts++;
      if (attempts < maxRetries && hasUnknownCommitResultLabel(err)) {
        continue;
      }
      throw err;
    }
  }
}

/**
 * Safely executes database operations inside a MongoDB multi-document transaction
 * when connected to a replica set or sharded cluster. If running in a standalone
 * MongoDB environment (e.g., local single-node dev) or disconnected test mode,
 * executes the callback without a transaction session.
 *
 * @template T
 * @param {(session: import('mongoose').ClientSession | null) => Promise<T>} callback
 * @returns {Promise<T>}
 */
export async function withTransaction(callback) {
  if (!canUseTransactions()) {
    return callback(null);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await commitWithRetry(session);
    return result;
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {
      // Ignore secondary abort failures
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
