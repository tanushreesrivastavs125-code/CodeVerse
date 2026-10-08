import { fileURLToPath } from 'node:url';
import path from 'node:path';
import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase, sanitizeErrorMessage } from './config/database.js';

let isShuttingDown = false;
let sigintListener = null;
let sigtermListener = null;

/**
 * Executes graceful shutdown of the HTTP server and database connections.
 *
 * @param {import('http').Server} [server] - Active Node.js HTTP server instance
 * @param {string} [signal='SIGTERM'] - Process signal initiating shutdown
 * @param {{ timeoutMs?: number, exitProcess?: boolean }} [options] - Shutdown configuration options
 * @returns {Promise<void>}
 */
export async function shutdown(server, signal = 'SIGTERM', options = {}) {
  const { timeoutMs = 5000, exitProcess = true } = options;

  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  const forceTimeoutTimer = setTimeout(() => {
    console.error(`[Server] Graceful shutdown exceeded ${timeoutMs}ms timeout. Forcing termination.`);
    if (exitProcess) {
      process.exit(1);
    }
  }, timeoutMs);

  if (forceTimeoutTimer.unref) {
    forceTimeoutTimer.unref();
  }

  try {
    // 1. Stop accepting new HTTP requests and close idle keepalive sockets
    if (server && server.listening) {
      if (typeof server.closeIdleConnections === 'function') {
        server.closeIdleConnections();
      }

      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            console.warn(`[Server] Notice during HTTP server closure: ${err.message}`);
          } else {
            console.log('[Server] HTTP connections closed.');
          }
          resolve();
        });
      });
    }

    // 2. Disconnect Mongoose cleanly
    await disconnectDatabase();
    console.log('[Server] Graceful shutdown complete.');
  } catch (error) {
    console.error(`[Server] Error encountered during shutdown: ${sanitizeErrorMessage(error)}`);
  } finally {
    clearTimeout(forceTimeoutTimer);
    unregisterShutdownHandlers();
    isShuttingDown = false;
    if (exitProcess) {
      process.exit(0);
    }
  }
}

/**
 * Registers process signal listeners for graceful shutdown.
 *
 * @param {import('http').Server} server - Active HTTP server instance
 */
export function registerShutdownHandlers(server) {
  unregisterShutdownHandlers();

  sigintListener = () => {
    shutdown(server, 'SIGINT');
  };
  sigtermListener = () => {
    shutdown(server, 'SIGTERM');
  };

  process.once('SIGINT', sigintListener);
  process.once('SIGTERM', sigtermListener);
}

/**
 * Removes registered process signal listeners.
 */
export function unregisterShutdownHandlers() {
  if (sigintListener) {
    process.removeListener('SIGINT', sigintListener);
    sigintListener = null;
  }
  if (sigtermListener) {
    process.removeListener('SIGTERM', sigtermListener);
    sigtermListener = null;
  }
}

/**
 * Deterministic application startup lifecycle:
 * 1. Configuration loaded & validated (via config/env.js)
 * 2. Express application initialized (via app.js)
 * 3. MongoDB connection initiated
 *    (If connection fails, log warning and continue in degraded mode as per HLD/LLD design)
 * 4. HTTP server starts listening
 * 5. Process signal handlers registered for graceful shutdown
 *
 * @param {number} [port=config.port] - Port number to bind the HTTP server
 * @returns {Promise<import('http').Server>} Active HTTP server instance
 */
export async function startServer(port = config.port, options = {}) {
  const { skipDatabase = false, dbOptions = {} } = options;

  // Step 3: Attempt database connection before opening the HTTP port
  if (!skipDatabase) {
    try {
      await connectDatabase(config.mongoUri, dbOptions);
      console.log('[Server] MongoDB connected successfully.');
    } catch (err) {
      // Degraded mode rationale:
      // Aligns with Step 0 design where database availability is non-blocking for process boot.
      // Allows the server to service basic health probes and client status checks even if MongoDB
      // is temporarily offline or in a container initialization window.
      console.warn(`[Server] Non-fatal database initialization notice: ${sanitizeErrorMessage(err)}. Running in degraded mode.`);
    }
  }

  // Step 4 & 5: Bind HTTP listener and register shutdown handlers
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`[Server] CodeVerse backend active on port ${port} (${config.nodeEnv})`);
      registerShutdownHandlers(server);
      resolve(server);
    });

    server.once('error', (err) => {
      console.error(`[Server] Failed to bind HTTP server on port ${port}: ${err.message}`);
      reject(err);
    });
  });
}

/**
 * Checks whether this file is being executed directly via node CLI.
 */
function isMainModule() {
  if (!process.argv[1]) {
    return false;
  }
  try {
    const scriptPath = path.resolve(process.argv[1]);
    const modulePath = path.resolve(fileURLToPath(import.meta.url));
    return scriptPath.toLowerCase() === modulePath.toLowerCase();
  } catch {
    return false;
  }
}

// Automatically start server when executed directly as CLI entrypoint
if (isMainModule()) {
  startServer().catch((err) => {
    console.error(`[Server] Fatal process startup error: ${err.message}`);
    process.exit(1);
  });
}

export default { startServer, shutdown };
