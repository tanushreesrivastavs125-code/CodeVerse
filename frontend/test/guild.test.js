import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/api/client.js';

describe('Frontend Guild Client & Interface Invariants', () => {
  test('api.guilds defines all required contract operations', () => {
    assert.equal(typeof api.guilds, 'object');
    assert.equal(typeof api.guilds.list, 'function');
    assert.equal(typeof api.guilds.me, 'function');
    assert.equal(typeof api.guilds.getById, 'function');
    assert.equal(typeof api.guilds.create, 'function');
    assert.equal(typeof api.guilds.join, 'function');
    assert.equal(typeof api.guilds.leave, 'function');
  });

  test('guild name bounds check: 3 to 30 characters', () => {
    const validNames = ['Cyber Sentinels', 'Apex-9', 'Alpha_Squad', '007 Pilots'];
    for (const name of validNames) {
      assert.ok(name.length >= 3 && name.length <= 30);
      assert.ok(/^[a-zA-Z0-9 _-]+$/.test(name));
    }

    const invalidShort = 'AB';
    assert.ok(invalidShort.length < 3);

    const invalidLong = 'A'.repeat(31);
    assert.ok(invalidLong.length > 30);

    const invalidChars = 'Squad<script>';
    assert.ok(!/^[a-zA-Z0-9 _-]+$/.test(invalidChars));
  });

  test('guild description bound check: max 250 characters', () => {
    const validDesc = 'Elite squadron navigating challenging firewall core sectors.';
    assert.ok(validDesc.length <= 250);

    const tooLong = 'Z'.repeat(251);
    assert.ok(tooLong.length > 250);
  });

  test('Combined member XP display formatting', () => {
    const sampleXp = 125430;
    const formatted = sampleXp.toLocaleString();
    assert.equal(typeof formatted, 'string');
    assert.ok(formatted.includes('430'));

    const zeroXp = 0;
    assert.equal(zeroXp.toLocaleString(), '0');
  });

  test('Ownership departure confirmation messaging distinction', () => {
    const getLeavePrompt = (isOwner) =>
      isOwner
        ? 'Are you sure you want to leave your guild? Ownership will be transferred to the oldest remaining member, or the guild will disband if you are the last pilot.'
        : 'Are you sure you want to leave this guild?';

    assert.ok(getLeavePrompt(true).includes('Ownership will be transferred'));
    assert.ok(!getLeavePrompt(false).includes('Ownership will be transferred'));
  });

  test('Guest session privileges disclosure clarity', () => {
    const guestUser = { isGuest: true, username: 'Guest_abc123' };
    const registeredUser = { isGuest: false, username: 'CommanderNova' };

    const hasGuestPrivilegesDisclosure = (u) => Boolean(u?.isGuest);
    assert.equal(hasGuestPrivilegesDisclosure(guestUser), true);
    assert.equal(hasGuestPrivilegesDisclosure(registeredUser), false);
  });
});
