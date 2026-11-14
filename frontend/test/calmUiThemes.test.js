import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import { setupJsdom } from './helpers/setupJsdom.js';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext.jsx';
import { Navbar } from '../src/components/Navbar.jsx';
import { PlaygroundView } from '../src/views/PlaygroundView.jsx';
import { MissionBriefing } from '../src/components/game/controls/MissionBriefing.jsx';
import { PlaybackControls } from '../src/components/game/controls/PlaybackControls.jsx';
import { getBlocklyTheme } from '../src/components/game/blockly/blocklyConfig.js';
import { AuthContext } from '../src/context/AuthContext.jsx';
import { api } from '../src/api/client.js';

describe('Stage B: Calm UI and Theme Settings Suite', () => {
  let rootElement;
  let root;

  beforeEach(() => {
    const env = setupJsdom();
    rootElement = env.rootElement;
    root = createRoot(rootElement);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    mock.restoreAll();
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
      root = null;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    mock.restoreAll();
  });

  // Test Harness for ThemeContext
  function ThemeHarness({ hookRef }) {
    const themeCtx = useTheme();
    if (hookRef) {
      hookRef.current = themeCtx;
    }
    return React.createElement(
      'div',
      { id: 'theme-harness' },
      React.createElement('span', { id: 'current-theme' }, themeCtx.theme),
      React.createElement('span', { id: 'resolved-theme' }, themeCtx.resolvedTheme),
      React.createElement('span', { id: 'sound-state' }, String(themeCtx.soundEnabled)),
      React.createElement('span', { id: 'motion-state' }, themeCtx.motionSetting)
    );
  }

  describe('Theme Selection & Persistence', () => {
    test('defaults to system theme and persists user changes in localStorage', () => {
      const hookRef = { current: null };

      act(() => {
        root.render(
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(ThemeHarness, { hookRef })
          )
        );
      });

      assert.ok(hookRef.current, 'Theme hook should be available');
      assert.equal(hookRef.current.theme, 'system');

      // Switch to Light theme
      act(() => {
        hookRef.current.setTheme('light');
      });

      assert.equal(hookRef.current.theme, 'light');
      assert.equal(hookRef.current.resolvedTheme, 'light');
      assert.equal(window.localStorage.getItem('codeverse_theme'), 'light');
      assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
      assert.ok(document.documentElement.classList.contains('theme-light'));

      // Switch to Soft Contrast theme
      act(() => {
        hookRef.current.setTheme('soft');
      });

      assert.equal(hookRef.current.theme, 'soft');
      assert.equal(hookRef.current.resolvedTheme, 'soft');
      assert.equal(window.localStorage.getItem('codeverse_theme'), 'soft');
      assert.equal(document.documentElement.getAttribute('data-theme'), 'soft');
      assert.ok(document.documentElement.classList.contains('theme-soft'));

      // Switch to Dark theme
      act(() => {
        hookRef.current.setTheme('dark');
      });

      assert.equal(hookRef.current.theme, 'dark');
      assert.equal(hookRef.current.resolvedTheme, 'dark');
      assert.equal(window.localStorage.getItem('codeverse_theme'), 'dark');
      assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
      assert.ok(document.documentElement.classList.contains('theme-dark'));
    });

    test('Blockly themes are defined for dark, light, and soft contrast', () => {
      const darkTheme = getBlocklyTheme('dark');
      const lightTheme = getBlocklyTheme('light');
      const softTheme = getBlocklyTheme('soft');

      assert.ok(darkTheme, 'Dark Blockly theme should exist');
      assert.ok(lightTheme, 'Light Blockly theme should exist');
      assert.ok(softTheme, 'Soft Blockly theme should exist');
      assert.notEqual(darkTheme, lightTheme, 'Dark and light themes must have distinct definitions');
    });

    test('Sound and motion preferences update and persist across sessions', () => {
      const hookRef = { current: null };

      act(() => {
        root.render(
          React.createElement(
            ThemeProvider,
            null,
            React.createElement(ThemeHarness, { hookRef })
          )
        );
      });

      // Sound toggle
      act(() => {
        hookRef.current.setSoundEnabled(true);
      });
      assert.equal(hookRef.current.soundEnabled, true);
      assert.equal(window.localStorage.getItem('codeverse_sound'), 'true');

      // Motion setting
      act(() => {
        hookRef.current.setMotionSetting('reduced');
      });
      assert.equal(hookRef.current.motionSetting, 'reduced');
      assert.equal(hookRef.current.isReducedMotion, true);
      assert.equal(window.localStorage.getItem('codeverse_motion'), 'reduced');
    });
  });

  describe('Navbar Theme Controls & Streamlined Navigation', () => {
    test('renders theme menu trigger and allows switching theme from UI', () => {
      const mockUser = { id: 'u1', username: 'PilotOne', level: 2, totalXp: 150, coins: 25 };

      act(() => {
        root.render(
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(
              ThemeProvider,
              null,
              React.createElement(
                AuthContext.Provider,
                { value: { user: mockUser, isAuthenticated: true, logout: async () => {} } },
                React.createElement(Navbar, null)
              )
            )
          )
        );
      });

      const themeBtn = rootElement.querySelector('button[aria-label="Theme and display settings"]');
      assert.ok(themeBtn, 'Theme menu button should exist in Navbar');

      // Open menu
      act(() => {
        themeBtn.click();
      });

      const lightOption = Array.from(rootElement.querySelectorAll('button')).find((b) =>
        b.textContent.includes('Light')
      );
      assert.ok(lightOption, 'Light theme option should be present in dropdown');

      act(() => {
        lightOption.click();
      });

      assert.equal(window.localStorage.getItem('codeverse_theme'), 'light');
    });
  });

  describe('Playground Focused Learning Workspace', () => {
    test('focuses on board and editor, removing duplicate telemetry banners and duplicate mentor buttons', async () => {
      const mockLevels = [
        { id: 1, title: 'Boot Sequence', zone: 'Neon Outskirts', concept: 'Sequence', unlocked: true, completed: false, map: ['S..G'], par: 3 },
        { id: 2, title: 'Second Step', zone: 'Neon Outskirts', concept: 'Actions', unlocked: true, completed: false, map: ['S...G'], par: 4 }
      ];

      mock.method(api.campaign, 'getLevels', async () => mockLevels);

      const mockUser = { id: 'usr_play', username: 'FocusPilot', level: 1, totalXp: 50, coins: 10 };

      await act(async () => {
        root.render(
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/playground?level=1'] },
            React.createElement(
              ThemeProvider,
              null,
              React.createElement(
                AuthContext.Provider,
                { value: { user: mockUser, refreshProfile: async () => mockUser } },
                React.createElement(PlaygroundView, null)
              )
            )
          )
        );
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      const text = rootElement.textContent;

      // Pilot greeting/level displayed cleanly
      assert.ok(text.includes('FocusPilot'), 'Pilot username should appear in level bar');
      assert.ok(text.includes('Boot Sequence'), 'Level title should appear');
      assert.ok(text.includes('Level 1'), 'Level number should appear');

      // Duplicate telemetry chips should NOT clutter the playground top (they live in the Navbar)
      assert.ok(!text.includes('PILOT TIER'), 'Duplicated "PILOT TIER" banner should be removed');
      assert.ok(!text.includes('TOTAL XP'), 'Duplicated "TOTAL XP" banner should be removed');
      assert.ok(!text.includes('CREDITS'), 'Duplicated "CREDITS" banner should be removed');

      // Launch and Reset controls exist
      const buttons = Array.from(rootElement.querySelectorAll('button'));
      const launchBtn = buttons.find((b) => b.textContent.toLowerCase().includes('launch'));
      const resetBtn = buttons.find((b) => b.textContent.toLowerCase().includes('reset'));
      assert.ok(launchBtn, 'Launch button must exist');
      assert.ok(resetBtn, 'Reset button must exist');
    });

    test('keyboard shortcut Ctrl+Enter triggers launch', async () => {
      const mockLevels = [
        { id: 1, title: 'Boot Sequence', zone: 'Neon Outskirts', concept: 'Sequence', unlocked: true, completed: false, map: ['S..G'], par: 3 }
      ];

      let runCalled = false;
      mock.method(api.campaign, 'getLevels', async () => mockLevels);
      mock.method(api.campaign, 'runLevel', async () => {
        runCalled = true;
        return {
          passed: true,
          stars: 3,
          earned: { xp: 100, coins: 25 },
          message: 'Level complete!',
          state: { x: 3, y: 0 },
          frames: []
        };
      });

      const mockUser = { id: 'usr_play', username: 'KeyPilot' };

      await act(async () => {
        root.render(
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/playground?level=1'] },
            React.createElement(
              ThemeProvider,
              null,
              React.createElement(
                AuthContext.Provider,
                { value: { user: mockUser, refreshProfile: async () => mockUser } },
                React.createElement(PlaygroundView, null)
              )
            )
          )
        );
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      // Dispatch Ctrl+Enter keydown
      await act(async () => {
        const event = new window.KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          bubbles: true
        });
        window.dispatchEvent(event);
      });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 60));
      });

      assert.ok(runCalled, 'Ctrl+Enter keyboard shortcut must trigger program execution');
    });
  });

  describe('MissionBriefing Plain-Language Wording & Collapsible Constraints', () => {
    test('renders plain-language target instead of tactical par jargon and toggles constraints', () => {
      const level = {
        id: 4,
        title: 'Loop Runner',
        zone: 'Neon Outskirts',
        concept: 'Loops',
        briefing: 'Collect shards using repeat blocks.',
        par: 11,
        requireLoops: true,
        maxBlocks: 6
      };

      act(() => {
        root.render(React.createElement(MissionBriefing, { level }));
      });

      const text = rootElement.textContent;
      assert.ok(text.includes('11 actions'), 'Target actions should be displayed');
      assert.ok(text.includes('TARGET'), 'Target label should replace tactical par');
      assert.ok(!text.includes('TACTICAL PAR'), 'Old tactical par jargon should be replaced');

      // Expand constraints
      const buttons = Array.from(rootElement.querySelectorAll('button'));
      const toggleBtn = buttons.find((b) => b.textContent.includes('Constraints'));
      assert.ok(toggleBtn, 'Constraints drawer toggle button exists');

      act(() => {
        toggleBtn.click();
      });

      const expandedText = rootElement.textContent;
      assert.ok(expandedText.includes('Loop Block Required'), 'Loop requirement displayed on expansion');
      assert.ok(expandedText.includes('Max 6 Blocks'), 'Block budget displayed on expansion');
    });
  });

  describe('PlaybackControls Calm Aesthetics & Ergonomics', () => {
    test('renders accessible buttons with proper minimum height and clear labels', () => {
      let launched = false;
      let reset = false;

      act(() => {
        root.render(
          React.createElement(PlaybackControls, {
            isBusy: false,
            onLaunch: () => { launched = true; },
            onReset: () => { reset = true; },
            speed: 1,
            sound: false,
            hasActiveLevel: true
          })
        );
      });

      const buttons = Array.from(rootElement.querySelectorAll('button'));
      const launch = buttons.find((b) => b.textContent.includes('Launch Program'));
      const resetBtn = buttons.find((b) => b.textContent.includes('Reset World'));

      assert.ok(launch, 'Launch Program button exists');
      assert.ok(resetBtn, 'Reset World button exists');

      act(() => {
        launch.click();
      });
      assert.equal(launched, true);

      act(() => {
        resetBtn.click();
      });
      assert.equal(reset, true);
    });
  });
});
