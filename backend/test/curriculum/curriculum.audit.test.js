import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, validateProgram } from '../../../shared/game.js';
import {
  LEVEL_CURRICULUM,
  VISUAL_LEGEND,
  BLOCK_DEFINITIONS,
  getLevelCurriculum,
  auditCurriculum,
  diagnoseFailure
} from '../../../shared/curriculum.js';

test('Curriculum Audit: 24 Levels Complete and Mechanically Accurate', async (t) => {
  await t.test('auditCurriculum passes with zero errors for all 24 levels', () => {
    assert.ok(Object.keys(VISUAL_LEGEND).length >= 7, 'VISUAL_LEGEND must define core mechanics');
    assert.ok(Object.keys(BLOCK_DEFINITIONS).length >= 9, 'BLOCK_DEFINITIONS must define core blocks');
    assert.equal(Object.keys(LEVEL_CURRICULUM).length, 24, 'LEVEL_CURRICULUM must contain 24 levels');
    const result = auditCurriculum(levels);
    assert.equal(result.valid, true, `Audit failed: ${result.errors.join(', ')}`);
    assert.equal(result.errors.length, 0);
  });

  await t.test('every level contains required educational and pedagogical attributes', () => {
    for (let id = 1; id <= 24; id++) {
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
    assert.deepEqual(l1.allowedBlocks, ['cv_move', 'cv_repeat']);

    const l2 = getLevelCurriculum(2);
    assert.ok(l2.allowedBlocks.includes('cv_collect'));
    assert.ok(!l2.allowedBlocks.includes('cv_left'));

    const l3 = getLevelCurriculum(3);
    assert.ok(l3.allowedBlocks.includes('cv_left'));
    assert.ok(l3.allowedBlocks.includes('cv_right'));
    assert.ok(!l3.allowedBlocks.includes('cv_jump'));

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

  await t.test('worked examples have valid AST structure for validation engine', () => {
    for (let id = 1; id <= 12; id++) {
      const curriculum = getLevelCurriculum(id);
      const { workedExample } = curriculum;
      assert.ok(workedExample, `Level ${id} must have workedExample`);
      assert.ok(workedExample.title);
      assert.ok(workedExample.explanation);
      assert.ok(Array.isArray(workedExample.demoMap));
      assert.ok(workedExample.demoInitialState);
      const isValid = validateProgram(workedExample.program);
      assert.equal(isValid, true, `Worked example for level ${id} has invalid AST`);
    }
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
