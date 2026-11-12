import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { guestRateLimiter, _resetGuestRateLimiter } from '../../src/middleware/rateLimiter.js';
import { AppError } from '../../src/middleware/errorHandler.js';

describe('Guest Rate Limiter Middleware', () => {
  beforeEach(() => {
    _resetGuestRateLimiter();
  });

  test('allows requests within standard threshold (10 requests)', () => {
    const req = { ip: '192.168.1.100' };

    for (let i = 0; i < 10; i++) {
      let calledNext = false;
      let error = null;

      guestRateLimiter(req, {}, (err) => {
        calledNext = true;
        error = err;
      });

      assert.equal(calledNext, true, `Request ${i + 1} should be permitted`);
      assert.equal(error, undefined);
    }
  });

  test('rejects request with 429 TOO_MANY_REQUESTS when limit exceeded', () => {
    const req = { ip: '10.0.0.42' };

    for (let i = 0; i < 10; i++) {
      guestRateLimiter(req, {}, () => {});
    }

    let calledNextWith = null;
    guestRateLimiter(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 429);
    assert.equal(calledNextWith.errorCode, 'TOO_MANY_REQUESTS');
  });

  test('tracks requests independently across different client IPs', () => {
    const reqA = { ip: '10.0.0.1' };
    const reqB = { ip: '10.0.0.2' };

    for (let i = 0; i < 10; i++) {
      guestRateLimiter(reqA, {}, () => {});
    }

    // reqA should be blocked
    let reqAError = null;
    guestRateLimiter(reqA, {}, (err) => {
      reqAError = err;
    });
    assert.equal(reqAError?.statusCode, 429);

    // reqB should still be allowed
    let reqBCalled = false;
    let reqBError = null;
    guestRateLimiter(reqB, {}, (err) => {
      reqBCalled = true;
      reqBError = err;
    });
    assert.equal(reqBCalled, true);
    assert.equal(reqBError, undefined);
  });
});

