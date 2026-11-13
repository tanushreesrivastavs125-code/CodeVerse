import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { isPortAvailable, assertPortsAvailable } from '../../../scripts/lib/port-utils.mjs';
import {
  writeTrackingFile,
  readTrackingFile,
  removeTrackingFile,
  TRACKING_FILE_PATH
} from '../../../scripts/lib/process-manager.mjs';

describe('Release Readiness & Launcher Utilities Suite', () => {
  describe('Port Conflict Detection', () => {
    it('accurately identifies an available random port', async () => {
      // Find a dynamic ephemeral port
      const ephemeralServer = net.createServer();
      await new Promise((resolve) => ephemeralServer.listen(0, '127.0.0.1', resolve));
      const testPort = ephemeralServer.address().port;
      await new Promise((resolve) => ephemeralServer.close(resolve));

      const available = await isPortAvailable(testPort);
      assert.strictEqual(available, true);
    });

    it('accurately identifies an occupied port and prevents collision', async () => {
      const server = net.createServer();
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const occupiedPort = server.address().port;

      try {
        const available = await isPortAvailable(occupiedPort);
        assert.strictEqual(available, false);

        await assert.rejects(
          async () => {
            await assertPortsAvailable([{ port: occupiedPort, name: 'Test Conflict Service' }]);
          },
          (err) => {
            assert.match(err.message, /Port conflict detected/);
            assert.match(err.message, new RegExp(String(occupiedPort)));
            return true;
          }
        );
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });
  });

  describe('Launcher Tracking File Management', () => {
    it('safely writes, reads, and clears verified launcher tracking information', () => {
      // Clean start
      removeTrackingFile();
      assert.strictEqual(readTrackingFile(), null);

      writeTrackingFile({
        mode: 'local',
        launcherPid: 99999,
        controlPort: 54321,
        controlToken: 'a'.repeat(64),
        children: {
          mongodPid: 11111,
          backendPid: 22222,
          frontendPid: 33333
        }
      });

      assert.strictEqual(fs.existsSync(TRACKING_FILE_PATH), true);
      const data = readTrackingFile();
      assert.ok(data);
      assert.strictEqual(data.mode, 'local');
      assert.strictEqual(data.launcherPid, 99999);
      assert.strictEqual(data.controlPort, 54321);
      assert.strictEqual(data.controlToken, 'a'.repeat(64));
      assert.strictEqual(data.children.mongodPid, 11111);
      assert.strictEqual(data.children.backendPid, 22222);
      assert.strictEqual(data.children.frontendPid, 33333);
      assert.ok(data.createdAt);

      removeTrackingFile();
      assert.strictEqual(readTrackingFile(), null);
      assert.strictEqual(fs.existsSync(TRACKING_FILE_PATH), false);
    });
  });

  describe('Engine & Dependency Requirements', () => {
    const projectRoot = fs.existsSync(path.resolve('package.json')) && fs.existsSync(path.resolve('backend'))
      ? path.resolve('.')
      : path.resolve('..');

    it('verifies root, backend, and frontend packages specify Node >=20.19.0', () => {
      const rootPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      const backendPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'backend/package.json'), 'utf8'));
      const frontendPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'frontend/package.json'), 'utf8'));

      assert.strictEqual(rootPkg.engines?.node, '>=20.19.0');
      assert.strictEqual(backendPkg.engines?.node, '>=20.19.0');
      assert.strictEqual(frontendPkg.engines?.node, '>=20.19.0');
    });

    it('verifies root package.json provides start, start:local, start:external, stop, and verify scripts', () => {
      const rootPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      assert.ok(rootPkg.scripts.start);
      assert.ok(rootPkg.scripts['start:local']);
      assert.ok(rootPkg.scripts['start:external']);
      assert.ok(rootPkg.scripts.stop);
      assert.ok(rootPkg.scripts.verify);
      assert.ok(rootPkg.scripts['setup:env']);
    });
  });
});
