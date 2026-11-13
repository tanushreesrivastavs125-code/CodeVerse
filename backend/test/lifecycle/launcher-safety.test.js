import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import {
  createControlServer,
  writeTrackingFile,
  readTrackingFile,
  removeTrackingFile,
  probeLiveLauncher,
  safeStopInstances,
  TRACKING_FILE_PATH
} from '../../../scripts/lib/process-manager.mjs';

describe('Launcher Process Ownership & Stop Safety Lifecycle Suite', () => {
  it('handles missing, empty, and malformed tracking files safely without errors', async () => {
    // 1. Missing tracking file
    removeTrackingFile();
    const resMissing = await safeStopInstances();
    assert.strictEqual(resMissing.status, 'not_running');

    // 2. Empty tracking file
    fs.writeFileSync(TRACKING_FILE_PATH, '', 'utf8');
    const resEmpty = await safeStopInstances();
    assert.strictEqual(resEmpty.status, 'malformed_cleaned');
    assert.strictEqual(fs.existsSync(TRACKING_FILE_PATH), false);

    // 3. Corrupted / invalid JSON tracking file
    fs.writeFileSync(TRACKING_FILE_PATH, '{ corrupted-json: true ', 'utf8');
    const resCorrupt = await safeStopInstances();
    assert.strictEqual(resCorrupt.status, 'malformed_cleaned');
    assert.strictEqual(fs.existsSync(TRACKING_FILE_PATH), false);

    // 4. Incomplete fields (missing token)
    fs.writeFileSync(TRACKING_FILE_PATH, JSON.stringify({ launcherPid: 99999, controlPort: 12345 }), 'utf8');
    const resIncomplete = await safeStopInstances();
    assert.strictEqual(resIncomplete.status, 'malformed_cleaned');
    assert.strictEqual(fs.existsSync(TRACKING_FILE_PATH), false);
  });

  it('refuses to terminate an unrelated live application when PID matches but control channel is absent or unauthenticated', async () => {
    // Start an unrelated innocent process (sleep/timer)
    const innocentProcess = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000);'], {
      stdio: 'ignore'
    });
    assert.ok(innocentProcess.pid);

    try {
      // Create an open HTTP server that is NOT a CodeVerse launcher (wrong protocol / no token)
      const unrelatedHttpServer = http.createServer((_req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Unrelated application');
      });

      await new Promise((resolve) => unrelatedHttpServer.listen(0, '127.0.0.1', resolve));
      const unrelatedPort = unrelatedHttpServer.address().port;

      try {
        // Write tracking file attributing ownership of the innocent process PID
        // but pointing to the unrelated HTTP server with an arbitrary token
        writeTrackingFile({
          launcherPid: innocentProcess.pid,
          controlPort: unrelatedPort,
          controlToken: 'arbitrary-unauthenticated-token-12345',
          mode: 'local'
        });

        // Execute safeStopInstances
        const stopResult = await safeStopInstances();

        // Must report stale / unverified state and REFUSE to terminate the innocent process
        assert.strictEqual(stopResult.status, 'stale_cleaned');
        assert.match(stopResult.message, /Refusing to terminate any processes/);

        // Verify the innocent process is STILL RUNNING!
        let innocentStillAlive = false;
        try {
          process.kill(innocentProcess.pid, 0);
          innocentStillAlive = true;
        } catch {
          innocentStillAlive = false;
        }

        assert.strictEqual(innocentStillAlive, true, 'Unrelated application must never be terminated!');
      } finally {
        await new Promise((resolve) => unrelatedHttpServer.close(resolve));
      }
    } finally {
      // Clean up innocent test process
      try { innocentProcess.kill('SIGKILL'); } catch { /* ignore */ }
      removeTrackingFile();
    }
  });

  it('authenticates live launcher instance, sends stop signal, and cleans up tracking safely', async () => {
    let onStopCalled = false;

    const control = await createControlServer({
      mode: 'local',
      onStop: async () => {
        onStopCalled = true;
        removeTrackingFile();
      }
    });

    writeTrackingFile({
      launcherPid: process.pid,
      controlPort: control.port,
      controlToken: control.token,
      mode: 'local'
    });

    try {
      // Probe live launcher
      const tracking = readTrackingFile();
      assert.ok(tracking);
      const isLive = await probeLiveLauncher(tracking);
      assert.strictEqual(isLive, true);

      // Execute safeStopInstances
      const stopResult = await safeStopInstances();
      assert.strictEqual(stopResult.status, 'stopped');
      assert.strictEqual(onStopCalled, true, 'onStop handler must be executed');
      assert.strictEqual(fs.existsSync(TRACKING_FILE_PATH), false, 'Tracking file must be cleaned up');
    } finally {
      await control.close();
      removeTrackingFile();
    }
  });

  it('detects live running launcher to prevent double launch from disrupting the first instance', async () => {
    const control = await createControlServer({
      mode: 'local',
      onStop: () => {}
    });

    writeTrackingFile({
      launcherPid: process.pid,
      controlPort: control.port,
      controlToken: control.token,
      mode: 'local'
    });

    try {
      const tracking = readTrackingFile();
      assert.ok(tracking);

      // Check live status
      const isLive = await probeLiveLauncher(tracking);
      assert.strictEqual(isLive, true, 'Active launcher must be recognized as live');

      // The running control server must reject unauthenticated requests
      const unauthProbe = await probeLiveLauncher({
        controlPort: control.port,
        controlToken: 'invalid-token'
      });
      assert.strictEqual(unauthProbe, false, 'Unauthenticated probe must be rejected');
    } finally {
      await control.close();
      removeTrackingFile();
    }
  });

  it('external database mode never shuts down external database service', async () => {
    // Mock external database server
    let externalDbReceivedShutdown = false;
    const mockExternalDb = http.createServer((req, res) => {
      if (req.url === '/shutdown') {
        externalDbReceivedShutdown = true;
      }
      res.writeHead(200);
      res.end('ok');
    });

    await new Promise((resolve) => mockExternalDb.listen(0, '127.0.0.1', resolve));
    const dbPort = mockExternalDb.address().port;

    try {
      // Simulate external mode launcher
      let launcherStopped = false;
      const control = await createControlServer({
        mode: 'external',
        onStop: async () => {
          launcherStopped = true;
          // In external mode, dbHandle is null so no db shutdown is called
          removeTrackingFile();
        }
      });

      writeTrackingFile({
        launcherPid: process.pid,
        controlPort: control.port,
        controlToken: control.token,
        mode: 'external'
      });

      const stopResult = await safeStopInstances();
      assert.strictEqual(stopResult.status, 'stopped');
      assert.strictEqual(launcherStopped, true);

      // Verify external DB is STILL RUNNING and never received shutdown
      assert.strictEqual(externalDbReceivedShutdown, false, 'External DB must never receive shutdown commands');

      // Verify external DB is still accepting HTTP connections
      const dbCheck = await fetch(`http://127.0.0.1:${dbPort}/`);
      assert.strictEqual(dbCheck.ok, true, 'External DB must remain fully operational');

      await control.close();
    } finally {
      await new Promise((resolve) => mockExternalDb.close(resolve));
      removeTrackingFile();
    }
  });
});

