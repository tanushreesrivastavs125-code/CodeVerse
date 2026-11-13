import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { MongoClient } from 'mongodb';
import { ensureEnvFiles } from './setup-env.mjs';
import { assertPortsAvailable } from './lib/port-utils.mjs';
import { startManagedDb } from './lib/managed-db.mjs';
import { waitForBackendHealth, waitForFrontendReadiness } from './lib/readiness.mjs';
import { savePidFile, removePidFile, stopTrackedProcesses } from './lib/process-manager.mjs';

const ROOT_DIR = process.cwd();
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

/**
 * Parses simple KEY=VALUE pairs from a .env file into an object.
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

/**
 * Cross-platform open URL in system default browser.
 */
function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' });
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
    }
  } catch {}
}

async function main() {
  const args = process.argv.slice(2);

  // Command: --stop
  if (args.includes('--stop')) {
    console.log('[CodeVerse] Stopping running instances...');
    const result = stopTrackedProcesses();
    if (result.stopped) {
      console.log(`[CodeVerse] Successfully stopped processes (PIDs: ${result.pids.join(', ')}).`);
    } else {
      console.log('[CodeVerse] No running instances tracked in .codeverse-launcher.pid.');
    }
    process.exit(0);
  }

  const isExternal = args.includes('--external');
  const shouldOpen = args.includes('--open');
  const mode = isExternal ? 'external' : 'local';

  console.log('============================================================');
  console.log(`  CodeVerse Launch Coordinator [Mode: ${mode.toUpperCase()}]`);
  console.log('============================================================');

  // Step 1: Environment files initialization
  ensureEnvFiles();
  const backendEnv = parseEnvFile(path.join(BACKEND_DIR, '.env'));

  // Step 2: Port conflict detection
  console.log('[Launcher] Checking port availability (strict assignments)...');
  const portsToCheck = [
    { port: 5000, name: 'Backend API Gateway' },
    { port: 5173, name: 'Frontend Vite Dev Server' }
  ];
  if (!isExternal) {
    portsToCheck.unshift({ port: 27017, name: 'Managed MongoDB Replica Set' });
  }

  try {
    await assertPortsAvailable(portsToCheck);
    console.log('[Launcher] All required ports available.');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  let dbHandle = null;
  let mongoUri = '';

  // Step 3: Database setup
  if (isExternal) {
    mongoUri = process.env.MONGODB_URI || backendEnv.MONGODB_URI;
    if (!mongoUri) {
      console.error('[Launcher] Error: External mode specified, but MONGODB_URI is not set in backend/.env or environment.');
      process.exit(1);
    }
    console.log(`[Launcher] Verifying external MongoDB connectivity: ${mongoUri.replace(/:([^:@]{3,})@/, ':****@')}`);
    try {
      const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      await client.close();
      console.log('[Launcher] External database connection verified.');
    } catch (err) {
      console.error(`[Launcher] Error: Failed to connect to external MongoDB: ${err.message}`);
      console.error('[Launcher] Strict policy: Refusing to fall back to local managed database.');
      process.exit(1);
    }
  } else {
    console.log('[Launcher] Initializing managed MongoDB replica set (persistent storage at .local-db)...');
    try {
      dbHandle = await startManagedDb({ port: 27017, dbPath: path.resolve(ROOT_DIR, '.local-db') });
      mongoUri = dbHandle.uri;
      console.log('[Launcher] Managed replica set ready on port 27017 (rs0).');
    } catch (err) {
      console.error(`[Launcher] Failed to start managed database: ${err.message}`);
      process.exit(1);
    }
  }

  // Step 4: Launch Backend
  console.log('[Launcher] Starting backend server (port 5000)...');
  const backendMergedEnv = {
    ...process.env,
    ...backendEnv,
    PORT: '5000',
    MONGODB_URI: mongoUri
  };

  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';

  const backendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: BACKEND_DIR,
    env: backendMergedEnv,
    stdio: ['ignore', 'inherit', 'inherit']
  });

  // Step 5: Launch Frontend
  console.log('[Launcher] Starting frontend dev server (port 5173)...');
  const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    env: { ...process.env, PORT: '5173' },
    stdio: ['ignore', 'inherit', 'inherit']
  });

  // Save tracked PIDs
  savePidFile({
    mode,
    mongodPid: dbHandle?.child?.pid,
    backendPid: backendProcess.pid,
    frontendPid: frontendProcess.pid
  });

  // Graceful shutdown coordinator
  let isShuttingDown = false;
  const cleanup = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n[Launcher] Initiating graceful shutdown of CodeVerse stack...');

    try {
      if (frontendProcess.pid) {
        if (isWindows) {
          spawn('taskkill', ['/pid', String(frontendProcess.pid), '/T', '/F'], { stdio: 'ignore' });
        } else {
          frontendProcess.kill('SIGTERM');
        }
      }
    } catch {}

    try {
      if (backendProcess.pid) {
        if (isWindows) {
          spawn('taskkill', ['/pid', String(backendProcess.pid), '/T', '/F'], { stdio: 'ignore' });
        } else {
          backendProcess.kill('SIGTERM');
        }
      }
    } catch {}

    if (dbHandle) {
      console.log('[Launcher] Cleanly stopping managed MongoDB...');
      await dbHandle.stop();
    }

    removePidFile();
    console.log('[Launcher] All services stopped cleanly. Exiting.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  if (process.platform !== 'win32') {
    process.on('SIGHUP', cleanup);
  }

  // Step 6: Readiness probing
  console.log('[Launcher] Awaiting system readiness and transaction verification...');
  try {
    const health = await waitForBackendHealth({
      url: 'http://127.0.0.1:5000/api/health',
      timeoutMs: 40000,
      requireTransactions: true
    });
    await waitForFrontendReadiness({
      url: 'http://localhost:5173/',
      timeoutMs: 30000
    });

    console.log('\n============================================================');
    console.log('          C O D E V E R S E   G A M E   S T A C K           ');
    console.log('============================================================');
    console.log('  Game Application:    http://localhost:5173/');
    console.log('  API Gateway:         http://localhost:5000/api');
    console.log('  Health Probe:        http://localhost:5000/api/health');
    console.log(`  Database Mode:       ${mode.toUpperCase()} (Transactions: ${health.transactions ? 'ACTIVE' : 'INACTIVE'})`);
    if (!isExternal) {
      console.log('  Local Storage:       .local-db/ (Persists across restarts)');
    }
    console.log('============================================================');
    console.log('  Ready for play and evaluation! Press Ctrl+C to exit.');
    console.log('============================================================\n');

    if (shouldOpen) {
      console.log('[Launcher] Opening CodeVerse in default web browser...');
      openBrowser('http://localhost:5173/');
    }
  } catch (err) {
    console.error(`\n[Launcher] Startup readiness check failed: ${err.message}`);
    await cleanup();
  }
}

main().catch((err) => {
  console.error('[Launcher] Fatal error:', err);
  process.exit(1);
});
