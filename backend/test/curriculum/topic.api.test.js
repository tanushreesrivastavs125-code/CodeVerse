import { test, describe, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import app from '../../src/app.js';
import Topic from '../../src/models/Topic.js';

describe('Curriculum & Topics API Contract (GET /api/topics)', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      server.close();
    }
  });

  beforeEach(() => {
    mock.restoreAll();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('GET /api/topics', () => {
    test('returns 200 OK with standardized success envelope and active curriculum topics', async () => {
      const mockTopics = [
        new Topic({
          title: 'Computational Thinking',
          slug: 'computational-thinking',
          description: 'Algorithmic fundamentals',
          category: 'core',
          difficulty: 'beginner',
          order: 1,
          isActive: true
        }),
        new Topic({
          title: 'HTML Structure Realm',
          slug: 'html-structure',
          description: 'Document structure',
          category: 'frontend',
          difficulty: 'beginner',
          order: 2,
          isActive: true
        })
      ];

      mock.method(Topic, 'find', () => ({
        sort: () => Promise.resolve(mockTopics)
      }));

      const res = await fetch(`${baseUrl}/api/topics`);
      assert.equal(res.status, 200);

      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.equal(body.data.length, 2);
      assert.equal(body.data[0].slug, 'computational-thinking');
      assert.equal(body.data[0].order, 1);
      assert.equal(body.data[1].slug, 'html-structure');
      assert.equal(body.data[1].order, 2);
      assert.ok(body.data[0].id);
      assert.equal(body.data[0].__v, undefined);
    });

    test('returns empty array when no topics match criteria', async () => {
      mock.method(Topic, 'find', () => ({
        sort: () => Promise.resolve([])
      }));

      const res = await fetch(`${baseUrl}/api/topics`);
      assert.equal(res.status, 200);

      const body = await res.json();
      assert.equal(body.success, true);
      assert.deepEqual(body.data, []);
    });

    test('strictly enforces active-only topics in MongoDB query', async () => {
      let capturedQuery = null;

      mock.method(Topic, 'find', (query) => {
        capturedQuery = query;
        return {
          sort: () => Promise.resolve([])
        };
      });

      // Default request
      await fetch(`${baseUrl}/api/topics`);
      assert.equal(capturedQuery.isActive, true);

      // Category filter cannot bypass isActive: true
      await fetch(`${baseUrl}/api/topics?category=frontend`);
      assert.equal(capturedQuery.isActive, true);
      assert.equal(capturedQuery.category, 'frontend');

      // Search filter cannot bypass isActive: true
      await fetch(`${baseUrl}/api/topics?search=logic`);
      assert.equal(capturedQuery.isActive, true);
      assert.ok(capturedQuery.$or);
    });

    test('rejects public attempts to query inactive topics with 400 VALIDATION_ERROR', async () => {
      const resFalse = await fetch(`${baseUrl}/api/topics?isActive=false`);
      assert.equal(resFalse.status, 400);
      const bodyFalse = await resFalse.json();
      assert.equal(bodyFalse.success, false);
      assert.equal(bodyFalse.error.code, 'VALIDATION_ERROR');

      const resAll = await fetch(`${baseUrl}/api/topics?isActive=all`);
      assert.equal(resAll.status, 400);
      const bodyAll = await resAll.json();
      assert.equal(bodyAll.success, false);
      assert.equal(bodyAll.error.code, 'VALIDATION_ERROR');
    });

    test('rejects invalid query parameters with 400 VALIDATION_ERROR', async () => {
      // Invalid category
      const resCat = await fetch(`${baseUrl}/api/topics?category=invalid`);
      assert.equal(resCat.status, 400);
      const bodyCat = await resCat.json();
      assert.equal(bodyCat.error.code, 'VALIDATION_ERROR');

      // Invalid difficulty
      const resDiff = await fetch(`${baseUrl}/api/topics?difficulty=expert`);
      assert.equal(resDiff.status, 400);
      const bodyDiff = await resDiff.json();
      assert.equal(bodyDiff.error.code, 'VALIDATION_ERROR');

      // Invalid sortBy
      const resSort = await fetch(`${baseUrl}/api/topics?sortBy=unknownField`);
      assert.equal(resSort.status, 400);
      const bodySort = await resSort.json();
      assert.equal(bodySort.error.code, 'VALIDATION_ERROR');

      // Invalid sortOrder
      const resOrder = await fetch(`${baseUrl}/api/topics?sortOrder=upside_down`);
      assert.equal(resOrder.status, 400);
      const bodyOrder = await resOrder.json();
      assert.equal(bodyOrder.error.code, 'VALIDATION_ERROR');

      // Unrecognized query parameter
      const resUnknown = await fetch(`${baseUrl}/api/topics?maliciousParam=attack`);
      assert.equal(resUnknown.status, 400);
      const bodyUnknown = await resUnknown.json();
      assert.equal(bodyUnknown.error.code, 'VALIDATION_ERROR');
    });

    test('filters topics by category and difficulty with valid values', async () => {
      let capturedQuery = null;

      mock.method(Topic, 'find', (query) => {
        capturedQuery = query;
        return {
          sort: () => Promise.resolve([])
        };
      });

      await fetch(`${baseUrl}/api/topics?category=dsa&difficulty=beginner`);
      assert.equal(capturedQuery.category, 'dsa');
      assert.equal(capturedQuery.difficulty, 'beginner');
      assert.equal(capturedQuery.isActive, true);
    });

    test('sorts topics deterministically with tie-breaker', async () => {
      let capturedSort = null;

      mock.method(Topic, 'find', () => ({
        sort: (sortOptions) => {
          capturedSort = sortOptions;
          return Promise.resolve([]);
        }
      }));

      // Default sort
      await fetch(`${baseUrl}/api/topics`);
      assert.deepEqual(capturedSort, { order: 1, _id: 1 });

      // Custom descending sort by order
      await fetch(`${baseUrl}/api/topics?sortBy=order&sortOrder=desc`);
      assert.deepEqual(capturedSort, { order: -1, _id: 1 });
    });

    test('handles database failures with 500 Internal Server Error and standardized error envelope', async () => {
      mock.method(Topic, 'find', () => ({
        sort: () => Promise.reject(new Error('MongoDB connection lost'))
      }));

      const res = await fetch(`${baseUrl}/api/topics`);
      assert.equal(res.status, 500);

      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'DATABASE_ERROR');
      assert.equal(body.error.message, 'Unable to retrieve curriculum topics due to a database error.');
      assert.ok(body.timestamp);
      assert.equal(body.error.details, null);
    });
  });
});
