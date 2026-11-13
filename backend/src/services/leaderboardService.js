import mongoose from 'mongoose';
import User from '../models/User.js';
import CampaignProgress from '../models/CampaignProgress.js';

/**
 * Calculates deterministic UTC calendar week boundaries (Monday 00:00:00 UTC through next Monday 00:00:00 UTC).
 *
 * @param {Date | string | number} [referenceDate=new Date()]
 * @returns {{ start: Date, end: Date, label: string }}
 */
export function getUtcWeekBoundaries(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = day === 0 ? 6 : day - 1;

  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diffToMonday, 0, 0, 0, 0));
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const startLabel = start.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  const endLabel = new Date(end.getTime() - 1000).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    start,
    end,
    label: `Week of ${startLabel} – ${endLabel} (UTC)`
  };
}

/**
 * Retrieves the authoritative CodeVerse leaderboard for the specified time range.
 *
 * @param {object} params
 * @param {'all' | 'weekly'} [params.range='all']
 * @param {number} [params.limit=20]
 * @param {string} [params.currentUserId]
 * @param {Date} [params.referenceDate] - Optional anchor date for testing UTC boundaries
 * @returns {Promise<object>}
 */
export async function getLeaderboard({
  range = 'all',
  limit = 20,
  currentUserId = null,
  referenceDate = new Date()
} = {}) {
  const boundedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  const currentUserIdStr = currentUserId ? currentUserId.toString() : null;

  if (range === 'weekly') {
    const { start, end, label } = getUtcWeekBoundaries(referenceDate);

    // Aggregate committed one-time reward records within the active UTC week.
    // Replays (xpAwarded: 0) and failed attempts are strictly excluded.
    const pipeline = [
      {
        $match: {
          rewardClaimed: true,
          xpAwarded: { $gt: 0 },
          firstCompletedAt: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: '$user',
          weeklyXp: { $sum: '$xpAwarded' },
          sectorsCleared: { $sum: 1 },
          firstClearTime: { $min: '$firstCompletedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        // Deterministic tie-breaking: weekly XP -> all-time XP -> earliest clear time -> _id
        $sort: {
          weeklyXp: -1,
          'userDetails.totalXp': -1,
          firstClearTime: 1,
          _id: 1
        }
      },
      {
        $limit: boundedLimit
      }
    ];

    const weeklyAgg = await CampaignProgress.aggregate(pipeline);

    const entries = weeklyAgg.map((row, idx) => {
      const uId = row._id.toString();
      return {
        rank: idx + 1,
        userId: uId,
        username: row.userDetails.username,
        level: row.userDetails.level || 1,
        xp: row.weeklyXp,
        sectorsCleared: row.sectorsCleared,
        isGuest: row.userDetails.role === 'guest',
        isCurrentPlayer: Boolean(currentUserIdStr && uId === currentUserIdStr)
      };
    });

    let currentPlayer = null;
    if (currentUserIdStr) {
      const existingInTop = entries.find((e) => e.userId === currentUserIdStr);
      if (existingInTop) {
        currentPlayer = {
          inTopResults: true,
          rank: existingInTop.rank,
          xp: existingInTop.xp,
          username: existingInTop.username
        };
      } else {
        // Player is outside top results; compute their personal weekly XP without fabricating a false rank
        try {
          const userObjId = mongoose.Types.ObjectId.isValid(currentUserIdStr)
            ? new mongoose.Types.ObjectId(currentUserIdStr)
            : null;

          if (userObjId) {
            const [personalAgg, userDoc] = await Promise.all([
              CampaignProgress.aggregate([
                {
                  $match: {
                    user: userObjId,
                    rewardClaimed: true,
                    xpAwarded: { $gt: 0 },
                    firstCompletedAt: { $gte: start, $lt: end }
                  }
                },
                {
                  $group: {
                    _id: '$user',
                    weeklyXp: { $sum: '$xpAwarded' }
                  }
                }
              ]),
              User.findById(userObjId).select('username').lean()
            ]);

            currentPlayer = {
              inTopResults: false,
              rank: null,
              xp: personalAgg[0]?.weeklyXp || 0,
              username: userDoc?.username || 'Pilot'
            };
          }
        } catch {
          currentPlayer = null;
        }
      }
    }

    return {
      range: 'weekly',
      limit: boundedLimit,
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
      weekLabel: label,
      generatedAt: new Date().toISOString(),
      entries,
      currentPlayer
    };
  }

  // Range === 'all' (All-time authoritative XP ranking)
  // Deterministic tie-breaking: totalXp -> level -> account creation -> _id
  const topUsers = await User.find({})
    .sort({ totalXp: -1, level: -1, createdAt: 1, _id: 1 })
    .limit(boundedLimit)
    .select('username totalXp level currentStreak role createdAt')
    .lean();

  const entries = topUsers.map((u, idx) => {
    const uId = u._id.toString();
    return {
      rank: idx + 1,
      userId: uId,
      username: u.username,
      level: u.level || 1,
      xp: u.totalXp || 0,
      streak: u.currentStreak || 0,
      isGuest: u.role === 'guest',
      isCurrentPlayer: Boolean(currentUserIdStr && uId === currentUserIdStr)
    };
  });

  let currentPlayer = null;
  if (currentUserIdStr) {
    const existingInTop = entries.find((e) => e.userId === currentUserIdStr);
    if (existingInTop) {
      currentPlayer = {
        inTopResults: true,
        rank: existingInTop.rank,
        xp: existingInTop.xp,
        username: existingInTop.username
      };
    } else {
      try {
        const userDoc = await User.findById(currentUserIdStr).select('username totalXp').lean();
        if (userDoc) {
          currentPlayer = {
            inTopResults: false,
            rank: null,
            xp: userDoc.totalXp || 0,
            username: userDoc.username
          };
        }
      } catch {
        currentPlayer = null;
      }
    }
  }

  return {
    range: 'all',
    limit: boundedLimit,
    generatedAt: new Date().toISOString(),
    entries,
    currentPlayer
  };
}

