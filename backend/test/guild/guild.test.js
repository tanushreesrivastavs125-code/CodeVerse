import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import app from '../../src/app.js';
import User from '../../src/models/User.js';
import Guild from '../../src/models/Guild.js';
import GuildMembership from '../../src/models/GuildMembership.js';
import { signToken } from '../../src/config/jwt.js';
import { _resetGuildRateLimiter } from '../../src/middleware/rateLimiter.js';
import {
  validateCreateGuildPayload,
  validateGuildId,
  validateGuildQuery
} from '../../src/validators/guild.validator.js';

describe('Guild Unit & API Contract Suite (/api/guilds)', () => {
  let replSet;
  let server;
  let baseUrl;
  let testUser;
  let authToken;

  before(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await replSet.waitUntilRunning();
    const uri = replSet.getUri('codeverse_guild_unit_test');
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
    _resetGuildRateLimiter();
    await GuildMembership.deleteMany({});
    await Guild.deleteMany({});
    await User.deleteMany({});

    testUser = await User.create({
      username: 'guild_tester',
      email: 'guild_tester@codeverse.io',
      password: 'StrongPassword123!',
      totalXp: 350,
      level: 3,
      coins: 80,
      currentStreak: 2
    });

    authToken = signToken({
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role
    });
  });

  describe('Guild Input Validators', () => {
    test('validateCreateGuildPayload: accepts valid name and description', () => {
      const payload = {
        name: 'Cyber Sentinels',
        description: 'Elite squadron of automated drone coders.'
      };
      const result = validateCreateGuildPayload(payload);
      assert.equal(result.name, 'Cyber Sentinels');
      assert.equal(result.normalizedName, 'cyber sentinels');
      assert.equal(result.description, 'Elite squadron of automated drone coders.');
    });

    test('validateCreateGuildPayload: rejects non-object or array payloads', () => {
      assert.throws(() => validateCreateGuildPayload(null), /must be a JSON object/);
      assert.throws(() => validateCreateGuildPayload([]), /must be a JSON object/);
      assert.throws(() => validateCreateGuildPayload('string'), /must be a JSON object/);
    });

    test('validateCreateGuildPayload: rejects forbidden authority/derived fields', () => {
      const forbidden = ['owner', 'members', 'combinedXp', 'id', '_id', 'joinedAt', 'user'];
      for (const key of forbidden) {
        assert.throws(
          () => validateCreateGuildPayload({ name: 'Valid Name', [key]: 'injected' }),
          new RegExp(`Field "${key}" is not permitted`)
        );
      }
    });

    test('validateCreateGuildPayload: enforces name bounds and characters', () => {
      assert.throws(() => validateCreateGuildPayload({ name: 'ab' }), /between 3 and 30 characters/);
      assert.throws(() => validateCreateGuildPayload({ name: 'a'.repeat(31) }), /between 3 and 30 characters/);
      assert.throws(() => validateCreateGuildPayload({ name: 'Invalid<Tag>' }), /only contain alphanumeric/);
      assert.throws(() => validateCreateGuildPayload({}), /Guild name is required/);
    });

    test('validateCreateGuildPayload: enforces description bounds', () => {
      assert.throws(
        () => validateCreateGuildPayload({ name: 'Valid Name', description: 'x'.repeat(251) }),
        /cannot exceed 250 characters/
      );
    });

    test('validateGuildId: validates 24-hex MongoDB ObjectIds', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      assert.equal(validateGuildId(validId), validId);
      assert.throws(() => validateGuildId('invalid-id'), /Invalid guild identifier/);
      assert.throws(() => validateGuildId(''), /Invalid guild identifier/);
    });

    test('validateGuildQuery: sanitizes limit and search parameters', () => {
      assert.deepEqual(validateGuildQuery({}), { limit: 20, search: '' });
      assert.deepEqual(validateGuildQuery({ limit: '10', search: 'cyber' }), { limit: 10, search: 'cyber' });
      assert.throws(() => validateGuildQuery({ limit: '0' }), /integer between 1 and 50/);
      assert.throws(() => validateGuildQuery({ limit: '100' }), /integer between 1 and 50/);
      assert.throws(() => validateGuildQuery({ search: 12345 }), /Search parameter must be a string/);
    });
  });

  describe('Authentication & Authorization Contracts', () => {
    test('POST /api/guilds rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/guilds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Rogue Squad' })
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'UNAUTHORIZED');
    });

    test('GET /api/guilds/me rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/guilds/me`);
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'UNAUTHORIZED');
    });

    test('POST /api/guilds/leave rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/guilds/leave`, {
        method: 'POST'
      });
      assert.equal(res.status, 401);
    });

    test('POST /api/guilds/:id/join rejects unauthenticated requests with 401', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await fetch(`${baseUrl}/api/guilds/${fakeId}/join`, {
        method: 'POST'
      });
      assert.equal(res.status, 401);
    });

    test('GET /api/guilds allows public unauthenticated requests', async () => {
      const res = await fetch(`${baseUrl}/api/guilds`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
    });
  });

  describe('Guild Creation & Validation Contracts', () => {
    test('POST /api/guilds creates guild and returns complete envelope', async () => {
      const res = await fetch(`${baseUrl}/api/guilds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Neon Pilots',
          description: 'Soaring through neon skies.'
        })
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.name, 'Neon Pilots');
      assert.equal(body.data.description, 'Soaring through neon skies.');
      assert.equal(body.data.owner.id, testUser.id);
      assert.equal(body.data.memberCount, 1);
      assert.equal(body.data.combinedXp, 350);
      assert.equal(body.data.isOwner, true);
      assert.equal(body.data.isMember, true);
      assert.equal(body.data.members[0].id, testUser.id);
      assert.equal(body.data.members[0].username, testUser.username);
      assert.equal(body.data.members[0].totalXp, 350);
      // Ensure private fields are omitted
      assert.equal(body.data.members[0].email, undefined);
      assert.equal(body.data.members[0].password, undefined);
    });

    test('POST /api/guilds rejects duplicate guild names with 409 GUILD_NAME_TAKEN', async () => {
      // Create first guild
      await fetch(`${baseUrl}/api/guilds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: 'Neon Pilots' })
      });

      // Create a second user
      const user2 = await User.create({
        username: 'pilot_two',
        email: 'two@codeverse.io',
        password: 'Password123!'
      });
      const token2 = signToken({ id: user2.id, username: user2.username, email: user2.email });

      // Second user tries to create identical name (case-insensitive)
      const res = await fetch(`${baseUrl}/api/guilds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token2}`
        },
        body: JSON.stringify({ name: 'neon pilots' })
      });

      assert.equal(res.status, 409);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'GUILD_NAME_TAKEN');
    });

    test('POST /api/guilds rejects creating when already in a guild with 400 ALREADY_IN_GUILD', async () => {
      // Create first guild
      await fetch(`${baseUrl}/api/guilds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: 'Squadron One' })
      });

      // Try creating second guild with same user
      const res = await fetch(`${baseUrl}/api/guilds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: 'Squadron Two' })
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'ALREADY_IN_GUILD');
    });
  });

  describe('Rate Limiter Protection', () => {
    test('enforces rate limiting after 20 operations within 1 minute', async () => {
      // Perform 20 valid guild leave requests (unaffiliated no-ops)
      for (let i = 0; i < 20; i++) {
        await fetch(`${baseUrl}/api/guilds/leave`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }

      // 21st request should be throttled
      const throttledRes = await fetch(`${baseUrl}/api/guilds/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });

      assert.equal(throttledRes.status, 429);
      const data = await throttledRes.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'TOO_MANY_REQUESTS');
    });
  });
});
