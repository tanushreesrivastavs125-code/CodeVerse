import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  signToken,
  verifyToken,
  getJwtSecret,
  validateJwtConfig,
  INSECURE_DEV_SECRET,
  JWT_ALGORITHM,
  JWT_ISSUER,
  JWT_AUDIENCE
} from '../../src/config/jwt.js';
import { ConfigurationError } from '../../src/config/env.js';

describe('JWT Utilities & Configuration Security', () => {
  test('signToken generates valid JWT and verifyToken decodes standard claims', () => {
    const payload = {
      id: '507f1f77bcf86cd799439011',
      username: 'jwt_learner',
      role: 'user'
    };

    const token = signToken(payload, { expiresIn: '1h' });
    assert.equal(typeof token, 'string');
    assert.ok(token.split('.').length === 3, 'JWT must contain header, payload, and signature sections');

    const decoded = verifyToken(token);
    assert.equal(decoded.id, payload.id);
    assert.equal(decoded.username, payload.username);
    assert.equal(decoded.role, 'user');
    assert.equal(decoded.iss, JWT_ISSUER, 'Token issuer must match canonical codeverse issuer');
    assert.equal(decoded.aud, JWT_AUDIENCE, 'Token audience must match canonical codeverse audience');
    assert.ok(decoded.exp);
  });

  test('verifyToken throws on tampered token payload', () => {
    const token = signToken({ id: 'user_123', role: 'user' });
    const parts = token.split('.');
    // Tamper payload segment
    const tamperedPayload = Buffer.from(JSON.stringify({ id: 'user_123', role: 'admin' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    assert.throws(
      () => verifyToken(tamperedToken),
      (err) => err.name === 'JsonWebTokenError'
    );
  });

  test('verifyToken throws TokenExpiredError on expired tokens', () => {
    // Generate token with immediate expiration
    const expiredToken = signToken({ id: 'expired_user' }, { expiresIn: '0s' });

    assert.throws(
      () => verifyToken(expiredToken),
      (err) => err.name === 'TokenExpiredError'
    );
  });

  test('getJwtSecret rejects empty or whitespace-only secret keys', () => {
    assert.throws(
      () => getJwtSecret(''),
      (err) => err instanceof ConfigurationError && err.message.includes('JWT_SECRET must be configured')
    );
    assert.throws(
      () => getJwtSecret('   '),
      (err) => err instanceof ConfigurationError && err.message.includes('JWT_SECRET must be configured')
    );
  });

  test('validateJwtConfig rejects missing, weak, or dev secrets in production', () => {
    // 1. Missing or undefined secret in production
    assert.throws(
      () => validateJwtConfig(undefined, 'production'),
      (err) => err instanceof ConfigurationError && err.message.includes('JWT_SECRET is required in production environment')
    );

    // 2. Empty or whitespace secret in production
    assert.throws(
      () => validateJwtConfig('   ', 'production'),
      (err) => err instanceof ConfigurationError && err.message.includes('JWT_SECRET is required in production environment')
    );

    // 3. Known development secret in production
    assert.throws(
      () => validateJwtConfig(INSECURE_DEV_SECRET, 'production'),
      (err) => err instanceof ConfigurationError && err.message.includes('secure, custom JWT_SECRET (minimum 32 characters)')
    );

    // 4. Secret containing "dev_secret" substring in production
    assert.throws(
      () => validateJwtConfig('custom_dev_secret_that_is_at_least_32_characters_long', 'production'),
      (err) => err instanceof ConfigurationError && err.message.includes('secure, custom JWT_SECRET (minimum 32 characters)')
    );

    // 5. Weak secret under 32 characters in production
    assert.throws(
      () => validateJwtConfig('short_secret_under_32_chars', 'production'),
      (err) => err instanceof ConfigurationError && err.message.includes('secure, custom JWT_SECRET (minimum 32 characters)')
    );

    // 6. Valid production secret passes and returns trimmed value
    const strongSecret = 'super_secure_production_secret_key_at_least_32_bytes!';
    const validated = validateJwtConfig(strongSecret, 'production');
    assert.equal(validated, strongSecret);
  });

  test('validateJwtConfig error messages never leak secret values', () => {
    const sensitiveCandidate = 'weak_short_secret_never_leak';
    assert.throws(
      () => validateJwtConfig(sensitiveCandidate, 'production'),
      (err) => {
        assert.ok(err instanceof ConfigurationError);
        assert.ok(!err.message.includes(sensitiveCandidate), 'Error message must never echo the secret candidate');
        return true;
      }
    );
  });

  test('verifyToken restricts verification to the intended signing algorithm (HS256)', () => {
    const secret = getJwtSecret();
    const payload = { id: 'user_alg_test', username: 'alg_tester' };

    // Sign with HS512 (disallowed algorithm)
    const tokenHs512 = jwt.sign(payload, secret, {
      algorithm: 'HS512',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    assert.throws(
      () => verifyToken(tokenHs512),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('invalid algorithm')
    );
  });

  test('verifyToken rejects tokens with invalid issuer', () => {
    const secret = getJwtSecret();
    const token = jwt.sign({ id: 'user_iss_test' }, secret, {
      algorithm: JWT_ALGORITHM,
      issuer: 'untrusted-rogue-issuer',
      audience: JWT_AUDIENCE
    });

    assert.throws(
      () => verifyToken(token),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('jwt issuer invalid')
    );
  });

  test('verifyToken rejects tokens with invalid audience', () => {
    const secret = getJwtSecret();
    const token = jwt.sign({ id: 'user_aud_test' }, secret, {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: 'rogue-client-service'
    });

    assert.throws(
      () => verifyToken(token),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('jwt audience invalid')
    );
  });

  test('signToken ignores caller attempts to override algorithm, issuer, or audience', () => {
    const payload = { id: 'user_override_test', username: 'override_tester' };
    const token = signToken(payload, {
      algorithm: 'HS512',
      issuer: 'malicious-issuer',
      audience: 'malicious-audience'
    });

    // Inspect decoded token header and payload
    const decoded = jwt.decode(token, { complete: true });
    assert.equal(decoded.header.alg, JWT_ALGORITHM, 'Algorithm must strictly remain HS256');
    assert.equal(decoded.payload.iss, JWT_ISSUER, 'Issuer must strictly remain codeverse');
    assert.equal(decoded.payload.aud, JWT_AUDIENCE, 'Audience must strictly remain codeverse-client');

    // Verify token resolves successfully under canonical policy
    const verified = verifyToken(token);
    assert.equal(verified.id, payload.id);
  });

  test('verifyToken ignores caller attempts to override algorithms allowlist, issuer, or audience', () => {
    const secret = getJwtSecret();
    const payload = { id: 'user_bypass_test', username: 'bypass_tester' };

    // 1. Attempt to bypass algorithm restriction by supplying algorithms allowlist to verifyToken
    const forgedTokenHs512 = jwt.sign(payload, secret, {
      algorithm: 'HS512',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    assert.throws(
      () => verifyToken(forgedTokenHs512, { algorithms: ['HS512', 'HS256'] }),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('invalid algorithm')
    );

    // 2. Attempt to bypass issuer validation by passing custom issuer to verifyToken
    const forgedIssuerToken = jwt.sign(payload, secret, {
      algorithm: JWT_ALGORITHM,
      issuer: 'rogue-issuer',
      audience: JWT_AUDIENCE
    });

    assert.throws(
      () => verifyToken(forgedIssuerToken, { issuer: 'rogue-issuer' }),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('jwt issuer invalid')
    );

    // 3. Attempt to bypass audience validation by passing custom audience to verifyToken
    const forgedAudToken = jwt.sign(payload, secret, {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: 'rogue-audience'
    });

    assert.throws(
      () => verifyToken(forgedAudToken, { audience: 'rogue-audience' }),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('jwt audience invalid')
    );
  });

  test('verifyToken rejects expired tokens even if caller passes ignoreExpiration: true', () => {
    const expiredToken = signToken({ id: 'user_ignore_exp' }, { expiresIn: '0s' });

    assert.throws(
      () => verifyToken(expiredToken, { ignoreExpiration: true }),
      (err) => err.name === 'TokenExpiredError'
    );
  });

  test('verifyToken rejects expired tokens even if caller passes manipulated clockTimestamp', () => {
    const expiredToken = signToken({ id: 'user_clock_timestamp' }, { expiresIn: '0s' });

    assert.throws(
      () => verifyToken(expiredToken, { clockTimestamp: 0 }),
      (err) => err.name === 'TokenExpiredError'
    );
  });

  test('verifyToken rejects expired tokens even if caller passes clockTolerance override', () => {
    const expiredToken = signToken({ id: 'user_clock_tolerance' }, { expiresIn: '0s' });

    assert.throws(
      () => verifyToken(expiredToken, { clockTolerance: 10000000 }),
      (err) => err.name === 'TokenExpiredError'
    );
  });

  test('verifyToken rejects tokens with future nbf even if caller passes ignoreNotBefore: true', () => {
    const secret = getJwtSecret();
    const futureToken = jwt.sign(
      { id: 'user_future_nbf' },
      secret,
      {
        algorithm: JWT_ALGORITHM,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        notBefore: '1h'
      }
    );
    assert.throws(
      () => verifyToken(futureToken, { ignoreNotBefore: true }),
      (err) => err.name === 'NotBeforeError'
    );
  });

  test('signToken ignores caller attempts to override JWT signing secret', () => {
    const rogueSecret = 'rogue_secret_that_is_long_enough_32_characters_12345';
    const payload = { id: 'user_secret_override', username: 'secret_override_tester' };

    const token = signToken(payload, { secret: rogueSecret });

    // The token must verify cleanly with verifyToken using server configuration
    const verified = verifyToken(token);
    assert.equal(verified.id, payload.id);

    // The token must verify with the configured server secret
    const serverVerified = jwt.verify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    assert.equal(serverVerified.id, payload.id);

    // The token must NOT verify with the caller-supplied rogue secret
    assert.throws(
      () => jwt.verify(token, rogueSecret, { algorithms: [JWT_ALGORITHM] }),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('invalid signature')
    );
  });

  test('verifyToken ignores caller attempts to override JWT verification secret', () => {
    const rogueSecret = 'rogue_secret_that_is_long_enough_32_characters_12345';
    const payload = { id: 'user_forged_secret', username: 'forged_user' };

    // Attacker crafts a token signed with an arbitrary rogue secret
    const rogueToken = jwt.sign(payload, rogueSecret, {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    // Caller attempts to supply the matching rogue secret to verifyToken
    assert.throws(
      () => verifyToken(rogueToken, { secret: rogueSecret }),
      (err) => err.name === 'JsonWebTokenError' && err.message.includes('invalid signature')
    );
  });
});

