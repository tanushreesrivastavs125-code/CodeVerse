import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { seedTopics } from '../../src/seeds/seedTopics.js';
import { beginnerTopics } from '../../src/seeds/topics.data.js';
import Topic from '../../src/models/Topic.js';
import { config } from '../../src/config/env.js';

describe('Curriculum Seeder & Idempotency Tests', () => {
  let originalReadyState;

  beforeEach(() => {
    mock.restoreAll();
    originalReadyState = mongoose.connection.readyState;
  });

  afterEach(() => {
    mock.restoreAll();
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: originalReadyState,
      configurable: true
    });
  });

  test('beginnerTopics defines valid curriculum objects conforming to schema', () => {
    assert.ok(beginnerTopics.length >= 6, 'Must define at least 6 beginner curriculum topics');

    const orders = new Set();
    const slugs = new Set();

    for (const topic of beginnerTopics) {
      assert.ok(topic.title, 'Topic must have title');
      assert.ok(topic.slug, 'Topic must have slug');
      assert.ok(topic.category, 'Topic must have category');
      assert.equal(topic.difficulty, 'beginner');
      assert.ok(typeof topic.order === 'number');
      assert.ok(Array.isArray(topic.concepts));
      assert.ok(topic.concepts.length > 0, 'Topic must have at least one concept');

      assert.ok(!orders.has(topic.order), `Duplicate order index ${topic.order} found`);
      orders.add(topic.order);

      assert.ok(!slugs.has(topic.slug), `Duplicate slug ${topic.slug} found`);
      slugs.add(topic.slug);
    }
  });

  test('seedTopics is idempotent and safely upserts without duplicates', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true
    });

    const store = new Map();

    mock.method(Topic, 'findOne', async (query) => {
      return store.get(query.slug) || null;
    });

    mock.method(Topic, 'findOneAndUpdate', async (filter, update) => {
      const slug = filter.slug;
      const doc = {
        _id: '507f1f77bcf86cd799439011',
        ...update.$set,
        toSafeObject() {
          return { ...this };
        }
      };
      store.set(slug, doc);
      return doc;
    });

    // Run 1: First seed run (inserts)
    const result1 = await seedTopics({ quiet: true });
    assert.equal(result1.totalProcessed, beginnerTopics.length);
    assert.equal(result1.insertedCount, beginnerTopics.length);
    assert.equal(result1.updatedCount, 0);

    // Run 2: Second seed run on same database (updates / no duplicates)
    const result2 = await seedTopics({ quiet: true });
    assert.equal(result2.totalProcessed, beginnerTopics.length);
    assert.equal(result2.insertedCount, 0);
    assert.equal(result2.updatedCount, beginnerTopics.length);
  });

  test('seedTopics rejects automatic execution in production environment without explicit force', async () => {
    const originalEnv = config.nodeEnv;
    const originalForce = process.env.FORCE_SEED;
    delete process.env.FORCE_SEED;

    try {
      config.nodeEnv = 'production';

      await assert.rejects(
        async () => {
          await seedTopics({ quiet: true, force: false });
        },
        (err) => {
          assert.match(err.message, /Automatic seeding in production is disabled for safety/);
          return true;
        }
      );
    } finally {
      config.nodeEnv = originalEnv;
      if (originalForce !== undefined) {
        process.env.FORCE_SEED = originalForce;
      }
    }
  });

  test('seedTopics allows production seeding when force: true is explicitly provided', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true
    });

    const originalEnv = config.nodeEnv;

    mock.method(Topic, 'findOne', async () => null);
    mock.method(Topic, 'findOneAndUpdate', async (_filter, update) => ({
      ...update.$set
    }));

    try {
      config.nodeEnv = 'production';

      const result = await seedTopics({ quiet: true, force: true });
      assert.equal(result.totalProcessed, beginnerTopics.length);
    } finally {
      config.nodeEnv = originalEnv;
    }
  });

  test('seedTopics closes database connection in finally block even if seeding throws', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true
    });

    let disconnected = false;
    mock.method(Topic, 'findOne', async () => {
      throw new Error('Fatal disk write error');
    });

    mock.method(mongoose, 'disconnect', async () => {
      disconnected = true;
    });

    await assert.rejects(
      async () => {
        await seedTopics({ quiet: true, disconnectOnFinish: true });
      },
      /Fatal disk write error/
    );

    assert.equal(disconnected, true, 'Database must be disconnected in finally block on failure');
  });
});
