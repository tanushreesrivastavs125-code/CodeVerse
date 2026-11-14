import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { csrfProtection } from '../../src/middleware/csrfProtection.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import { config } from '../../src/config/env.js';

describe('CSRF Protection Middleware', () => {
  test('passes safe read methods (GET, HEAD, OPTIONS) without origin check', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const req = {
        method,
        headers: { origin: 'http://malicious.com' },
        get: () => 'localhost:5000'
      };
      let calledNext = false;
      let error = null;

      csrfProtection(req, {}, (err) => {
        calledNext = true;
        error = err;
      });

      assert.equal(calledNext, true);
      assert.equal(error, undefined);
    }
  });

  test('allows state-changing request with Origin matching config.corsOrigin', () => {
    const req = {
      method: 'POST',
      headers: { origin: config.corsOrigin },
      get: () => 'localhost:5000'
    };
    let calledNext = false;
    let error = null;

    csrfProtection(req, {}, (err) => {
      calledNext = true;
      error = err;
    });

    assert.equal(calledNext, true);
    assert.equal(error, undefined);
  });

  test('allows state-changing request with Origin matching host', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'http://localhost:5000' },
      get: (header) => (header === 'host' ? 'localhost:5000' : null)
    };
    let calledNext = false;
    let error = null;

    csrfProtection(req, {}, (err) => {
      calledNext = true;
      error = err;
    });

    assert.equal(calledNext, true);
    assert.equal(error, undefined);
  });

  test('rejects state-changing request with untrusted Origin header', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'http://attacker-site.com' },
      get: (header) => (header === 'host' ? 'localhost:5000' : null)
    };
    let calledNextWith = null;

    csrfProtection(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 403);
    assert.equal(calledNextWith.errorCode, 'CSRF_ORIGIN_INVALID');
  });

  test('rejects state-changing request with malformed Origin header', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'not-a-valid-url' },
      get: () => 'localhost:5000'
    };
    let calledNextWith = null;

    csrfProtection(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 403);
    assert.equal(calledNextWith.errorCode, 'CSRF_ORIGIN_INVALID');
  });

  test('allows cookie request without Origin if Referer matches allowed host', () => {
    const req = {
      method: 'POST',
      headers: { referer: 'http://localhost:5173/dashboard' },
      cookies: { token: 'sample.jwt' },
      get: (header) => (header === 'host' ? 'localhost:5000' : null)
    };
    let calledNext = false;
    let error = null;

    csrfProtection(req, {}, (err) => {
      calledNext = true;
      error = err;
    });

    assert.equal(calledNext, true);
    assert.equal(error, undefined);
  });

  test('rejects cookie request without Origin if Referer is untrusted', () => {
    const req = {
      method: 'POST',
      headers: { referer: 'http://phishing.example.com/exploit' },
      cookies: { token: 'sample.jwt' },
      get: (header) => (header === 'host' ? 'localhost:5000' : null)
    };
    let calledNextWith = null;

    csrfProtection(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 403);
    assert.equal(calledNextWith.errorCode, 'CSRF_ORIGIN_INVALID');
  });

  test('allows requests from explicitly configured LAN origin', () => {
    const lanOrigin = 'http://192.168.1.8:5173';
    const req = {
      method: 'POST',
      headers: { origin: lanOrigin },
      get: () => 'localhost:5000'
    };
    let calledNext = false;
    let error = null;

    // Temporarily verify with LAN origin in allowed list
    const originalOrigins = config.corsOrigins;
    config.corsOrigins = ['http://localhost:5173', lanOrigin];

    try {
      csrfProtection(req, {}, (err) => {
        calledNext = true;
        error = err;
      });

      assert.equal(calledNext, true);
      assert.equal(error, undefined);
    } finally {
      config.corsOrigins = originalOrigins;
    }
  });

  test('allows 127.0.0.1 when localhost is configured in development/test', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'http://127.0.0.1:5173' },
      get: () => 'localhost:5000'
    };
    let calledNext = false;
    let error = null;

    csrfProtection(req, {}, (err) => {
      calledNext = true;
      error = err;
    });

    assert.equal(calledNext, true);
    assert.equal(error, undefined);
  });

  test('rejects port mismatch even on localhost', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
      get: () => 'localhost:5000'
    };
    let calledNextWith = null;

    csrfProtection(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 403);
    assert.equal(calledNextWith.errorCode, 'CSRF_ORIGIN_INVALID');
  });
});

