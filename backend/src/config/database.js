import mongoose from 'mongoose';
import { config } from './env.js';

let connectionPromise = null;
let lastConnectionError = null;
let listenersAttached = false;

// Matches credentials in standard and srv MongoDB URIs, even when embedded in error messages
const MONGO_CREDENTIALS_REGEX = /(mongodb(?:\+srv)?:\/\/(?:[^\s:@/]+)?:)[^\s/]+@(?=[a-zA-Z0-9]|\[)/gi;

/**
 * Sanitizes a MongoDB connection URI or any string containing connection strings
 * by redacting passwords so credentials are never exposed or logged.
 *
 * @param {string} [uri]
 * @returns {string} Sanitized URI string with redacted credentials
 */
export function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return '';
  }
  return uri.replace(MONGO_CREDENTIALS_REGEX, '$1****@');
}

/**
 * Sanitizes an Error instance or error message string by removing any sensitive
 * MongoDB connection credentials while preserving actionable operational error details.
 *
 * @param {Error | string} [error]
 * @returns {string} Safe diagnostic message
 */
export function sanitizeErrorMessage(error) {
  if (!error) {
    return 'Unknown error';
  }
  const rawMessage = typeof error === 'string' ? error : (error.message || String(error));
  return sanitizeMongoUri(rawMessage);
}

/**
 * Attaches Mongoose lifecycle event listeners once to observe connection changes.
 */
function attachLifecycleListeners() {
  if (listenersAttached) {
    return;
  }

  mongoose.connection.on('connected', () => {
    lastConnectionError = null;
    console.log('[Database] MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    lastConnectionError = err;
    console.warn(`[Database] MongoDB connection error: ${sanitizeErrorMessage(err)}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    lastConnectionError = null;
    console.log('[Database] MongoDB reconnected.');
  });

  listenersAttached = true;
}

/**
 * Connects to MongoDB via Mongoose.
 * Prevents multiple concurrent connection attempts.
 *
 * @param {string} [uri] - Target MongoDB URI (defaults to config.mongoUri)
 * @param {import('mongoose').ConnectOptions} [options] - Additional Mongoose connection options
 * @returns {Promise<typeof mongoose>}
 */
export async function connectDatabase(uri = config.mongoUri, options = {}) {
  if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
    const error = new Error('MONGODB_URI is required for database connection.');
    lastConnectionError = error;
    throw error;
  }

  // Already fully connected
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // Connection already in-flight: return existing promise to prevent duplicate connections
  if (connectionPromise) {
    return connectionPromise;
  }

  attachLifecycleListeners();
  lastConnectionError = null;

  const connectionOptions = {
    serverSelectionTimeoutMS: 3000,
    ...options
  };

  console.log('[Database] Initiating connection to MongoDB...');

  connectionPromise = mongoose.connect(uri, connectionOptions)
    .then((m) => {
      lastConnectionError = null;
      return m;
    })
    .catch((error) => {
      lastConnectionError = error;
      console.warn(`[Database] MongoDB connection attempt failed: ${sanitizeErrorMessage(error)}`);
      throw error;
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
}

/**
 * Disconnects cleanly from MongoDB if a connection is currently open or establishing.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      lastConnectionError = null;
      console.log('[Database] MongoDB connection closed cleanly.');
    } catch (error) {
      console.warn(`[Database] Error during MongoDB disconnect: ${sanitizeErrorMessage(error)}`);
    }
  }
  connectionPromise = null;
}

/**
 * Returns current database connection state.
 *
 * @returns {{
 *   state: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'error',
 *   connected: boolean
 * }}
 */
export function getDatabaseStatus() {
  const readyState = mongoose.connection.readyState;

  let state = 'disconnected';
  if (readyState === 1) {
    state = 'connected';
  } else if (readyState === 2) {
    state = 'connecting';
  } else if (readyState === 3) {
    state = 'disconnecting';
  } else if (lastConnectionError && readyState === 0) {
    state = 'error';
  } else {
    state = 'disconnected';
  }

  return {
    state,
    connected: readyState === 1
  };
}

/**
 * Resets internal module state for isolated unit testing.
 * @private
 */
export function _resetDatabaseStateForTesting() {
  connectionPromise = null;
  lastConnectionError = null;
}

// Backward-compatibility aliases
export const connectDB = connectDatabase;
export const disconnectDB = disconnectDatabase;
export const getDBStatus = getDatabaseStatus;
