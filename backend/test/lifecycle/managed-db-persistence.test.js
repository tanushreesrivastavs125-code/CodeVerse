import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { startManagedDb } from '../../../scripts/lib/managed-db.mjs';
import { User } from '../../src/models/User.js';
import { CampaignProgress } from '../../src/models/CampaignProgress.js';
import { Guild } from '../../src/models/Guild.js';
import { GuildMembership } from '../../src/models/GuildMembership.js';
import { runCampaignLevel } from '../../src/services/campaignService.js';

describe('Managed DB Process Restart & Transactional Persistence Verification', () => {
  const testDbDir = path.resolve('.local-db-test-qa-' + Date.now());
  const testPort = 27018;
  const loopSol = [{ type: 'repeat', count: 3, body: [{ type: 'move' }] }];

  it('preserves accounts, stars, coins, XP, and guild memberships across complete process restarts with replica set transactions', async () => {
    let session1Db = null;
    let session2Db = null;
    let pilotId = null;

    try {
      // Clean initial state
      if (fs.existsSync(testDbDir)) {
        try { fs.rmSync(testDbDir, { recursive: true, force: true }); } catch { /* ignore */ }
      }

      // ============================================================
      // SESSION 1: Initial Start & Data Population
      // ============================================================
      console.log('[QA Test] Step 1: Starting managed replica set for Session 1...');
      session1Db = await startManagedDb({ port: testPort, dbPath: testDbDir, timeoutMs: 35000 });
      assert.ok(session1Db.child);
      assert.strictEqual(session1Db.port, testPort);

      await mongoose.connect(`mongodb://127.0.0.1:${testPort}/codeverse_qa?replicaSet=rs0`);

      // Ensure indexes are established to avoid concurrent catalog updates during first transaction
      await User.init();
      await CampaignProgress.init();
      await Guild.init();
      await GuildMembership.init();

      // Create player
      const pilot = await User.create({
        username: 'PersistenceVanguard',
        email: 'vanguard@codeverse.game',
        password: 'HashedSecurePassword123!',
        coins: 0,
        totalStars: 0,
        xp: 0
      });
      pilotId = pilot._id;

      // Complete Sector 1 and award transactional rewards
      const runOutcome = await runCampaignLevel({
        userId: pilotId,
        levelId: 1,
        program: loopSol
      });

      assert.strictEqual(runOutcome.passed, true);
      assert.strictEqual(runOutcome.stars, 3);
      assert.strictEqual(runOutcome.earned.coins, 25);
      assert.strictEqual(runOutcome.earned.xp, 100);

      const updatedPilot = await User.findById(pilotId);
      const initialCoins = updatedPilot.coins;
      const initialXp = updatedPilot.totalXp;

      assert.strictEqual(initialCoins, 25);
      assert.strictEqual(initialXp, 100);

      // Create persistent Guild
      const guild = await Guild.create({
        name: 'Vanguard Flight Wing',
        normalizedName: 'vanguard flight wing',
        description: 'Persistent test guild',
        owner: pilotId
      });

      await GuildMembership.create({
        user: pilotId,
        guild: guild._id,
        joinedAt: new Date()
      });

      // Verify progress in Session 1
      const progressSession1 = await CampaignProgress.findOne({ user: pilotId, levelId: 1 });
      assert.ok(progressSession1);
      assert.strictEqual(progressSession1.stars, 3);

      // Clean disconnect and process shutdown
      console.log('[QA Test] Step 2: Cleanly shutting down Session 1 database process...');
      await mongoose.disconnect();
      await session1Db.stop();
      session1Db = null;

      // ============================================================
      // SESSION 2: Process Restart from Persisted Disk State
      // ============================================================
      console.log('[QA Test] Step 3: Restarting managed database process using identical persisted storage...');
      session2Db = await startManagedDb({ port: testPort, dbPath: testDbDir, timeoutMs: 35000 });
      assert.ok(session2Db.child);

      await mongoose.connect(`mongodb://127.0.0.1:${testPort}/codeverse_qa?replicaSet=rs0`);

      // Verify user recovered with exact state
      const recoveredPilot = await User.findById(pilotId);
      assert.ok(recoveredPilot, 'Pilot must survive process restart');
      assert.strictEqual(recoveredPilot.username, 'PersistenceVanguard');
      assert.strictEqual(recoveredPilot.coins, 25, 'Coins must persist');
      assert.strictEqual(recoveredPilot.totalXp, 100, 'XP must persist');

      // Verify campaign progress recovered
      const recoveredProgress = await CampaignProgress.findOne({ user: pilotId, levelId: 1 });
      assert.ok(recoveredProgress, 'Campaign progress must survive process restart');
      assert.strictEqual(recoveredProgress.stars, 3);

      // Verify guild & membership recovered
      const recoveredGuild = await Guild.findById(guild._id);
      assert.ok(recoveredGuild, 'Guild must survive process restart');
      assert.strictEqual(recoveredGuild.name, 'Vanguard Flight Wing');

      const recoveredMember = await GuildMembership.findOne({ user: pilotId, guild: guild._id });
      assert.ok(recoveredMember, 'Guild membership must survive process restart');

      // Replay Sector 1 - verify idempotency: NO DUPLICATE COINS OR STARS
      console.log('[QA Test] Step 4: Replaying Sector 1 to verify zero duplicate currency or stars...');
      const replayOutcome = await runCampaignLevel({
        userId: pilotId,
        levelId: 1,
        program: loopSol
      });

      assert.strictEqual(replayOutcome.passed, true);
      assert.strictEqual(replayOutcome.stars, 3);
      assert.strictEqual(replayOutcome.earned.coins, 0, 'Replay must award zero coins');
      assert.strictEqual(replayOutcome.earned.xp, 0, 'Replay must award zero additional XP');

      const finalPilot = await User.findById(pilotId);
      assert.strictEqual(finalPilot.coins, 25, 'User balance must remain unchanged after replay');
      assert.strictEqual(finalPilot.totalXp, 100, 'User XP must remain unchanged after replay');

      // Clean disconnect and shutdown
      console.log('[QA Test] Step 5: Clean shutdown and cleanup...');
      await mongoose.disconnect();
      await session2Db.stop();
      session2Db = null;

      try { fs.rmSync(testDbDir, { recursive: true, force: true }); } catch { /* ignore */ }
      console.log('[QA Test] Persistence verification passed flawlessly!');
    } finally {
      try { await mongoose.disconnect(); } catch { /* ignore */ }
      if (session1Db) {
        try { await session1Db.stop(); } catch { /* ignore */ }
      }
      if (session2Db) {
        try { await session2Db.stop(); } catch { /* ignore */ }
      }
      try {
        if (fs.existsSync(testDbDir)) {
          fs.rmSync(testDbDir, { recursive: true, force: true });
        }
      } catch { /* ignore */ }
    }
  });
});
