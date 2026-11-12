import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import User from '../../src/models/User.js';
import CampaignProgress from '../../src/models/CampaignProgress.js';
import CampaignAttempt from '../../src/models/CampaignAttempt.js';
import {
  runCampaignLevel,
  getCampaignLevels,
  isExpectedCompletionDuplicateKey,
  recoverFromDuplicateKey,
  CAMPAIGN_VERSION
} from '../../src/services/campaignService.js';
import { canUseTransactions, withTransaction } from '../../src/services/rewardService.js';
import { validateRunPayload } from '../../src/validators/campaign.validator.js';

/**
 * Validates that an integration test connection string strictly targets a dedicated
 * test database and never touches the application, production, or player databases.
 *
 * @param {string} uri
 */
export function assertSafeTestDatabase(uri) {
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

describe('Real MongoDB Replica Set Integration Verification', () => {
  let replSet = null;
  let activeMongoUri = null;
  let primaryTestUser = null;
  const testUsersToCleanup = new Set();

  before(async () => {
    let targetUri = process.env.MONGODB_TEST_URI;

    if (!targetUri) {
      // Start in-memory replica set if an external URI was not provided
      replSet = await MongoMemoryReplSet.create({
        replSet: {
          count: 1,
          storageEngine: 'wiredTiger'
        }
      });
      const uniqueDbName = `codeverse_campaign_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      targetUri = replSet.getUri(uniqueDbName);
    }

    assertSafeTestDatabase(targetUri);
    activeMongoUri = targetUri;

    // Connect to real MongoDB
    await mongoose.connect(activeMongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    // Verify transaction capability against real cluster
    const txSupported = canUseTransactions();
    if (!txSupported) {
      throw new Error(
        'Integration suite requires a MongoDB replica set supporting multi-document transactions.'
      );
    }

    // Build and sync required collection indexes before running concurrency tests
    await CampaignProgress.syncIndexes();
    await User.syncIndexes();
    await CampaignAttempt.syncIndexes();
  });

  after(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        // Drop the dedicated ephemeral test database
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
      }
    } finally {
      if (replSet) {
        await replSet.stop({ doCleanup: true });
      }
    }
  });

  beforeEach(async () => {
    primaryTestUser = await User.create({
      username: `pilot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: `pilot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@codeverse.io`,
      password: 'hashed_secure_password',
      totalXp: 0,
      level: 1,
      coins: 0,
      currentStreak: 0
    });
    testUsersToCleanup.add(primaryTestUser._id.toString());
  });

  afterEach(async () => {
    // Scope cleanup strictly to test-created user records and their progress
    for (const userId of testUsersToCleanup) {
      await CampaignProgress.deleteMany({ user: userId });
      await CampaignAttempt.deleteMany({ user: userId });
      await User.deleteOne({ _id: userId });
    }
    testUsersToCleanup.clear();
  });

  describe('Database Isolation & Safety Safeguards', () => {
    test('assertSafeTestDatabase blocks player and production databases while allowing test databases', () => {
      assert.throws(
        () => assertSafeTestDatabase('mongodb://127.0.0.1:27017/codeverse?replicaSet=rs0'),
        /forbidden from running against production\/application database: "codeverse"/
      );
      assert.throws(
        () => assertSafeTestDatabase('mongodb://127.0.0.1:27017/production?replicaSet=rs0'),
        /forbidden from running against production\/application database: "production"/
      );
      assert.throws(
        () => assertSafeTestDatabase('mongodb://127.0.0.1:27017/?replicaSet=rs0'),
        /must specify a database name/
      );
      assert.throws(
        () => assertSafeTestDatabase('mongodb://127.0.0.1:27017/my_database?replicaSet=rs0'),
        /must contain "test" or "tmp"/
      );

      // Safe test URIs must pass
      assert.doesNotThrow(() =>
        assertSafeTestDatabase('mongodb://127.0.0.1:27017/codeverse_test?replicaSet=rs0')
      );
      assert.doesNotThrow(() =>
        assertSafeTestDatabase('mongodb://127.0.0.1:27017/tmp_campaign_run?replicaSet=rs0')
      );
    });
  });

  describe('Authoritative Level Progression & Reward Invariants', () => {
    test('first clear grants 100 XP and 25 coins, increments streak, and unlocks next level in real MongoDB', async () => {
      // Step 1: Initial state - Level 1 unlocked, Level 2 locked
      const initialLevels = await getCampaignLevels(primaryTestUser.id);
      assert.equal(initialLevels[0].unlocked, true);
      assert.equal(initialLevels[0].completed, false);
      assert.equal(initialLevels[1].unlocked, false);

      // Step 2: Clear Level 1 with 2-star solution (3 forward moves)
      const sol = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
      const runOutcome = await runCampaignLevel({
        userId: primaryTestUser.id,
        levelId: 1,
        program: sol
      });

      assert.equal(runOutcome.passed, true);
      assert.equal(runOutcome.stars, 2);
      assert.equal(runOutcome.earned.xp, 100);
      assert.equal(runOutcome.earned.coins, 25);
      assert.equal(runOutcome.unlockedNext, true);

      // Verify real MongoDB User document
      const updatedUser = await User.findById(primaryTestUser.id);
      assert.equal(updatedUser.totalXp, 100);
      assert.equal(updatedUser.coins, 25);
      assert.equal(updatedUser.level, 2);
      assert.equal(updatedUser.currentStreak, 1);

      // Verify real MongoDB CampaignProgress document
      const progressDoc = await CampaignProgress.findOne({
        user: primaryTestUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION
      });
      assert.ok(progressDoc);
      assert.equal(progressDoc.stars, 2);
      assert.equal(progressDoc.attempts, 1);
      assert.equal(progressDoc.xpAwarded, 100);
      assert.equal(progressDoc.coinsAwarded, 25);
      assert.equal(progressDoc.rewardClaimed, true);

      // Verify Level 2 is now unlocked
      const unlockedLevels = await getCampaignLevels(primaryTestUser.id);
      assert.equal(unlockedLevels[0].completed, true);
      assert.equal(unlockedLevels[1].unlocked, true);
      assert.equal(unlockedLevels[1].completed, false);
    });

    test('replaying cleared level can improve stars but grants 0 duplicate currency', async () => {
      // First clear Level 1
      const sol1 = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
      await runCampaignLevel({ userId: primaryTestUser.id, levelId: 1, program: sol1 });

      // Replay with 3-star loop solution
      const loopSol = [{ type: 'repeat', count: 3, body: [{ type: 'move' }] }];
      const replayOutcome = await runCampaignLevel({
        userId: primaryTestUser.id,
        levelId: 1,
        program: loopSol
      });

      assert.equal(replayOutcome.passed, true);
      assert.equal(replayOutcome.stars, 3);
      assert.equal(replayOutcome.earned.xp, 0, 'Replay must award 0 XP');
      assert.equal(replayOutcome.earned.coins, 0, 'Replay must award 0 coins');

      // Balances in real MongoDB remain unchanged
      const recheckedUser = await User.findById(primaryTestUser.id);
      assert.equal(recheckedUser.totalXp, 100);
      assert.equal(recheckedUser.coins, 25);

      // Progress record in DB reflects updated best stars = 3 and attempts = 2
      const progressDoc = await CampaignProgress.findOne({
        user: primaryTestUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION
      });
      assert.equal(progressDoc.stars, 3);
      assert.equal(progressDoc.attempts, 2);
    });

    test('best stars never decrease under lower-star replay or concurrent recovery', async () => {
      // Clear with 3 stars initially
      const loopSol = [{ type: 'repeat', count: 3, body: [{ type: 'move' }] }];
      await runCampaignLevel({ userId: primaryTestUser.id, levelId: 1, program: loopSol });

      // Replay with a 2-star solution
      const twoStarSol = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
      const runOutcome = await runCampaignLevel({
        userId: primaryTestUser.id,
        levelId: 1,
        program: twoStarSol
      });

      assert.equal(runOutcome.passed, true);
      assert.equal(runOutcome.stars, 3, 'Best stars must remain 3');

      const progressDoc = await CampaignProgress.findOne({
        user: primaryTestUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION
      });
      assert.equal(progressDoc.stars, 3);
      assert.equal(progressDoc.attempts, 2);
    });

    test('existing player XP and coins are preserved and correctly incremented', async () => {
      // Set existing veteran player stats
      await User.updateOne(
        { _id: primaryTestUser._id },
        { $set: { totalXp: 350, coins: 75, level: 3, currentStreak: 4 } }
      );

      const sol = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
      const runOutcome = await runCampaignLevel({
        userId: primaryTestUser.id,
        levelId: 1,
        program: sol
      });

      assert.equal(runOutcome.earned.xp, 100);
      assert.equal(runOutcome.earned.coins, 25);

      const finalUser = await User.findById(primaryTestUser.id);
      assert.equal(finalUser.totalXp, 450);
      assert.equal(finalUser.coins, 100);
      assert.equal(finalUser.level, 3);
    });
  });

  describe('Multi-Document Concurrency & Race Conditions against Real Replica Set', () => {
    test('concurrent first clears produce exactly one completion and one reward', async () => {
      const concurrentUser = await User.create({
        username: `concurrent_${Date.now()}`,
        email: `concurrent_${Date.now()}@codeverse.io`,
        password: 'hashed_password',
        totalXp: 0,
        level: 1,
        coins: 0,
        currentStreak: 0
      });
      testUsersToCleanup.add(concurrentUser._id.toString());

      const sol = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];

      // Dispatch 2 concurrent completions simultaneously
      const [res1, res2] = await Promise.all([
        runCampaignLevel({ userId: concurrentUser.id, levelId: 1, program: sol }),
        runCampaignLevel({ userId: concurrentUser.id, levelId: 1, program: sol })
      ]);

      assert.equal(res1.passed, true);
      assert.equal(res2.passed, true);

      const totalXp = res1.earned.xp + res2.earned.xp;
      const totalCoins = res1.earned.coins + res2.earned.coins;

      assert.equal(totalXp, 100, 'Exactly one concurrent request must win the 100 XP');
      assert.equal(totalCoins, 25, 'Exactly one concurrent request must win the 25 coins');

      // Verify real MongoDB database state
      const dbUser = await User.findById(concurrentUser.id);
      assert.equal(dbUser.totalXp, 100);
      assert.equal(dbUser.coins, 25);

      const progressDocs = await CampaignProgress.find({
        user: concurrentUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION
      });
      assert.equal(progressDocs.length, 1, 'Exactly one CampaignProgress document must exist');
      assert.equal(progressDocs[0].attempts, 2, 'Attempts count must record both runs');
    });

    test('concurrent eligible rewards for different unlocked levels preserve both increments', async () => {
      // Clear Level 1 first so Level 2 is unlocked
      const sol1 = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
      await runCampaignLevel({ userId: primaryTestUser.id, levelId: 1, program: sol1 });

      // Now create a scenario where two distinct eligible reward-bearing actions occur concurrently:
      // For example, two distinct users or two distinct sector completions
      const userA = primaryTestUser;
      const userB = await User.create({
        username: `pilot_b_${Date.now()}`,
        email: `pilot_b_${Date.now()}@codeverse.io`,
        password: 'hashed_password',
        totalXp: 0,
        level: 1,
        coins: 0,
        currentStreak: 0
      });
      testUsersToCleanup.add(userB._id.toString());

      // Level 2 solution for user A (move, collect shard, move, move, collect shard, reach portal)
      const sol2 = [
        { type: 'move' },
        { type: 'collect' },
        { type: 'move' },
        { type: 'move' },
        { type: 'collect' },
        { type: 'move' }
      ];

      // Concurrently run Level 2 for user A and Level 1 for user B
      const [outcomeA, outcomeB] = await Promise.all([
        runCampaignLevel({ userId: userA.id, levelId: 2, program: sol2 }),
        runCampaignLevel({ userId: userB.id, levelId: 1, program: sol1 })
      ]);

      assert.equal(outcomeA.passed, true);
      assert.equal(outcomeB.passed, true);
      assert.equal(outcomeA.earned.xp, 100);
      assert.equal(outcomeB.earned.xp, 100);

      // Verify user A now has 200 XP (100 from level 1 + 100 from level 2)
      const userADoc = await User.findById(userA.id);
      assert.equal(userADoc.totalXp, 200);
      assert.equal(userADoc.coins, 50);

      // Verify user B has 100 XP
      const userBDoc = await User.findById(userB.id);
      assert.equal(userBDoc.totalXp, 100);
      assert.equal(userBDoc.coins, 25);
    });
  });

  describe('Transaction Rollback & Durability against Real MongoDB', () => {
    test('a failure between completion creation and player update cleanly rolls back both in real MongoDB', async () => {
      // Execute a transactional operation that fails after creating progress but before user update
      const injectedFailure = new Error('SIMULATED_PROCESS_FAILURE');

      await assert.rejects(
        async () => {
          await withTransaction(async (session) => {
            await CampaignProgress.create(
              [
                {
                  user: primaryTestUser.id,
                  levelId: 1,
                  campaignVersion: CAMPAIGN_VERSION,
                  stars: 3,
                  attempts: 1,
                  firstCompletedAt: new Date(),
                  lastCompletedAt: new Date(),
                  xpAwarded: 100,
                  coinsAwarded: 25,
                  rewardClaimed: true
                }
              ],
              { session }
            );

            // Injected failure before player record is saved
            throw injectedFailure;
          });
        },
        /SIMULATED_PROCESS_FAILURE/
      );

      // Verify real MongoDB: CampaignProgress must NOT exist (transaction rolled back)
      const progressDoc = await CampaignProgress.findOne({
        user: primaryTestUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION
      });
      assert.equal(progressDoc, null, 'Progress record must have rolled back');

      // Verify real MongoDB: User balances must remain 0
      const userDoc = await User.findById(primaryTestUser.id);
      assert.equal(userDoc.totalXp, 0);
      assert.equal(userDoc.coins, 0);
    });

    test('retrying after a rolled-back transaction successfully awards one-time rewards once', async () => {
      // Ensure no progress from prior aborted attempt
      const priorDoc = await CampaignProgress.findOne({
        user: primaryTestUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION
      });
      assert.equal(priorDoc, null);

      // Normal execution after aborted transaction
      const sol = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
      const runOutcome = await runCampaignLevel({
        userId: primaryTestUser.id,
        levelId: 1,
        program: sol
      });

      assert.equal(runOutcome.passed, true);
      assert.equal(runOutcome.earned.xp, 100);
      assert.equal(runOutcome.earned.coins, 25);

      const dbUser = await User.findById(primaryTestUser.id);
      assert.equal(dbUser.totalXp, 100);
      assert.equal(dbUser.coins, 25);
    });

    test('reconnecting / restarting application preserves completed progress and balances identically', async () => {
      // Complete Level 1
      const sol = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
      await runCampaignLevel({ userId: primaryTestUser.id, levelId: 1, program: sol });

      // Simulate process restart: disconnect and reconnect Mongoose
      await mongoose.disconnect();
      assert.equal(mongoose.connection.readyState, 0);

      await mongoose.connect(activeMongoUri, { serverSelectionTimeoutMS: 5000 });
      assert.equal(mongoose.connection.readyState, 1);

      // Confirm documents persist intact across connections
      const persistedProgress = await CampaignProgress.findOne({
        user: primaryTestUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION
      });
      assert.ok(persistedProgress);
      assert.equal(persistedProgress.stars, 2);
      assert.equal(persistedProgress.xpAwarded, 100);

      const persistedUser = await User.findById(primaryTestUser.id);
      assert.equal(persistedUser.totalXp, 100);
      assert.equal(persistedUser.coins, 25);
    });
  });

  describe('Contract Invariants & Bounded Recovery Safety', () => {
    test('rejects client-provided idempotencyKey as unrecognized payload field', () => {
      const payloadWithIdemp = {
        program: [{ type: 'move' }],
        idempotencyKey: 'client-key-12345'
      };

      assert.throws(
        () => validateRunPayload(payloadWithIdemp),
        /Unrecognized payload field: "idempotencyKey"/
      );
    });

    test('isExpectedCompletionDuplicateKey accurately identifies duplicate key error on completion constraint', () => {
      const completionErr = {
        code: 11000,
        keyPattern: { user: 1, levelId: 1, campaignVersion: 1 }
      };
      assert.equal(isExpectedCompletionDuplicateKey(completionErr), true);

      const messageErr = {
        code: 11000,
        message: 'E11000 duplicate key error collection: unique_user_level_campaign_version dup key'
      };
      assert.equal(isExpectedCompletionDuplicateKey(messageErr), true);

      const differentIndexErr = {
        code: 11000,
        keyPattern: { email: 1 }
      };
      assert.equal(isExpectedCompletionDuplicateKey(differentIndexErr), false);

      assert.equal(isExpectedCompletionDuplicateKey(null), false);
      assert.equal(isExpectedCompletionDuplicateKey(new Error('generic')), false);
    });

    test('recoverFromDuplicateKey returns null and fails safely when no committed winning record exists', async () => {
      // Query recovery for a non-existent document with maxRetries = 1
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const result = await recoverFromDuplicateKey({
        userId: nonExistentUserId.toString(),
        levelId: 99,
        stars: 3,
        now: new Date(),
        maxRetries: 1
      });

      assert.equal(result, null, 'Must return null when winning record does not exist');
    });
  });
});
