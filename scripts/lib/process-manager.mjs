import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PID_FILE_PATH = path.resolve('.codeverse-launcher.pid');

/**
 * Saves tracked launcher process PIDs to disk.
 *
 * @param {object} info
 * @param {string} info.mode - 'local' or 'external'
 * @param {number} [info.mongodPid]
 * @param {number} info.backendPid
 * @param {number} info.frontendPid
 */
export function savePidFile(info) {
  const data = {
    launcherPid: process.pid,
    createdAt: new Date().toISOString(),
    ...info
  };
  fs.writeFileSync(PID_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Reads existing launcher PID file if present.
 *
 * @returns {object | null}
 */
export function readPidFile() {
  if (!fs.existsSync(PID_FILE_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(PID_FILE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Removes the launcher PID file safely.
 */
export function removePidFile() {
  try {
    if (fs.existsSync(PID_FILE_PATH)) {
      fs.unlinkSync(PID_FILE_PATH);
    }
  } catch {}
}

/**
 * Checks whether a given PID is currently active.
 *
 * @param {number} pid
 * @returns {boolean}
 */
export function isProcessRunning(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Terminates a specific process tree safely.
 * Never kills unrelated processes.
 *
 * @param {number} pid
 */
export function killProcessTree(pid) {
  if (!isProcessRunning(pid)) return;

  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      try { process.kill(pid, 'SIGKILL'); } catch {}
    }
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try { process.kill(pid, 'SIGTERM'); } catch {}
    }
  }
}

/**
 * Stops all processes tracked by .codeverse-launcher.pid and cleans up the pidfile.
 *
 * @returns {{ stopped: boolean, pids: number[] }}
 */
export function stopTrackedProcesses() {
  const info = readPidFile();
  if (!info) {
    return { stopped: false, pids: [] };
  }

  const pidsToStop = [info.frontendPid, info.backendPid, info.mongodPid, info.launcherPid]
    .filter((pid) => typeof pid === 'number' && pid > 0);

  for (const pid of pidsToStop) {
    if (pid !== process.pid) {
      killProcessTree(pid);
    }
  }

  removePidFile();
  return { stopped: true, pids: pidsToStop };
}
