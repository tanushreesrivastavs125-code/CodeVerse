import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  calculateLevel,
  calculateStreak,
  getUtcDayTimestamp,
  isReplicaSetConnected,
  canUseTransactions,
  isTransientTransactionError,
  hasUnknownCommitResultLabel,
  commitWithRetry,
  withTransaction
} from '../../src/services/rewardService.js';
import { AppError } from '../../src/middleware/errorHandler.js';

describe('Reward Service & Transaction Safety', () => {
  beforeEach(() => {
    mock.restoreAll();
    delete mongoose.connection._forceTransactionSupport;
  });

  afterEach(() => {
    mock.restoreAll();
    delete mongoose.connection._forceTransactionSupport;
  });

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
    const baseDate = new Date('2026-11-12T10:00:00.000Z');

    test('initial activity with null lastActiveDate initializes streak to 1', () => {
      const result = calculateStreak(null, 0, baseDate);
      assert.equal(result.currentStreak, 1);
      assert.equal(result.lastActiveDate, baseDate);
    });

    test('activity on the same UTC calendar day preserves current streak', () => {
      const earlierSameDay = new Date('2026-11-12T02:00:00.000Z');
      const result = calculateStreak(earlierSameDay, 5, baseDate);
      assert.equal(result.currentStreak, 5);
      assert.equal(result.lastActiveDate, baseDate);
    });

    test('activity on consecutive UTC calendar day increments streak by 1', () => {
      const yesterday = new Date('2026-11-11T18:00:00.000Z');
      const result = calculateStreak(yesterday, 3, baseDate);
      assert.equal(result.currentStreak, 4);
    });

    test('activity after 2 or more elapsed UTC days resets streak to 1', () => {
      const twoDaysAgo = new Date('2026-11-10T10:00:00.000Z');
      const result = calculateStreak(twoDaysAgo, 10, baseDate);
      assert.equal(result.currentStreak, 1);
      assert.equal(result.lastActiveDate, baseDate);
    });

    test('getUtcDayTimestamp correctly normalizes to midnight UTC', () => {
      const ts1 = getUtcDayTimestamp('2026-11-12T03:15:00.000Z');
      const ts2 = getUtcDayTimestamp('2026-11-12T23:59:59.000Z');
      assert.equal(ts1, ts2);
    });
  });

  describe('Topology & Transaction Capability Inspection', () => {
    test('reports transactions unavailable when disconnected or standalone', () => {
      const origReadyState = mongoose.connection.readyState;
      try {
        Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });
        assert.equal(canUseTransactions(), false);
        assert.equal(isReplicaSetConnected(), false);
      } finally {
        Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, configurable: true });
      }
    });

    test('reports transactions available when connected to ReplicaSet', () => {
      const origReadyState = mongoose.connection.readyState;
      const origClient = mongoose.connection.client;
      try {
        Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
        Object.defineProperty(mongoose.connection, 'client', {
          value: {
            topology: {
              description: {
                type: 'ReplicaSetWithPrimary'
              }
            }
          },
          configurable: true
        });

        assert.equal(isReplicaSetConnected(), true);
        assert.equal(canUseTransactions(), true);
      } finally {
        Object.defineProperty(mongoose.connection, 'readyState', { value: origReadyState, configurable: true });
        Object.defineProperty(mongoose.connection, 'client', { value: origClient, configurable: true });
      }
    });

    test('respects _forceTransactionSupport flag for test environments', () => {
      mongoose.connection._forceTransactionSupport = true;
      assert.equal(canUseTransactions(), true);
    });
  });

  describe('Error Label Detection', () => {
    test('isTransientTransactionError detects hasErrorLabel and errorLabels array', () => {
      const errWithFn = { hasErrorLabel: (label) => label === 'TransientTransactionError' };
      assert.equal(isTransientTransactionError(errWithFn), true);

      const errWithArray = { errorLabels: ['TransientTransactionError'] };
      assert.equal(isTransientTransactionError(errWithArray), true);

      const standardErr = new Error('Regular error');
      assert.equal(isTransientTransactionError(standardErr), false);
      assert.equal(isTransientTransactionError(null), false);
    });

    test('hasUnknownCommitResultLabel detects UnknownTransactionCommitResult', () => {
      const errWithFn = { hasErrorLabel: (label) => label === 'UnknownTransactionCommitResult' };
      assert.equal(hasUnknownCommitResultLabel(errWithFn), true);

      const errWithArray = { errorLabels: ['UnknownTransactionCommitResult'] };
      assert.equal(hasUnknownCommitResultLabel(errWithArray), true);

      const standardErr = new Error('Regular error');
      assert.equal(hasUnknownCommitResultLabel(standardErr), false);
      assert.equal(hasUnknownCommitResultLabel(null), false);
    });
  });

  describe('commitWithRetry Ambiguous Commit Handling', () => {
    test('commits successfully on first attempt', async () => {
      let commitCalls = 0;
      const mockSession = {
        commitTransaction: async () => {
          commitCalls++;
        }
      };

      await commitWithRetry(mockSession);
      assert.equal(commitCalls, 1);
    });

    test('retries commit when UnknownTransactionCommitResult occurs and succeeds', async () => {
      let commitCalls = 0;
      const mockSession = {
        commitTransaction: async () => {
          commitCalls++;
          if (commitCalls < 3) {
            const err = new Error('Transient network partition');
            err.errorLabels = ['UnknownTransactionCommitResult'];
            throw err;
          }
        }
      };

      await assert.doesNotReject(async () => {
        await commitWithRetry(mockSession, 3);
      });
      assert.equal(commitCalls, 3);
    });

    test('throws non-ambiguous commit error immediately without retrying', async () => {
      let commitCalls = 0;
      const mockSession = {
        commitTransaction: async () => {
          commitCalls++;
          throw new Error('Fatal database error');
        }
      };

      await assert.rejects(
        async () => {
          await commitWithRetry(mockSession, 3);
        },
        /Fatal database error/
      );
      assert.equal(commitCalls, 1);
    });
  });

  describe('withTransaction Atomicity & Retry Semantics', () => {
    test('throws 503 TRANSACTIONS_UNAVAILABLE when transactions are disabled', async () => {
      delete mongoose.connection._forceTransactionSupport;
      await assert.rejects(
        async () => {
          await withTransaction(async () => {});
        },
        (err) => {
          assert.equal(err instanceof AppError, true);
          assert.equal(err.statusCode, 503);
          assert.equal(err.code, 'TRANSACTIONS_UNAVAILABLE');
          return true;
        }
      );
    });

    test('executes callback, commits, and ends session when transactions are supported', async () => {
      mongoose.connection._forceTransactionSupport = true;

      let started = false;
      let committed = false;
      let ended = false;

      const mockSession = {
        startTransaction() {
          started = true;
        },
        async commitTransaction() {
          committed = true;
        },
        async abortTransaction() {},
        async endSession() {
          ended = true;
        }
      };

      mock.method(mongoose, 'startSession', async () => mockSession);

      const result = await withTransaction(async (session) => {
        assert.equal(session, mockSession);
        return { success: true };
      });

      assert.equal(result.success, true);
      assert.equal(started, true);
      assert.equal(committed, true);
      assert.equal(ended, true);
    });

    test('retries transient transaction errors up to maxRetries', async () => {
      mongoose.connection._forceTransactionSupport = true;

      let attempts = 0;
      let sessionsAborted = 0;
      let sessionsEnded = 0;

      mock.method(mongoose, 'startSession', async () => {
        return {
          startTransaction() {},
          async commitTransaction() {},
          async abortTransaction() {
            sessionsAborted++;
          },
          async endSession() {
            sessionsEnded++;
          }
        };
      });

      const result = await withTransaction(async () => {
        attempts++;
        if (attempts < 3) {
          const transientErr = new Error('WriteConflict');
          transientErr.errorLabels = ['TransientTransactionError'];
          throw transientErr;
        }
        return 'recovered';
      }, 3);

      assert.equal(result, 'recovered');
      assert.equal(attempts, 3);
      assert.equal(sessionsAborted, 2);
      assert.equal(sessionsEnded, 3);
    });

    test('aborts transaction and does NOT retry non-transient errors (such as E11000)', async () => {
      mongoose.connection._forceTransactionSupport = true;

      let attempts = 0;
      let aborted = false;
      let ended = false;

      const mockSession = {
        startTransaction() {},
        async commitTransaction() {},
        async abortTransaction() {
          aborted = true;
        },
        async endSession() {
          ended = true;
        }
      };

      mock.method(mongoose, 'startSession', async () => mockSession);

      const duplicateKeyErr = new Error('E11000 duplicate key');
      duplicateKeyErr.code = 11000;

      await assert.rejects(
        async () => {
          await withTransaction(async () => {
            attempts++;
            throw duplicateKeyErr;
          });
        },
        (err) => {
          assert.equal(err.code, 11000);
          return true;
        }
      );

      assert.equal(attempts, 1, 'Non-transient error must not be retried');
      assert.equal(aborted, true, 'Transaction must be cleanly aborted');
      assert.equal(ended, true, 'Session must be closed');
    });
  });
});
