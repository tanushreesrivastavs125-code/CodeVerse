import jwt from 'jsonwebtoken';
import { config, ConfigurationError } from './env.js';

export const INSECURE_DEV_SECRET = 'dev_secret_key_for_local_development_only_replace_in_prod';
export const MIN_JWT_SECRET_LENGTH = 32;
export const JWT_ALGORITHM = 'HS256';
export const JWT_ISSUER = 'codeverse';
export const JWT_AUDIENCE = 'codeverse-client';

/**
 * Validates JWT configuration for startup or runtime usage.
 * Fails fast in production if JWT_SECRET is missing, weak (< 32 chars), or matches the insecure dev secret.
 * Error messages are strictly sanitized and never echo secrets or raw environment values.
 *
 * @param {string} [customSecret] - Optional secret override (defaults to config.jwtSecret)
 * @param {string} [customNodeEnv] - Optional environment override (defaults to config.nodeEnv)
 * @returns {string} Validated JWT secret
 */
export function validateJwtConfig(customSecret, customNodeEnv) {
  const nodeEnv = customNodeEnv !== undefined ? customNodeEnv : config.nodeEnv;
  const isProduction = nodeEnv === 'production';
  const secret = customSecret !== undefined
    ? customSecret
    : (isProduction && config.nodeEnv !== 'production' ? undefined : config.jwtSecret);

  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    if (isProduction) {
      throw new ConfigurationError('JWT_SECRET is required in production environment.');
    }
    throw new ConfigurationError('JWT_SECRET must be configured.');
  }

  const trimmed = secret.trim();

  if (isProduction) {
    if (
      trimmed === INSECURE_DEV_SECRET ||
      trimmed.includes('dev_secret') ||
      trimmed.length < MIN_JWT_SECRET_LENGTH
    ) {
      throw new ConfigurationError('Production environment requires a secure, custom JWT_SECRET (minimum 32 characters).');
    }
  }

  return trimmed;
}

/**
 * Returns the validated JWT secret key.
 *
 * @param {string} [customSecret] - Optional override for testing
 * @param {string} [customNodeEnv] - Optional environment override for testing
 * @returns {string} The validated JWT secret
 */
export function getJwtSecret(customSecret, customNodeEnv) {
  return validateJwtConfig(
    customSecret !== undefined ? customSecret : config.jwtSecret,
    customNodeEnv !== undefined ? customNodeEnv : config.nodeEnv
  );
}

/**
 * Signs a JWT token with the application secret, configured algorithm, issuer, and audience.
 * Security policy (signing secret, algorithm, issuer, and audience) cannot be overridden by callers.
 *
 * @param {object} payload - Claims to embed in token
 * @param {object} [options] - Signing options (e.g., expiresIn)
 * @returns {string} Signed JWT string
 */
export function signToken(payload, options = {}) {
  const secret = getJwtSecret();
  const expiresIn = options.expiresIn || config.jwtExpiresIn || '24h';

  const signingOptions = { ...options };
  delete signingOptions.secret;
  delete signingOptions.algorithm;
  delete signingOptions.issuer;
  delete signingOptions.audience;

  return jwt.sign(payload, secret, {
    ...signingOptions,
    expiresIn,
    algorithm: JWT_ALGORITHM,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });
}

/**
 * Verifies and decodes a JWT token, explicitly restricting verification to
 * the server's validated secret, the intended signing algorithm (HS256), and validating issuer and audience.
 * Security policy (verification secret, algorithm, issuer, audience, and expiration/time checks) cannot be bypassed or overridden by callers.
 *
 * @param {string} token - Bearer JWT string
 * @param {object} [options] - Verification options override
 * @returns {object} Decoded token payload
 */
export function verifyToken(token, options = {}) {
  const secret = getJwtSecret();
  const verifyOptions = { ...options };
  delete verifyOptions.secret;
  delete verifyOptions.algorithms;
  delete verifyOptions.algorithm;
  delete verifyOptions.issuer;
  delete verifyOptions.audience;
  delete verifyOptions.ignoreExpiration;
  delete verifyOptions.ignoreNotBefore;
  delete verifyOptions.clockTimestamp;
  delete verifyOptions.clockTolerance;
  delete verifyOptions.maxAge;

  return jwt.verify(token, secret, {
    ...verifyOptions,
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    ignoreExpiration: false,
    ignoreNotBefore: false
  });
}


