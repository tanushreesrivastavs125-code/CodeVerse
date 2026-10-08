import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

/**
 * Custom error class for invalid or missing configuration values.
 */
export class ConfigurationError extends Error {
  constructor(message) {
    super(`[ConfigurationError] ${message}`);
    this.name = 'ConfigurationError';
  }
}

const VALID_NODE_ENVS = ['development', 'production', 'test'];

/**
 * Validates and normalizes raw environment variables.
 *
 * @param {Record<string, string | undefined>} rawEnv - Environment variables source (defaults to process.env)
 * @returns {{
 *   port: number,
 *   nodeEnv: 'development' | 'production' | 'test',
 *   corsOrigin: string,
 *   mongoUri: string,
 *   jwtSecret: string | undefined,
 *   jwtExpiresIn: string
 * }}
 */
export function validateConfig(rawEnv = process.env) {
  const errors = [];

  // 1. NODE_ENV validation
  const rawNodeEnv = rawEnv.NODE_ENV || 'development';
  if (!VALID_NODE_ENVS.includes(rawNodeEnv)) {
    errors.push(
      `Invalid NODE_ENV "${rawNodeEnv}". Allowed values are: ${VALID_NODE_ENVS.join(', ')}.`
    );
  }
  const nodeEnv = rawNodeEnv;

  // 2. PORT validation
  let port = 5000;
  if (rawEnv.PORT !== undefined && rawEnv.PORT !== '') {
    const parsedPort = Number(rawEnv.PORT);
    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      errors.push(
        `Invalid PORT "${rawEnv.PORT}". Must be an integer between 1 and 65535.`
      );
    } else {
      port = parsedPort;
    }
  }

  // 3. CORS_ORIGIN validation
  let corsOrigin = 'http://localhost:5173';
  if (rawEnv.CORS_ORIGIN !== undefined) {
    const trimmed = rawEnv.CORS_ORIGIN.trim();
    if (trimmed.length === 0) {
      errors.push('Invalid CORS_ORIGIN: cannot be an empty string.');
    } else {
      corsOrigin = trimmed;
    }
  }

  // 4. MONGODB_URI validation
  let mongoUri;
  const rawMongoUri = rawEnv.MONGODB_URI;

  if (nodeEnv === 'production') {
    if (!rawMongoUri || rawMongoUri.trim().length === 0) {
      errors.push(
        'MONGODB_URI is required in production environment. A valid MongoDB connection string must be provided.'
      );
    }
  }

  if (rawMongoUri && rawMongoUri.trim().length > 0) {
    const trimmedUri = rawMongoUri.trim();
    if (!trimmedUri.startsWith('mongodb://') && !trimmedUri.startsWith('mongodb+srv://')) {
      errors.push(
        'Invalid MONGODB_URI. Connection string must start with "mongodb://" or "mongodb+srv://".'
      );
    } else {
      mongoUri = trimmedUri;
    }
  } else if (nodeEnv !== 'production') {
    // Sensible development and test default
    mongoUri = 'mongodb://localhost:27017/codeverse';
  }

  if (errors.length > 0) {
    throw new ConfigurationError(`Environment validation failed:\n  - ${errors.join('\n  - ')}`);
  }

  // Optional JWT settings preserved for downstream auth milestones
  const jwtSecret = rawEnv.JWT_SECRET || (nodeEnv === 'production' ? undefined : 'dev_secret_key_for_local_development_only_replace_in_prod');
  const jwtExpiresIn = rawEnv.JWT_EXPIRES_IN || '24h';

  return {
    port,
    nodeEnv,
    corsOrigin,
    mongoUri,
    jwtSecret,
    jwtExpiresIn
  };
}

export const config = validateConfig(process.env);
