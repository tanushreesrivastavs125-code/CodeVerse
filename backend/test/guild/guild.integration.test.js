import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import User from '../../src/models/User.js';
import Guild from '../../src/models/Guild.js';
import GuildMembership from '../../src/models/GuildMembership.js';
import CampaignProgress from '../../src/models/CampaignProgress.js';
import CampaignAttempt from '../../src/models/CampaignAttempt.js';
import * as guildService from '../../src/services/guildService.js';
import * as campaignService from '../../src/services/campaignService.js';
import { canUseTransactions } from '../../src/services/rewardService.js';

function assertSafeTestDatabase(uri) {
  if (!uri || typeof uri !== 'string') {
    throw new Error('[SAFEGUARD] Database URI must be a valid connection string.');
  }

  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  const dbName = match ? match[1] : '';

  const FORBIDDEN_DATABASES = [
    'codeverse',
    'production',
    'prod',
    'staging',
    'admin',
    'config',
    'local'
  ];

  if (!dbName) {
    throw new Error('[SAFEGUARD] Target URI must specify a database name.');
  }

  if (FORBIDDEN_DATABASES.includes(dbName.toLowerCase())) {
    throw new Error(
      `[SAFEGUARD] Integration tests are forbidden from running against production/application database: "${dbName}".`
    );
  }

  if (!dbName.toLowerCase().includes('test') && !dbName.toLowerCase().includes('tmp')) {
    throw new Error(
      `[SAFEGUARD] Integration test database name "${dbName}" must contain "test" or "tmp" to ensure isolation.`
    );
  }
}

describe('Guild Real Replica-Set Transaction & Invariant Integration Verification', () => {
  let replSet;

  before(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await replSet.waitUntilRunning();
    const uri = replSet.getUri('codeverse_guild_integration_test');
    assertSafeTestDatabase(uri);
    await mongoose.connect(uri);

    assert.ok(canUseTransactions(), 'Replica set must support multi-document transactions');
  });

  after(async () => {
    await mongoose.disconnect();
    if (replSet) {
      await replSet.stop({ doCleanup: true });
    }
  });

  beforeEach(async () => {
    await GuildMembership.deleteMany({});
    await Guild.deleteMany({});
    await CampaignProgress.deleteMany({});
    await CampaignAttempt.deleteMany({});
    await User.deleteMany({});
  });

  test('Guild creation atomically creates Guild and GuildMembership in transaction', async () => {
    const pilot = await User.create({
      username: 'flight_lead',
      email: 'lead@codeverse.io',
      password: 'StrongPassword123!',
      totalXp: 400,
      level: 4,
      coins: 100,
      currentStreak: 3
    });

    const guild = await guildService.createGuild({
      userId: pilot.id,
      name: 'Vanguard Pilots',
      description: 'First to deploy.'
    });

    assert.equal(guild.name, 'Vanguard Pilots');
    assert.equal(guild.owner.id, pilot.id);
    assert.equal(guild.memberCount, 1);
    assert.equal(guild.combinedXp, 400);
    assert.equal(guild.isOwner, true);
    assert.equal(guild.isMember, true);

    // Verify DB records
    const dbGuild = await Guild.findById(guild.id);
    assert.ok(dbGuild);
    assert.equal(dbGuild.normalizedName, 'vanguard pilots');

    const dbMembership = await GuildMembership.findOne({ user: pilot.id });
    assert.ok(dbMembership);
    assert.equal(dbMembership.guild.toString(), guild.id);

    // Verify personal balances were not altered
    const reloadedPilot = await User.findById(pilot.id);
    assert.equal(reloadedPilot.totalXp, 400);
    assert.equal(reloadedPilot.coins, 100);
    assert.equal(reloadedPilot.level, 4);
    assert.equal(reloadedPilot.currentStreak, 3);
  });

  test('Duplicate normalized guild names reject with 409 GUILD_NAME_TAKEN', async () => {
    const pilot1 = await User.create({ username: 'alpha_one', email: 'alpha@codeverse.io', password: 'SecretPassword123!' });
    const pilot2 = await User.create({ username: 'beta_one', email: 'beta@codeverse.io', password: 'SecretPassword123!' });

    await guildService.createGuild({
      userId: pilot1.id,
      name: 'Cyber Nova',
      description: 'Original squad.'
    });

    await assert.rejects(
      async () => {
        await guildService.createGuild({
          userId: pilot2.id,
          name: '  cyber   nova  ',
          description: 'Copycat squad.'
        });
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.errorCode, 'GUILD_NAME_TAKEN');
        return true;
      }
    );
  });

  test('Single-guild membership invariant: user cannot create or join a second guild', async () => {
    const pilot1 = await User.create({ username: 'fleet_admiral', email: 'admiral@codeverse.io', password: 'SecretPassword123!' });
    const pilot2 = await User.create({ username: 'wing_lead', email: 'wing@codeverse.io', password: 'SecretPassword123!' });

    await guildService.createGuild({
      userId: pilot1.id,
      name: 'Fleet Core'
    });

    const guild2 = await guildService.createGuild({
      userId: pilot2.id,
      name: 'Wing Core'
    });

    // pilot1 tries to create another guild
    await assert.rejects(
      async () => {
        await guildService.createGuild({
          userId: pilot1.id,
          name: 'Fleet Sub'
        });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'ALREADY_IN_GUILD');
        return true;
      }
    );

    // pilot1 tries to join guild2
    await assert.rejects(
      async () => {
        await guildService.joinGuild({
          userId: pilot1.id,
          guildId: guild2.id
        });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'ALREADY_IN_GUILD');
        return true;
      }
    );
  });

  test('Joining guild is idempotent if user already belongs to the target guild', async () => {
    const owner = await User.create({ username: 'owner_pilot', email: 'owner@codeverse.io', password: 'SecretPassword123!', totalXp: 100 });
    const member = await User.create({ username: 'join_pilot', email: 'join@codeverse.io', password: 'SecretPassword123!', totalXp: 150 });

    const guild = await guildService.createGuild({
      userId: owner.id,
      name: 'Star Cluster'
    });

    const joined1 = await guildService.joinGuild({
      userId: member.id,
      guildId: guild.id
    });
    assert.equal(joined1.memberCount, 2);
    assert.equal(joined1.combinedXp, 250);

    // Re-joining same guild is idempotent
    const joined2 = await guildService.joinGuild({
      userId: member.id,
      guildId: guild.id
    });
    assert.equal(joined2.memberCount, 2);
    assert.equal(joined2.combinedXp, 250);

    const count = await GuildMembership.countDocuments({ user: member.id });
    assert.equal(count, 1);
  });

  test('Combined XP dynamically updates when a member clears a campaign level', async () => {
    const lead = await User.create({ username: 'lead_drone', email: 'lead@codeverse.io', password: 'SecretPassword123!', totalXp: 100 });
    const cadet = await User.create({ username: 'cadet_drone', email: 'cadet@codeverse.io', password: 'SecretPassword123!', totalXp: 0 });

    const guild = await guildService.createGuild({
      userId: lead.id,
      name: 'Dynamic Squad'
    });

    await guildService.joinGuild({
      userId: cadet.id,
      guildId: guild.id
    });

    // Initial combined XP: 100 + 0 = 100
    let details = await guildService.getGuildDetailsById(guild.id, lead.id);
    assert.equal(details.combinedXp, 100);

    // Cadet completes Level 1 (Forward, Forward, Forward)
    const runResult = await campaignService.runCampaignLevel({
      userId: cadet.id,
      levelId: 1,
      program: [{ type: 'move' }, { type: 'move' }, { type: 'move' }]
    });
    assert.equal(runResult.passed, true);
    assert.ok(runResult.earned.xp > 0, 'Cadet earned XP for clearing Level 1');

    // Reload cadet user to inspect updated personal totalXp
    const updatedCadet = await User.findById(cadet.id);
    assert.equal(updatedCadet.totalXp, runResult.earned.xp);

    // Query guild details: combinedXp reflects cadet's new XP in real time!
    details = await guildService.getGuildDetailsById(guild.id, lead.id);
    assert.equal(details.combinedXp, 100 + runResult.earned.xp);

    // List directory also reflects updated combinedXp
    const list = await guildService.listGuilds({});
    assert.equal(list[0].combinedXp, 100 + runResult.earned.xp);
  });

  test('Member leaves guild: membership removed, owner unaffected, balances preserved', async () => {
    const owner = await User.create({ username: 'guild_master', email: 'master@codeverse.io', password: 'SecretPassword123!', totalXp: 500 });
    const member = await User.create({ username: 'cadet_one', email: 'c1@codeverse.io', password: 'SecretPassword123!', totalXp: 200, coins: 50 });

    const guild = await guildService.createGuild({
      userId: owner.id,
      name: 'Iron Wings'
    });

    await guildService.joinGuild({
      userId: member.id,
      guildId: guild.id
    });

    const leaveResult = await guildService.leaveGuild({ userId: member.id });
    assert.equal(leaveResult.action, 'left');

    const details = await guildService.getGuildDetailsById(guild.id, owner.id);
    assert.equal(details.memberCount, 1);
    assert.equal(details.combinedXp, 500);
    assert.equal(details.owner.id, owner.id);

    // Cadet personal balances untouched
    const reloadedCadet = await User.findById(member.id);
    assert.equal(reloadedCadet.totalXp, 200);
    assert.equal(reloadedCadet.coins, 50);

    // Cadet can now create a new guild
    const newGuild = await guildService.createGuild({
      userId: member.id,
      name: 'Solo Vanguard'
    });
    assert.equal(newGuild.owner.id, member.id);
  });

  test('Owner leaves nonempty guild: ownership deterministically transfers to oldest remaining member', async () => {
    const owner = await User.create({ username: 'original_owner', email: 'orig@codeverse.io', password: 'SecretPassword123!', totalXp: 300 });
    const member1 = await User.create({ username: 'second_pilot', email: 'sec@codeverse.io', password: 'SecretPassword123!', totalXp: 150 });
    const member2 = await User.create({ username: 'third_pilot', email: 'third@codeverse.io', password: 'SecretPassword123!', totalXp: 100 });

    const guild = await guildService.createGuild({
      userId: owner.id,
      name: 'Succession Test'
    });

    // member1 joins first
    await guildService.joinGuild({ userId: member1.id, guildId: guild.id });
    // member2 joins second
    await guildService.joinGuild({ userId: member2.id, guildId: guild.id });

    // Original owner leaves
    const leaveResult = await guildService.leaveGuild({ userId: owner.id });
    assert.equal(leaveResult.action, 'transferred');
    assert.equal(leaveResult.newOwnerId, member1.id);

    // Verify guild state
    const details = await guildService.getGuildDetailsById(guild.id, member1.id);
    assert.equal(details.owner.id, member1.id);
    assert.equal(details.owner.username, member1.username);
    assert.equal(details.memberCount, 2);
    assert.equal(details.combinedXp, 250);
    assert.equal(details.isOwner, true);

    // Verify former owner is completely unaffiliated
    const formerOwnerStatus = await guildService.getMyGuild(owner.id);
    assert.equal(formerOwnerStatus.guild, null);
  });

  test('Final member leaves: guild is cleanly disbanded and removed', async () => {
    const lonePilot = await User.create({ username: 'lone_ranger', email: 'lone@codeverse.io', password: 'SecretPassword123!', totalXp: 50 });

    const guild = await guildService.createGuild({
      userId: lonePilot.id,
      name: 'Ephemeral Squad'
    });

    const leaveResult = await guildService.leaveGuild({ userId: lonePilot.id });
    assert.equal(leaveResult.action, 'disbanded');

    // Guild record should no longer exist
    const dbGuild = await Guild.findById(guild.id);
    assert.equal(dbGuild, null);

    const memberships = await GuildMembership.find({ guild: guild.id });
    assert.equal(memberships.length, 0);

    // Attempting to query disbanded guild throws 404
    await assert.rejects(
      async () => {
        await guildService.getGuildDetailsById(guild.id, lonePilot.id);
      },
      (err) => {
        assert.equal(err.statusCode, 404);
        assert.equal(err.errorCode, 'GUILD_NOT_FOUND');
        return true;
      }
    );
  });

  test('Unaffiliated player leaving returns harmless no-op', async () => {
    const unaffiliated = await User.create({ username: 'free_agent', email: 'free@codeverse.io', password: 'SecretPassword123!' });

    const result = await guildService.leaveGuild({ userId: unaffiliated.id });
    assert.equal(result.action, 'noop');
    assert.equal(result.guild, null);
  });

  test('Guest accounts have identical guild capabilities and invariants', async () => {
    const guestUser = await User.create({
      username: 'Guest_1001',
      email: 'guest_1001@guest.codeverse.io',
      password: 'GuestPassword123!',
      role: 'guest',
      totalXp: 75,
      level: 1,
      coins: 20
    });

    const guestGuild = await guildService.createGuild({
      userId: guestUser.id,
      name: 'Guest Coalition',
      description: 'Temporary callsigns, real teamwork.'
    });

    assert.equal(guestGuild.name, 'Guest Coalition');
    assert.equal(guestGuild.owner.id, guestUser.id);
    assert.equal(guestGuild.combinedXp, 75);

    const leaveResult = await guildService.leaveGuild({ userId: guestUser.id });
    assert.equal(leaveResult.action, 'disbanded');
  });
});
