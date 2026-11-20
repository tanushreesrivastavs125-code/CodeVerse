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

  test('compiles cv_var_set, cv_var_change, and cv_while with compare condition', () => {
    const valBlock = {
      type: 'cv_val_num',
      getFieldValue: (f) => (f === 'NUM' ? '10' : null)
    };

    const varSetBlock = {
      type: 'cv_var_set',
      getFieldValue: (f) => (f === 'VAR' ? 'energy' : null),
      getInputTargetBlock: (n) => (n === 'VALUE' ? valBlock : null),
      getNextBlock: () => varChangeBlock
    };

    const varChangeBlock = {
      type: 'cv_var_change',
      getFieldValue: (f) => (f === 'VAR' ? 'energy' : (f === 'DELTA' ? '-1' : null)),
      getNextBlock: () => whileBlock
    };

    const compareBlock = {
      type: 'cv_compare',
      getFieldValue: (f) => (f === 'OP' ? '>' : null),
      getInputTargetBlock: (n) => {
        if (n === 'LEFT') return { type: 'cv_var_get', getFieldValue: () => 'energy' };
        if (n === 'RIGHT') return { type: 'cv_val_num', getFieldValue: () => '0' };
        return null;
      }
    };

    const moveBlock = {
      type: 'cv_move',
      getNextBlock: () => null
    };

    const whileBlock = {
      type: 'cv_while',
      getInputTargetBlock: (n) => {
        if (n === 'CONDITION') return compareBlock;
        if (n === 'DO') return moveBlock;
        return null;
      },
      getNextBlock: () => null
    };

    const ast = compileBlockSequence(varSetBlock);
    assert.deepEqual(ast, [
      { type: 'var_set', var: 'energy', variable: 'energy', value: 10 },
      { type: 'var_change', var: 'energy', variable: 'energy', amount: -1 },
      {
        type: 'while',
        condition: {
          type: 'compare',
          left: { type: 'var_get', var: 'energy' },
          op: '>',
          right: 0
        },
        body: [{ type: 'move' }]
      }
    ]);

    const validRes = validateProgramAST(ast);
    assert.equal(validRes.valid, true);

    const preview = programToPreviewCode(ast);
    assert.ok(preview.includes('let energy = 10;'));
    assert.ok(preview.includes('energy -= 1;'));
    assert.ok(preview.includes('while (energy > 0) {'));
  });

  test('compiles cv_array_create, cv_array_set, cv_array_get, and cv_array_length', () => {
    const arraySetBlock = {
      type: 'cv_array_set',
      getFieldValue: (f) => (f === 'NAME' ? 'codes' : null),
      getInputTargetBlock: (n) => {
        if (n === 'INDEX') return { type: 'cv_val_num', getFieldValue: () => '1' };
        if (n === 'VALUE') return { type: 'cv_val_num', getFieldValue: () => '9' };
        return null;
      },
      getNextBlock: () => null
    };

    const arrayCreateBlock = {
      type: 'cv_array_create',
      getFieldValue: (f) => (f === 'NAME' ? 'codes' : (f === 'VALUES' ? '2, 1, 3' : null)),
      getNextBlock: () => arraySetBlock
    };

    const ast = compileBlockSequence(arrayCreateBlock);
    assert.deepEqual(ast, [
      {
        type: 'array_init',
        name: 'codes',
        array: 'codes',
        values: [2, 1, 3]
      },
      {
        type: 'array_set',
        name: 'codes',
        array: 'codes',
        index: 1,
        value: 9
      }
    ]);

    const validRes = validateProgramAST(ast);
    assert.equal(validRes.valid, true);

    const preview = programToPreviewCode(ast);
    assert.ok(preview.includes('let codes = [2, 1, 3];'));
    assert.ok(preview.includes('codes[1] = 9;'));
  });
});
