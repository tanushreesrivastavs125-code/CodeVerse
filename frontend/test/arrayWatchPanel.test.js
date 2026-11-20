import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setupJsdom } from './helpers/setupJsdom.js';
import { ArrayWatchPanel } from '../src/components/game/controls/ArrayWatchPanel.jsx';

describe('ArrayWatchPanel Component Invariants', () => {
  let container;
  let root;

  beforeEach(() => {
    setupJsdom();
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

  test('does not render for levels < 39 when no arrays exist', async () => {
    await act(async () => {
      root.render(
        React.createElement(ArrayWatchPanel, {
          level: { id: 38 },
          arrays: {}
        })
      );
    });

    assert.equal(container.querySelector('[data-testid="array-watch-panel"]'), null);
  });

  test('renders empty array state notice for level 39 before array creation', async () => {
    await act(async () => {
      root.render(
        React.createElement(ArrayWatchPanel, {
          level: { id: 39 },
          arrays: {}
        })
      );
    });

    const panel = container.querySelector('[data-testid="array-watch-panel"]');
    assert.ok(panel, 'Panel must render for level 39');
    const emptyNotice = container.querySelector('[data-testid="array-watch-empty"]');
    assert.ok(emptyNotice, 'Must render empty state message');
    assert.ok(emptyNotice.textContent.includes('No arrays created yet'));

    const footnote = container.querySelector('[data-testid="array-watch-footnote"]');
    assert.ok(footnote, 'Must render zero-based indexing footnote');
    assert.ok(footnote.textContent.includes('Zero-Based Indexing'));
  });

  test('renders numbered cells, values, and index headers for active array', async () => {
    await act(async () => {
      root.render(
        React.createElement(ArrayWatchPanel, {
          level: { id: 39 },
          arrays: {
            codes: [2, 1, 3]
          }
        })
      );
    });

    const countBadge = container.querySelector('[data-testid="array-watch-count"]');
    assert.ok(countBadge && countBadge.textContent.includes('1 array active'));

    const arrayContainer = container.querySelector('[data-testid="array-container-codes"]');
    assert.ok(arrayContainer, 'Must render container for codes array');
    assert.ok(arrayContainer.textContent.includes('length: 3'));

    const cell0 = container.querySelector('[data-testid="array-cell-codes-0"]');
    const cell1 = container.querySelector('[data-testid="array-cell-codes-1"]');
    const cell2 = container.querySelector('[data-testid="array-cell-codes-2"]');
    assert.ok(cell0 && cell0.textContent.includes('[0]') && cell0.textContent.includes('2'));
    assert.ok(cell1 && cell1.textContent.includes('[1]') && cell1.textContent.includes('1'));
    assert.ok(cell2 && cell2.textContent.includes('[2]') && cell2.textContent.includes('3'));
  });

  test('renders mutation and read notices and traversal pointers during playback', async () => {
    const activeFrame = {
      arrays: {
        path: [10, 20, 30]
      },
      variables: {
        i: 1
      },
      arrayMutation: {
        type: 'set',
        name: 'path',
        index: 1,
        prevVal: 20,
        val: 99,
        explanation: 'Updated path[1] from 20 to 99.'
      },
      arrayRead: {
        name: 'path',
        index: 1,
        value: 99
      }
    };

    await act(async () => {
      root.render(
        React.createElement(ArrayWatchPanel, {
          level: { id: 42 },
          activeFrame
        })
      );
    });

    const mutationNotice = container.querySelector('[data-testid="array-mutation-notice"]');
    assert.ok(mutationNotice, 'Must render mutation notice');
    assert.ok(mutationNotice.textContent.includes('Updated path[1] from 20 to 99.'));

    const readNotice = container.querySelector('[data-testid="array-read-notice"]');
    assert.ok(readNotice, 'Must render read notice');
    assert.ok(readNotice.textContent.includes('Read path[1] = 99'));

    const pointer = container.querySelector('[data-testid="array-pointer-path-1"]');
    assert.ok(pointer, 'Must render traversal pointer for index 1');
    assert.ok(pointer.textContent.includes('▲'));
    assert.ok(pointer.textContent.includes('i'));
  });

  test('renders search targets, comparisons count, status banners, and live comparison notice', async () => {
    const activeFrame = {
      arrays: {
        sensors: [4, 7, 2, 9]
      },
      variables: {
        target: 2,
        found: 2,
        comparisons: 3
      },
      comparisons: 3,
      lastComparison: {
        left: 'sensors[2]',
        leftVal: 2,
        op: '==',
        right: 'target',
        rightVal: 2,
        outcome: true
      }
    };

    await act(async () => {
      root.render(
        React.createElement(ArrayWatchPanel, {
          level: { id: 45, targetValue: 2 },
          activeFrame
        })
      );
    });

    const targetBadge = container.querySelector('[data-testid="search-target-badge"]');
    assert.ok(targetBadge && targetBadge.textContent.includes('Target: 2'));

    const compCount = container.querySelector('[data-testid="search-comparisons-count"]');
    assert.ok(compCount && compCount.textContent.includes('Comparisons: 3'));

    const statusBanner = container.querySelector('[data-testid="search-status-banner"]');
    assert.ok(statusBanner && statusBanner.textContent.includes('Target found at index [2]'));

    const compNotice = container.querySelector('[data-testid="search-comparison-notice"]');
    assert.ok(compNotice && compNotice.textContent.includes('Comparing: sensors[2] (2) == target (2) ➔ TRUE'));
  });

  test('renders binary search window, LOW/MID/HIGH boundary badges, and dims eliminated cells', async () => {
    const activeFrame = {
      arrays: {
        grid: [2, 6, 11, 19, 27, 34, 45]
      },
      variables: {
        target: 19,
        low: 3,
        mid: 5,
        high: 6
      },
      searchBounds: {
        low: 3,
        mid: 5,
        high: 6
      }
    };

    await act(async () => {
      root.render(
        React.createElement(ArrayWatchPanel, {
          level: { id: 49 },
          activeFrame
        })
      );
    });

    // Window indicator
    const windowInd = container.querySelector('[data-testid="binary-search-window-indicator"]');
    assert.ok(windowInd && windowInd.textContent.includes('Search Window: [3 .. 6]'));
    assert.ok(windowInd && windowInd.textContent.includes('Midpoint: [5]'));

    // Boundary badges on cells
    const lowBound = container.querySelector('[data-testid="search-bound-grid-3"]');
    assert.ok(lowBound && lowBound.textContent.includes('LOW'));

    const midBound = container.querySelector('[data-testid="search-bound-grid-5"]');
    assert.ok(midBound && midBound.textContent.includes('MID'));

    const highBound = container.querySelector('[data-testid="search-bound-grid-6"]');
    assert.ok(highBound && highBound.textContent.includes('HIGH'));

    // Cell 0, 1, 2 should be eliminated (idx < low)
    const cell0 = container.querySelector('[data-testid="array-cell-grid-0"]');
    assert.ok(cell0, 'Cell 0 should exist');
    assert.equal(cell0.style.opacity, '0.38');
    const discarded0 = container.querySelector('[data-testid="cell-eliminated-grid-0"]');
    assert.ok(discarded0 && discarded0.textContent.includes('discarded'));
  });
});
