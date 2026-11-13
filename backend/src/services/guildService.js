import Guild from '../models/Guild.js';
import GuildMembership from '../models/GuildMembership.js';
import User from '../models/User.js';
import { withTransaction } from './rewardService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Retrieves detailed presentation data for a specific guild, calculating
 * the real-time sum of members' authoritative totalXp and verifying membership/ownership.
 *
 * @param {string | import('mongoose').Types.ObjectId} guildId
 * @param {string} [currentUserId=null]
 * @param {import('mongoose').ClientSession} [session=null]
 * @returns {Promise<object>}
 */
export async function getGuildDetailsById(guildId, currentUserId = null, session = null) {
  const guildQuery = Guild.findById(guildId);
  if (session) guildQuery.session(session);
  const guild = await guildQuery.lean();

  if (!guild) {
    throw new AppError('Guild not found.', 404, 'GUILD_NOT_FOUND');
  }

  // Retrieve memberships ordered deterministically: joinedAt asc, _id asc
  const memQuery = GuildMembership.find({ guild: guild._id }).sort({ joinedAt: 1, _id: 1 });
  if (session) memQuery.session(session);
  const memberships = await memQuery.lean();

  const userIds = memberships.map((m) => m.user);
  // Fetch safe public user fields only: username, level, totalXp
  const userQuery = User.find({ _id: { $in: userIds } }, 'username level totalXp').lean();
  if (session) userQuery.session(session);
  const userDocs = await userQuery;
  const userMap = new Map(userDocs.map((u) => [u._id.toString(), u]));

  // Calculate authoritative Combined Member XP as the direct sum of current members' totalXp
  let combinedXp = 0;
  const members = memberships.map((m) => {
    const u = userMap.get(m.user.toString());
    const memberXp = u?.totalXp || 0;
    combinedXp += memberXp;

    return {
      id: m.user.toString(),
      username: u?.username || 'Unknown Pilot',
      level: u?.level || 1,
      totalXp: memberXp,
      joinedAt: m.joinedAt,
      isOwner: m.user.toString() === guild.owner.toString()
    };
  });

  const ownerUser = userMap.get(guild.owner.toString());

  return {
    id: guild._id.toString(),
    name: guild.name,
    description: guild.description || '',
    owner: {
      id: guild.owner.toString(),
      username: ownerUser?.username || 'Guild Master',
      level: ownerUser?.level || 1
    },
    memberCount: members.length,
    combinedXp,
    members,
    isOwner: currentUserId ? guild.owner.toString() === currentUserId.toString() : false,
    isMember: currentUserId ? members.some((m) => m.id === currentUserId.toString()) : false,
    createdAt: guild.createdAt
  };
}

/**
 * Retrieves the authenticated player's current guild, or null if unaffiliated.
 *
 * @param {string} userId
 * @returns {Promise<{ guild: object | null }>}
 */
export async function getMyGuild(userId) {
  const membership = await GuildMembership.findOne({ user: userId }).lean();
  if (!membership) {
    return { guild: null };
  }

  const details = await getGuildDetailsById(membership.guild, userId);
  return { guild: details };
}

/**
 * Lists public guilds with bounded limit, optional substring search, member count,
 * and authoritative combined member XP.
 *
 * @param {object} params
 * @param {number} [params.limit=20]
 * @param {string} [params.search='']
 * @returns {Promise<Array<object>>}
 */
export async function listGuilds({ limit = 20, search = '' }) {
  const filter = {};
  if (search && search.trim().length > 0) {
    const escaped = search.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.normalizedName = new RegExp(escaped, 'i');
  }

  const guilds = await Guild.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  if (guilds.length === 0) {
    return [];
  }

  const guildIds = guilds.map((g) => g._id);
  const allMemberships = await GuildMembership.find({ guild: { $in: guildIds } }).lean();

  const userIds = [...new Set(allMemberships.map((m) => m.user.toString()))];
  const userDocs = await User.find({ _id: { $in: userIds } }, 'username level totalXp').lean();
  const userMap = new Map(userDocs.map((u) => [u._id.toString(), u]));

  // Group memberships by guildId
  const membershipsByGuild = new Map();
  for (const m of allMemberships) {
    const gid = m.guild.toString();
    if (!membershipsByGuild.has(gid)) {
      membershipsByGuild.set(gid, []);
    }
    membershipsByGuild.get(gid).push(m);
  }

  const results = guilds.map((g) => {
    const gid = g._id.toString();
    const gMembers = membershipsByGuild.get(gid) || [];
    let combinedXp = 0;
    for (const m of gMembers) {
      const u = userMap.get(m.user.toString());
      combinedXp += u?.totalXp || 0;
    }

    const ownerUser = userMap.get(g.owner.toString());

    return {
      id: gid,
      name: g.name,
      description: g.description || '',
      owner: {
        id: g.owner.toString(),
        username: ownerUser?.username || 'Guild Master'
      },
      memberCount: gMembers.length,
      combinedXp,
      createdAt: g.createdAt
    };
  });

  // Sort by combined member XP descending for an engaging, competitive directory
  return results.sort((a, b) => b.combinedXp - a.combinedXp);
}

/**
 * Creates a new guild, atomically establishing the creator as owner and first member
 * within a multi-document database transaction.
 *
 * @param {object} params
 * @param {string} params.userId - Authenticated creator ID
 * @param {string} params.name - User-facing guild name
 * @param {string} [params.description=''] - Optional description
 * @returns {Promise<object>} Created guild details
 */
export async function createGuild({ userId, name, description = '' }) {
  return withTransaction(async (session) => {
    // 1. Invariant: Player cannot belong to any other guild
    const existingMembership = await GuildMembership.findOne({ user: userId }).session(session);
    if (existingMembership) {
      throw new AppError(
        'You already belong to a guild. Leave your current guild before creating a new one.',
        400,
        'ALREADY_IN_GUILD'
      );
    }

    // 2. Invariant: Normalized name uniqueness
    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, ' ');
    const duplicateGuild = await Guild.findOne({ normalizedName }).session(session);
    if (duplicateGuild) {
      throw new AppError(
        'A guild with this name already exists. Please choose a unique name.',
        409,
        'GUILD_NAME_TAKEN'
      );
    }

    // 3. Create Guild document
    const [guild] = await Guild.create(
      [
        {
          name: name.trim(),
          normalizedName,
          description: description ? description.trim() : '',
          owner: userId
        }
      ],
      { session }
    );

    // 4. Create initial Membership document for the owner
    await GuildMembership.create(
      [
        {
          user: userId,
          guild: guild._id,
          joinedAt: new Date()
        }
      ],
      { session }
    );

    return getGuildDetailsById(guild._id, userId, session);
  });
}

/**
 * Joins a specified guild within a multi-document transaction.
 * Idempotent if the player is already a member of the target guild.
 * Rejects with 400 ALREADY_IN_GUILD if the player belongs to another guild.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.guildId
 * @returns {Promise<object>} Updated guild details
 */
export async function joinGuild({ userId, guildId }) {
  return withTransaction(async (session) => {
    // 1. Verify guild existence
    const guild = await Guild.findById(guildId).session(session);
    if (!guild) {
      throw new AppError('Guild not found.', 404, 'GUILD_NOT_FOUND');
    }

    // 2. Check current player membership
    const existingMembership = await GuildMembership.findOne({ user: userId }).session(session);
    if (existingMembership) {
      if (existingMembership.guild.toString() === guild._id.toString()) {
        // Idempotent: already a member of this guild
        return getGuildDetailsById(guild._id, userId, session);
      }

      throw new AppError(
        'You already belong to another guild. Leave your current guild before joining this one.',
        400,
        'ALREADY_IN_GUILD'
      );
    }

    // 3. Create active membership
    await GuildMembership.create(
      [
        {
          user: userId,
          guild: guild._id,
          joinedAt: new Date()
        }
      ],
      { session }
    );

    return getGuildDetailsById(guild._id, userId, session);
  });
}

/**
 * Leaves the player's current guild within a multi-document database transaction:
 * - Harmless no-op if unaffiliated.
 * - Regular member departure removes membership without affecting others.
 * - Owner departure transfers ownership to the oldest remaining member (deterministic tie-break).
 * - Final member departure removes both membership and the empty guild consistently.
 *
 * @param {object} params
 * @param {string} params.userId
 * @returns {Promise<{ action: 'noop' | 'left' | 'transferred' | 'disbanded', message: string, guild: null, newOwnerId?: string }>}
 */
export async function leaveGuild({ userId }) {
  return withTransaction(async (session) => {
    // 1. Locate player membership
    const currentMembership = await GuildMembership.findOne({ user: userId }).session(session);
    if (!currentMembership) {
      return {
        action: 'noop',
        message: 'Not currently affiliated with any guild.',
        guild: null
      };
    }

    const guild = await Guild.findById(currentMembership.guild).session(session);
    if (!guild) {
      // Clean up orphaned membership record
      await GuildMembership.deleteOne({ _id: currentMembership._id }).session(session);
      return {
        action: 'left',
        message: 'Successfully left guild.',
        guild: null
      };
    }

    const isOwner = guild.owner.toString() === userId.toString();

    if (!isOwner) {
      // Normal member departure: simple delete
      await GuildMembership.deleteOne({ _id: currentMembership._id }).session(session);
      return {
        action: 'left',
        message: 'Successfully left the guild.',
        guild: null
      };
    }

    // Owner departure: determine if other members remain
    const allMembers = await GuildMembership.find({ guild: guild._id })
      .sort({ joinedAt: 1, _id: 1 })
      .session(session);

    const remaining = allMembers.filter((m) => m.user.toString() !== userId.toString());

    if (remaining.length === 0) {
      // Final member leaving: disband empty guild and delete membership consistently
      await GuildMembership.deleteOne({ _id: currentMembership._id }).session(session);
      await Guild.deleteOne({ _id: guild._id }).session(session);
      return {
        action: 'disbanded',
        message: 'Guild disbanded as the final member left.',
        guild: null
      };
    }

    // Nonempty guild: transfer ownership to oldest remaining member (deterministic tie-break)
    const nextOwnerMembership = remaining[0];
    guild.owner = nextOwnerMembership.user;
    await guild.save({ session });

    await GuildMembership.deleteOne({ _id: currentMembership._id }).session(session);

    return {
      action: 'transferred',
      message: 'Successfully left guild. Ownership transferred to oldest remaining member.',
      guild: null,
      newOwnerId: nextOwnerMembership.user.toString()
    };
  });
}
