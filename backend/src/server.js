import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`[Server] CodeVerse backend active on port ${PORT} (${config.nodeEnv})`);
  // Attempt non-blocking database connection
  connectDB().catch((err) => {
    console.warn(`[Server] Non-fatal database initialization notice: ${err.message}`);
  });
});

/**
 * Handles graceful process shutdown
 */
async function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP connections closed.');
    await disconnectDB();
    console.log('[Server] Graceful shutdown complete.');
    process.exit(0);
  });

  // Force close if graceful shutdown exceeds 5s timeout
  setTimeout(() => {
    console.error('[Server] Forcing process termination due to timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default server;
