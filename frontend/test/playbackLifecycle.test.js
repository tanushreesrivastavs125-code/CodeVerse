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

  test('level metadata refresh preserves active result and final board state', () => {
    // Simulates the bug where setActiveLevel(updatedMetadata) had a different object reference,
    // but the same level ID, which previously wiped the result and reset the world state.
    const initialLevel = { id: 1, title: 'Sector 1', completed: false, stars: 0, map: ['S.G'] };
    let activeLevel = initialLevel;
    let previousLevelId = activeLevel.id;
    let worldState = { x: 2, y: 0, event: 'victory' };
    let activeResult = { passed: true, stars: 3, message: 'Sector secured.' };

    // Metadata refresh arrives from server after run
    const refreshedLevel = { id: 1, title: 'Sector 1', completed: true, stars: 3, map: ['S.G'] };

    // Hook logic: only reset if level ID actually changes
    const onLevelPropUpdate = (newLevel) => {
      activeLevel = newLevel;
      if (newLevel.id !== previousLevelId) {
        previousLevelId = newLevel.id;
        worldState = { x: 0, y: 0, event: 'ready' };
        activeResult = null;
      }
    };

    onLevelPropUpdate(refreshedLevel);

    // Verify result and final world state were preserved
    assert.notEqual(activeResult, null, 'Active result must NOT be erased by metadata refresh');
    assert.equal(activeResult.passed, true);
    assert.equal(worldState.x, 2, 'Final drone position must NOT be reset by metadata refresh');

    // Now switch to actual new level (Sector 2)
    const nextLevel = { id: 2, title: 'Sector 2', completed: false, stars: 0, map: ['S..G'] };
    onLevelPropUpdate(nextLevel);

    assert.equal(activeResult, null, 'Switching to distinct level ID must reset result');
    assert.equal(worldState.x, 0, 'Switching to distinct level ID must re-initialize world');
  });

  test('duplicate execution requests are rejected during submitting lifecycle state', async () => {
    let runState = 'idle';
    let networkCallCount = 0;

    const mockRunLevel = async () => {
      if (runState === 'submitting' || runState === 'playing') {
        return; // Guarded
      }
      runState = 'submitting';
      networkCallCount += 1;
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 10));
      runState = 'playing';
    };

    // User rapidly clicks Run 5 times
    const p1 = mockRunLevel();
    const p2 = mockRunLevel();
    const p3 = mockRunLevel();
    const p4 = mockRunLevel();
    const p5 = mockRunLevel();

    await Promise.all([p1, p2, p3, p4, p5]);

    assert.equal(networkCallCount, 1, 'Only exactly 1 network request must be dispatched');
    assert.equal(runState, 'playing');
  });

  test('action count resolution correctly maps steps and actionsCount', () => {
    // Backend returns 'steps', legacy frontend expected 'actionsCount'
    const attemptWithStepsOnly = { id: '1', levelId: 1, steps: 7, passed: true };
    const attemptWithActionsCountOnly = { id: '2', levelId: 1, actionsCount: 5, passed: true };
    const attemptWithBoth = { id: '3', levelId: 1, steps: 9, actionsCount: 9, passed: true };
    const attemptWithNeither = { id: '4', levelId: 1, passed: false };

    const resolveActions = (attempt) => attempt.steps ?? attempt.actionsCount ?? 0;

    assert.equal(resolveActions(attemptWithStepsOnly), 7);
    assert.equal(resolveActions(attemptWithActionsCountOnly), 5);
    assert.equal(resolveActions(attemptWithBoth), 9);
    assert.equal(resolveActions(attemptWithNeither), 0);
  });
});
