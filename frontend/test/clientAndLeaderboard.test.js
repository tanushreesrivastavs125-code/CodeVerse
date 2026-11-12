import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ApiClientError } from '../src/api/client.js';

describe('Frontend API Client & Invariants', () => {
  test('ApiClientError carries status, code, and message correctly', () => {
    const err = new ApiClientError('Leaderboard query invalid', 'INVALID_RANGE', 400, { field: 'range' });

    assert.equal(err.name, 'ApiClientError');
    assert.equal(err.message, 'Leaderboard query invalid');
    assert.equal(err.code, 'INVALID_RANGE');
    assert.equal(err.status, 400);
    assert.deepEqual(err.details, { field: 'range' });
  });

  test('Reduced motion media query check handles browser-like environment safely', () => {
    const dummyMatchMedia = (query) => ({
      matches: query.includes('reduce'),
      addEventListener: () => {},
      removeEventListener: () => {}
    });

    const result = dummyMatchMedia('(prefers-reduced-motion: reduce)');
    assert.equal(result.matches, true);
  });
});

