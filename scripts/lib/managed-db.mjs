import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { MongoBinary } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { isPortAvailable } from './port-utils.mjs';

/**
 * Starts a managed local MongoDB replica-set instance with persistent on-disk storage.
 *
 * @param {object} options
 * @param {number} [options.port=27017] - MongoDB listen port
 * @param {string} [options.dbPath] - Persistent database directory
 * @param {number} [options.timeoutMs=35000] - Maximum milliseconds to wait for primary election
 * @returns {Promise<{ child: import('node:child_process').ChildProcess, uri: string, port: number, dbPath: string, stop: () => Promise<void> }>}
 */
export async function startManagedDb({
  port = 27017,
  dbPath = path.resolve('.local-db'),
  timeoutMs = 35000
} = {}) {
  const available = await isPortAvailable(port);
  if (!available) {
    throw new Error(
      `[Managed DB] Port conflict: Port ${port} is already in use by another process.\n` +
      `Cannot start managed replica set on occupied port ${port}. Please free the port first.`
    );
  }

  fs.mkdirSync(dbPath, { recursive: true });

  const logFilePath = path.join(dbPath, 'mongod.log');
  const logFd = fs.openSync(logFilePath, 'a');

  // Obtain cached or downloaded MongoDB binary
  const binaryPath = await MongoBinary.getPath();

  const child = spawn(binaryPath, [
    '--replSet', 'rs0',
    '--port', String(port),
    '--dbpath', dbPath,
    '--bind_ip', '127.0.0.1'
  ], {
    stdio: ['ignore', logFd, logFd],
    detached: false
  });

  const directUri = `mongodb://127.0.0.1:${port}/?directConnection=true`;
  const startTime = Date.now();
  let primaryReady = false;

  while (Date.now() - startTime < timeoutMs) {
    if (child.exitCode !== null) {
      fs.closeSync(logFd);
      throw new Error(`[Managed DB] mongod process terminated unexpectedly with exit code ${child.exitCode}. Check ${logFilePath}`);
    }

    const client = new MongoClient(directUri, {
      serverSelectionTimeoutMS: 1200,
      connectTimeoutMS: 1200
    });

    try {
      await client.connect();
      const hello = await client.db('admin').command({ hello: 1 });

      if (hello.isWritablePrimary) {
        primaryReady = true;
        await client.close();
        break;
      }

      // If replica set is uninitialized (fresh dbpath), execute replSetInitiate
      if (!hello.setName || hello.info?.includes('replica set config') || !hello.isWritablePrimary) {
        try {
          await client.db('admin').command({
            replSetInitiate: {
              _id: 'rs0',
              members: [{ _id: 0, host: `127.0.0.1:${port}` }]
            }
          });
        } catch {
          // Ignore initiation collision if concurrent or in progress
        }
      }

      await client.close();
    } catch {
      await client.close().catch(() => {});
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  if (!primaryReady) {
    child.kill('SIGINT');
    fs.closeSync(logFd);
    throw new Error(`[Managed DB] Timed out after ${timeoutMs}ms waiting for replica set 'rs0' writable primary on port ${port}.`);
  }

  const uri = `mongodb://127.0.0.1:${port}/codeverse?replicaSet=rs0`;

  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;

    // Send admin shutdown command for clean WiredTiger flush
    try {
      const shutdownClient = new MongoClient(directUri, { serverSelectionTimeoutMS: 1500 });
      await shutdownClient.connect();
      await shutdownClient.db('admin').command({ shutdown: 1, force: true }).catch(() => {});
      await shutdownClient.close().catch(() => {});
    } catch {}

    if (child.exitCode === null) {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          try {
            if (process.platform === 'win32') {
              spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
            } else {
              child.kill('SIGKILL');
            }
          } catch {}
          resolve();
        }, 4000);

        child.once('close', () => {
          clearTimeout(timeout);
          resolve();
        });

        try {
          child.kill('SIGINT');
        } catch {
          clearTimeout(timeout);
          resolve();
        }
      });
    }

    try {
      fs.closeSync(logFd);
    } catch {}
  };

  return {
    child,
    uri,
    port,
    dbPath,
    stop
  };
}
