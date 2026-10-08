import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

/**
 * Initiates connection to MongoDB.
 * Non-blocking: failures log a warning instead of crashing the process,
 * allowing the server to service basic health probes in offline mode.
 */
export async function connectDB() {
  if (isConnected) {
    return;
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[Database] MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.warn(`[Database] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database] MongoDB disconnected.');
  });

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2500
    });
    isConnected = true;
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] Initial MongoDB connection unsuccessful (${error.message}). Running in offline/degraded mode.`);
  }
}

/**
 * Closes the MongoDB connection gracefully.
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB connection closed.');
  }
}

/**
 * Returns the current database connection status.
 */
export function getDBStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateStr = states[mongoose.connection.readyState] || 'unknown';
  return {
    state: stateStr,
    connected: isConnected && mongoose.connection.readyState === 1
  };
}
