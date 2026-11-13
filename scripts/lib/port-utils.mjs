import net from 'node:net';

/**
 * Checks whether a given TCP port is available on the specified host.
 *
 * @param {number} port - Port number to check
 * @param {string} [host='127.0.0.1'] - Host address
 * @returns {Promise<boolean>} Resolves true if available, false if in use
 */
export function isPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, host);
  });
}

/**
 * Validates that all required ports are available.
 * Fails fast with informative error details if any port is already in use.
 *
 * @param {Array<{ port: number, name: string }>} portConfigs - Ports to verify
 * @throws {Error} if any required port is occupied
 */
export async function assertPortsAvailable(portConfigs) {
  for (const { port, name } of portConfigs) {
    const available = await isPortAvailable(port);
    if (!available) {
      throw new Error(
        `[CodeVerse Launcher] Port conflict detected: Port ${port} (${name}) is already in use.\n` +
        `CodeVerse operates with strict port assignments (API: 5000, Frontend: 5173, DB: 27017).\n` +
        `To prevent unexpected collisions, ports are not shifted silently and unrelated processes are never killed.\n` +
        `Please free port ${port} or terminate the conflicting service before starting CodeVerse.`
      );
    }
  }
}
