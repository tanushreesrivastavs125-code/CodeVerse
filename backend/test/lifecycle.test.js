import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, shutdown, unregisterShutdownHandlers } from '../src/server.js';
import { _resetDatabaseStateForTesting, getDatabaseStatus } from '../src/config/database.js';

describe('Application Lifecycle & Graceful Shutdown', () => {
  let activeServer;

  afterEach(async () => {
    if (activeServer && activeServer.listening) {
      if (typeof activeServer.closeAllConnections === 'function') {
        activeServer.closeAllConnections();
      }
      await new Promise((resolve) => activeServer.close(resolve));
    }
    unregisterShutdownHandlers();
    _resetDatabaseStateForTesting();
    activeServer = null;
  });

  test('startServer deterministically binds HTTP server on dynamic port', async () => {
    activeServer = await startServer(0, { skipDatabase: true });

    assert.ok(activeServer, 'Server instance should be returned');
    assert.ok(activeServer.listening, 'Server should be listening');

    const port = activeServer.address().port;
    assert.ok(port > 0, 'Port must be a positive integer');

    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.status, 'ok');
  });

  test('startServer starts successfully in degraded mode when MongoDB is unavailable', async () => {
    // Attempt database connection with very low timeout against unreachable port to simulate MongoDB outage
    activeServer = await startServer(0, {
      dbOptions: { serverSelectionTimeoutMS: 50 }
    });

    assert.ok(activeServer.listening, 'Server should start and listen despite MongoDB connection failure');

    const port = activeServer.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.database, 'error');

    const dbStatus = getDatabaseStatus();
    assert.equal(dbStatus.connected, false);
    assert.equal(dbStatus.state, 'error');
  });

  test('shutdown closes HTTP connections cleanly without exiting process during test', async () => {
    activeServer = await startServer(0, { skipDatabase: true });
    assert.ok(activeServer.listening);

    await shutdown(activeServer, 'SIGTERM', { exitProcess: false, timeoutMs: 1000 });

    assert.equal(activeServer.listening, false, 'Server should no longer be listening');
  });

  test('shutdown is safe and idempotent when called multiple times', async () => {
    activeServer = await startServer(0, { skipDatabase: true });

    await shutdown(activeServer, 'SIGINT', { exitProcess: false, timeoutMs: 1000 });
    // Second concurrent/subsequent invocation must not throw
    await assert.doesNotReject(() =>
      shutdown(activeServer, 'SIGINT', { exitProcess: false, timeoutMs: 1000 })
    );

    assert.equal(activeServer.listening, false);
  });
});
