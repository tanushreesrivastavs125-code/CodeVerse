import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('Backend Foundation Smoke Tests', () => {
  let server;
  let baseUrl;

  test('Server starts successfully on dynamic port', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
    assert.ok(baseUrl, 'Base URL should be defined');
  });

  test('GET /api/health returns 200 OK with alive status', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'CodeVerse API Gateway');
    assert.ok(typeof body.uptime === 'number');
    assert.ok(body.timestamp);
    assert.ok(body.database);
  });

  test('GET /api/unmapped-endpoint returns standardized 404', async () => {
    const response = await fetch(`${baseUrl}/api/unmapped-endpoint`);
    assert.equal(response.status, 404);

    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'ROUTE_NOT_FOUND');
  });

  after(() => {
    if (server) {
      server.close();
    }
  });
});
