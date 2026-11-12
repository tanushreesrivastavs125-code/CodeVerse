import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import mongoose from 'mongoose';
import { assertSafeTestDatabase } from './campaign.integration.test.js';

let replSetInstance = null;

async function main() {
  let testUri = process.env.MONGODB_TEST_URI;

  if (testUri) {
    console.log(`[Integration Harness] Connecting to existing test replica set: ${testUri}`);
    assertSafeTestDatabase(testUri);
  } else {
    console.log('[Integration Harness] Starting isolated in-memory MongoDB replica set (MongoMemoryReplSet)...');
    replSetInstance = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
        storageEngine: 'wiredTiger'
      }
    });

    const dbName = `codeverse_campaign_test_${Date.now()}`;
    testUri = replSetInstance.getUri(dbName);
    console.log(`[Integration Harness] Replica set active at: ${testUri}`);
    assertSafeTestDatabase(testUri);
  }

  // Pre-flight transaction readiness check using an isolated connection
  console.log('[Integration Harness] Verifying multi-document transaction readiness...');
  const probeConn = await mongoose.createConnection(testUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  const readyState = probeConn.readyState;
  const client = probeConn.client;
  const desc = client?.topology?.description || client?.topology?.s?.description;
  const topologyType = desc?.type;
  const txReady =
    readyState === 1 &&
    (topologyType === 'ReplicaSetWithPrimary' ||
      topologyType === 'ReplicaSetNoPrimary' ||
      topologyType === 'Sharded' ||
      Boolean(desc?.setName));
  await probeConn.close();

  if (!txReady) {
    console.error('[Integration Harness] FATAL: Multi-document transactions are unavailable on target database.');
    if (replSetInstance) await replSetInstance.stop({ doCleanup: true });
    process.exit(1);
  }

  console.log('[Integration Harness] Pre-flight verification passed: multi-document transactions confirmed.');
  console.log('[Integration Harness] Executing campaign integration test suite...\n');

  const testEnv = {
    ...process.env,
    MONGODB_TEST_URI: testUri,
    REQUIRED_INTEGRATION: 'true'
  };

  const child = spawn(process.execPath, ['--test', 'test/campaign/campaign.integration.test.js'], {
    cwd: process.cwd(),
    env: testEnv,
    stdio: 'inherit'
  });

  child.on('exit', async (code) => {
    if (replSetInstance) {
      console.log('\n[Integration Harness] Stopping isolated replica set...');
      await replSetInstance.stop({ doCleanup: true });
      console.log('[Integration Harness] Cleanup complete.');
    }
    process.exit(code ?? 0);
  });
}

main().catch(async (err) => {
  console.error('[Integration Harness] Unhandled exception:', err);
  if (replSetInstance) {
    try {
      await replSetInstance.stop({ doCleanup: true });
    } catch {
      // ignore
    }
  }
  process.exit(1);
});
