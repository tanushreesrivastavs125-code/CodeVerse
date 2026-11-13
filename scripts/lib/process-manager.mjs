import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';

export const TRACKING_FILE_PATH = path.resolve('.codeverse-launcher.json');
export const LEGACY_PID_PATH = path.resolve('.codeverse-launcher.pid');

/**
 * Creates an in-process authenticated HTTP control server for launcher coordination.
 * The server listens on an ephemeral loopback port (127.0.0.1) and enforces
 * bearer token authorization for all control requests.
 *
 * @param {object} options
 * @param {() => Promise<void> | void} options.onStop - Callback invoked when an authenticated stop is requested
 * @param {string} [options.mode='local'] - Launcher operating mode
 * @returns {Promise<{ server: http.Server, port: number, token: string, close: () => Promise<void> }>}
 */
export function createControlServer({ onStop, mode = 'local' } = {}) {
  const token = crypto.randomBytes(32).toString('hex');

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      // Authenticate via Bearer token using timing-safe comparison
      const authHeader = req.headers.authorization || '';
      const prefix = 'Bearer ';
      let authenticated = false;

      if (authHeader.startsWith(prefix)) {
        const candidateToken = authHeader.slice(prefix.length).trim();
        if (candidateToken.length === token.length) {
          try {
            authenticated = crypto.timingSafeEqual(
              Buffer.from(candidateToken),
              Buffer.from(token)
            );
          } catch {
            authenticated = false;
          }
        }
      }

      if (!authenticated) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing control token.' }));
        return;
      }

      const url = new URL(req.url, 'http://127.0.0.1');

      if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          service: 'codeverse-launcher-control',
          launcherPid: process.pid,
          mode
        }));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/stop') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'stopping',
          message: 'Authenticated stop request accepted. Graceful shutdown initiated.'
        }));

        // Execute graceful shutdown on next tick to allow HTTP response flush
        setImmediate(async () => {
          if (typeof onStop === 'function') {
            try {
              await onStop();
            } catch (err) {
              console.error('[ControlServer] Error during onStop shutdown:', err);
            }
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    });

    server.once('error', reject);

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = addr.port;

      const close = () => new Promise((done) => {
        try {
          server.close(() => done());
        } catch {
          done();
        }
      });

      resolve({
        server,
        port,
        token,
        close
      });
    });
  });
}

/**
 * Atomically writes tracking metadata to .codeverse-launcher.json using a temporary file.
 * Prevents partially written or locked files from being read by other commands.
 *
 * @param {object} data
 * @param {number} data.launcherPid
 * @param {number} data.controlPort
 * @param {string} data.controlToken
 * @param {string} data.mode - 'local' or 'external'
 */
export function writeTrackingFile(data) {
  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    ...data
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const tmpPath = `${TRACKING_FILE_PATH}.tmp.${process.pid}.${Date.now()}`;

  fs.writeFileSync(tmpPath, jsonStr, 'utf8');
  try {
    fs.renameSync(tmpPath, TRACKING_FILE_PATH);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}

/**
 * Safely reads and validates the launcher tracking file.
 * Handles missing, locked, corrupted, or malformed files gracefully.
 *
 * @param {string} [filePath=TRACKING_FILE_PATH]
 * @returns {object | null} Valid tracking object, or null if missing/malformed
 */
export function readTrackingFile(filePath = TRACKING_FILE_PATH) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Must have essential control channel fields
    if (typeof parsed.controlPort !== 'number' || !parsed.controlToken || typeof parsed.controlToken !== 'string') {
      return null;
    }

    return parsed;
  } catch {
    // Malformed JSON or unreadable file
    return null;
  }
}

/**
 * Removes the launcher tracking file safely.
 *
 * @param {string} [filePath=TRACKING_FILE_PATH]
 */
export function removeTrackingFile(filePath = TRACKING_FILE_PATH) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch { /* ignore */ }

  try {
    if (fs.existsSync(LEGACY_PID_PATH)) {
      fs.unlinkSync(LEGACY_PID_PATH);
    }
  } catch { /* ignore */ }
}

/**
 * Probes the local control channel to verify launcher authenticity and liveness.
 * Verifies that the process on controlPort is indeed an active CodeVerse launcher
 * that recognizes the instance secret.
 *
 * @param {object} tracking
 * @param {number} tracking.controlPort
 * @param {string} tracking.controlToken
 * @param {number} [timeoutMs=1500]
 * @returns {Promise<boolean>} True only if the control channel authenticates successfully
 */
export async function probeLiveLauncher(tracking, timeoutMs = 1500) {
  if (!tracking || !tracking.controlPort || !tracking.controlToken) {
    return false;
  }

  try {
    const res = await fetch(`http://127.0.0.1:${tracking.controlPort}/health`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tracking.controlToken}`
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (res.ok) {
      const data = await res.json();
      return data.status === 'ok' && data.service === 'codeverse-launcher-control';
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Requests an authenticated graceful stop from the verified live launcher instance.
 *
 * @param {object} tracking
 * @param {number} tracking.controlPort
 * @param {string} tracking.controlToken
 * @param {number} [timeoutMs=3000]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function requestAuthenticatedStop(tracking, timeoutMs = 3000) {
  if (!tracking || !tracking.controlPort || !tracking.controlToken) {
    return { success: false, message: 'Invalid tracking metadata.' };
  }

  try {
    const res = await fetch(`http://127.0.0.1:${tracking.controlPort}/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tracking.controlToken}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (res.ok) {
      return { success: true, message: 'Stop request accepted by live launcher instance.' };
    }
    return { success: false, message: `Control channel responded with HTTP ${res.status}.` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Safely stops active CodeVerse instances through verified ownership.
 *
 * Safety guarantees:
 * 1. Missing or unreadable tracking files do not terminate any processes.
 * 2. Unauthenticated or unresponsive ports are treated as stale state;
 *    NEVER sends signals or kills arbitrary PIDs.
 * 3. Only the authentic launcher process stops its own owned child processes.
 *
 * @returns {Promise<{ status: string, message: string }>}
 */
export async function safeStopInstances() {
  // Check if tracking file exists at all
  if (!fs.existsSync(TRACKING_FILE_PATH)) {
    // Also clean up any legacy pidfile if present
    removeTrackingFile();
    return {
      status: 'not_running',
      message: 'No active CodeVerse instance found (no tracking file).'
    };
  }

  const tracking = readTrackingFile(TRACKING_FILE_PATH);

  // Handle malformed or corrupted tracking files safely
  if (!tracking) {
    removeTrackingFile(TRACKING_FILE_PATH);
    return {
      status: 'malformed_cleaned',
      message: 'Tracking file was corrupted or incomplete. Removed safely without terminating any processes.'
    };
  }

  // Probe live control channel to establish authentic ownership
  const isLive = await probeLiveLauncher(tracking, 2000);

  if (!isLive) {
    // Refuse to terminate arbitrary processes
    removeTrackingFile(TRACKING_FILE_PATH);
    return {
      status: 'stale_cleaned',
      message:
        'Stale launcher tracking file detected. The control channel did not authenticate or respond.\n' +
        'Refusing to terminate any processes to avoid affecting unrelated applications.\n' +
        'Stale tracking state cleared safely.'
    };
  }

  // Send authenticated stop command to the verified live launcher
  const stopResult = await requestAuthenticatedStop(tracking, 3000);

  if (stopResult.success) {
    // Wait for the live launcher to finish shutting down and clean up tracking file
    const startTime = Date.now();
    while (Date.now() - startTime < 6000) {
      if (!fs.existsSync(TRACKING_FILE_PATH)) {
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    return {
      status: 'stopped',
      message: `CodeVerse launcher (PID ${tracking.launcherPid}) successfully verified and stopped owned processes.`
    };
  }

  return {
    status: 'stop_failed',
    message: `Authenticated stop request failed: ${stopResult.message}`
  };
}
