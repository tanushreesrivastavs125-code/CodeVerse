import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDatabase, _resetDatabaseStateForTesting } from '../src/config/database.js';

describe('Health Endpoint Contract & Observability', () => {
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
    _resetDatabaseStateForTesting();
  });

  test('GET /api/health reports database as disconnected when offline', async () => {
    const originalReadyState = mongoose.connection.readyState;
    try {
      Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });
      _resetDatabaseStateForTesting();

      const response = await fetch(`${baseUrl}/api/health`);
      assert.equal(response.status, 200);

      const body = await response.json();
      assert.equal(body.status, 'ok');
      assert.equal(body.service, 'CodeVerse API Gateway');
      assert.equal(body.database, 'disconnected');
      assert.ok(typeof body.uptime === 'number');
      assert.ok(body.timestamp);
    } finally {
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    }
  });

  test('GET /api/health reports database as connected when Mongoose is active', async () => {
    const originalReadyState = mongoose.connection.readyState;
    try {
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

      const response = await fetch(`${baseUrl}/api/health`);
      assert.equal(response.status, 200);

      const body = await response.json();
      assert.equal(body.status, 'ok');
      assert.equal(body.database, 'connected');
    } finally {
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    }
  });

  test('GET /api/health reports database error state when connection fails', async () => {
    const originalReadyState = mongoose.connection.readyState;
    try {
      Object.defineProperty(mongoose.connection, 'readyState', {
        get: () => 0,
        set: () => {},
        configurable: true
      });

      // Trigger a connection error with missing or invalid parameters
      try {
        await connectDatabase('');
      } catch {
        // Expected failure
      }

      const response = await fetch(`${baseUrl}/api/health`);
      assert.equal(response.status, 200);

      const body = await response.json();
      assert.equal(body.status, 'ok');
      assert.equal(body.database, 'error');
    } finally {
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
      _resetDatabaseStateForTesting();
    }
  });

  test('GET /api/health never exposes database credentials or internal infrastructure paths', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const rawText = await response.text();

    assert.ok(!rawText.includes('mongodb://'), 'Raw MongoDB connection string must not be exposed');
    assert.ok(!rawText.includes('mongodb+srv://'), 'MongoDB SRV connection string must not be exposed');
    assert.ok(!rawText.includes('password'), 'Password keyword must not be exposed');
    assert.ok(!rawText.includes('stack'), 'Stack trace must not be exposed');
  });
});
