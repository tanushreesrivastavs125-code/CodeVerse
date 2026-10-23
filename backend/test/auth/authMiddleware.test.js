import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../src/middleware/authMiddleware.js';
import { signToken, getJwtSecret, JWT_ALGORITHM, JWT_ISSUER, JWT_AUDIENCE } from '../../src/config/jwt.js';
import { AppError } from '../../src/middleware/errorHandler.js';

describe('authMiddleware Token Inspection', () => {
  test('rejects request with missing Authorization header', () => {
    const req = { headers: {} };
    let calledNextWith = null;

    authMiddleware(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 401);
    assert.equal(calledNextWith.errorCode, 'UNAUTHORIZED');
  });

  test('rejects request with malformed Authorization header (missing Bearer prefix)', () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    let calledNextWith = null;

    authMiddleware(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 401);
    assert.ok(calledNextWith.message.includes('Bearer'));
  });

  test('rejects request with Bearer prefix but empty token string', () => {
    const req = { headers: { authorization: 'Bearer    ' } };
    let calledNextWith = null;

    authMiddleware(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 401);
  });

  test('rejects request with invalid or corrupted token signature', () => {
    const req = { headers: { authorization: 'Bearer completely.invalid.token' } };
    let calledNextWith = null;

    authMiddleware(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 401);
    assert.equal(calledNextWith.errorCode, 'INVALID_TOKEN');
  });

  test('rejects request with expired token and issues TOKEN_EXPIRED code', () => {
    const expiredToken = signToken({ id: 'user_expired', username: 'expired' }, { expiresIn: '0s' });
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    let calledNextWith = null;

    authMiddleware(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 401);
    assert.equal(calledNextWith.errorCode, 'TOKEN_EXPIRED');
  });

  test('successfully attaches user claims to req.user for valid token', () => {
    const token = signToken({
      id: '507f1f77bcf86cd799439011',
      username: 'active_coder',
      role: 'user'
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    let calledNext = false;
    let errorPassed = null;

    authMiddleware(req, {}, (err) => {
      calledNext = true;
      errorPassed = err;
    });

    assert.equal(calledNext, true);
    assert.equal(errorPassed, undefined);
    assert.equal(req.user.id, '507f1f77bcf86cd799439011');
    assert.equal(req.user.username, 'active_coder');
    assert.equal(req.user.role, 'user');
  });

  test('rejects request with token signed using disallowed algorithm', () => {
    const disallowedToken = jwt.sign(
      { id: 'user_disallowed' },
      getJwtSecret(),
      { algorithm: 'HS512', issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );
    const req = { headers: { authorization: `Bearer ${disallowedToken}` } };
    let calledNextWith = null;

    authMiddleware(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 401);
    assert.equal(calledNextWith.errorCode, 'INVALID_TOKEN');
  });

  test('rejects request with token containing invalid issuer', () => {
    const invalidIssuerToken = jwt.sign(
      { id: 'user_bad_issuer' },
      getJwtSecret(),
      { algorithm: JWT_ALGORITHM, issuer: 'untrusted_issuer', audience: JWT_AUDIENCE }
    );
    const req = { headers: { authorization: `Bearer ${invalidIssuerToken}` } };
    let calledNextWith = null;

    authMiddleware(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 401);
    assert.equal(calledNextWith.errorCode, 'INVALID_TOKEN');
  });

  test('rejects request with token containing invalid audience', () => {
    const invalidAudienceToken = jwt.sign(
      { id: 'user_bad_aud' },
      getJwtSecret(),
      { algorithm: JWT_ALGORITHM, issuer: JWT_ISSUER, audience: 'unauthorized_audience' }
    );
    const req = { headers: { authorization: `Bearer ${invalidAudienceToken}` } };
    let calledNextWith = null;

    authMiddleware(req, {}, (err) => {
      calledNextWith = err;
    });

    assert.ok(calledNextWith instanceof AppError);
    assert.equal(calledNextWith.statusCode, 401);
    assert.equal(calledNextWith.errorCode, 'INVALID_TOKEN');
  });
});

