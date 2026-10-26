import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, shutdown, unregisterShutdownHandlers } from '../src/server.js';
import { _resetDatabaseStateForTesting, getDatabaseStatus } from '../src/config/database.js';
import { ConfigurationError } from '../src/config/env.js';
import { INSECURE_DEV_SECRET } from '../src/config/jwt.js';

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

  test('startServer fails fast in production when JWT_SECRET is missing, weak, or the dev secret', async () => {
    // 1. Missing / undefined secret in production
    await assert.rejects(
      async () => {
        await startServer(0, {
          skipDatabase: true,
          nodeEnv: 'production',
          jwtSecret: undefined
        });
      },
      (err) => {
        assert.ok(err instanceof ConfigurationError);
        assert.ok(err.message.includes('JWT_SECRET is required in production environment'));
        return true;
      }
    );

    // 2. Insecure dev secret in production
    await assert.rejects(
      async () => {
        await startServer(0, {
          skipDatabase: true,
          nodeEnv: 'production',
          jwtSecret: INSECURE_DEV_SECRET
        });
      },
      (err) => {
        assert.ok(err instanceof ConfigurationError);
        assert.ok(err.message.includes('secure, custom JWT_SECRET (minimum 32 characters)'));
        return true;
      }
    );

    // 3. Weak secret under 32 characters in production
    await assert.rejects(
      async () => {
        await startServer(0, {
          skipDatabase: true,
          nodeEnv: 'production',
          jwtSecret: 'too_short_secret_for_production'
        });
      },
      (err) => {
        assert.ok(err instanceof ConfigurationError);
        assert.ok(err.message.includes('secure, custom JWT_SECRET (minimum 32 characters)'));
        return true;
      }
    );
  });

  test('startServer starts successfully in production when provided a valid, strong JWT secret', async () => {
    const strongProdSecret = 'super_strong_production_jwt_secret_with_over_32_characters!';
    activeServer = await startServer(0, {
      skipDatabase: true,
      nodeEnv: 'production',
      jwtSecret: strongProdSecret
    });

    assert.ok(activeServer, 'Server instance should be created');
    assert.ok(activeServer.listening, 'Server should be listening in production with valid JWT secret');
  });
});
