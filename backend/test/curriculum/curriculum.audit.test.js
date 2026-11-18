import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, validateProgram, simulate } from '../../../shared/game.js';
import {
  LEVEL_CURRICULUM,
  VISUAL_LEGEND,
  BLOCK_DEFINITIONS,
  INTENTIONAL_FAILURE_EXAMPLE,
  getLevelCurriculum,
  auditCurriculum,
  diagnoseFailure
} from '../../../shared/curriculum.js';

test('Curriculum Audit: 32 Levels Complete and Mechanically Accurate', async (t) => {
  await t.test('auditCurriculum passes with zero errors for all 32 levels', () => {
    assert.ok(Object.keys(VISUAL_LEGEND).length >= 7, 'VISUAL_LEGEND must define core mechanics');
    assert.ok(Object.keys(BLOCK_DEFINITIONS).length >= 9, 'BLOCK_DEFINITIONS must define core blocks');
    assert.equal(Object.keys(LEVEL_CURRICULUM).length, 32, 'LEVEL_CURRICULUM must contain 32 levels');
    const result = auditCurriculum(levels);
    assert.equal(result.valid, true, `Audit failed: ${result.errors.join(', ')}`);
    assert.equal(result.errors.length, 0);
  });

  await t.test('every level contains required educational and pedagogical attributes', () => {
    for (let id = 1; id <= 32; id++) {
      const curriculum = getLevelCurriculum(id);
      assert.ok(curriculum, `Level ${id} curriculum must exist`);
      assert.equal(curriculum.id, id);
      assert.ok(curriculum.title && curriculum.title.length > 0, `Level ${id} title missing`);
      assert.ok(curriculum.zone && curriculum.zone.length > 0, `Level ${id} zone missing`);
      assert.ok(curriculum.objective && curriculum.objective.length > 0, `Level ${id} objective missing`);
      assert.ok(curriculum.learningObjective && curriculum.learningObjective.length > 0, `Level ${id} learningObjective missing`);
      assert.ok(curriculum.newConcept && curriculum.newConcept.length > 0, `Level ${id} newConcept missing`);
      assert.ok(Array.isArray(curriculum.prerequisites), `Level ${id} prerequisites must be array`);
      assert.ok(Array.isArray(curriculum.practisedSkills), `Level ${id} practisedSkills must be array`);
      assert.ok(Array.isArray(curriculum.allowedBlocks) && curriculum.allowedBlocks.length > 0, `Level ${id} allowedBlocks missing`);
      assert.ok(curriculum.conceptExplanation && curriculum.conceptExplanation.length > 0, `Level ${id} conceptExplanation missing`);
      assert.ok(Array.isArray(curriculum.visualLegend) && curriculum.visualLegend.length > 0, `Level ${id} visualLegend missing`);
      assert.ok(curriculum.commonMistake?.mistake && curriculum.commonMistake?.correction, `Level ${id} commonMistake invalid`);
      assert.equal(curriculum.hints?.length, 3, `Level ${id} must have exactly 3 hints`);
      assert.ok(curriculum.postSuccessExplanation && curriculum.postSuccessExplanation.length > 0, `Level ${id} postSuccessExplanation missing`);

      // Verify hints are progressive tiers 1, 2, 3
      assert.equal(curriculum.hints[0].level, 1);
      assert.equal(curriculum.hints[1].level, 2);
      assert.equal(curriculum.hints[2].level, 3);
      assert.ok(curriculum.hints[0].text.length > 10);
      assert.ok(curriculum.hints[1].text.length > 10);
      assert.ok(curriculum.hints[2].text.length > 10);
    }
  });

  await t.test('progressive block staging introduces mechanics chronologically', () => {
    const l1 = getLevelCurriculum(1);
    assert.deepEqual(l1.allowedBlocks, ['cv_move'], 'Level 1 must only allow cv_move for new learners');

    const l2 = getLevelCurriculum(2);
    assert.deepEqual(l2.allowedBlocks, ['cv_move', 'cv_collect'], 'Level 2 adds collection');

    const l3 = getLevelCurriculum(3);
    assert.deepEqual(l3.allowedBlocks, ['cv_move', 'cv_left', 'cv_right', 'cv_collect'], 'Level 3 adds turns');

    const l4 = getLevelCurriculum(4);
    assert.ok(l4.allowedBlocks.includes('cv_repeat'), 'Level 4 introduces repeat loops');
    assert.ok(!l4.allowedBlocks.includes('cv_jump'));

    const l5 = getLevelCurriculum(5);
    assert.ok(l5.allowedBlocks.includes('cv_jump'));
    assert.ok(!l5.allowedBlocks.includes('cv_activate'));

    const l6 = getLevelCurriculum(6);
    assert.ok(l6.allowedBlocks.includes('cv_activate'));
    assert.ok(!l6.allowedBlocks.includes('cv_if'));

    const l7 = getLevelCurriculum(7);
    assert.ok(l7.allowedBlocks.includes('cv_if'));
    assert.ok(l7.allowedBlocks.includes('cv_sensor'));
    assert.ok(!l7.allowedBlocks.includes('cv_if_else'));

    const l10 = getLevelCurriculum(10);
    assert.ok(l10.allowedBlocks.includes('cv_if_else'));
    assert.ok(!l10.allowedBlocks.includes('cv_pulse'));

    const l11 = getLevelCurriculum(11);
    assert.ok(l11.allowedBlocks.includes('cv_pulse'));
  });

  await t.test('all 32 worked examples have valid AST and pass canonical simulation against demo boards', () => {
    for (let id = 1; id <= 32; id++) {
      const curriculum = getLevelCurriculum(id);
      const { workedExample } = curriculum;
      assert.ok(workedExample, `Level ${id} must have workedExample`);
      assert.ok(workedExample.title, `Level ${id} workedExample must have title`);
      assert.ok(workedExample.explanation, `Level ${id} workedExample must have explanation`);
      assert.ok(Array.isArray(workedExample.demoMap), `Level ${id} demoMap must be array`);
      assert.ok(workedExample.demoInitialState, `Level ${id} demoInitialState must exist`);

      // 1. AST Validation
      const isValid = validateProgram(workedExample.program);
      assert.equal(isValid, true, `Worked example for level ${id} has invalid AST`);

      // 2. Canonical Simulation Execution
      const demoLevel = {
        id: `demo-${id}`,
        title: workedExample.title,
        map: workedExample.demoMap,
        direction: workedExample.demoInitialState.direction,
        bossHealth: workedExample.demoLevel?.bossHealth ?? (workedExample.demoMap.some(r => r.includes('X')) ? 3 : 0)
      };

      const simResult = simulate(demoLevel, workedExample.program, { recordConditions: true });
      if (workedExample.isIntentionalFailure) {
        assert.equal(simResult.passed, false, `Level ${id} intentional failure example should not pass`);
        assert.equal(simResult.state.event, 'loop_limit');
      } else {
        assert.equal(simResult.passed, true, `Level ${id} worked example did not pass canonical simulation: ${simResult.message}`);
      }
      assert.ok(simResult.frames.length >= 2, `Level ${id} simulation frames must be non-empty`);

      // 3. Assert specific demonstrated outcomes
      if (workedExample.expectedOutcome) {
        if (workedExample.expectedOutcome.finalPosition) {
          assert.equal(simResult.state.x, workedExample.expectedOutcome.finalPosition.x, `Level ${id} final X mismatch`);
          assert.equal(simResult.state.y, workedExample.expectedOutcome.finalPosition.y, `Level ${id} final Y mismatch`);
        }
        if (workedExample.expectedOutcome.collectedCount !== undefined) {
          assert.equal(simResult.state.collected.length, workedExample.expectedOutcome.collectedCount, `Level ${id} collected count mismatch`);
        }
        if (workedExample.expectedOutcome.bridgeDeployed !== undefined) {
          assert.equal(simResult.state.bridge, workedExample.expectedOutcome.bridgeDeployed, `Level ${id} bridge status mismatch`);
        }
        if (workedExample.expectedOutcome.bossHP !== undefined) {
          assert.equal(simResult.state.bossHP, workedExample.expectedOutcome.bossHP, `Level ${id} boss HP mismatch`);
        }
      }
    }
  });

  await t.test('demonstrates true and false sensor conditions, if/else branching, and intentional failure', () => {
    // 1. Condition TRUE case (Level 7)
    const l7 = getLevelCurriculum(7);
    const l7Sim = simulate(
      { id: 'demo-7', title: 'L7 Demo', map: l7.workedExample.demoMap, direction: 0 },
      l7.workedExample.program,
      { recordConditions: true }
    );
    assert.equal(l7Sim.passed, true);
    const l7CondFrame = l7Sim.frames.find(f => f.event === 'condition');
    assert.ok(l7CondFrame, 'L7 must record a condition evaluation frame');
    assert.equal(l7CondFrame.condition.outcome, true, 'L7 sensor(energy) must evaluate to TRUE on shard tile');
    assert.ok(l7Sim.state.collected.length >= 1, 'L7 must have collected shard in conditional body');

    // 2. Condition FALSE case (Level 17)
    const l17 = getLevelCurriculum(17);
    const l17Sim = simulate(
      { id: 'demo-17', title: 'L17 Demo', map: l17.workedExample.demoMap, direction: 0 },
      l17.workedExample.program,
      { recordConditions: true }
    );
    assert.equal(l17Sim.passed, true);
    const l17CondFrame = l17Sim.frames.find(f => f.event === 'condition');
    assert.ok(l17CondFrame, 'L17 must record a condition evaluation frame');
    assert.equal(l17CondFrame.condition.outcome, false, 'L17 sensor(energy) must evaluate to FALSE on empty floor');
    assert.equal(l17Sim.state.collected.length, 0, 'L17 body must be skipped when sensor is FALSE');

    // 3. Two-way If / Else branching (Level 10)
    const l10 = getLevelCurriculum(10);
    const l10Sim = simulate(
      { id: 'demo-10', title: 'L10 Demo', map: l10.workedExample.demoMap, direction: 0 },
      l10.workedExample.program,
      { recordConditions: true }
    );
    assert.equal(l10Sim.passed, true);
    const condFrames = l10Sim.frames.filter(f => f.event === 'condition');
    assert.ok(condFrames.length >= 2, 'L10 must record multiple condition frames');
    // First evaluation: floor ahead -> wall is FALSE -> took ELSE branch (move)
    assert.equal(condFrames[0].condition.outcome, false, 'First check: wall ahead is FALSE');
    assert.ok(condFrames[0].condition.explanation.includes('Executing ELSE body'));
    // Second evaluation: wall ahead -> wall is TRUE -> took IF branch (turn right)
    assert.equal(condFrames[1].condition.outcome, true, 'Second check: wall ahead is TRUE');
    assert.ok(condFrames[1].condition.explanation.includes('Executing IF body'));

    // 4. Intentional failure demonstration
    assert.equal(INTENTIONAL_FAILURE_EXAMPLE.isIntentionalFailure, true);
    const failSim = simulate(
      INTENTIONAL_FAILURE_EXAMPLE.demoLevel,
      INTENTIONAL_FAILURE_EXAMPLE.program,
      { recordConditions: true }
    );
    assert.equal(failSim.passed, false, 'Intentional failure demo must fail');
    assert.equal(failSim.state.event, 'crash', 'Intentional failure demo must halt on collision');
    assert.ok(failSim.message.includes('Route blocked'), 'Failure message must report collision');
  });

  await t.test('diagnoseFailure returns grounded advice distinguishing mistakes from suggestions', () => {
    const level5 = levels[4]; // Level 5: Broken Circuit

    // Hazard crash
    const hazardCrash = diagnoseFailure(level5, { event: 'crash', message: 'Corruption hazard breach', x: 2, y: 1 });
    assert.ok(hazardCrash.diagnosis.includes('corruption hazard'));
    assert.ok(hazardCrash.suggestion.includes('Jump Across Breach'));
    assert.equal(hazardCrash.hintTier, 2);

    // Wall crash
    const wallCrash = diagnoseFailure(level5, { event: 'crash', message: 'Collision with perimeter barrier', x: 0, y: 1 });
    assert.ok(wallCrash.diagnosis.includes('wall or obstacle'));
    assert.ok(wallCrash.suggestion.includes('Turn before taking another step'));
    assert.equal(wallCrash.hintTier, 2);

    // Missed terminal
    const terminalMiss = diagnoseFailure(level5, { event: 'miss', message: 'No terminal at current position' });
    assert.ok(terminalMiss.diagnosis.includes('Activate Terminal was called'));
    assert.ok(terminalMiss.suggestion.includes('Step directly onto the "T" tile'));
    assert.equal(terminalMiss.hintTier, 2);

    // Missed energy
    const energyMiss = diagnoseFailure(level5, { event: 'miss', message: 'No energy shard on current position' });
    assert.ok(energyMiss.diagnosis.includes('Collect Energy was called on an empty tile'));
    assert.ok(energyMiss.suggestion.includes('diamond shard tile'));
    assert.equal(energyMiss.hintTier, 2);

    // Missed pulse
    const pulseMiss = diagnoseFailure(level5, { event: 'miss', message: 'Pulse failed: no guardian in range' });
    assert.ok(pulseMiss.diagnosis.includes('Pulse discharge fired but no guardian was within 3 tiles'));
    assert.ok(pulseMiss.suggestion.includes('facing the guardian (X)'));
    assert.equal(pulseMiss.hintTier, 2);

    // Unfinished program
    const unfinished = diagnoseFailure(level5, { event: null, x: 1, y: 1 });
    assert.ok(unfinished.diagnosis.includes('Program finished before reaching the objective'));
    assert.ok(unfinished.suggestion.length > 0);
    assert.equal(unfinished.hintTier, 1);
  });
});
