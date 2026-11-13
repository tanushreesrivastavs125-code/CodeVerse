import { test, describe, before, after, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import app from '../../src/app.js';
import User from '../../src/models/User.js';
import CampaignProgress from '../../src/models/CampaignProgress.js';
import CampaignAttempt from '../../src/models/CampaignAttempt.js';
import { signToken } from '../../src/config/jwt.js';
import { _resetMentorRateLimiter } from '../../src/middleware/rateLimiter.js';
import { validateMentorPayload } from '../../src/validators/mentor.validator.js';
import { getLlmConfig } from '../../src/config/llm.config.js';
import * as mentorService from '../../src/services/mentorService.js';
import { CAMPAIGN_VERSION } from '../../src/services/campaignService.js';

describe('Game-Aware AI Mentor Suite (/api/ai/mentor)', () => {
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
    const uri = replSet.getUri('codeverse_mentor_test');
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
    _resetMentorRateLimiter();
    await User.deleteMany({});
    await CampaignProgress.deleteMany({});
    await CampaignAttempt.deleteMany({});

    testUser = await User.create({
      username: 'mentor_pilot',
      email: 'pilot@mentor.codeverse.io',
      password: 'StrongPassword123!',
      totalXp: 200,
      level: 2,
      coins: 50,
      currentStreak: 1
    });

    authToken = signToken({
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: 'user'
    });
  });

  describe('1. Configuration & Request Payload Validation', () => {
    test('getLlmConfig provides safe defaults and detects missing API key', () => {
      const emptyEnv = {};
      const config = getLlmConfig(emptyEnv);
      assert.equal(config.apiKey, null);
      assert.equal(config.isConfigured, false);
      assert.equal(config.model, 'gemini-1.5-flash');
      assert.equal(config.timeoutMs, 8000);
    });

    test('getLlmConfig correctly parses valid external configuration', () => {
      const customEnv = {
        LLM_API_KEY: 'test-secret-key',
        LLM_API_URL: 'https://custom-gateway.internal/v1/chat/completions',
        LLM_MODEL: 'custom-model-pro',
        LLM_TIMEOUT_MS: '5000'
      };
      const config = getLlmConfig(customEnv);
      assert.equal(config.apiKey, 'test-secret-key');
      assert.equal(config.isConfigured, true);
      assert.equal(config.apiUrl, 'https://custom-gateway.internal/v1/chat/completions');
      assert.equal(config.model, 'custom-model-pro');
      assert.equal(config.timeoutMs, 5000);
    });

    test('validateMentorPayload accepts valid requests for all modes', () => {
      const payloadHint = validateMentorPayload({
        mode: 'hint',
        levelId: 1,
        message: 'How do I start?',
        program: [{ type: 'move' }]
      });
      assert.equal(payloadHint.mode, 'hint');
      assert.equal(payloadHint.levelId, 1);
      assert.equal(payloadHint.message, 'How do I start?');
      assert.equal(payloadHint.program.length, 1);

      const payloadRecommend = validateMentorPayload({
        mode: 'recommend'
      });
      assert.equal(payloadRecommend.mode, 'recommend');
      assert.equal(payloadRecommend.levelId, null);
    });

    test('validateMentorPayload rejects missing or invalid mode', () => {
      assert.throws(
        () => validateMentorPayload({}),
        (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR'
      );
      assert.throws(
        () => validateMentorPayload({ mode: 'hack_the_game' }),
        (err) => err.statusCode === 400 && err.code === 'VALIDATION_ERROR'
      );
    });

    test('validateMentorPayload requires levelId for hint, explain, and debug', () => {
      for (const m of ['hint', 'explain', 'debug']) {
        assert.throws(
          () => validateMentorPayload({ mode: m }),
          (err) => err.statusCode === 400 && err.message.includes('levelId is required')
        );
      }
    });

    test('validateMentorPayload rejects invalid or out-of-range levelId', () => {
      assert.throws(
        () => validateMentorPayload({ mode: 'hint', levelId: 0 }),
        (err) => err.statusCode === 400
      );
      assert.throws(
        () => validateMentorPayload({ mode: 'hint', levelId: 99 }),
        (err) => err.statusCode === 400
      );
      assert.throws(
        () => validateMentorPayload({ mode: 'hint', levelId: 'invalid' }),
        (err) => err.statusCode === 400
      );
    });

    test('validateMentorPayload enforces 500-character message bound', () => {
      const longMessage = 'A'.repeat(501);
      assert.throws(
        () => validateMentorPayload({ mode: 'hint', levelId: 1, message: longMessage }),
        (err) => err.statusCode === 400 && err.message.includes('maximum allowed length')
      );
    });

    test('validateMentorPayload rejects malformed or bounded AST program structures', () => {
      assert.throws(
        () => validateMentorPayload({ mode: 'debug', levelId: 1, program: 'not-an-array' }),
        (err) => err.statusCode === 400 && err.code === 'INVALID_PROGRAM'
      );
      assert.throws(
        () => validateMentorPayload({ mode: 'debug', levelId: 1, program: [{ type: 'malicious_exec' }] }),
        (err) => err.statusCode === 400 && err.code === 'INVALID_PROGRAM'
      );
      assert.throws(
        () =>
          validateMentorPayload({
            mode: 'debug',
            levelId: 1,
            program: [{ type: 'repeat', count: -1, body: [] }]
          }),
        (err) => err.statusCode === 400 && err.code === 'INVALID_PROGRAM'
      );
    });
  });

  describe('2. Authentication & Rate Limiting Enforcement', () => {
    test('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'hint', levelId: 1 })
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'UNAUTHORIZED');
    });

    test('enforces rate limit of 20 requests per minute with 429 TOO_MANY_REQUESTS', async () => {
      _resetMentorRateLimiter();

      // Send 20 allowed requests
      for (let i = 0; i < 20; i++) {
        const res = await fetch(`${baseUrl}/api/ai/mentor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ mode: 'recommend' })
        });
        assert.equal(res.status, 200, `Request ${i + 1} should succeed`);
      }

      // 21st request must trigger 429
      const blockedRes = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'recommend' })
      });

      assert.equal(blockedRes.status, 429);
      const data = await blockedRes.json();
      assert.equal(data.success, false);
      assert.equal(data.error.code, 'TOO_MANY_REQUESTS');
    });
  });

  describe('3. Level Unlock & Access Control Invariants', () => {
    test('permits access to Sector 1 without prior completions', async () => {
      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 1 })
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.levelId, 1);
    });

    test('rejects access to locked sector with 403 LEVEL_LOCKED when prerequisite is uncompleted', async () => {
      // Test user has zero completions; Sector 5 requires Sector 4
      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 5 })
      });

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'LEVEL_LOCKED');
    });

    test('permits access to Sector 2 once Sector 1 is recorded in CampaignProgress', async () => {
      await CampaignProgress.create({
        user: testUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION,
        stars: 3,
        attempts: 1,
        bestSteps: 3,
        bestBlocks: 3,
        firstCompletedAt: new Date(),
        lastCompletedAt: new Date()
      });

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 2 })
      });

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.levelId, 2);
    });
  });

  describe('4. Game-Aware Fallback Mechanics & Graduated Clues', () => {
    test('Sector 2 (Energy Run): provides energy shard collection guidance', async () => {
      // Ensure Sector 2 is accessible
      await CampaignProgress.create({
        user: testUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION,
        stars: 3
      });

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 2 })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.equal(data.source, 'fallback');
      assert.match(data.text, /Energy Shards/i);
      assert.match(data.text, /collect/i);
    });

    test('Sector 3 (The First Turn): emphasizes heading and turn orientation', async () => {
      await CampaignProgress.create({
        user: testUser.id,
        levelId: 2,
        campaignVersion: CAMPAIGN_VERSION,
        stars: 3
      });

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 3 })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /Heading & Orientation/i);
      assert.match(data.text, /turn_left|turn_right/i);
    });

    test('Sector 5 (Broken Circuit): explains move vs jump over corruption hazards', async () => {
      await CampaignProgress.create({
        user: testUser.id,
        levelId: 4,
        campaignVersion: CAMPAIGN_VERSION,
        stars: 3
      });

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 5 })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /Corruption Tiles/i);
      assert.match(data.text, /jump/i);
    });

    test('Sector 6 (Switch Protocol): explains terminal activation and bridge states', async () => {
      await CampaignProgress.create({
        user: testUser.id,
        levelId: 5,
        campaignVersion: CAMPAIGN_VERSION,
        stars: 3
      });

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 6 })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /Bridge Terminals/i);
      assert.match(data.text, /activate/i);
    });

    test('Sector 11 (Firewall Guardian): explains boss shield and pulse charges', async () => {
      await CampaignProgress.create({
        user: testUser.id,
        levelId: 10,
        campaignVersion: CAMPAIGN_VERSION,
        stars: 3
      });

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 11 })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /Firewall Guardian/i);
      assert.match(data.text, /pulse/i);
    });

    test('Mode explain: delivers algorithmic concept breakdown', async () => {
      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'explain', levelId: 1 })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /Concept Analysis: Sequences/i);
      assert.match(data.text, /ordered list of instructions/i);
    });

    test('Mode debug: simulates program and reports passing outcome', async () => {
      const validProgramLevel1 = [
        { type: 'move' },
        { type: 'move' },
        { type: 'move' }
      ];

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          mode: 'debug',
          levelId: 1,
          program: validProgramLevel1
        })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /Simulation Diagnostic: PASS/i);
      assert.match(data.text, /Ready for flight authorization/i);
    });

    test('Mode debug: diagnoses wall collision with coordinate details', async () => {
      // Program that turns left into the wall on Sector 1
      const collidingProgram = [
        { type: 'left' },
        { type: 'move' }
      ];

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          mode: 'debug',
          levelId: 1,
          program: collidingProgram
        })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /FAILURE DETECTED/i);
      assert.match(data.text, /barrier|wall/i);
    });

    test('Mode debug: falls back to recent flight attempt when no program is passed', async () => {
      await CampaignAttempt.create({
        user: testUser.id,
        levelId: 1,
        campaignVersion: CAMPAIGN_VERSION,
        passed: false,
        reason: 'Drone collided with perimeter barrier',
        steps: 2,
        programBlocks: 2
      });

      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'debug', levelId: 1 })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /Drone collided with perimeter barrier/i);
    });

    test('Mode recommend: recommends first uncompleted sector for new pilot', async () => {
      const res = await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'recommend' })
      });

      assert.equal(res.status, 200);
      const { data } = await res.json();
      assert.match(data.text, /Next Objective: Sector 1/i);
      assert.match(data.text, /Boot Sequence/i);
    });
  });

  describe('5. External Provider Stubbing & Graceful Error Handling', () => {
    test('returns AI source when external provider succeeds', async () => {
      const originalEnvKey = process.env.LLM_API_KEY;
      process.env.LLM_API_KEY = 'mock-test-key';

      try {
        const mockResponse = '### AI Flight Guidance\n\nExecute a 3-step sequence to reach extraction.';
        mock.method(mentorService.llmClient, 'call', async () => mockResponse);

        const res = await fetch(`${baseUrl}/api/ai/mentor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ mode: 'hint', levelId: 1 })
        });

        assert.equal(res.status, 200);
        const { data } = await res.json();
        assert.equal(data.source, 'ai');
        assert.equal(data.text, mockResponse);
      } finally {
        mock.restoreAll();
        if (originalEnvKey) {
          process.env.LLM_API_KEY = originalEnvKey;
        } else {
          delete process.env.LLM_API_KEY;
        }
      }
    });

    test('falls back gracefully to deterministic guidance when provider times out or throws', async () => {
      const originalEnvKey = process.env.LLM_API_KEY;
      process.env.LLM_API_KEY = 'mock-test-key';

      try {
        mock.method(mentorService.llmClient, 'call', async () => {
          throw new Error('LLM connection timeout after 8000ms');
        });

        const res = await fetch(`${baseUrl}/api/ai/mentor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ mode: 'hint', levelId: 1 })
        });

        assert.equal(res.status, 200);
        const { data } = await res.json();
        assert.equal(data.source, 'fallback');
        assert.match(data.text, /Boot Sequence/i);
      } finally {
        mock.restoreAll();
        if (originalEnvKey) {
          process.env.LLM_API_KEY = originalEnvKey;
        } else {
          delete process.env.LLM_API_KEY;
        }
      }
    });
  });

  describe('6. Zero-Side-Effect Invariants Verification', () => {
    test('mentor consultations never alter player balances, stars, completions, or unlocks', async () => {
      const userBefore = await User.findById(testUser.id).lean();

      // Submit multiple mentor requests across multiple modes
      await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'hint', levelId: 1 })
      });

      await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'recommend' })
      });

      await fetch(`${baseUrl}/api/ai/mentor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode: 'debug', levelId: 1 })
      });

      const userAfter = await User.findById(testUser.id).lean();
      assert.equal(userAfter.totalXp, userBefore.totalXp);
      assert.equal(userAfter.coins, userBefore.coins);
      assert.equal(userAfter.level, userBefore.level);
      assert.equal(userAfter.currentStreak, userBefore.currentStreak);

      const progressCount = await CampaignProgress.countDocuments({ user: testUser.id });
      assert.equal(progressCount, 0, 'Mentor must never create or award CampaignProgress records');

      const attemptCount = await CampaignAttempt.countDocuments({ user: testUser.id });
      assert.equal(attemptCount, 0, 'Mentor must never record CampaignAttempt records');
    });
  });
});
