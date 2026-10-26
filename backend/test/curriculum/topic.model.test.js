import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Topic, { topicSchema } from '../../src/models/Topic.js';

describe('Topic Mongoose Model & Schema Invariants', () => {
  test('validates successfully with compliant topic attributes', async () => {
    const topic = new Topic({
      title: 'HTML Foundations',
      slug: 'html-foundations',
      description: 'Foundations of web page structure.',
      category: 'frontend',
      difficulty: 'beginner',
      order: 1,
      isActive: true,
      concepts: [
        {
          title: 'Semantic Tags',
          slug: 'semantic-tags',
          description: 'Using header, main, and footer.',
          order: 1
        }
      ]
    });

    await assert.doesNotReject(async () => {
      await topic.validate();
    }, 'Valid topic should pass schema validation');

    assert.equal(topic.title, 'HTML Foundations');
    assert.equal(topic.slug, 'html-foundations');
    assert.equal(topic.category, 'frontend');
    assert.equal(topic.difficulty, 'beginner');
    assert.equal(topic.order, 1);
    assert.equal(topic.isActive, true);
    assert.equal(topic.isLocked, false);
    assert.equal(topic.concepts.length, 1);
    assert.equal(topic.concepts[0].title, 'Semantic Tags');
  });

  test('applies sensible defaults for optional attributes', async () => {
    const topic = new Topic({
      title: 'CSS Styling',
      order: 2
    });

    await assert.doesNotReject(async () => {
      await topic.validate();
    });

    assert.equal(topic.slug, 'css-styling', 'Slug must be auto-derived from title');
    assert.equal(topic.category, 'frontend', 'Category must default to frontend');
    assert.equal(topic.difficulty, 'beginner', 'Difficulty must default to beginner');
    assert.equal(topic.isActive, true, 'isActive must default to true');
    assert.equal(topic.isLocked, false, 'isLocked must default to false');
    assert.equal(topic.description, '', 'description must default to empty string');
    assert.deepEqual(topic.concepts, [], 'concepts must default to empty array');
  });

  test('auto-derives concept slug from concept title if missing', async () => {
    const topic = new Topic({
      title: 'JavaScript Logic',
      order: 3,
      concepts: [
        {
          title: 'Conditionals & If-Else',
          description: 'Basic branching logic'
        }
      ]
    });

    await assert.doesNotReject(async () => {
      await topic.validate();
    });

    assert.equal(topic.concepts[0].slug, 'conditionals-if-else');
  });

  test('enforces required constraints on title and order', async () => {
    const topic = new Topic({});
    await assert.rejects(
      async () => {
        await topic.validate();
      },
      (err) => {
        assert.ok(err.errors.title, 'Title is required');
        return true;
      }
    );
  });

  test('enforces title length constraints', async () => {
    // Too short
    const shortTopic = new Topic({ title: 'A', order: 1 });
    await assert.rejects(
      async () => {
        await shortTopic.validate();
      },
      (err) => {
        assert.ok(err.errors.title, 'Title shorter than 2 chars should fail');
        return true;
      }
    );

    // Too long (>100 characters)
    const longTopic = new Topic({ title: 'A'.repeat(101), order: 1 });
    await assert.rejects(
      async () => {
        await longTopic.validate();
      },
      (err) => {
        assert.ok(err.errors.title, 'Title exceeding 100 chars should fail');
        return true;
      }
    );
  });

  test('enforces category enum constraints', async () => {
    const invalidCategoryTopic = new Topic({
      title: 'Invalid Category Topic',
      order: 1,
      category: 'invalid_realm'
    });

    await assert.rejects(
      async () => {
        await invalidCategoryTopic.validate();
      },
      (err) => {
        assert.ok(err.errors.category, 'Invalid category should be rejected');
        return true;
      }
    );
  });

  test('enforces difficulty enum constraints', async () => {
    const invalidDiffTopic = new Topic({
      title: 'Invalid Difficulty Topic',
      order: 1,
      difficulty: 'nightmare'
    });

    await assert.rejects(
      async () => {
        await invalidDiffTopic.validate();
      },
      (err) => {
        assert.ok(err.errors.difficulty, 'Invalid difficulty should be rejected');
        return true;
      }
    );
  });

  test('enforces non-negative order constraint', async () => {
    const negativeOrderTopic = new Topic({
      title: 'Negative Order Topic',
      order: -1
    });

    await assert.rejects(
      async () => {
        await negativeOrderTopic.validate();
      },
      (err) => {
        assert.ok(err.errors.order, 'Negative order should be rejected');
        return true;
      }
    );
  });

  test('toJSON and toObject transform converts _id to id and removes internal __v', () => {
    const topic = new Topic({
      title: 'Serialization Test Topic',
      slug: 'serialization-test',
      order: 10
    });

    const json = topic.toJSON();
    assert.ok(json.id, 'JSON output must contain id');
    assert.equal(json.__v, undefined, 'JSON output must omit __v');
    assert.equal(json.title, 'Serialization Test Topic');

    const obj = topic.toObject();
    assert.ok(obj.id, 'Object output must contain id');
    assert.equal(obj.__v, undefined, 'Object output must omit __v');
  });

  test('toSafeObject returns non-sensitive attributes with formatted concepts', () => {
    const topic = new Topic({
      title: 'Safe Object Topic',
      slug: 'safe-object-topic',
      description: 'Test description',
      category: 'dsa',
      difficulty: 'intermediate',
      order: 5,
      concepts: [
        {
          title: 'Binary Trees',
          slug: 'binary-trees',
          description: 'Tree traversal fundamentals',
          order: 1
        }
      ]
    });

    const safe = topic.toSafeObject();
    assert.ok(safe.id);
    assert.equal(safe.title, 'Safe Object Topic');
    assert.equal(safe.slug, 'safe-object-topic');
    assert.equal(safe.category, 'dsa');
    assert.equal(safe.difficulty, 'intermediate');
    assert.equal(safe.order, 5);
    assert.equal(safe.concepts.length, 1);
    assert.ok(safe.concepts[0].id);
    assert.equal(safe.concepts[0].slug, 'binary-trees');
  });

  test('declares appropriate unique and compound indexes', () => {
    const indexes = topicSchema.indexes();
    const indexFields = indexes.map((entry) => entry[0]);

    // Check compound index for active & order
    const hasActiveOrderIndex = indexFields.some(
      (fields) => fields.isActive === 1 && fields.order === 1
    );
    assert.ok(hasActiveOrderIndex, 'Schema must define compound index on { isActive: 1, order: 1 }');

    // Check order index
    const hasOrderIndex = indexFields.some((fields) => fields.order === 1);
    assert.ok(hasOrderIndex, 'Schema must define index on order');

    // Check category & difficulty compound index
    const hasCategoryDiffIndex = indexFields.some(
      (fields) => fields.category === 1 && fields.difficulty === 1
    );
    assert.ok(hasCategoryDiffIndex, 'Schema must define compound index on { category: 1, difficulty: 1 }');
  });
});
