import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import { setupJsdom } from './helpers/setupJsdom.js';
import { useGamePlayback } from '../src/hooks/useGamePlayback.js';
import { ResultModal } from '../src/components/game/modals/ResultModal.jsx';
import { ProfileView } from '../src/views/ProfileView.jsx';
import { PlaygroundView } from '../src/views/PlaygroundView.jsx';
import { AuthContext } from '../src/context/AuthContext.jsx';
import { api, ApiClientError } from '../src/api/client.js';
import { validateProgramAST } from '../src/components/game/blockly/astCompiler.js';

describe('Mission Playback Lifecycle & Synchronous Locking (Stage A)', () => {
  let rootElement;
  let root;

  beforeEach(() => {
    const env = setupJsdom();
    rootElement = env.rootElement;
    root = createRoot(rootElement);
    mock.restoreAll();
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
      root = null;
    }
    mock.restoreAll();
  });

  // Test Harness Component for useGamePlayback
  function PlaybackHarness({ level, onRunFinished, hookRef }) {
    const playback = useGamePlayback({ level, onRunFinished });
    if (hookRef) {
      hookRef.current = playback;
    }
    return React.createElement(
      'div',
      { id: 'harness' },
      React.createElement('span', { id: 'runState' }, playback.runState),
      React.createElement('span', { id: 'isBusy' }, String(playback.isBusy)),
      React.createElement('span', { id: 'dronePos' }, playback.worldState ? `${playback.worldState.x},${playback.worldState.y}` : 'none'),
      React.createElement('span', { id: 'result' }, playback.result ? JSON.stringify(playback.result) : 'none')
    );
  }

  describe('Immediate Synchronous Submission Locking in useGamePlayback', () => {
    test('synchronous ownership lock rejects immediate second invocation without queuing duplicate run', () => {
      const hookRef = { current: null };
      const level1 = { id: 1, title: 'Sector 1', map: ['S..G'] };

      act(() => {
        root.render(React.createElement(PlaybackHarness, { level: level1, hookRef }));
      });

      assert.ok(hookRef.current, 'Hook ref should be bound');
      assert.equal(hookRef.current.runState, 'idle');
      assert.equal(hookRef.current.isBusy, false);

      let gen1;
      let gen2;

      // In the same synchronous tick, player rapidly invokes startSubmission twice
      act(() => {
        gen1 = hookRef.current.startSubmission();
        gen2 = hookRef.current.startSubmission();
      });

      assert.ok(typeof gen1 === 'number', 'First submission must succeed and return generation number');
      assert.equal(gen2, null, 'Second synchronous submission must return null (immediately locked)');
      assert.equal(hookRef.current.isBusy, true, 'Hook must report busy immediately');
      assert.equal(hookRef.current.runState, 'submitting');
    });

    test('submission lock is released on request error, reset, and unmount', () => {
      const hookRef = { current: null };
      const level1 = { id: 1, title: 'Sector 1', map: ['S..G'] };

      act(() => {
        root.render(React.createElement(PlaybackHarness, { level: level1, hookRef }));
      });

      // 1. Lock acquired
      let gen1;
      act(() => {
        gen1 = hookRef.current.startSubmission();
      });
      assert.ok(typeof gen1 === 'number');
      assert.equal(hookRef.current.submissionLockRef.current, true);

      // 2. Request error releases lock
      act(() => {
        hookRef.current.setRequestError('Connection failed');
      });
      assert.equal(hookRef.current.runState, 'request-error');
      assert.equal(hookRef.current.submissionLockRef.current, false, 'Lock must be released on request-error');

      // 3. New submission can now be acquired
      let gen2;
      act(() => {
        gen2 = hookRef.current.startSubmission();
      });
      assert.ok(typeof gen2 === 'number');
      assert.ok(gen2 > gen1, 'Generation must advance');
      assert.equal(hookRef.current.submissionLockRef.current, true);

      // 4. Client reset releases lock
      act(() => {
        hookRef.current.resetWorld();
      });
      assert.equal(hookRef.current.runState, 'idle');
      assert.equal(hookRef.current.submissionLockRef.current, false, 'Lock must be released on resetWorld');

      // 5. Submission after reset
      let gen3;
      act(() => {
        gen3 = hookRef.current.startSubmission();
      });
      assert.ok(typeof gen3 === 'number');
      assert.equal(hookRef.current.submissionLockRef.current, true);
    });

    test('submission lock is released on run completion and invalidated on level change', () => {
      const hookRef = { current: null };
      const level1 = { id: 1, title: 'Sector 1', map: ['S..G'] };

      act(() => {
        root.render(React.createElement(PlaybackHarness, { level: level1, hookRef }));
      });

      let gen1;
      act(() => {
        gen1 = hookRef.current.startSubmission();
      });
      assert.equal(hookRef.current.submissionLockRef.current, true);

      // Complete run with empty frames (triggers finishRun immediately)
      act(() => {
        hookRef.current.startPlayback({ passed: true, stars: 3, earned: { xp: 50, coins: 25 }, frames: [] }, gen1);
      });

      assert.equal(hookRef.current.runState, 'passed');
      assert.equal(hookRef.current.submissionLockRef.current, false, 'Lock must be released on finishRun');
      assert.equal(hookRef.current.result.passed, true);

      // Acquire submission lock again
      act(() => {
        hookRef.current.startSubmission();
      });
      assert.equal(hookRef.current.submissionLockRef.current, true);

      // Level changes to Sector 2
      const level2 = { id: 2, title: 'Sector 2', map: ['S.G'] };
      act(() => {
        root.render(React.createElement(PlaybackHarness, { level: level2, hookRef }));
      });

      assert.equal(hookRef.current.submissionLockRef.current, false, 'Lock must be invalidated on level change');
      assert.equal(hookRef.current.runState, 'idle');
      assert.equal(hookRef.current.result, null);
    });
  });

  describe('Level Identity vs Metadata Refresh Invariants', () => {
    test('refreshed level object with same identity preserves result modal and final board coordinates', () => {
      const hookRef = { current: null };
      const initialLevel = { id: 1, title: 'Sector 1', completed: false, stars: 0, map: ['S..G'] };

      act(() => {
        root.render(React.createElement(PlaybackHarness, { level: initialLevel, hookRef }));
      });

      // Execute run that ends at drone position (3, 0)
      act(() => {
        const gen = hookRef.current.startSubmission();
        hookRef.current.startPlayback(
          {
            passed: true,
            stars: 3,
            message: 'Portal reached.',
            state: { x: 3, y: 0, event: 'extract' },
            frames: []
          },
          gen
        );
      });

      assert.equal(hookRef.current.runState, 'passed');
      assert.equal(hookRef.current.result.passed, true);
      assert.equal(hookRef.current.worldState.x, 3, 'Drone should be at extraction portal');

      // Server progress refresh returns updated level object for Sector 1 (different reference, same ID)
      const refreshedLevel = { id: 1, title: 'Sector 1', completed: true, stars: 3, map: ['S..G'] };

      act(() => {
        root.render(React.createElement(PlaybackHarness, { level: refreshedLevel, hookRef }));
      });

      // Result and final board position MUST survive metadata refresh
      assert.notEqual(hookRef.current.result, null, 'Result must NOT be wiped by metadata refresh');
      assert.equal(hookRef.current.result.passed, true);
      assert.equal(hookRef.current.worldState.x, 3, 'Final drone coordinate must survive metadata refresh');

      // Now switch to an actual new level (Sector 2)
      const nextSector = { id: 2, title: 'Sector 2', completed: false, stars: 0, map: ['S.G'] };

      act(() => {
        root.render(React.createElement(PlaybackHarness, { level: nextSector, hookRef }));
      });

      // Distinct level ID MUST reset world and clear previous outcome
      assert.equal(hookRef.current.result, null, 'Switching to next level ID must reset result');
      assert.equal(hookRef.current.worldState.x, 0, 'Switching to next level ID must reset world position');
      assert.equal(hookRef.current.runState, 'idle');
    });
  });

  describe('ResultModal Real Rendering & Pedagogical Feedback', () => {
    test('victory outcome renders celebration, star rating, and earned currency', () => {
      act(() => {
        root.render(
          React.createElement(ResultModal, {
            result: { passed: true, stars: 3, earned: { xp: 120, coins: 60 }, message: 'Sector secured.' },
            isOpen: true,
            hasNextSector: true,
            onClose: () => {}
          })
        );
      });

      const text = rootElement.textContent;
      assert.ok(text.includes('Level complete!'), 'Should show Level complete!');
      assert.ok(text.includes('MISSION ACCOMPLISHED'), 'Should show mission accomplished banner');
      assert.ok(text.includes('+120 Flight XP'), 'Should display earned XP');
      assert.ok(text.includes('+60 Drone Credits'), 'Should display earned Drone Credits');
      assert.ok(text.includes('Next Level →'), 'Should display Next Level button');
    });

    test('replay clear honestly discloses first-clear rewards collected without promising +0', () => {
      act(() => {
        root.render(
          React.createElement(ResultModal, {
            result: { passed: true, stars: 3, earned: { xp: 0, coins: 0 }, message: 'Sector secured.' },
            isOpen: true,
            onClose: () => {}
          })
        );
      });

      const text = rootElement.textContent;
      assert.ok(text.includes('Level complete!'));
      assert.ok(text.includes('Replay Cleared // First-clear XP and Credits were already collected'), 'Must disclose replay status');
      assert.ok(!text.includes('+0 Flight XP'), 'Must not promise or badge +0 Flight XP');
    });

    test('failure outcome renders plain-language advice, stopped coordinate, and explicit action buttons', () => {
      let rerunFired = false;
      let resetToEditFired = false;
      let editProgramFired = false;

      act(() => {
        root.render(
          React.createElement(ResultModal, {
            result: {
              passed: false,
              message: 'The path ahead was blocked by a wall or obstacle.',
              state: { x: 2, y: 1 }
            },
            isOpen: true,
            onRerun: () => {
              rerunFired = true;
            },
            onResetToEdit: () => {
              resetToEditFired = true;
            },
            onEditProgram: () => {
              editProgramFired = true;
            },
            onClose: () => {}
          })
        );
      });

      const text = rootElement.textContent;
      assert.ok(text.includes('Not quite yet—try again'), 'Should show Not quite yet—try again');
      assert.ok(text.includes('(2, 1)'), 'Should report drone stopped board coordinates');
      assert.ok(text.includes('SUGGESTED CORRECTION'), 'Should show pedagogical advice');

      // Check action buttons
      const buttons = Array.from(rootElement.querySelectorAll('button'));
      const rerunBtn = buttons.find((b) => b.textContent.includes('Rerun Program'));
      const resetBtn = buttons.find((b) => b.textContent.includes('Reset to Edit'));
      const editBtn = buttons.find((b) => b.textContent.includes('Edit Program'));

      assert.ok(rerunBtn, 'Must render Rerun Program button');
      assert.ok(resetBtn, 'Must render Reset to Edit button');
      assert.ok(editBtn, 'Must render Edit Program button');

      act(() => {
        rerunBtn.click();
        resetBtn.click();
        editBtn.click();
      });

      assert.equal(rerunFired, true);
      assert.equal(resetToEditFired, true);
      assert.equal(editProgramFired, true);
    });
  });

  describe('ProfileView Real Rendering With Actual API Steps', () => {
    test('profile renders actual step counts returned by API history audit log', async () => {
      const mockLevels = [{ id: 1, title: 'Sector 1', completed: true, stars: 3 }];
      const mockHistory = [
        {
          id: 'attempt-101',
          levelId: 1,
          steps: 19,
          passed: true,
          stars: 3,
          createdAt: new Date().toISOString()
        }
      ];

      mock.method(api.campaign, 'getLevels', async () => mockLevels);
      mock.method(api.campaign, 'getHistory', async () => mockHistory);

      const mockUser = {
        id: 'usr_pilot_42',
        username: 'ApexPilot',
        totalXp: 450,
        coins: 120,
        level: 2,
        isGuest: false
      };

      await act(async () => {
        root.render(
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(
              AuthContext.Provider,
              { value: { user: mockUser, logout: async () => {} } },
              React.createElement(ProfileView, null)
            )
          )
        );
      });

      // Wait for async loadStats & loadHistory promises
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const text = rootElement.textContent;
      assert.ok(text.includes('ApexPilot'), 'Should display username');
      assert.ok(text.includes('Sector 1'), 'Should display attempt sector');
      assert.ok(text.includes('✓ PASSED'), 'Should display passed badge');

      // Verify the ACTIONS cell contains the actual steps returned by API
      const cells = Array.from(rootElement.querySelectorAll('td'));
      const actionsCell = cells.find((c) => c.textContent.trim() === '19');
      assert.ok(actionsCell, 'ACTIONS table cell must display the 19 steps returned by the API');
    });
  });

  describe('PlaygroundView Submission Locking, Route Sync & Retry', () => {
    test('PlaygroundView locks rapid clicks immediately and dispatches exactly one network request', async () => {
      const mockLevels = [
        { id: 1, title: 'Sector 1', unlocked: true, completed: false, map: ['S..G'], par: 3 },
        { id: 2, title: 'Sector 2', unlocked: false, completed: false, map: ['S.G'], par: 2 }
      ];

      let runCalls = 0;
      mock.method(api.campaign, 'getLevels', async () => mockLevels);
      mock.method(api.campaign, 'runLevel', async () => {
        runCalls += 1;
        await new Promise((r) => setTimeout(r, 30));
        return {
          passed: true,
          stars: 3,
          earned: { xp: 100, coins: 50 },
          message: 'Sector secured.',
          state: { x: 3, y: 0 },
          frames: []
        };
      });

      let refreshProfileCalls = 0;
      const mockUser = { id: 'usr_guest', username: 'GuestPilot', totalXp: 0, coins: 0, isGuest: true };

      await act(async () => {
        root.render(
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/playground?level=1'] },
            React.createElement(
              AuthContext.Provider,
              {
                value: {
                  user: mockUser,
                  refreshProfile: async () => {
                    refreshProfileCalls += 1;
                    return mockUser;
                  }
                }
              },
              React.createElement(PlaygroundView, null)
            )
          )
        );
      });

      // Wait for initial levels to load
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      assert.ok(rootElement.textContent.includes('GuestPilot'), 'Playground rendered with user');

      // Find the Launch Drone button
      const buttons = Array.from(rootElement.querySelectorAll('button'));
      const launchBtn = buttons.find((b) => b.textContent.toLowerCase().includes('launch'));
      assert.ok(launchBtn, 'Launch button must exist');

      // Click rapidly twice in the exact same tick
      await act(async () => {
        launchBtn.click();
        launchBtn.click();
      });

      // Wait for simulation run to settle
      await act(async () => {
        await new Promise((r) => setTimeout(r, 80));
      });

      assert.equal(runCalls, 1, 'Exactly ONE API request must be dispatched under rapid double click');
      assert.ok(rootElement.textContent.includes('Level complete!'), 'Result modal should display victory');

      // Close the modal and assert persistent summary banner
      const closeBtn = rootElement.querySelector('button[aria-label="Close result modal"]');
      assert.ok(closeBtn, 'Modal close button must exist');

      act(() => {
        closeBtn.click();
      });

      const textAfterClose = rootElement.textContent;
      assert.ok(textAfterClose.includes('Level complete!'), 'Persistent banner must preserve Level complete! after modal dismissal');
      assert.ok(textAfterClose.includes('View Rewards'), 'Banner must have View Rewards button');
      assert.ok(refreshProfileCalls >= 1, 'Profile telemetry should be refreshed on run finish');
    });

    test('telemetry sync failure displays retry button that recovers progression', async () => {
      const mockLevels = [{ id: 1, title: 'Sector 1', unlocked: true, completed: false, map: ['S..G'], par: 3 }];

      mock.method(api.campaign, 'getLevels', async () => mockLevels);
      mock.method(api.campaign, 'runLevel', async () => ({
        passed: true,
        stars: 3,
        earned: { xp: 100, coins: 50 },
        message: 'Sector secured.',
        state: { x: 3, y: 0 },
        frames: []
      }));

      let failSync = true;
      let syncAttempts = 0;
      const mockRefreshProfile = async () => {
        syncAttempts += 1;
        if (failSync) {
          throw new Error('Sync server unreachable');
        }
        return { id: 'usr_test' };
      };

      const mockUser = { id: 'usr_test', username: 'TestPilot' };

      await act(async () => {
        root.render(
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/playground?level=1'] },
            React.createElement(
              AuthContext.Provider,
              { value: { user: mockUser, refreshProfile: mockRefreshProfile } },
              React.createElement(PlaygroundView, null)
            )
          )
        );
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Launch drone
      const launchBtn = Array.from(rootElement.querySelectorAll('button')).find((b) =>
        b.textContent.toLowerCase().includes('launch')
      );
      assert.ok(launchBtn, 'Launch button must exist');

      await act(async () => {
        launchBtn.click();
        await new Promise((r) => setTimeout(r, 40));
      });

      // Verify retry banner is displayed
      const textWithSyncError = rootElement.textContent;
      assert.ok(textWithSyncError.includes('Sync server unreachable') || textWithSyncError.includes('Retry Sync'));

      const retryBtn = Array.from(rootElement.querySelectorAll('button')).find((b) => b.textContent.includes('Retry Sync'));
      assert.ok(retryBtn, 'Retry Sync button must be visible');

      // Recover sync on click
      failSync = false;
      await act(async () => {
        retryBtn.click();
        await new Promise((r) => setTimeout(r, 40));
      });

      assert.ok(syncAttempts >= 2, 'Sync must have been retried');
      assert.ok(!rootElement.textContent.includes('Sync server unreachable'), 'Warning banner must be cleared after successful retry');
    });
  });

  describe('AST Compiler Invariants', () => {
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
  });
});
