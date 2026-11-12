import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  compileBlockSequence,
  validateProgramAST,
  programToPreviewCode
} from '../src/components/game/blockly/astCompiler.js';

describe('Blockly AST Compiler & Validation Rules', () => {
  test('compiles linear sequence of atomic drone actions', () => {
    // Mock block chain: move -> left -> right -> collect -> jump -> activate -> pulse
    const createMockBlock = (type, next = null) => ({
      type,
      getNextBlock: () => next
    });

    const chain = createMockBlock('cv_move',
      createMockBlock('cv_left',
        createMockBlock('cv_right',
          createMockBlock('cv_collect',
            createMockBlock('cv_jump',
              createMockBlock('cv_activate',
                createMockBlock('cv_pulse')
              )
            )
          )
        )
      )
    );

    const ast = compileBlockSequence(chain);
    assert.deepEqual(ast, [
      { type: 'move' },
      { type: 'left' },
      { type: 'right' },
      { type: 'collect' },
      { type: 'jump' },
      { type: 'activate' },
      { type: 'pulse' }
    ]);

    const preview = programToPreviewCode(ast);
    assert.ok(preview.includes('drone.move();'));
    assert.ok(preview.includes('drone.left();'));
    assert.ok(preview.includes('drone.collect();'));
  });

  test('compiles cv_repeat block with nested actions', () => {
    const moveBlock = {
      type: 'cv_move',
      getNextBlock: () => null
    };

    const repeatBlock = {
      type: 'cv_repeat',
      getFieldValue: (field) => (field === 'COUNT' ? '5' : null),
      getInputTargetBlock: (name) => (name === 'DO' ? moveBlock : null),
      getNextBlock: () => null
    };

    const ast = compileBlockSequence(repeatBlock);
    assert.deepEqual(ast, [
      {
        type: 'repeat',
        count: 5,
        body: [{ type: 'move' }]
      }
    ]);

    const preview = programToPreviewCode(ast);
    assert.ok(preview.includes('repeat (5 times) {'));
    assert.ok(preview.includes('drone.move();'));
  });

  test('compiles cv_if_else block with sensor input and branches', () => {
    const sensorBlock = {
      type: 'cv_sensor',
      getFieldValue: (field) => (field === 'SENSOR' ? 'wall' : null)
    };

    const leftBlock = {
      type: 'cv_left',
      getNextBlock: () => null
    };

    const moveBlock = {
      type: 'cv_move',
      getNextBlock: () => null
    };

    const ifElseBlock = {
      type: 'cv_if_else',
      getInputTargetBlock: (name) => {
        if (name === 'SENSOR') return sensorBlock;
        if (name === 'DO') return leftBlock;
        if (name === 'ELSE') return moveBlock;
        return null;
      },
      getNextBlock: () => null
    };

    const ast = compileBlockSequence(ifElseBlock);
    assert.deepEqual(ast, [
      {
        type: 'if',
        sensor: 'wall',
        body: [{ type: 'left' }],
        elseBody: [{ type: 'move' }]
      }
    ]);

    const preview = programToPreviewCode(ast);
    assert.ok(preview.includes('if (drone.sensor("wall")) {'));
    assert.ok(preview.includes('drone.left();'));
    assert.ok(preview.includes('else {'));
    assert.ok(preview.includes('drone.move();'));
  });

  test('rejects if block without connected sensor', () => {
    const ifBlock = {
      type: 'cv_if',
      getInputTargetBlock: (name) => (name === 'DO' ? { type: 'cv_move', getNextBlock: () => null } : null),
      getNextBlock: () => null
    };

    assert.throws(() => {
      compileBlockSequence(ifBlock);
    }, /attach a sensor block/);
  });

  test('rejects repeat block with empty body', () => {
    const emptyRepeat = {
      type: 'cv_repeat',
      getFieldValue: () => '3',
      getInputTargetBlock: () => null,
      getNextBlock: () => null
    };

    assert.throws(() => {
      compileBlockSequence(emptyRepeat);
    }, /cannot be empty/);
  });

  test('validates compiled AST correctly', () => {
    const emptyRes = validateProgramAST([]);
    assert.equal(emptyRes.valid, false);
    assert.ok(emptyRes.error.includes('empty'));

    const validRes = validateProgramAST([
      { type: 'repeat', count: 3, body: [{ type: 'move' }] }
    ]);
    assert.equal(validRes.valid, true);
    assert.equal(validRes.error, null);
  });
});
