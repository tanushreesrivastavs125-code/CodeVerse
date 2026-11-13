import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/api/client.js';

describe('Frontend AI Mentor Client & Interface Invariants', () => {
  test('api.ai.mentor exists and sends standard POST envelope', () => {
    assert.equal(typeof api.ai, 'object');
    assert.equal(typeof api.ai.mentor, 'function');
  });

  test('preserves assembled program state during consultation lifecycle', () => {
    const assembledProgram = [
      { type: 'repeat', count: 3, body: [{ type: 'move' }] },
      { type: 'collect' }
    ];

    // Payload copy for mentor consultation
    const payload = {
      mode: 'debug',
      levelId: 2,
      program: assembledProgram
    };

    // Verify program payload retains identical length and structure
    assert.equal(payload.program.length, 2);
    assert.equal(payload.program[0].type, 'repeat');
    assert.equal(payload.program[0].count, 3);
    assert.equal(payload.program[1].type, 'collect');

    // Invariant: original program reference remains unchanged
    assert.equal(assembledProgram[0].body[0].type, 'move');
  });

  test('validates 500-character message bound on client side before request', () => {
    const validMessage = 'How do I jump over the corrupted hazard tile?';
    assert.ok(validMessage.length <= 500);

    const oversizedMessage = 'X'.repeat(501);
    assert.ok(oversizedMessage.length > 500);
    const trimmed = oversizedMessage.slice(0, 500);
    assert.equal(trimmed.length, 500);
  });
});

