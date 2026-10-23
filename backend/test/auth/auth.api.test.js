import { test, describe, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import User from '../../src/models/User.js';
import { signToken, getJwtSecret, JWT_ALGORITHM, JWT_ISSUER, JWT_AUDIENCE } from '../../src/config/jwt.js';

describe('Authentication API Endpoint Contract (/api/auth)', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      server.close();
    }
  });

  beforeEach(() => {
    mock.restoreAll();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('POST /api/auth/register', () => {
    test('successfully registers new user with 201 Created and safe response envelope', async () => {
      let createdDoc = null;

      mock.method(User, 'findOne', async () => null);
      mock.method(User, 'create', async (data) => {
        createdDoc = {
          _id: '507f1f77bcf86cd799439011',
          ...data,
          totalXp: 0,
          level: 1,
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return createdDoc;
      });

      const rawPassword = 'StrongPassword123!';
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'cyber_coder',
          email: 'Learner@CodeVerse.IO',
          password: rawPassword
        })
      });

      assert.equal(response.status, 201);
      const body = await response.json();

      // Envelope validation
      assert.equal(body.success, true);
      assert.ok(body.data, 'Response must provide data envelope');
      assert.ok(body.data.token, 'data envelope must provide signed JWT');
      assert.equal(body.token, undefined, 'Redundant top-level token must not be present');
      assert.equal(body.user, undefined, 'Redundant top-level user must not be present');

      // User payload validation
      const user = body.data.user;
      assert.equal(user.username, 'cyber_coder');
      assert.equal(user.email, 'learner@codeverse.io');
      assert.equal(user.totalXp, 0);
      assert.equal(user.level, 1);
      assert.equal(user.id, '507f1f77bcf86cd799439011');

      // Security verification: password hash and secrets must NEVER be present
      assert.equal(body.password, undefined);
      assert.equal(user.password, undefined);
      assert.equal(user.passwordHash, undefined);
      const rawText = JSON.stringify(body);
      assert.ok(!rawText.includes(rawPassword), 'Plaintext password must not be leaked in response');
      assert.ok(!rawText.includes('$2a$') && !rawText.includes('$2b$'), 'Password hash must not be leaked in response');

      // Database persistence security check: verify password was hashed before storage
      assert.ok(createdDoc, 'User.create must have been invoked');
      assert.notEqual(createdDoc.password, rawPassword, 'Plaintext password must never be stored');
      assert.ok(createdDoc.password.startsWith('$2'), 'Stored password must be a bcrypt hash');
      const isHashValid = await bcrypt.compare(rawPassword, createdDoc.password);
      assert.equal(isHashValid, true, 'Stored bcrypt hash must verify against original password');
    });

    test('returns 400 Bad Request on input validation failure', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'ab', // too short (< 3 chars)
          email: 'not-an-email',
          password: '123' // too short (< 6 chars)
        })
      });

      assert.equal(response.status, 400);
      const body = await response.json();

      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
      assert.ok(body.error.message);
      assert.equal(body.error.details, null);
    });

    test('returns 409 Conflict when email is already registered', async () => {
      mock.method(User, 'findOne', async () => ({
        _id: 'existing_id',
        email: 'duplicate@example.com',
        username: 'other_user'
      }));

      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'new_unique_name',
          email: 'duplicate@example.com',
          password: 'ValidPassword123'
        })
      });

      assert.equal(response.status, 409);
      const body = await response.json();

      assert.equal(body.success, false);
      assert.equal(body.error.code, 'EMAIL_ALREADY_EXISTS');
      assert.ok(body.error.message.includes('already exists'));
    });

    test('returns 409 Conflict when username is already taken', async () => {
      mock.method(User, 'findOne', async () => ({
        _id: 'existing_id',
        email: 'different@example.com',
        username: 'existing_username'
      }));

      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'existing_username',
          email: 'new_email@example.com',
          password: 'ValidPassword123'
        })
      });

      assert.equal(response.status, 409);
      const body = await response.json();

      assert.equal(body.success, false);
      assert.equal(body.error.code, 'USERNAME_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    test('successfully authenticates with valid credentials returning signed JWT', async () => {
      const plainPassword = 'CorrectPassword456!';
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      mock.method(User, 'findOne', async () => ({
        _id: '507f1f77bcf86cd799439022',
        username: 'login_tester',
        email: 'tester@example.com',
        password: passwordHash,
        totalXp: 120,
        level: 2,
        role: 'user'
      }));

      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tester@example.com',
          password: plainPassword
        })
      });

      assert.equal(response.status, 200);
      const body = await response.json();

      assert.equal(body.success, true);
      assert.ok(body.data, 'Response must provide data envelope');
      assert.ok(body.data.token, 'data envelope must provide signed JWT');
      assert.equal(body.token, undefined, 'Redundant top-level token must not be present');
      assert.equal(body.user, undefined, 'Redundant top-level user must not be present');
      const user = body.data.user;
      assert.equal(user.username, 'login_tester');
      assert.equal(user.email, 'tester@example.com');
      assert.equal(user.totalXp, 120);
      assert.equal(user.level, 2);

      // Verify no password hash or secrets are returned
      assert.equal(user.password, undefined);
      const rawText = JSON.stringify(body);
      assert.ok(!rawText.includes(passwordHash));
    });

    test('returns generic 401 error for incorrect password without leaking specifics', async () => {
      const correctHash = await bcrypt.hash('RealPassword!', 10);

      mock.method(User, 'findOne', async () => ({
        _id: '507f1f77bcf86cd799439022',
        email: 'tester@example.com',
        password: correctHash
      }));

      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tester@example.com',
          password: 'WrongPasswordGuess!'
        })
      });

      assert.equal(response.status, 401);
      const body = await response.json();

      assert.equal(body.success, false);
      assert.equal(body.error.code, 'INVALID_CREDENTIALS');
      assert.equal(body.error.message, 'Invalid email or password.');
    });

    test('returns generic 401 error for non-existent email preventing user enumeration', async () => {
      mock.method(User, 'findOne', async () => null);

      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'does_not_exist@example.com',
          password: 'AnyPassword123!'
        })
      });

      assert.equal(response.status, 401);
      const body = await response.json();

      assert.equal(body.success, false);
      assert.equal(body.error.code, 'INVALID_CREDENTIALS');
      // Identical error message prevents account enumeration
      assert.equal(body.error.message, 'Invalid email or password.');
    });

    test('returns 400 Bad Request when login body is malformed', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: ''
        })
      });

      assert.equal(response.status, 400);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('retrieves user profile when presented with a valid Bearer token', async () => {
      const userId = '507f1f77bcf86cd799439033';
      const token = signToken({
        id: userId,
        username: 'verified_learner',
        email: 'verified@example.com',
        role: 'user'
      });

      mock.method(User, 'findById', () => ({
        select: async () => ({
          _id: userId,
          username: 'verified_learner',
          email: 'verified@example.com',
          totalXp: 450,
          level: 4,
          currentStreak: 5,
          role: 'user',
          toSafeObject() {
            return {
              id: userId,
              username: 'verified_learner',
              email: 'verified@example.com',
              totalXp: 450,
              level: 4,
              currentStreak: 5,
              role: 'user'
            };
          }
        })
      }));

      const response = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      assert.equal(response.status, 200);
      const body = await response.json();

      assert.equal(body.success, true);
      assert.ok(body.data, 'Response must provide data envelope');
      assert.equal(body.user, undefined, 'Redundant top-level user must not be present');
      const profile = body.data;
      assert.equal(profile.id, userId);
      assert.equal(profile.username, 'verified_learner');
      assert.equal(profile.email, 'verified@example.com');
      assert.equal(profile.totalXp, 450);
      assert.equal(profile.level, 4);

      // Must never leak passwords or hashes
      assert.equal(profile.password, undefined);
      assert.equal(profile.passwordHash, undefined);
    });

    test('rejects request with missing Authorization header', async () => {
      const response = await fetch(`${baseUrl}/api/auth/profile`);

      assert.equal(response.status, 401);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('rejects request with malformed Authorization header (missing Bearer prefix)', async () => {
      const response = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { Authorization: 'Token xyz123' }
      });

      assert.equal(response.status, 401);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'UNAUTHORIZED');
    });

    test('rejects request with invalid or tampered token', async () => {
      const response = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { Authorization: 'Bearer this.is.an.invalid.token' }
      });

      assert.equal(response.status, 401);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'INVALID_TOKEN');
    });

    test('rejects request with expired token and issues TOKEN_EXPIRED error code', async () => {
      const expiredToken = signToken(
        { id: 'user_expired', username: 'expired' },
        { expiresIn: '0s' }
      );

      const response = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });

      assert.equal(response.status, 401);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'TOKEN_EXPIRED');
    });

    test('returns 500 DATABASE_ERROR when profile database query fails and does not fallback to JWT claims', async () => {
      const userId = '507f1f77bcf86cd799439055';
      const token = signToken({
        id: userId,
        username: 'db_failure_user',
        email: 'fail@example.com',
        role: 'user'
      });

      // Simulate a raw MongoDB query exception (e.g. socket timeout, network disconnection)
      mock.method(User, 'findById', () => {
        throw new Error('MongoNetworkTimeoutException: connection closed by remote peer');
      });

      const response = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      assert.equal(response.status, 500);
      const body = await response.json();

      assert.equal(body.success, false);
      assert.equal(body.error.code, 'DATABASE_ERROR');
      assert.equal(body.error.message, 'Unable to retrieve user profile due to a database error.');
      // Must not leak the fallback user profile
      assert.equal(body.user, undefined);
      assert.equal(body.data, undefined);
      // Must not leak raw database error details to client
      assert.equal(body.error.details, null);
      const rawBody = JSON.stringify(body);
      assert.ok(!rawBody.includes('MongoNetworkTimeoutException'), 'Raw database error details must not leak in response');
    });

    test('returns 404 USER_NOT_FOUND when user does not exist in the database', async () => {
      const userId = '507f1f77bcf86cd799439066';
      const token = signToken({
        id: userId,
        username: 'nonexistent_user',
        email: 'nonexistent@example.com',
        role: 'user'
      });

      // User.findById returns query object resolving to null
      mock.method(User, 'findById', () => ({
        select: async () => null
      }));

      const response = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      assert.equal(response.status, 404);
      const body = await response.json();

      assert.equal(body.success, false);
      assert.equal(body.error.code, 'USER_NOT_FOUND');
      assert.equal(body.error.message, 'User not found.');
      assert.equal(body.user, undefined);
      assert.equal(body.data, undefined);
    });

    test('rejects request with token signed with disallowed algorithm', async () => {
      const disallowedToken = jwt.sign(
        { id: 'user_disallowed_alg', username: 'disallowed' },
        getJwtSecret(),
        { algorithm: 'HS512', issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
      );

      const response = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${disallowedToken}` }
      });

      assert.equal(response.status, 401);
      const body = await response.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'INVALID_TOKEN');
    });

    test('rejects request with token having invalid issuer or audience', async () => {
      const badIssuerToken = jwt.sign(
        { id: 'user_bad_iss', username: 'bad_iss' },
        getJwtSecret(),
        { algorithm: JWT_ALGORITHM, issuer: 'unauthorized-issuer', audience: JWT_AUDIENCE }
      );

      const resBadIss = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${badIssuerToken}` }
      });
      assert.equal(resBadIss.status, 401);
      const bodyBadIss = await resBadIss.json();
      assert.equal(bodyBadIss.error.code, 'INVALID_TOKEN');

      const badAudToken = jwt.sign(
        { id: 'user_bad_aud', username: 'bad_aud' },
        getJwtSecret(),
        { algorithm: JWT_ALGORITHM, issuer: JWT_ISSUER, audience: 'unauthorized-audience' }
      );

      const resBadAud = await fetch(`${baseUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${badAudToken}` }
      });
      assert.equal(resBadAud.status, 401);
      const bodyBadAud = await resBadAud.json();
      assert.equal(bodyBadAud.error.code, 'INVALID_TOKEN');
    });
  });
});
