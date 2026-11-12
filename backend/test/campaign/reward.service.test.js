import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLevel,
  calculateStreak,
  getUtcDayTimestamp,
  hasUnknownCommitResultLabel,
  commitWithRetry
} from '../../src/services/rewardService.js';

describe('Reward Service Unit Tests', () => {
  describe('calculateLevel Formula Invariants', () => {
    test('returns minimum level 1 for null, undefined, non-numbers, or 0 XP', () => {
      assert.equal(calculateLevel(0), 1);
      assert.equal(calculateLevel(-50), 1);
      assert.equal(calculateLevel(null), 1);
      assert.equal(calculateLevel(undefined), 1);
      assert.equal(calculateLevel('100'), 1);
    });

    test('calculates correct level thresholds based on 100 * N^1.5', () => {
      // Level 1: 0 - 99 XP
      assert.equal(calculateLevel(50), 1);
      assert.equal(calculateLevel(99), 1);

      // Level 2: 100 - 282 XP (ceil(100 * 1^1.5) = 100)
      assert.equal(calculateLevel(100), 2);
      assert.equal(calculateLevel(282), 2);

      // Level 3: 283 - 519 XP (ceil(100 * 2^1.5) = 283)
      assert.equal(calculateLevel(283), 3);
      assert.equal(calculateLevel(519), 3);

      // Level 4: 520 - 799 XP (ceil(100 * 3^1.5) = 520)
      assert.equal(calculateLevel(520), 4);
      assert.equal(calculateLevel(799), 4);

      // Level 5: 800+ XP (ceil(100 * 4^1.5) = 800)
      assert.equal(calculateLevel(800), 5);
    });
  });

  describe('calculateStreak Activity Invariants', () => {
    test('initial activity with null lastActiveDate initializes streak to 1', () => {
      const now = new Date('2026-11-12T10:00:00.000Z');
      const result = calculateStreak(null, 0, now);
      assert.equal(result.currentStreak, 1);
      assert.equal(result.lastActiveDate, now);
    });

    test('activity on the same UTC calendar day preserves current streak', () => {
      const morning = new Date('2026-11-12T08:00:00.000Z');
      const evening = new Date('2026-11-12T20:30:00.000Z');

      const result = calculateStreak(morning, 5, evening);
      assert.equal(result.currentStreak, 5);
      assert.equal(result.lastActiveDate, evening);
    });

    test('activity on consecutive UTC calendar day increments streak by 1', () => {
      const yesterday = new Date('2026-11-11T23:55:00.000Z');
      const today = new Date('2026-11-12T01:15:00.000Z');

      const result = calculateStreak(yesterday, 3, today);
      assert.equal(result.currentStreak, 4);
      assert.equal(result.lastActiveDate, today);
    });

    test('activity after 2 or more elapsed UTC days resets streak to 1', () => {
      const threeDaysAgo = new Date('2026-11-09T12:00:00.000Z');
      const today = new Date('2026-11-12T12:00:00.000Z');

      const result = calculateStreak(threeDaysAgo, 10, today);
      assert.equal(result.currentStreak, 1);
      assert.equal(result.lastActiveDate, today);
    });

    test('getUtcDayTimestamp correctly normalizes to midnight UTC', () => {
      const ts1 = getUtcDayTimestamp(new Date('2026-11-12T05:30:00.000Z'));
      const ts2 = getUtcDayTimestamp(new Date('2026-11-12T23:59:59.999Z'));
      assert.equal(ts1, ts2);
    });
  });

  describe('Transaction Ambiguity and Retries', () => {
    test('hasUnknownCommitResultLabel detects UnknownTransactionCommitResult label', () => {
      assert.equal(hasUnknownCommitResultLabel(null), false);
      assert.equal(hasUnknownCommitResultLabel(new Error('Generic failure')), false);

      const errWithMethod = {
        hasErrorLabel: (lbl) => lbl === 'UnknownTransactionCommitResult'
      };
      assert.equal(hasUnknownCommitResultLabel(errWithMethod), true);

      const errWithArray = {
        errorLabels: ['UnknownTransactionCommitResult']
      };
      assert.equal(hasUnknownCommitResultLabel(errWithArray), true);
    });

    test('commitWithRetry retries when UnknownTransactionCommitResult occurs', async () => {
      let callCount = 0;
      const mockSession = {
        commitTransaction: async () => {
          callCount++;
          if (callCount < 3) {
            const err = new Error('Transient network partition');
            err.errorLabels = ['UnknownTransactionCommitResult'];
            throw err;
          }
        }
      };

      await assert.doesNotReject(async () => {
        await commitWithRetry(mockSession, 3);
      });
      assert.equal(callCount, 3);
    });

    test('commitWithRetry throws immediately for non-transient errors', async () => {
      const mockSession = {
        commitTransaction: async () => {
          throw new Error('Fatal write collision');
        }
      };

      await assert.rejects(
        async () => {
          await commitWithRetry(mockSession, 3);
        },
        /Fatal write collision/
      );
    });
  });
});
