import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  sanitizeMongoUri,
  sanitizeErrorMessage,
  connectDB,
  disconnectDB,
  getDBStatus,
  _resetDatabaseStateForTesting
} from '../../src/config/database.js';

describe('MongoDB Connection Module', () => {
  beforeEach(() => {
    _resetDatabaseStateForTesting();
  });

  afterEach(async () => {
    _resetDatabaseStateForTesting();
  });

  test('sanitizeMongoUri redacts password credentials while preserving host and options', () => {
    const rawUri = 'mongodb://codeverse_admin:SuperSecret123!@db.example.com:27017/codeverse?authSource=admin';
    const sanitized = sanitizeMongoUri(rawUri);

    assert.equal(
      sanitized,
      'mongodb://codeverse_admin:****@db.example.com:27017/codeverse?authSource=admin'
    );
    assert.ok(!sanitized.includes('SuperSecret123!'), 'Password must not appear in sanitized URI');
  });

  test('sanitizeMongoUri handles mongodb+srv with credentials', () => {
    const rawUri = 'mongodb+srv://cluster_user:P@ssword#99@cluster0.abc.mongodb.net/codeverse';
    const sanitized = sanitizeMongoUri(rawUri);

    assert.equal(
      sanitized,
      'mongodb+srv://cluster_user:****@cluster0.abc.mongodb.net/codeverse'
    );
    assert.ok(!sanitized.includes('P@ssword#99'), 'Password must not appear in sanitized URI');
  });

  test('sanitizeMongoUri handles passwords containing diverse URL-special characters', () => {
    const specialPasswords = [
      'P@ss!#$&*+=?',
      'Secret%20Pass#123',
      'abc:def@123$',
      '~-_!$*()'
    ];

    for (const pwd of specialPasswords) {
      const uri = `mongodb://admin:${pwd}@db.example.com:27017/codeverse`;
      const sanitized = sanitizeMongoUri(uri);
      assert.equal(sanitized, 'mongodb://admin:****@db.example.com:27017/codeverse');
      assert.ok(!sanitized.includes(pwd), `Sanitized URI must not leak password: ${pwd}`);
    }
  });

  test('sanitizeMongoUri preserves URIs without credentials', () => {
    const localUri = 'mongodb://localhost:27017/codeverse';
    assert.equal(sanitizeMongoUri(localUri), localUri);

    const srvNoAuth = 'mongodb+srv://cluster0.abc.mongodb.net/codeverse';
    assert.equal(sanitizeMongoUri(srvNoAuth), srvNoAuth);
  });

  test('sanitizeMongoUri safely returns empty string on non-string input', () => {
    assert.equal(sanitizeMongoUri(null), '');
    assert.equal(sanitizeMongoUri(undefined), '');
    assert.equal(sanitizeMongoUri(''), '');
  });

  test('sanitizeErrorMessage strips credentials from Error instances and string messages', () => {
    const secretPassword = 'SensitiveP@ssword#2026';
    const rawError = new Error(`Connection to mongodb://dbuser:${secretPassword}@cluster0.mongodb.net:27017/test timed out`);

    const sanitized = sanitizeErrorMessage(rawError);
    assert.ok(!sanitized.includes(secretPassword), 'Sanitized error message must not contain password');
    assert.ok(!sanitized.includes(`mongodb://dbuser:${secretPassword}@`), 'Raw URI must not be present');
    assert.ok(sanitized.includes('mongodb://dbuser:****@cluster0.mongodb.net:27017/test'));
    assert.ok(sanitized.includes('timed out'), 'Operational diagnostic context must be preserved');

    // Handles plain strings and non-URI errors cleanly
    assert.equal(sanitizeErrorMessage('connect ECONNREFUSED 127.0.0.1:27017'), 'connect ECONNREFUSED 127.0.0.1:27017');
    assert.equal(sanitizeErrorMessage(null), 'Unknown error');
  });

  test('database connection failure logging does not contain MongoDB credentials or raw URI', async () => {
    const secretPassword = 'SuperSecretDbPassword123!';
    const rawUriWithSecret = `mongodb://db_admin:${secretPassword}@127.0.0.1:1/codeverse_test`;

    const loggedWarnings = [];
    const originalWarn = console.warn;
    const originalLog = console.log;
    const loggedOutputs = [];

    console.warn = (...args) => {
      loggedWarnings.push(args.join(' '));
    };
    console.log = (...args) => {
      loggedOutputs.push(args.join(' '));
    };

    try {
      await connectDatabase(rawUriWithSecret, { serverSelectionTimeoutMS: 50 });
    } catch {
      // Expected connection failure
    } finally {
      console.warn = originalWarn;
      console.log = originalLog;
    }

    const allEmittedLogs = [...loggedWarnings, ...loggedOutputs].join('\n');

    assert.ok(loggedWarnings.length > 0, 'Connection failure should log a warning');
    assert.ok(!allEmittedLogs.includes(secretPassword), 'Logs must never contain MongoDB passwords');
    assert.ok(!allEmittedLogs.includes(rawUriWithSecret), 'Logs must never contain raw unredacted MongoDB URI');
    assert.ok(allEmittedLogs.includes('[Database] MongoDB connection attempt failed:'), 'Log should maintain useful operational failure context');
  });

  test('connectDatabase rejects when MONGODB_URI is missing or empty', async () => {
    await assert.rejects(
      () => connectDatabase(''),
      (err) => err.message.includes('MONGODB_URI is required')
    );

    await assert.rejects(
      () => connectDatabase(null),
      (err) => err.message.includes('MONGODB_URI is required')
    );
  });

  test('getDatabaseStatus accurately reflects disconnected state initially', () => {
    const status = getDatabaseStatus();
    assert.ok(['disconnected', 'connected'].includes(status.state));
    assert.equal(typeof status.connected, 'boolean');
  });

  test('getDatabaseStatus reflects connecting, connected, and disconnecting states', () => {
    const originalReadyState = mongoose.connection.readyState;

    try {
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
      assert.deepEqual(getDatabaseStatus(), { state: 'connected', connected: true });

      Object.defineProperty(mongoose.connection, 'readyState', { value: 2, configurable: true });
      assert.deepEqual(getDatabaseStatus(), { state: 'connecting', connected: false });

      Object.defineProperty(mongoose.connection, 'readyState', { value: 3, configurable: true });
      assert.deepEqual(getDatabaseStatus(), { state: 'disconnecting', connected: false });

      Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });
      assert.deepEqual(getDatabaseStatus(), { state: 'disconnected', connected: false });
    } finally {
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    }
  });

  test('connectDatabase returns existing connection when already connected', async () => {
    const originalReadyState = mongoose.connection.readyState;
    try {
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });
      const result = await connectDatabase('mongodb://localhost:27017/codeverse');
      assert.equal(result, mongoose);
    } finally {
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    }
  });

  test('disconnectDatabase executes cleanly when database is disconnected', async () => {
    await assert.doesNotReject(() => disconnectDatabase());
    const status = getDatabaseStatus();
    assert.equal(status.connected, false);
  });

  test('preserves backwards-compatibility aliases', () => {
    assert.equal(connectDB, connectDatabase);
    assert.equal(disconnectDB, disconnectDatabase);
    assert.equal(getDBStatus, getDatabaseStatus);
  });
});
