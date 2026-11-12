import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app.js';

describe('Stage 3 End-to-End Session & Routed Game Shell Verification', () => {
  let replSet;
  let server;
  let baseUrl;

  before(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
      instanceOpts: [{ port: 0 }]
    });
    await replSet.waitUntilRunning();
    const uri = replSet.getUri('codeverse_stage3_e2e');

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
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
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (replSet) {
      await replSet.stop();
    }
  });

  test('Walkthrough Step 1: /play -> guest session creation & cookie issuance', async () => {
    const res = await fetch(`${baseUrl}/api/auth/guest`, {
      method: 'POST'
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isExisting, false);
    assert.equal(body.data.user.role, 'guest');
    assert.equal(body.data.user.isGuest, true);
    assert.ok(body.data.user.username.startsWith('Guest_'));

    // Check Set-Cookie
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie);
    assert.ok(setCookie.includes('token='));
    assert.ok(setCookie.toLowerCase().includes('httponly'));

    // Extract cookie for subsequent calls
    const rawCookie = setCookie.split(';')[0];

    // Walkthrough Step 2: Fetch real campaign data using the guest cookie
    const levelsRes = await fetch(`${baseUrl}/api/game/levels`, {
      headers: {
        Cookie: rawCookie
      }
    });

    assert.equal(levelsRes.status, 200);
    const levelsBody = await levelsRes.json();
    assert.equal(levelsBody.success, true);
    assert.ok(Array.isArray(levelsBody.data));
    assert.equal(levelsBody.data.length, 3);
    assert.equal(levelsBody.data[0].unlocked, true);
    assert.equal(levelsBody.data[1].unlocked, false);
    assert.equal(levelsBody.data[2].unlocked, false);

    // Walkthrough Step 3: Browser reload / resume session retains same player
    const reloadRes = await fetch(`${baseUrl}/api/auth/guest`, {
      method: 'POST',
      headers: {
        Cookie: rawCookie
      }
    });

    assert.equal(reloadRes.status, 200);
    const reloadBody = await reloadRes.json();
    assert.equal(reloadBody.success, true);
    assert.equal(reloadBody.data.isExisting, true);
    assert.equal(reloadBody.data.user.id, body.data.user.id);
    assert.equal(reloadBody.data.user.username, body.data.user.username);

    // Also verify profile endpoint returns same user via cookie
    const profileRes = await fetch(`${baseUrl}/api/auth/profile`, {
      headers: {
        Cookie: rawCookie
      }
    });
    assert.equal(profileRes.status, 200);
    const profileBody = await profileRes.json();
    assert.equal(profileBody.data.id, body.data.user.id);

    // Walkthrough Step 4: Sign out clears session cookie
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: rawCookie
      }
    });
    assert.equal(logoutRes.status, 200);
    const logoutCookie = logoutRes.headers.get('set-cookie');
    assert.ok(logoutCookie);
    assert.ok(
      logoutCookie.includes('Max-Age=0') || logoutCookie.includes('token=;') || logoutCookie.includes('expires=')
    );

    // Walkthrough Step 5: After logout, unauthenticated profile access fails
    const unauthProfile = await fetch(`${baseUrl}/api/auth/profile`);
    assert.equal(unauthProfile.status, 401);

    // Walkthrough Step 6: Sign in to registered permanent account
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'commander_pilot',
        email: 'commander@codeverse.io',
        password: 'PilotPassword123!'
      })
    });
    assert.equal(regRes.status, 201);
    const regCookie = regRes.headers.get('set-cookie').split(';')[0];

    // Walkthrough Step 7: Access protected routes (/dashboard, /playground, /profile)
    const authLevelsRes = await fetch(`${baseUrl}/api/game/levels`, {
      headers: { Cookie: regCookie }
    });
    assert.equal(authLevelsRes.status, 200);
    const authLevels = await authLevelsRes.json();
    assert.equal(authLevels.data[0].unlocked, true);

    const authProfileRes = await fetch(`${baseUrl}/api/auth/profile`, {
      headers: { Cookie: regCookie }
    });
    assert.equal(authProfileRes.status, 200);
    const authProfile = await authProfileRes.json();
    assert.equal(authProfile.data.username, 'commander_pilot');
    assert.equal(authProfile.data.email, 'commander@codeverse.io');
    assert.equal(authProfile.data.role, 'user');
    assert.equal(authProfile.data.isGuest, false);
  });
});
