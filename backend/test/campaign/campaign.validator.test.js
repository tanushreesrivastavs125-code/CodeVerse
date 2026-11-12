import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateLevelId, validateRunPayload } from '../../src/validators/campaign.validator.js';

describe('Campaign Validator Rules', () => {
  describe('validateLevelId', () => {
    test('accepts valid integer level numbers and numeric strings', () => {
      assert.equal(validateLevelId(1), 1);
      assert.equal(validateLevelId(24), 24);
      assert.equal(validateLevelId('2'), 2);
      assert.equal(validateLevelId('100'), 100);
    });

    test('rejects missing, undefined, null, or empty level ID', () => {
      assert.throws(() => validateLevelId(undefined), /Level identifier is required/);
      assert.throws(() => validateLevelId(null), /Level identifier is required/);
      assert.throws(() => validateLevelId(''), /Level identifier is required/);
    });

    test('rejects negative numbers, zero, floats, and non-numeric strings', () => {
      assert.throws(() => validateLevelId(0), /positive integer/);
      assert.throws(() => validateLevelId(-5), /positive integer/);
      assert.throws(() => validateLevelId(1.5), /positive integer/);
      assert.throws(() => validateLevelId('abc'), /positive integer/);
      assert.throws(() => validateLevelId(1001), /between 1 and 1000/);
    });
  });

  describe('validateRunPayload', () => {
    test('accepts valid payload with program list', () => {
      const validPayload = {
        program: [{ type: 'move' }]
      };
      const result = validateRunPayload(validPayload);
      assert.deepEqual(result.program, [{ type: 'move' }]);
      assert.equal(result.idempotencyKey, undefined);
    });

    test('accepts valid payload with optional idempotencyKey', () => {
      const validPayload = {
        program: [{ type: 'move' }],
        idempotencyKey: 'idemp-12345'
      };
      const result = validateRunPayload(validPayload);
      assert.equal(result.idempotencyKey, 'idemp-12345');
    });

    test('rejects non-object, null, or array body', () => {
      assert.throws(() => validateRunPayload(null), /Request body must be a JSON object/);
      assert.throws(() => validateRunPayload([]), /Request body must be a JSON object/);
      assert.throws(() => validateRunPayload('string'), /Request body must be a JSON object/);
    });

    test('rejects missing or non-array program field', () => {
      assert.throws(() => validateRunPayload({}), /Program must be a list of commands/);
      assert.throws(() => validateRunPayload({ program: 'move' }), /Program must be a list of commands/);
      assert.throws(() => validateRunPayload({ program: null }), /Program must be a list of commands/);
    });

    test('strictly rejects forbidden client outcome and reward fields', () => {
      const forbiddenSamples = [
        { program: [], success: true },
        { program: [], stars: 3 },
        { program: [], score: 100 },
        { program: [], xp: 100 },
        { program: [], totalXp: 5000 },
        { program: [], coins: 1000 },
        { program: [], userId: 'hacked' },
        { program: [], user: {} },
        { program: [], unlocked: true },
        { program: [], level: 5 },
        { program: [], role: 'admin' }
      ];

      for (const payload of forbiddenSamples) {
        assert.throws(
          () => validateRunPayload(payload),
          /Forbidden client-provided field/
        );
      }
    });

    test('rejects unrecognized payload fields', () => {
      const payload = {
        program: [{ type: 'move' }],
        extraParam: 'unsupported'
      };
      assert.throws(() => validateRunPayload(payload), /Unrecognized payload field: "extraParam"/);
    });
  });
});
