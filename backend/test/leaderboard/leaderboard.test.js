import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import app from '../../src/app.js';
import User from '../../src/models/User.js';
import CampaignProgress from '../../src/models/CampaignProgress.js';
import CampaignAttempt from '../../src/models/CampaignAttempt.js';
import { signToken, AUTH_COOKIE_NAME } from '../../src/config/jwt.js';
import {
  getUtcWeekBoundaries,
  getLeaderboard
} from '../../src/services/leaderboardService.js';
import { validateLeaderboardQuery } from '../../src/validators/leaderboard.validator.js';

describe('Leaderboard & Flight History Suite', () => {
  let replSet;
  let server;
  let baseUrl;

  before(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await replSet.waitUntilRunning();
    const uri = replSet.getUri('codeverse_leaderboard_test');
    await mongoose.connect(uri);

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      server.close();
    }
    await mongoose.disconnect();
    if (replSet) {
      await replSet.stop({ doCleanup: true });
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await CampaignProgress.deleteMany({});
    await CampaignAttempt.deleteMany({});
  });

  describe('Leaderboard Validator & UTC Week Boundaries', () => {
    test('validateLeaderboardQuery accepts valid ranges and sets defaults', () => {
      assert.deepEqual(validateLeaderboardQuery({}), { range: 'all', limit: 20 });
      assert.deepEqual(validateLeaderboardQuery({ range: 'all' }), { range: 'all', limit: 20 });
      assert.deepEqual(validateLeaderboardQuery({ range: 'weekly' }), { range: 'weekly', limit: 20 });
      assert.deepEqual(validateLeaderboardQuery({ range: 'WEEKLY', limit: '15' }), { range: 'weekly', limit: 15 });
    });

    test('validateLeaderboardQuery rejects invalid range and invalid limit', () => {
      assert.throws(
        () => validateLeaderboardQuery({ range: 'monthly' }),
        /Allowed values are "all" or "weekly"/
      );
      assert.throws(
        () => validateLeaderboardQuery({ limit: '0' }),
        /between 1 and 100/
      );
      assert.throws(
        () => validateLeaderboardQuery({ limit: '101' }),
        /between 1 and 100/
      );
      assert.throws(
        () => validateLeaderboardQuery({ limit: 'abc' }),
        /between 1 and 100/
      );
    });

    test('getUtcWeekBoundaries correctly calculates Monday-to-Monday UTC calendar week', () => {
      const midWeek = new Date('2026-11-11T14:30:00Z');
      const b1 = getUtcWeekBoundaries(midWeek);
      assert.equal(b1.start.toISOString(), '2026-11-09T00:00:00.000Z');
      assert.equal(b1.end.toISOString(), '2026-11-16T00:00:00.000Z');

      const sunday = new Date('2026-11-15T23:59:59Z');
      const b2 = getUtcWeekBoundaries(sunday);
      assert.equal(b2.start.toISOString(), '2026-11-09T00:00:00.000Z');
      assert.equal(b2.end.toISOString(), '2026-11-16T00:00:00.000Z');

      const monday = new Date('2026-11-16T00:00:00Z');
      const b3 = getUtcWeekBoundaries(monday);
      assert.equal(b3.start.toISOString(), '2026-11-16T00:00:00.000Z');
      assert.equal(b3.end.toISOString(), '2026-11-23T00:00:00.000Z');
    });
  });

  describe('All-Time Leaderboard Calculations & Privacy Invariants', () => {
    test('ranks users by authoritative totalXp with deterministic tie-breaking and privacy protection', async () => {
      const userA = await User.create({
        username: 'Pilot_Alpha',
        email: 'alpha@codeverse.local',
        password: 'hashed-password-1',
        totalXp: 500,
        level: 3,
        currentStreak: 2,
        createdAt: new Date('2026-11-01T10:00:00Z')
      });

      await User.create({
        username: 'Pilot_Beta',
        email: 'beta@codeverse.local',
        password: 'hashed-password-2',
        totalXp: 800,
        level: 4,
        currentStreak: 5,
        createdAt: new Date('2026-11-02T10:00:00Z')
      });

      await User.create({
        username: 'Pilot_Charlie',
        email: 'charlie@codeverse.local',
        password: 'hashed-password-3',
        totalXp: 300,
        level: 2,
        currentStreak: 1,
        createdAt: new Date('2026-11-03T10:00:00Z')
      });

      await User.create({
        username: 'Pilot_Delta',
        email: 'delta@codeverse.local',
        password: 'hashed-password-4',
        totalXp: 300,
        level: 1,
        currentStreak: 0,
        createdAt: new Date('2026-11-04T10:00:00Z')
      });

      const result = await getLeaderboard({
        range: 'all',
        limit: 10,
        currentUserId: userA._id.toString()
      });

      assert.equal(result.range, 'all');
      assert.equal(result.entries.length, 4);

      assert.equal(result.entries[0].username, 'Pilot_Beta');
      assert.equal(result.entries[0].rank, 1);
      assert.equal(result.entries[0].xp, 800);

      assert.equal(result.entries[1].username, 'Pilot_Alpha');
      assert.equal(result.entries[1].rank, 2);
      assert.equal(result.entries[1].isCurrentPlayer, true);

      assert.equal(result.entries[2].username, 'Pilot_Charlie');
      assert.equal(result.entries[2].rank, 3);

      assert.equal(result.entries[3].username, 'Pilot_Delta');
      assert.equal(result.entries[3].rank, 4);

      result.entries.forEach((e) => {
        assert.equal(e.email, undefined);
        assert.equal(e.password, undefined);
        assert.equal(e.__v, undefined);
      });

      assert.deepEqual(result.currentPlayer, {
        inTopResults: true,
        rank: 2,
        xp: 500,
        username: 'Pilot_Alpha'
      });
    });

    test('current player outside top results reports honest stats without fabricating a rank', async () => {
      for (let i = 1; i <= 3; i++) {
        await User.create({
          username: `Top_Pilot_${i}`,
          email: `top${i}@codeverse.local`,
          password: 'password',
          totalXp: 1000 - i * 50
        });
      }

      const outsideUser = await User.create({
        username: 'Outside_Pilot',
        email: 'outside@codeverse.local',
        password: 'password',
        totalXp: 50
      });

      const result = await getLeaderboard({
        range: 'all',
        limit: 2,
        currentUserId: outsideUser._id.toString()
      });

      assert.equal(result.entries.length, 2);
      assert.deepEqual(result.currentPlayer, {
        inTopResults: false,
        rank: null,
        xp: 50,
        username: 'Outside_Pilot'
      });
    });
  });

  describe('Weekly Leaderboard Calculations & Invariants', () => {
    test('weekly ranking accurately sums committed rewards in current UTC week, excluding replays and previous weeks', async () => {
      const thisWeekAnchor = new Date('2026-11-12T12:00:00Z');
      const { start: weekStart } = getUtcWeekBoundaries(thisWeekAnchor);

      const userA = await User.create({
        username: 'Weekly_Champ',
        email: 'wchamp@codeverse.local',
        password: 'password',
        totalXp: 600,
        level: 2
      });

      const userB = await User.create({
        username: 'Steady_Pilot',
        email: 'steady@codeverse.local',
        password: 'password',
        totalXp: 400,
        level: 2
      });

      await CampaignProgress.create({
        user: userA._id,
        levelId: 1,
        campaignVersion: 'v1',
        stars: 3,
        attempts: 1,
        firstCompletedAt: new Date(weekStart.getTime() + 10 * 3600 * 1000),
        xpAwarded: 100,
        coinsAwarded: 25,
        rewardClaimed: true
      });

      await CampaignProgress.create({
        user: userA._id,
        levelId: 2,
        campaignVersion: 'v1',
        stars: 2,
        attempts: 1,
        firstCompletedAt: new Date(weekStart.getTime() + 20 * 3600 * 1000),
        xpAwarded: 100,
        coinsAwarded: 25,
        rewardClaimed: true
      });

      // Clearance from LAST WEEK must be excluded from weekly XP
      await CampaignProgress.create({
        user: userA._id,
        levelId: 3,
        campaignVersion: 'v1',
        stars: 3,
        attempts: 1,
        firstCompletedAt: new Date(weekStart.getTime() - 24 * 3600 * 1000),
        xpAwarded: 100,
        coinsAwarded: 25,
        rewardClaimed: true
      });

      await CampaignProgress.create({
        user: userB._id,
        levelId: 1,
        campaignVersion: 'v1',
        stars: 3,
        attempts: 1,
        firstCompletedAt: new Date(weekStart.getTime() + 15 * 3600 * 1000),
        xpAwarded: 100,
        coinsAwarded: 25,
        rewardClaimed: true
      });

      // User B replayed Sector 1 ten times; replays have xpAwarded = 0 and must NOT inflate weekly XP
      await CampaignProgress.updateOne(
        { user: userB._id, levelId: 1 },
        { $inc: { attempts: 10 } }
      );

      const result = await getLeaderboard({
        range: 'weekly',
        limit: 10,
        currentUserId: userB._id.toString(),
        referenceDate: thisWeekAnchor
      });

      assert.equal(result.range, 'weekly');
      assert.equal(result.entries.length, 2);

      assert.equal(result.entries[0].username, 'Weekly_Champ');
      assert.equal(result.entries[0].xp, 200);
      assert.equal(result.entries[0].sectorsCleared, 2);

      assert.equal(result.entries[1].username, 'Steady_Pilot');
      assert.equal(result.entries[1].xp, 100);
      assert.equal(result.entries[1].sectorsCleared, 1);
      assert.equal(result.entries[1].isCurrentPlayer, true);

      assert.deepEqual(result.currentPlayer, {
        inTopResults: true,
        rank: 2,
        xp: 100,
        username: 'Steady_Pilot'
      });
    });
  });

  describe('HTTP API Endpoints Contract', () => {
    test('GET /api/leaderboard works anonymously and returns 200 with metadata', async () => {
      await User.create({
        username: 'Open_Pilot',
        email: 'open@codeverse.local',
        password: 'password',
        totalXp: 150
      });

      const res = await fetch(`${baseUrl}/api/leaderboard?range=all`);
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.success, true);
      assert.equal(json.data.range, 'all');
      assert.equal(json.data.entries.length, 1);
      assert.equal(json.data.entries[0].username, 'Open_Pilot');
      assert.equal(json.data.currentPlayer, null);
    });

    test('GET /api/leaderboard highlights authenticated player via cookie', async () => {
      const user = await User.create({
        username: 'Cookie_Pilot',
        email: 'cookie@codeverse.local',
        password: 'password',
        totalXp: 350
      });

      const token = signToken({ id: user._id.toString(), username: user.username });

      const res = await fetch(`${baseUrl}/api/leaderboard?range=all`, {
        headers: {
          Cookie: `${AUTH_COOKIE_NAME}=${token}`
        }
      });
      assert.equal(res.status, 200);
      const json = await res.json();

      assert.equal(json.success, true);
      assert.equal(json.data.entries[0].isCurrentPlayer, true);
      assert.equal(json.data.currentPlayer.rank, 1);
      assert.equal(json.data.currentPlayer.username, 'Cookie_Pilot');
    });

    test('GET /api/leaderboard rejects invalid range with 400 VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/leaderboard?range=annual`);
      assert.equal(res.status, 400);
      const json = await res.json();

      assert.equal(json.success, false);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    });

    test('GET /api/game/history enforces authentication and player isolation', async () => {
      const user1 = await User.create({
        username: 'Isolated_User_1',
        email: 'u1@codeverse.local',
        password: 'password'
      });

      const user2 = await User.create({
        username: 'Isolated_User_2',
        email: 'u2@codeverse.local',
        password: 'password'
      });

      await CampaignAttempt.create({
        user: user1._id,
        levelId: 1,
        campaignVersion: 'v1',
        passed: true,
        stars: 3,
        steps: 3,
        programBlocks: 2,
        reason: 'Extraction portal reached safely.'
      });

      await CampaignAttempt.create({
        user: user1._id,
        levelId: 2,
        campaignVersion: 'v1',
        passed: false,
        stars: 0,
        steps: 5,
        programBlocks: 4,
        reason: 'Mission aborted: 2 energy shards remaining.'
      });

      await CampaignAttempt.create({
        user: user2._id,
        levelId: 5,
        campaignVersion: 'v1',
        passed: true,
        stars: 3,
        steps: 5,
        programBlocks: 4,
        reason: 'Extraction portal reached safely.'
      });

      // Request without auth fails 401
      const unauthRes = await fetch(`${baseUrl}/api/game/history`);
      assert.equal(unauthRes.status, 401);

      // User 1 requests history
      const token1 = signToken({ id: user1._id.toString(), username: user1.username });
      const res1 = await fetch(`${baseUrl}/api/game/history?limit=10`, {
        headers: {
          Authorization: `Bearer ${token1}`
        }
      });
      assert.equal(res1.status, 200);
      const json1 = await res1.json();

      assert.equal(json1.success, true);
      assert.equal(json1.data.length, 2);
      assert.equal(json1.data[0].levelId, 2);
      assert.equal(json1.data[0].passed, false);
      assert.equal(json1.data[1].levelId, 1);
      assert.equal(json1.data[1].passed, true);

      // Verify no records from User 2 are leaked
      assert.equal(json1.data.some((h) => h.levelId === 5), false);
    });
  });
});
