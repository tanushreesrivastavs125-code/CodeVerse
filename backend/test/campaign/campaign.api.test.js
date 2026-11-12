import { test, describe, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import CampaignProgress from '../../src/models/CampaignProgress.js';
import CampaignAttempt from '../../src/models/CampaignAttempt.js';
import { signToken } from '../../src/config/jwt.js';

describe('Campaign & Game API Contracts (/api/game)', () => {
  let server;
  let baseUrl;

  const testUser = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    username: 'drone_pilot',
    email: 'pilot@codeverse.io',
    totalXp: 0,
    level: 1,
    coins: 0,
    currentStreak: 0,
    lastActiveDate: null,
    role: 'user',
    toSafeObject() {
      return {
        id: this.id,
        username: this.username,
        email: this.email,
        totalXp: this.totalXp,
        level: this.level,
        coins: this.coins,
        currentStreak: this.currentStreak,
        role: this.role
      };
    },
    async save() {
      return this;
    }
  };

  const authToken = signToken({
    id: testUser.id,
    username: testUser.username,
    email: testUser.email,
    role: testUser.role
  });

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      server.close();
    }
  });

  beforeEach(() => {
    mock.restoreAll();
    delete mongoose.connection._forceTransactionSupport;
    testUser.totalXp = 0;
    testUser.level = 1;
    testUser.coins = 0;
    testUser.currentStreak = 0;
    testUser.lastActiveDate = null;
  });

  afterEach(() => {
    mock.restoreAll();
    delete mongoose.connection._forceTransactionSupport;
  });

  describe('GET /api/game/levels (Protected)', () => {
    test('rejects unauthenticated request with 401 Unauthorized', async () => {
      const response = await fetch(`${baseUrl}/api/game/levels`);
      assert.equal(response.status, 401);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('returns levels with initial locked/unlocked states for new learner', async () => {
      // Mock no completions yet
      mock.method(CampaignProgress, 'find', () => ({
        lean: async () => []
      }));

      const response = await fetch(`${baseUrl}/api/game/levels`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(Array.isArray(body.data), true);
      assert.equal(body.data.length, 3);

      // Level 1 starts unlocked
      const l1 = body.data[0];
      assert.equal(l1.id, 1);
      assert.equal(l1.unlocked, true);
      assert.equal(l1.completed, false);
      assert.equal(l1.stars, 0);

      // Levels 2 & 3 start locked
      assert.equal(body.data[1].unlocked, false);
      assert.equal(body.data[2].unlocked, false);
    });

    test('returns unlocked state for level 2 when level 1 is completed', async () => {
      mock.method(CampaignProgress, 'find', () => ({
        lean: async () => [
          {
            user: testUser.id,
            levelId: 1,
            campaignVersion: 'v1',
            stars: 3,
            attempts: 1
          }
        ]
      }));

      const response = await fetch(`${baseUrl}/api/game/levels`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      assert.equal(response.status, 200);
      const body = await response.json();
      const l1 = body.data[0];
      const l2 = body.data[1];
      const l3 = body.data[2];

      assert.equal(l1.completed, true);
      assert.equal(l1.stars, 3);
      assert.equal(l1.unlocked, true);

      assert.equal(l2.completed, false);
      assert.equal(l2.unlocked, true);

      assert.equal(l3.completed, false);
      assert.equal(l3.unlocked, false);
    });
  });

  describe('POST /api/game/levels/:id/run (Protected)', () => {
    test('rejects unauthenticated run request with 401', async () => {
      const response = await fetch(`${baseUrl}/api/game/levels/1/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: [{ type: 'move' }] })
      });
      assert.equal(response.status, 401);
    });

    test('returns 404 for nonexistent level ID', async () => {
      const response = await fetch(`${baseUrl}/api/game/levels/999/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ program: [{ type: 'move' }] })
      });

      assert.equal(response.status, 404);
      const body = await response.json();
      assert.equal(body.error.code, 'LEVEL_NOT_FOUND');
    });

    test('returns 400 on malformed level parameter or body', async () => {
      const response = await fetch(`${baseUrl}/api/game/levels/invalid/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ program: [{ type: 'move' }] })
      });
      assert.equal(response.status, 400);

      const emptyRes = await fetch(`${baseUrl}/api/game/levels/1/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({})
      });
      assert.equal(emptyRes.status, 400);
    });

    test('strictly rejects client-supplied outcome or reward fields', async () => {
      const hackAttempt = {
        program: [{ type: 'move' }],
        stars: 3,
        xp: 1000,
        coins: 500,
        success: true
      };

      const response = await fetch(`${baseUrl}/api/game/levels/1/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(hackAttempt)
      });

      assert.equal(response.status, 400);
      const body = await response.json();
      assert.match(body.error.message, /Forbidden client-provided field/);
    });

    test('returns 403 Forbidden when attempting to run a locked level', async () => {
      // Mock level 1 not completed
      mock.method(CampaignProgress, 'exists', async () => null);

      const response = await fetch(`${baseUrl}/api/game/levels/2/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ program: [{ type: 'move' }] })
      });

      assert.equal(response.status, 403);
      const body = await response.json();
      assert.equal(body.error.code, 'LEVEL_LOCKED');
      assert.match(body.error.message, /Sector 2 is locked/);
    });

    test('returns passed: false and 0 rewards on failed program without unlocking next sector', async () => {
      let recordedAttempt = null;
      mock.method(CampaignAttempt, 'create', async (data) => {
        recordedAttempt = data;
        return data;
      });
      mock.method(User, 'findById', async () => testUser);

      // Level 1: 1 forward move (falls short of exit G at x=4)
      const response = await fetch(`${baseUrl}/api/game/levels/1/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          program: [{ type: 'move' }]
        })
      });

      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.data.passed, false);
      assert.equal(body.data.stars, 0);
      assert.equal(body.data.earned.xp, 0);
      assert.equal(body.data.earned.coins, 0);
      assert.equal(body.data.unlockedNext, false);
      assert.ok(recordedAttempt, 'Must record failed attempt');
      assert.equal(recordedAttempt.passed, false);

      // User balance untouched
      assert.equal(testUser.totalXp, 0);
      assert.equal(testUser.coins, 0);
    });

    test('returns 503 TRANSACTIONS_UNAVAILABLE when transactions are unavailable for reward-bearing run', async () => {
      delete mongoose.connection._forceTransactionSupport;
      mock.method(CampaignAttempt, 'create', async () => ({}));

      const solution = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];

      const response = await fetch(`${baseUrl}/api/game/levels/1/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ program: solution })
      });

      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'TRANSACTIONS_UNAVAILABLE');
      assert.match(body.error.message, /replica set is required/);

      // Balances preserved
      assert.equal(testUser.totalXp, 0);
      assert.equal(testUser.coins, 0);
    });

    test('first successful clear with replica-set transactions awards 100 XP, 25 coins, streak, and unlocks next level', async () => {
      mongoose.connection._forceTransactionSupport = true;
      const mockSession = {
        startTransaction() {},
        async commitTransaction() {},
        async abortTransaction() {},
        async endSession() {}
      };
      mock.method(mongoose, 'startSession', async () => mockSession);
      mock.method(CampaignAttempt, 'create', async () => ({}));
      mock.method(User, 'findById', async () => testUser);

      let createdProgress = null;
      mock.method(CampaignProgress, 'findOne', async () => null);
      mock.method(CampaignProgress, 'create', async (docs) => {
        createdProgress = docs[0];
        return docs;
      });

      // Level 1 valid solution: 3 forward moves
      const solution = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];

      const response = await fetch(`${baseUrl}/api/game/levels/1/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ program: solution })
      });

      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.data.passed, true);
      assert.equal(body.data.stars, 2);
      assert.equal(body.data.earned.xp, 100);
      assert.equal(body.data.earned.coins, 25);
      assert.equal(body.data.unlockedNext, true);

      // User rewards updated
      assert.equal(testUser.totalXp, 100);
      assert.equal(testUser.coins, 25);
      assert.equal(testUser.level, 2); // 100 XP reaches level 2
      assert.equal(testUser.currentStreak, 1);

      // Document invariants
      assert.ok(createdProgress);
      assert.equal(createdProgress.xpAwarded, 100);
      assert.equal(createdProgress.coinsAwarded, 25);
      assert.equal(createdProgress.rewardClaimed, true);
    });

    test('replaying cleared level can improve stars but awards 0 duplicate currency', async () => {
      mongoose.connection._forceTransactionSupport = true;
      const mockSession = {
        startTransaction() {},
        async commitTransaction() {},
        async abortTransaction() {},
        async endSession() {}
      };
      mock.method(mongoose, 'startSession', async () => mockSession);
      mock.method(CampaignAttempt, 'create', async () => ({}));
      mock.method(User, 'findById', async () => testUser);

      let savedDoc = null;
      const progressDoc = {
        user: testUser.id,
        levelId: 1,
        campaignVersion: 'v1',
        stars: 2,
        attempts: 1,
        save: async function () {
          savedDoc = this;
          return this;
        }
      };

      testUser.totalXp = 100;
      testUser.coins = 25;
      testUser.level = 2;
      testUser.currentStreak = 1;

      mock.method(CampaignProgress, 'findOne', async () => progressDoc);

      // Submit 3-star repeat solution
      const repeatSolution = [{ type: 'repeat', count: 3, body: [{ type: 'move' }] }];

      const response = await fetch(`${baseUrl}/api/game/levels/1/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ program: repeatSolution })
      });

      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.data.passed, true);
      assert.equal(body.data.stars, 3);
      assert.equal(body.data.earned.xp, 0, 'Replay must award 0 XP');
      assert.equal(body.data.earned.coins, 0, 'Replay must award 0 coins');

      // Best stars updated
      assert.ok(savedDoc);
      assert.equal(savedDoc.stars, 3);
      assert.equal(savedDoc.attempts, 2);

      // Balances preserved
      assert.equal(testUser.totalXp, 100);
      assert.equal(testUser.coins, 25);
    });

    test('concurrent first-clear race condition: duplicate key aborts transaction, safely re-reads winning doc outside transaction, and prevents double-awarding', async () => {
      mongoose.connection._forceTransactionSupport = true;
      mock.method(CampaignAttempt, 'create', async () => ({}));
      mock.method(User, 'findById', async () => testUser);

      let abortedSessions = 0;
      mock.method(mongoose, 'startSession', async () => {
        return {
          startTransaction() {},
          async commitTransaction() {},
          async abortTransaction() {
            abortedSessions++;
          },
          async endSession() {}
        };
      });

      let createCalls = 0;
      const winningDoc = {
        user: testUser.id,
        levelId: 1,
        campaignVersion: 'v1',
        stars: 2,
        attempts: 1,
        save: async function () {
          return this;
        }
      };

      mock.method(CampaignProgress, 'findOne', async (query, projection, options) => {
        // Inside transaction sessions, neither saw existing doc yet
        if (options?.session) {
          return null;
        }
        // Outside the aborted transaction session, read the winning doc
        return winningDoc;
      });

      mock.method(CampaignProgress, 'create', async (docs) => {
        createCalls++;
        if (createCalls === 1) {
          return docs; // Winner commits first
        }
        // Colliding concurrent insertion throws duplicate key error code 11000
        const dupErr = new Error('E11000 duplicate key error');
        dupErr.code = 11000;
        throw dupErr;
      });

      const solution = [{ type: 'move' }, { type: 'move' }, { type: 'move' }];

      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/game/levels/1/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ program: solution })
        }),
        fetch(`${baseUrl}/api/game/levels/1/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ program: solution })
        })
      ]);

      const body1 = await res1.json();
      const body2 = await res2.json();

      assert.equal(res1.status, 200);
      assert.equal(res2.status, 200);

      const totalAwardedXp = body1.data.earned.xp + body2.data.earned.xp;
      const totalAwardedCoins = body1.data.earned.coins + body2.data.earned.coins;

      assert.equal(totalAwardedXp, 100, 'Exactly one concurrent request must win the 100 XP reward');
      assert.equal(totalAwardedCoins, 25, 'Exactly one concurrent request must win the 25 coins reward');
      assert.equal(abortedSessions, 1, 'The colliding transaction must be cleanly aborted');
      assert.equal(testUser.totalXp, 100);
      assert.equal(testUser.coins, 25);
    });
  });
});
