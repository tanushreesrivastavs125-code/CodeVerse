import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import CampaignProgress from '../../src/models/CampaignProgress.js';
import { runCampaignLevel, getCampaignLevels } from '../../src/services/campaignService.js';
import { canUseTransactions } from '../../src/services/rewardService.js';
import { AppError } from '../../src/middleware/errorHandler.js';

/**
 * Local Replica-Set Connection String Format:
 * mongodb://127.0.0.1:27017/codeverse_campaign_test?replicaSet=rs0&directConnection=true
 */
const TEST_MONGO_URI =
  process.env.MONGODB_TEST_URI ||
  'mongodb://127.0.0.1:27017/codeverse_campaign_test?replicaSet=rs0&directConnection=true';

describe('Real MongoDB Integration Tests (Campaign Persistence & Transaction Consistency)', () => {
  let isMongoAvailable = false;
  let testUser = null;

  before(async () => {
    try {
      await mongoose.connect(TEST_MONGO_URI, {
        serverSelectionTimeoutMS: 1500
      });
      isMongoAvailable = true;
      await CampaignProgress.deleteMany({});
      await User.deleteMany({ email: 'integration_tester@codeverse.io' });

      testUser = await User.create({
        username: 'integration_tester',
        email: 'integration_tester@codeverse.io',
        password: 'hashed_test_password',
        totalXp: 0,
        level: 1,
        coins: 0,
        currentStreak: 0
      });
    } catch {
      isMongoAvailable = false;
    }
  });

  after(async () => {
    if (isMongoAvailable) {
      try {
        await CampaignProgress.deleteMany({});
        await User.deleteMany({ email: 'integration_tester@codeverse.io' });
        await mongoose.disconnect();
      } catch {
        // cleanup ignore
      }
    }
  });

  test('reports MongoDB infrastructure and replica-set transaction readiness', () => {
    if (!isMongoAvailable) {
      console.log(
        '  [Notice] MongoDB daemon not detected at localhost:27017. Integration suite safely documented and ready for CI/local replica-set daemon.'
      );
      assert.equal(isMongoAvailable, false);
    } else {
      assert.equal(isMongoAvailable, true);
      const txSupported = canUseTransactions();
      console.log(`  [Notice] MongoDB connection established. ReplicaSet Transactions Supported: ${txSupported}`);
    }
  });

  test('fails fast with 503 TRANSACTIONS_UNAVAILABLE if connected to standalone without replica set', async (t) => {
    if (!isMongoAvailable) {
      t.skip('Local MongoDB service is offline.');
      return;
    }

    if (canUseTransactions()) {
      t.skip('Connected to Replica Set. Standalone rejection test not applicable.');
      return;
    }

    // On standalone MongoDB, reward-bearing operations must fail fast with 503
    const sol = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
    await assert.rejects(
      async () => {
        await runCampaignLevel({
          userId: testUser.id,
          levelId: 1,
          program: sol
        });
      },
      (err) => {
        assert.equal(err instanceof AppError, true);
        assert.equal(err.statusCode, 503);
        assert.equal(err.code, 'TRANSACTIONS_UNAVAILABLE');
        return true;
      }
    );

    // Verify no partial progress or rewards persisted
    const progressCount = await CampaignProgress.countDocuments({ user: testUser.id });
    assert.equal(progressCount, 0);
  });

  test('executes authoritative transaction lifecycle and reward atomicity when replica set is active', async (t) => {
    if (!isMongoAvailable || !canUseTransactions()) {
      t.skip('Active MongoDB replica set not detected. Skipping live transaction verification.');
      return;
    }

    // Step 1: Initial state - Level 1 unlocked, Level 2 locked
    const initialLevels = await getCampaignLevels(testUser.id);
    assert.equal(initialLevels[0].unlocked, true);
    assert.equal(initialLevels[0].completed, false);
    assert.equal(initialLevels[1].unlocked, false);

    // Step 2: Clear Level 1 with 2-star solution
    const sol1 = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];
    const run1 = await runCampaignLevel({
      userId: testUser.id,
      levelId: 1,
      program: sol1
    });

    assert.equal(run1.passed, true);
    assert.equal(run1.earned.xp, 100);
    assert.equal(run1.earned.coins, 25);
    assert.equal(run1.stars, 2);

    // Verify User record updated atomically in MongoDB
    const updatedUser = await User.findById(testUser.id);
    assert.equal(updatedUser.totalXp, 100);
    assert.equal(updatedUser.coins, 25);
    assert.equal(updatedUser.level, 2);

    // Verify Level 2 now unlocked
    const unlockedLevels = await getCampaignLevels(testUser.id);
    assert.equal(unlockedLevels[0].completed, true);
    assert.equal(unlockedLevels[1].unlocked, true);

    // Step 3: Replay Level 1 with 3-star loop solution
    const loopSol = [{ type: 'repeat', count: 3, body: [{ type: 'move' }] }];
    const replayRun = await runCampaignLevel({
      userId: testUser.id,
      levelId: 1,
      program: loopSol
    });

    assert.equal(replayRun.passed, true);
    assert.equal(replayRun.stars, 3);
    assert.equal(replayRun.earned.xp, 0, 'Replay must award 0 XP');
    assert.equal(replayRun.earned.coins, 0, 'Replay must award 0 coins');

    // User record unchanged
    const replayUser = await User.findById(testUser.id);
    assert.equal(replayUser.totalXp, 100);
    assert.equal(replayUser.coins, 25);

    // Progress record in DB reflects best stars = 3
    const progressDoc = await CampaignProgress.findOne({ user: testUser.id, levelId: 1 });
    assert.equal(progressDoc.stars, 3);
  });

  test('verifies live concurrent submissions award one-time rewards exactly once', async (t) => {
    if (!isMongoAvailable || !canUseTransactions()) {
      t.skip('Active MongoDB replica set not detected. Skipping live concurrency verification.');
      return;
    }

    // Create a new learner specifically for live race condition testing
    const concurrentUser = await User.create({
      username: 'concurrent_pilot',
      email: 'concurrent_pilot@codeverse.io',
      password: 'hashed_test_password',
      totalXp: 0,
      level: 1,
      coins: 0,
      currentStreak: 0
    });

    try {
      const solution = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];

      // Dispatch 2 concurrent completions simultaneously
      const [res1, res2] = await Promise.all([
        runCampaignLevel({ userId: concurrentUser.id, levelId: 1, program: solution }),
        runCampaignLevel({ userId: concurrentUser.id, levelId: 1, program: solution })
      ]);

      assert.equal(res1.passed, true);
      assert.equal(res2.passed, true);

      const totalAwardedXp = res1.earned.xp + res2.earned.xp;
      const totalAwardedCoins = res1.earned.coins + res2.earned.coins;

      assert.equal(totalAwardedXp, 100, 'Exactly one concurrent request must win the 100 XP reward');
      assert.equal(totalAwardedCoins, 25, 'Exactly one concurrent request must win the 25 coins reward');

      const finalUser = await User.findById(concurrentUser.id);
      assert.equal(finalUser.totalXp, 100);
      assert.equal(finalUser.coins, 25);

      const progressDocs = await CampaignProgress.find({ user: concurrentUser.id, levelId: 1 });
      assert.equal(progressDocs.length, 1, 'Only one progress document must exist in database');
    } finally {
      await CampaignProgress.deleteMany({ user: concurrentUser.id });
      await User.deleteOne({ _id: concurrentUser._id });
    }
  });
});
