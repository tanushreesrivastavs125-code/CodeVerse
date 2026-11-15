import test, { describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setupJsdom } from './helpers/setupJsdom.js';
import { MissionBriefing } from '../src/components/game/controls/MissionBriefing.jsx';
import { LessonIntroductionModal } from '../src/components/game/lessons/LessonIntroductionModal.jsx';
import { InteractiveDemoSandbox } from '../src/components/game/lessons/InteractiveDemoSandbox.jsx';
import { ResultModal } from '../src/components/game/modals/ResultModal.jsx';
import { getToolboxForLevel } from '../src/components/game/blockly/blocklyConfig.js';
import { getLevelCurriculum, INTENTIONAL_FAILURE_EXAMPLE } from '../../shared/curriculum.js';

describe('Stage C: Beginner Lessons, Progressive Toolbox & Useful Guidance Suite', () => {
  let rootElement;
  let root;

  beforeEach(() => {
    setupJsdom();
    rootElement = document.getElementById('root');
    if (!rootElement) {
      rootElement = document.createElement('div');
      rootElement.id = 'root';
      document.body.appendChild(rootElement);
    }
    root = createRoot(rootElement);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }
    mock.reset();
  });

  describe('1. MissionBriefing 3-Tier Graduated Hints & Lesson Launch', () => {
    test('renders 📖 Learn button and triggers onOpenLesson callback', async () => {
      let lessonOpened = false;
      const level = {
        id: 1,
        title: 'Boot Sequence',
        zone: 'Neon Outskirts',
        concept: 'Sequences',
        briefing: 'Move forward 3 tiles',
        par: 3
      };

      await act(async () => {
        root.render(
          React.createElement(MissionBriefing, {
            level,
            onOpenLesson: () => {
              lessonOpened = true;
            }
          })
        );
      });

      const buttons = Array.from(rootElement.querySelectorAll('button'));
      const learnBtn = buttons.find((b) => b.textContent.includes('Learn'));
      assert.ok(learnBtn, '📖 Learn button must be rendered');

      await act(async () => {
        learnBtn.click();
      });

      assert.equal(lessonOpened, true, 'Clicking Learn must invoke onOpenLesson');
    });

    test('reveals hints progressively through 3 graduated tiers', async () => {
      const level = {
        id: 2,
        title: 'Energy Run',
        zone: 'Neon Outskirts',
        concept: 'Actions',
        briefing: 'Collect energy shards',
        par: 6
      };

      await act(async () => {
        root.render(React.createElement(MissionBriefing, { level }));
      });

      // Initially hints are closed
      const hintToggle = Array.from(rootElement.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Need a Hint?')
      );
      assert.ok(hintToggle, 'Need a Hint toggle must exist');

      // Open hints -> Tier 1 (Notice the Goal) is visible
      await act(async () => {
        hintToggle.click();
      });

      assert.ok(rootElement.textContent.includes('Hint 1 // Notice the Goal'));
      assert.ok(!rootElement.textContent.includes('Hint 2 // Helpful Concept'));

      // Click to reveal Tier 2
      const revealTier2Btn = Array.from(rootElement.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Reveal Hint 2')
      );
      assert.ok(revealTier2Btn, 'Reveal Hint 2 button must exist');

      await act(async () => {
        revealTier2Btn.click();
      });

      assert.ok(rootElement.textContent.includes('Hint 2 // Helpful Concept'));
      assert.ok(!rootElement.textContent.includes('Hint 3 // Step-by-Step Suggestion'));

      // Click to reveal Tier 3 (explicit learner action required)
      const revealTier3Btn = Array.from(rootElement.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Reveal Hint 3')
      );
      assert.ok(revealTier3Btn, 'Reveal Hint 3 button must exist');

      await act(async () => {
        revealTier3Btn.click();
      });

      assert.ok(rootElement.textContent.includes('Hint 3 // Step-by-Step Suggestion'));
    });
  });

  describe('2. Progressive Block Staging & Toolbox Filtering', () => {
    test('Level 1 toolbox stages strictly Move Forward (sequence-only for beginners)', () => {
      const level1 = { id: 1 };
      const toolbox = getToolboxForLevel(level1, false);

      const actionCat = toolbox.contents.find((c) => c.name === 'Actions');
      const actionTypes = actionCat.contents.map((b) => b.type);
      assert.deepEqual(actionTypes, ['cv_move'], 'Level 1 must only expose cv_move');

      // Control & Sensors categories must be omitted in staged mode for level 1
      const controlCat = toolbox.contents.find((c) => c.name === 'Control');
      assert.equal(controlCat, undefined, 'Control category should not be exposed in Level 1');

      const sensorCat = toolbox.contents.find((c) => c.name === 'Sensors');
      assert.equal(sensorCat, undefined, 'Sensors category should not be exposed in Level 1');
    });

    test('Show All Blocks toggle exposes full standard toolbox', () => {
      const level1 = { id: 1 };
      const fullToolbox = getToolboxForLevel(level1, true);

      const actionCat = fullToolbox.contents.find((c) => c.name === 'Actions');
      assert.ok(actionCat.contents.length >= 7);

      const sensorCat = fullToolbox.contents.find((c) => c.name === 'Sensors');
      assert.ok(sensorCat && sensorCat.contents.length > 0);
    });

    test('Level 4 stages repeat loops in Control', () => {
      const level4 = { id: 4 };
      const toolbox = getToolboxForLevel(level4, false);

      const controlCat = toolbox.contents.find((c) => c.name === 'Control');
      assert.ok(controlCat, 'Control category must appear in Level 4');
      const controlTypes = controlCat.contents.map((b) => b.type);
      assert.ok(controlTypes.includes('cv_repeat'), 'cv_repeat must be staged in Level 4');
      assert.ok(!controlTypes.includes('cv_if'), 'cv_if must not be staged in Level 4');
    });

    test('Level 7 stages conditional If blocks and Sensors', () => {
      const level7 = { id: 7 };
      const toolbox = getToolboxForLevel(level7, false);

      const controlCat = toolbox.contents.find((c) => c.name === 'Control');
      const controlTypes = controlCat.contents.map((b) => b.type);
      assert.ok(controlTypes.includes('cv_if'), 'cv_if must be staged in Level 7');

      const sensorCat = toolbox.contents.find((c) => c.name === 'Sensors');
      assert.ok(sensorCat !== undefined, 'Sensors category must be exposed in Level 7');
    });
  });

  describe('3. InteractiveDemoSandbox Canonical Simulation & Zero Side Effects', () => {
    test('demonstration steps forward and resets using canonical simulator without network calls', async () => {
      // Mock fetch to assert zero network calls during demo playback
      let fetchCalled = false;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = () => {
        fetchCalled = true;
        return Promise.reject(new Error('Demo sandbox must never make network requests'));
      };

      try {
        const workedExample = {
          title: 'Taking Two Steps',
          explanation: 'Move forward two tiles.',
          demoLevel: {
            id: 'demo-test',
            title: 'Test Demo',
            map: ['####', '#S.G#', '####'],
            direction: 0,
            bossHealth: 0
          },
          demoMap: ['####', '#S.G#', '####'],
          demoInitialState: { x: 1, y: 1, direction: 0 },
          program: [{ type: 'move' }, { type: 'move' }]
        };

        await act(async () => {
          root.render(React.createElement(InteractiveDemoSandbox, { workedExample }));
        });

        assert.ok(rootElement.textContent.includes('Step 0 of 2'));
        assert.ok(rootElement.textContent.includes('Initial Position'));

        const buttons = Array.from(rootElement.querySelectorAll('button'));
        const stepBtn = buttons.find((b) => b.textContent.includes('Step'));
        const resetBtn = buttons.find((b) => b.textContent.includes('Reset'));
        assert.ok(stepBtn, 'Step button must exist');
        assert.ok(resetBtn, 'Reset button must exist');

        // Execute Step 1
        await act(async () => {
          stepBtn.click();
        });

        assert.ok(rootElement.textContent.includes('Step 1 of 2'));
        assert.ok(rootElement.textContent.includes('Move Forward'));

        // Execute Step 2
        await act(async () => {
          stepBtn.click();
        });

        assert.ok(rootElement.textContent.includes('Step 2 of 2'));

        // Reset to 0
        await act(async () => {
          resetBtn.click();
        });

        assert.ok(rootElement.textContent.includes('Step 0 of 2'));
        assert.equal(fetchCalled, false, 'Interactive demo sandbox must never make network requests');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('renders condition explanation when evaluating sensor conditions', async () => {
      const workedExample = {
        title: 'Sensor Check Demo',
        explanation: 'Check energy sensor.',
        demoMap: ['#####', '#SCG#', '#####'],
        demoInitialState: { x: 1, y: 1, direction: 0 },
        program: [
          { type: 'move' },
          { type: 'if', sensor: 'energy', body: [{ type: 'collect' }] },
          { type: 'move' }
        ]
      };

      await act(async () => {
        root.render(React.createElement(InteractiveDemoSandbox, { workedExample }));
      });

      const buttons = Array.from(rootElement.querySelectorAll('button'));
      const stepBtn = buttons.find((b) => b.textContent.includes('Step'));

      // Step 1: Move to C
      await act(async () => {
        stepBtn.click();
      });

      // Step 2: Condition check
      await act(async () => {
        stepBtn.click();
      });

      const conditionEl = rootElement.querySelector('[data-testid="condition-explanation"]');
      assert.ok(conditionEl, 'Condition explanation callout must render');
      assert.ok(conditionEl.textContent.includes('energy') && conditionEl.textContent.includes('TRUE'));
    });

    test('renders intentional failure banner for failure demonstration', async () => {
      await act(async () => {
        root.render(React.createElement(InteractiveDemoSandbox, { workedExample: INTENTIONAL_FAILURE_EXAMPLE }));
      });

      const failureBanner = rootElement.querySelector('[data-testid="intentional-failure-banner"]');
      assert.ok(failureBanner, 'Intentional failure banner must render');
      assert.ok(failureBanner.textContent.includes('Intentional Failure Demonstration'));
    });
  });

  describe('4. LessonIntroductionModal Pedagogical Content & Dismissal', () => {
    test('renders plain-English objective, visual legend, and common mistake', async () => {
      let modalClosed = false;
      const level = {
        id: 1,
        title: 'Boot Sequence',
        zone: 'Neon Outskirts',
        concept: 'Sequences'
      };

      await act(async () => {
        root.render(
          React.createElement(LessonIntroductionModal, {
            isOpen: true,
            level,
            onClose: () => {
              modalClosed = true;
            }
          })
        );
      });

      const dialog = rootElement.querySelector('[role="dialog"]');
      assert.ok(dialog, 'Lesson modal dialog must render');

      // Check plain English sections
      assert.ok(rootElement.textContent.includes("What You'll Learn"));
      assert.ok(rootElement.textContent.includes('Common Beginner Mistake'));
      assert.ok(rootElement.textContent.includes('View Visual Map Legend'));

      // Toggle visual legend
      const legendToggle = Array.from(rootElement.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Visual Map Legend')
      );
      await act(async () => {
        legendToggle.click();
      });

      assert.ok(rootElement.textContent.includes('Recon Drone'));
      assert.ok(rootElement.textContent.includes('Extraction Portal'));

      // Dismiss button
      const gotItBtn = Array.from(rootElement.querySelectorAll('button')).find((b) =>
        b.textContent.includes("Got it, let's code!")
      );
      assert.ok(gotItBtn, "Got it, let's code! button must exist");

      await act(async () => {
        gotItBtn.click();
      });

      assert.equal(modalClosed, true, 'Clicking Got it must invoke onClose');
    });

    test('Escape key closes open lesson modal', async () => {
      let modalClosed = false;
      const level = { id: 3, title: 'The First Turn', concept: 'Direction' };

      await act(async () => {
        root.render(
          React.createElement(LessonIntroductionModal, {
            isOpen: true,
            level,
            onClose: () => {
              modalClosed = true;
            }
          })
        );
      });

      await act(async () => {
        const escEvent = new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        window.dispatchEvent(escEvent);
      });

      assert.equal(modalClosed, true, 'Escape keydown must trigger onClose');
    });
  });

  describe('5. ResultModal Pedagogical Reinforcement & Grounded Diagnostics', () => {
    test('victory outcome renders post-success concept explanation', async () => {
      const victoryResult = {
        passed: true,
        stars: 3,
        earned: { xp: 100, coins: 25 },
        message: 'Drone reached the extraction portal successfully.',
        state: { x: 3, y: 1 }
      };

      const level = { id: 1, title: 'Boot Sequence' };

      await act(async () => {
        root.render(
          React.createElement(ResultModal, {
            isOpen: true,
            result: victoryResult,
            level
          })
        );
      });

      assert.ok(rootElement.textContent.includes('Why This Concept Matters'));
      const curriculum = getLevelCurriculum(1);
      assert.ok(rootElement.textContent.includes(curriculum.postSuccessExplanation));
    });

    test('failure outcome distinguishes observed mistake from suggested correction', async () => {
      const failureResult = {
        passed: false,
        stars: 0,
        message: 'Collision with perimeter barrier',
        reason: 'Drone collided with perimeter wall at (0, 1)',
        state: { x: 0, y: 1, event: 'crash', message: 'Collision with wall' }
      };

      const level = { id: 3, title: 'The First Turn' };

      await act(async () => {
        root.render(
          React.createElement(ResultModal, {
            isOpen: true,
            result: failureResult,
            level
          })
        );
      });

      assert.ok(rootElement.textContent.includes('Observed Mistake: The robot crashed into a wall or obstacle'));
      assert.ok(rootElement.textContent.includes('SUGGESTED CORRECTION'));
      assert.ok(rootElement.textContent.includes('turn before hitting a wall'));
    });
  });
});
