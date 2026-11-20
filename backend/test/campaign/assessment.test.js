import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { runLevelAssessment } from '../../src/services/assessmentService.js';
import { levels } from '../../../shared/game.js';

describe('Search Assessment Service & Parity', () => {
  const level47 = levels.find((l) => l.id === 47);
  const level50 = levels.find((l) => l.id === 50);

  // Correct canonical linear search algorithm for Level 47
  const validLinearSearch = [
    { type: 'var_set', variable: 'i', value: 0 },
    { type: 'var_set', variable: 'found', value: -1 },
    {
      type: 'while',
      condition: { type: 'compare', left: 'i', op: '<', right: { type: 'array_length', name: 'codes' } },
      body: [
        {
          type: 'if',
          condition: { type: 'compare', left: { type: 'array_get', name: 'codes', index: 'i' }, op: '==', right: 'target' },
          body: [
            { type: 'var_set', variable: 'found', value: 'i' },
            { type: 'break' }
          ]
        },
        { type: 'var_change', variable: 'i', amount: 1 }
      ]
    }
  ];

  // Correct canonical binary search algorithm for Level 50
  const validBinarySearch = [
    { type: 'var_set', variable: 'low', value: 0 },
    {
      type: 'var_set',
      variable: 'high',
      value: { type: 'binary_op', op: '-', left: { type: 'array_length', name: 'coreKeys' }, right: 1 }
    },
    { type: 'var_set', variable: 'found', value: -1 },
    {
      type: 'while',
      condition: { type: 'compare', left: 'low', op: '<=', right: 'high' },
      body: [
        { type: 'var_set', variable: 'mid', value: { type: 'midpoint', low: 'low', high: 'high' } },
        {
          type: 'if',
          condition: { type: 'compare', left: { type: 'array_get', name: 'coreKeys', index: 'mid' }, op: '==', right: 'target' },
          body: [
            { type: 'var_set', variable: 'found', value: 'mid' },
            { type: 'break' }
          ],
          elseBody: [
            {
              type: 'if',
              condition: { type: 'compare', left: { type: 'array_get', name: 'coreKeys', index: 'mid' }, op: '<', right: 'target' },
              body: [
                { type: 'var_set', variable: 'low', value: { type: 'binary_op', op: '+', left: 'mid', right: 1 } }
              ],
              elseBody: [
                { type: 'var_set', variable: 'high', value: { type: 'binary_op', op: '-', left: 'mid', right: 1 } }
              ]
            }
          ]
        }
      ]
    }
  ];

  test('private assessment fixtures are absent from shared game.js levels', () => {
    assert.equal(level47.searchCases, undefined, 'Level 47 must not contain public searchCases');
    assert.equal(level50.searchCases, undefined, 'Level 50 must not contain public searchCases');
  });

  test('valid linear search program passes all Level 47 private assessment cases', () => {
    const outcome = runLevelAssessment(47, validLinearSearch);
    assert.equal(outcome.passed, true, `Assessment should pass: ${outcome.message}`);
  });

  test('valid binary search program passes all Level 50 private assessment cases', () => {
    const outcome = runLevelAssessment(50, validBinarySearch);
    assert.equal(outcome.passed, true, `Assessment should pass: ${outcome.message}`);
  });

  test('regression: program that sets expected found index and then crashes fails assessment', () => {
    const crashAfterFound = [
      ...validLinearSearch,
      // Deliberate out-of-bounds crash after finding target
      { type: 'array_get', name: 'codes', index: 999 }
    ];
    const outcome = runLevelAssessment(47, crashAfterFound);
    assert.equal(outcome.passed, false, 'Program that crashes after setting found must fail assessment');
    assert.match(outcome.message, /Runtime error|Program halted or crashed/i);
  });

  test('regression: program that sets expected found index and exceeds loop limits fails assessment', () => {
    const runawayAfterFound = [
      ...validLinearSearch,
      // Deliberate runaway while loop
      {
        type: 'while',
        condition: { type: 'compare', left: 1, op: '==', right: 1 },
        body: [{ type: 'var_change', variable: 'i', amount: 0 }]
      }
    ];
    const outcome = runLevelAssessment(47, runawayAfterFound);
    assert.equal(outcome.passed, false, 'Program that exceeds loop limit must fail assessment');
    assert.match(outcome.message, /Program halted or crashed/i);
  });

  test('hardcoded solution for Level 47 (found = 2) fails assessment on absent and varied targets', () => {
    const hardcodedLinear = [
      { type: 'var_set', variable: 'found', value: 2 }
    ];
    const outcome = runLevelAssessment(47, hardcodedLinear);
    assert.equal(outcome.passed, false, 'Hardcoded found = 2 must fail on other test cases');
    assert.match(outcome.message, /Linear search evaluation failed|Program halted or crashed/i);
  });

  test('hardcoded solution for Level 50 (found = 3) fails assessment on other test cases', () => {
    const hardcodedBinary = [
      { type: 'var_set', variable: 'found', value: 3 }
    ];
    const outcome = runLevelAssessment(50, hardcodedBinary);
    assert.equal(outcome.passed, false, 'Hardcoded found = 3 must fail on other test cases');
    assert.match(outcome.message, /Binary search evaluation failed|Program halted or crashed/i);
  });

  test('learner program attempting to overwrite mission target variable is rejected', () => {
    const overwriteTarget = [
      { type: 'var_set', variable: 'target', value: 27 },
      ...validLinearSearch
    ];
    const outcome = runLevelAssessment(47, overwriteTarget);
    assert.equal(outcome.passed, false, 'Overwriting mission input variable target must fail');
    assert.match(outcome.message, /Cannot modify input variable "target"/i);
  });

  test('learner program attempting to re-initialize mission array is rejected', () => {
    const overwriteArray = [
      { type: 'array_init', name: 'codes', values: [14, 9, 27, 42, 6] },
      ...validLinearSearch
    ];
    const outcome = runLevelAssessment(47, overwriteArray);
    assert.equal(outcome.passed, false, 'Re-initializing mission input array must fail');
    assert.match(outcome.message, /Cannot re-initialize input array "codes"/i);
  });

  test('linear search without break fails early termination requirement', () => {
    const noBreakLinear = [
      { type: 'var_set', variable: 'i', value: 0 },
      { type: 'var_set', variable: 'found', value: -1 },
      {
        type: 'while',
        condition: { type: 'compare', left: 'i', op: '<', right: { type: 'array_length', name: 'codes' } },
        body: [
          {
            type: 'if',
            condition: { type: 'compare', left: { type: 'array_get', name: 'codes', index: 'i' }, op: '==', right: 'target' },
            body: [
              { type: 'var_set', variable: 'found', value: 'i' }
              // Missing break!
            ]
          },
          { type: 'var_change', variable: 'i', amount: 1 }
        ]
      }
    ];
    const outcome = runLevelAssessment(47, noBreakLinear);
    assert.equal(outcome.passed, false, 'Linear search without break must fail early termination check');
    assert.match(outcome.message, /Did not break out of loop early|requires breaking out of the loop early/i);
  });

  test('binary search exceeding logarithmic comparison budget fails assessment', () => {
    // Deliberate non-halving search that does linear comparisons
    const inefficientSearch = [
      { type: 'var_set', variable: 'low', value: 0 },
      {
        type: 'var_set',
        variable: 'high',
        value: { type: 'binary_op', op: '-', left: { type: 'array_length', name: 'coreKeys' }, right: 1 }
      },
      { type: 'var_set', variable: 'found', value: -1 },
      {
        type: 'while',
        condition: { type: 'compare', left: 'low', op: '<=', right: 'high' },
        body: [
          {
            type: 'if',
            condition: { type: 'compare', left: { type: 'array_get', name: 'coreKeys', index: 'low' }, op: '==', right: 'target' },
            body: [
              { type: 'var_set', variable: 'found', value: 'low' },
              { type: 'break' }
            ]
          },
          // Inefficiently incrementing low by 1 instead of halving
          { type: 'var_set', variable: 'low', value: { type: 'binary_op', op: '+', left: 'low', right: 1 } }
        ]
      }
    ];
    const outcome = runLevelAssessment(50, inefficientSearch);
    assert.equal(outcome.passed, false, 'Linear comparisons in binary search must fail efficiency budget');
    assert.match(outcome.message, /comparison budget exceeded/i);
  });
});
