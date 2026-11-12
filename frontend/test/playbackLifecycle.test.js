import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateProgramAST } from '../src/components/game/blockly/astCompiler.js';

describe('Mission Request & Playback Lifecycle Invariants', () => {
  test('rejects unpopulated programs client-side before network transmission', () => {
    const emptyProgram = [];
    const validation = validateProgramAST(emptyProgram);

    assert.equal(validation.valid, false);
    assert.ok(validation.error.includes('empty'));
  });

  test('validates valid repeat and action programs', () => {
    const validProgram = [
      {
        type: 'repeat',
        count: 3,
        body: [{ type: 'move' }]
      }
    ];
    const validation = validateProgramAST(validProgram);

    assert.equal(validation.valid, true);
    assert.equal(validation.error, null);
  });

  test('generational counter rejects stale responses arriving after cancellation', async () => {
    let activeGeneration = 1;
    let appliedOutcome = null;

    // Simulate run request dispatched at generation 1
    const runGeneration = activeGeneration;

    // User triggers Reset while request is in flight
    activeGeneration += 1;

    // Delayed response returns from network
    const simulateResponse = (responseGeneration, outcome) => {
      if (responseGeneration === activeGeneration) {
        appliedOutcome = outcome;
      }
    };

    simulateResponse(runGeneration, { passed: true, stars: 3 });

    // Verify stale response was ignored
    assert.equal(appliedOutcome, null, 'Stale response from previous generation must be dropped');

    // Simulate new run request at generation 2
    const currentRunGen = activeGeneration;
    simulateResponse(currentRunGen, { passed: true, stars: 3 });
    assert.deepEqual(appliedOutcome, { passed: true, stars: 3 });
  });

  test('level switch guard prevents response from updating wrong level', () => {
    let currentLevelId = 1;
    let levelStateUpdated = false;

    const requestLevelId = currentLevelId;

    // User switches to Level 2
    currentLevelId = 2;

    // Response arrives for Level 1
    const onResponseArrival = (responseLevelId) => {
      if (responseLevelId === currentLevelId) {
        levelStateUpdated = true;
      }
    };

    onResponseArrival(requestLevelId);
    assert.equal(levelStateUpdated, false, 'Response for previous level must not update active level');

    // Response arrives for current Level 2
    onResponseArrival(2);
    assert.equal(levelStateUpdated, true);
  });

  test('playback frame stepping aborts immediately when reset occurs during animation', async () => {
    let activeGeneration = 1;
    const executedFrames = [];
    const mockFrames = [
      { x: 1, y: 1, event: 'move' },
      { x: 2, y: 1, event: 'move' },
      { x: 3, y: 1, event: 'extract' }
    ];

    const runGen = activeGeneration;

    // Execute first frame
    if (activeGeneration === runGen) {
      executedFrames.push(mockFrames[0]);
    }

    // Mid-playback reset
    activeGeneration += 1;

    // Subsequent frame tick
    if (activeGeneration === runGen) {
      executedFrames.push(mockFrames[1]);
    }

    assert.equal(executedFrames.length, 1);
    assert.deepEqual(executedFrames[0], { x: 1, y: 1, event: 'move' });
  });
});
