import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateTopicQuery } from '../../src/validators/topic.validator.js';
import { AppError } from '../../src/middleware/errorHandler.js';

describe('Curriculum Topic Query Validation Rules', () => {
  test('returns default normalized options for empty query', () => {
    const result = validateTopicQuery({});
    assert.deepEqual(result, {
      isActive: true,
      sortBy: 'order',
      sortOrder: 'asc'
    });
  });

  test('accepts valid category from allowlist and normalizes to lowercase', () => {
    const result = validateTopicQuery({ category: 'FRONTEND' });
    assert.equal(result.category, 'frontend');
  });

  test('rejects invalid category with 400 VALIDATION_ERROR', () => {
    assert.throws(
      () => validateTopicQuery({ category: 'non_existent_realm' }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'VALIDATION_ERROR');
        assert.match(err.message, /Invalid category filter/);
        return true;
      }
    );
  });

  test('accepts valid difficulty and normalizes to lowercase', () => {
    const result = validateTopicQuery({ difficulty: 'BEGINNER' });
    assert.equal(result.difficulty, 'beginner');
  });

  test('rejects invalid difficulty with 400 VALIDATION_ERROR', () => {
    assert.throws(
      () => validateTopicQuery({ difficulty: 'impossible' }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'VALIDATION_ERROR');
        assert.match(err.message, /Invalid difficulty filter/);
        return true;
      }
    );
  });

  test('accepts valid sortBy field from allowlist', () => {
    const result = validateTopicQuery({ sortBy: 'title' });
    assert.equal(result.sortBy, 'title');
  });

  test('rejects invalid sortBy field with 400 VALIDATION_ERROR', () => {
    assert.throws(
      () => validateTopicQuery({ sortBy: 'secret_column' }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'VALIDATION_ERROR');
        assert.match(err.message, /Invalid sortBy field/);
        return true;
      }
    );
  });

  test('accepts valid sortOrder (asc/desc)', () => {
    const asc = validateTopicQuery({ sortOrder: 'ASC' });
    assert.equal(asc.sortOrder, 'asc');

    const desc = validateTopicQuery({ sortOrder: 'DESC' });
    assert.equal(desc.sortOrder, 'desc');
  });

  test('rejects invalid sortOrder with 400 VALIDATION_ERROR', () => {
    assert.throws(
      () => validateTopicQuery({ sortOrder: 'sideways' }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'VALIDATION_ERROR');
        return true;
      }
    );
  });

  test('rejects public attempts to query inactive topics (isActive=false, isActive=all, isActive=*)', () => {
    const forbiddenValues = ['false', 'all', '*', '0', 'no'];
    for (const val of forbiddenValues) {
      assert.throws(
        () => validateTopicQuery({ isActive: val }),
        (err) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.statusCode, 400);
          assert.equal(err.errorCode, 'VALIDATION_ERROR');
          return true;
        },
        `Expected isActive="${val}" to be rejected`
      );
    }
  });

  test('accepts isActive="true" and strictly normalizes to true', () => {
    const result = validateTopicQuery({ isActive: 'true' });
    assert.equal(result.isActive, true);
  });

  test('rejects unrecognized query parameters to prevent parameter pollution', () => {
    assert.throws(
      () => validateTopicQuery({ maliciousParam: 'payload' }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'VALIDATION_ERROR');
        assert.match(err.message, /Unrecognized query parameter/);
        return true;
      }
    );
  });

  test('rejects non-string query parameter values (NoSQL operator object injection)', () => {
    assert.throws(
      () => validateTopicQuery({ category: { $gt: '' } }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'VALIDATION_ERROR');
        return true;
      }
    );
  });

  test('rejects search query exceeding 100 characters', () => {
    assert.throws(
      () => validateTopicQuery({ search: 'a'.repeat(101) }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.errorCode, 'VALIDATION_ERROR');
        assert.match(err.message, /Search query exceeds maximum allowed length/);
        return true;
      }
    );
  });

  test('normalizes search query from either search or q parameter', () => {
    const res1 = validateTopicQuery({ search: '  loops and iteration  ' });
    assert.equal(res1.search, 'loops and iteration');

    const res2 = validateTopicQuery({ q: 'html' });
    assert.equal(res2.search, 'html');
  });
});
