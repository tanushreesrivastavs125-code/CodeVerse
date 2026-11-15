import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setupJsdom } from './helpers/setupJsdom.js';
import { BlocklyEditor } from '../src/components/game/blockly/BlocklyEditor.jsx';
import { ThemeProvider } from '../src/context/ThemeContext.jsx';
import { DownloadModal } from '../src/components/game/blockly/DownloadModal.jsx';

describe('Stage D: Multi-Language Code Preview & Connected Playback', () => {
  let container;
  let root;

  beforeEach(() => {
    setupJsdom();
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('renders "Your Code" tab with "Read-Only" indicator and language selector', async () => {
    await act(async () => {
      root.render(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(BlocklyEditor, {
            level: { id: 1, title: 'Boot Sequence' }
          })
        )
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const codeTabButton = buttons.find((b) => b.textContent.includes('Your Code'));
    assert.ok(codeTabButton, 'Must render "Your Code" tab button');
    assert.ok(codeTabButton.textContent.includes('Read-Only'), 'Must display "Read-Only" indicator');

    // Switch to code tab
    await act(async () => {
      codeTabButton.click();
    });

    const select = container.querySelector('select[aria-label="Select Code Language"]');
    assert.ok(select, 'Must render language selector dropdown');

    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    assert.deepEqual(options, [
      'plainEnglish',
      'javascript',
      'python',
      'java',
      'cpp',
      'c'
    ]);
  });

  test('persists selected language in localStorage and recalls it on next render', async () => {
    localStorage.setItem('codeverse_preferred_language', 'python');

    await act(async () => {
      root.render(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(BlocklyEditor, {
            level: { id: 1, title: 'Boot Sequence' }
          })
        )
      );
    });

    const codeTabButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Your Code')
    );
    await act(async () => {
      codeTabButton.click();
    });

    const select = container.querySelector('select[aria-label="Select Code Language"]');
    assert.equal(select.value, 'python');

    // Change language to javascript
    await act(async () => {
      select.value = 'javascript';
      select.dispatchEvent(new window.Event('change', { bubbles: true }));
    });

    assert.equal(localStorage.getItem('codeverse_preferred_language'), 'javascript');
  });

  test('renders line numbers and highlights active line during playback', async () => {
    const mockAst = [
      { nodeId: 'node_1', blockId: 'block_1', type: 'move' },
      { nodeId: 'node_2', blockId: 'block_2', type: 'left' }
    ];

    await act(async () => {
      root.render(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(BlocklyEditor, {
            level: { id: 1, title: 'Boot Sequence' },
            isBusy: true,
            submittedProgram: mockAst,
            highlightedNodeId: 'node_1'
          })
        )
      );
    });

    // Switch to code tab
    const codeTabButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Your Code')
    );
    await act(async () => {
      codeTabButton.click();
    });

    // Verify line number gutters exist
    const lines = container.querySelectorAll('div > span:first-child');
    assert.ok(lines.length >= 2, 'Line numbers must be rendered');

    // Verify line highlight
    const lineElements = Array.from(container.querySelectorAll('div')).filter(
      (d) => d.style && d.style.borderLeft && d.style.borderLeft.includes('solid')
    );
    const highlightedRow = lineElements.find(
      (el) => el.style.borderLeft.includes('var(--accent-cyan)')
    );
    assert.ok(highlightedRow, 'Active node line must be highlighted with accent cyan border');
  });

  test('renders condition evaluation feedback banner on condition events', async () => {
    const mockAst = [
      {
        nodeId: 'n_if',
        blockId: 'b_if',
        type: 'if',
        sensor: 'wall',
        body: [{ nodeId: 'n_act', blockId: 'b_act', type: 'left' }]
      }
    ];

    const activeFrame = {
      event: 'condition',
      condition: {
        sensor: 'wall',
        outcome: false,
        explanation: 'Condition [wall] is FALSE → Skipping IF body.'
      }
    };

    await act(async () => {
      root.render(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(BlocklyEditor, {
            level: { id: 7, title: 'Scanner Station' },
            isBusy: true,
            submittedProgram: mockAst,
            highlightedNodeId: 'n_if',
            activeFrame
          })
        )
      );
    });

    // Switch to code tab
    const codeTabButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Your Code')
    );
    await act(async () => {
      codeTabButton.click();
    });

    const statusBanner = container.querySelector('[data-testid="condition-feedback-banner"]');
    assert.ok(statusBanner, 'Condition status banner must be rendered');
    assert.ok(statusBanner.textContent.includes('Condition [wall] is FALSE'));
    assert.ok(statusBanner.textContent.includes('Skipping IF body'));
  });

  test('Copy button triggers clipboard write and gives visual feedback', async () => {
    let copiedText = '';
    navigator.clipboard = {
      writeText: async (text) => {
        copiedText = text;
      }
    };

    await act(async () => {
      root.render(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(BlocklyEditor, {
            level: { id: 1, title: 'Boot Sequence' }
          })
        )
      );
    });

    const codeTabButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Your Code')
    );
    await act(async () => {
      codeTabButton.click();
    });

    const copyBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Copy')
    );
    assert.ok(copyBtn, 'Copy button must be present');

    await act(async () => {
      copyBtn.click();
    });

    assert.ok(copyBtn.textContent.includes('Copied!'), 'Must display "Copied!" feedback');
    assert.ok(copiedText.length > 0, 'Clipboard must receive generated code');
  });

  test('DownloadModal renders honest runtime disclosure and download options', async () => {
    let closed = false;
    const testAst = [{ type: 'move' }];

    await act(async () => {
      root.render(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(DownloadModal, {
            isOpen: true,
            onClose: () => {
              closed = true;
            },
            ast: testAst,
            language: 'python',
            level: { id: 1, title: 'Boot Sequence' }
          })
        )
      );
    });

    const modal = document.querySelector('[role="dialog"]');
    assert.ok(modal, 'Download modal must be visible');
    assert.ok(modal.textContent.includes('Export Code (Python)'));
    assert.ok(modal.textContent.includes('Toolchain & Execution'));
    assert.ok(modal.textContent.includes('Verified via CodeVerse CI test suite'));
    assert.ok(modal.textContent.includes('python drone_mission.py'));

    // Download action cards
    assert.ok(modal.textContent.includes('Download Snippet'));
    assert.ok(modal.textContent.includes('Requires CodeVerse Helpers'));
    assert.ok(modal.textContent.includes('Download Runnable Project'));
    assert.ok(modal.textContent.includes('Download README'));

    // Test close button
    const closeBtn = Array.from(modal.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Close')
    );
    assert.ok(closeBtn);
    await act(async () => {
      closeBtn.click();
    });
    assert.equal(closed, true);
  });

  test('DownloadModal distinguishes plain-English outline and omits runnable console export', async () => {
    const testAst = [{ type: 'move' }];

    await act(async () => {
      root.render(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(DownloadModal, {
            isOpen: true,
            onClose: () => {},
            ast: testAst,
            language: 'plainEnglish',
            level: { id: 1, title: 'Boot Sequence' }
          })
        )
      );
    });

    const modal = document.querySelector('[role="dialog"]');
    assert.ok(modal, 'Download modal must be visible');
    assert.ok(modal.textContent.includes('Algorithm Walkthrough'));
    assert.ok(modal.textContent.includes('not executable code'));
    assert.ok(modal.textContent.includes('Download Plain-English Steps'));
    assert.ok(!modal.textContent.includes('Download Runnable Project'), 'Plain-English must not offer a runnable project');
  });

  test('snapshot isolation: displays submittedProgram snapshot during isBusy', async () => {
    const submittedSnapshot = [
      { nodeId: 'snap_1', blockId: 'b_snap', type: 'move' }
    ];

    await act(async () => {
      root.render(
        React.createElement(
          ThemeProvider,
          null,
          React.createElement(BlocklyEditor, {
            level: { id: 1, title: 'Boot Sequence' },
            isBusy: true,
            submittedProgram: submittedSnapshot
          })
        )
      );
    });

    const codeTabButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Your Code')
    );
    await act(async () => {
      codeTabButton.click();
    });

    // In code view, header should report snapshot
    assert.ok(container.textContent.includes('Executing submitted program snapshot'));
    assert.ok(container.textContent.includes('drone.move()'));
  });
});
