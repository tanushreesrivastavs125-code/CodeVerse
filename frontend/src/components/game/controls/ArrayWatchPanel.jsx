import { useEffect, useState } from 'react';

/**
 * ArrayWatchPanel Component
 * Displays live array state, zero-based indexed cells, read/write highlights,
 * and traversal pointer indicators during program playback.
 */
export function ArrayWatchPanel({
  arrays = {},
  activeFrame = null,
  level = null,
  variables = {}
}) {
  const isLevelEligible = level && level.id >= 39;
  const currentArrays = activeFrame?.arrays || arrays || {};
  const currentVariables = activeFrame?.variables || variables || {};
  const arrayEntries = Object.entries(currentArrays);
  const hasArrays = arrayEntries.length > 0;

  const mutation = activeFrame?.arrayMutation || null;
  const read = activeFrame?.arrayRead || null;

  const targetVal = currentVariables.target !== undefined
    ? currentVariables.target
    : (level?.initialVariables?.target ?? level?.targetValue);
  const hasTarget = targetVal !== undefined;
  const comparisons = activeFrame?.comparisons ?? currentVariables.comparisons ?? 0;
  const foundVal = currentVariables.found;
  const lastComparison = activeFrame?.lastComparison || null;

  const searchBounds = activeFrame?.searchBounds || (
    typeof currentVariables.low === 'number' && typeof currentVariables.high === 'number'
      ? { low: currentVariables.low, high: currentVariables.high, mid: currentVariables.mid }
      : null
  );

  // Pulse animation states
  const [pulsingMutation, setPulsingMutation] = useState(null);
  const [pulsingRead, setPulsingRead] = useState(null);

  useEffect(() => {
    if (mutation?.name) {
      setPulsingMutation({ name: mutation.name, index: mutation.index });
      const timer = setTimeout(() => setPulsingMutation(null), 800);
      return () => clearTimeout(timer);
    }
  }, [mutation]);

  useEffect(() => {
    if (read?.name && read?.index !== undefined) {
      setPulsingRead({ name: read.name, index: read.index });
      const timer = setTimeout(() => setPulsingRead(null), 800);
      return () => clearTimeout(timer);
    }
  }, [read]);

  // Don't clutter earlier levels if arrays/search aren't part of the level concepts
  if (!isLevelEligible && !hasArrays && !hasTarget) {
    return null;
  }

  // Find variables pointing to an array index for traversal pointer display
  const getPointersForIndex = (arrLength, index) => {
    const pointers = [];
    for (const [varName, varVal] of Object.entries(currentVariables)) {
      if (typeof varVal === 'number' && varVal === index && index >= 0 && index < arrLength) {
        pointers.push(varName);
      }
    }
    return pointers;
  };

  return (
    <div
      className="calm-card array-watch-panel"
      role="region"
      aria-label="Array and Search Watch Panel"
      data-testid="array-watch-panel"
      style={{
        padding: '0.85rem 1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        borderLeft: '3px solid var(--accent-emerald, #10b981)'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.95rem' }}>🔢</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase'
            }}
          >
            Array &amp; Search Watch
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {hasTarget && (
            <span
              data-testid="search-target-badge"
              style={{
                fontSize: '0.72rem',
                color: 'var(--accent-purple, #a855f7)',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                padding: '0.12rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700
              }}
            >
              🎯 Target: {targetVal}
            </span>
          )}
          {(comparisons > 0 || hasTarget) && (
            <span
              data-testid="search-comparisons-count"
              style={{
                fontSize: '0.72rem',
                color: 'var(--accent-cyan, #06b6d4)',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '0.12rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600
              }}
            >
              🔍 Comparisons: {comparisons}
            </span>
          )}
          {hasArrays && (
            <span
              data-testid="array-watch-count"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {arrayEntries.length} {arrayEntries.length === 1 ? 'array' : 'arrays'} active
            </span>
          )}
        </div>
      </div>

      {/* Search Found / Not Found Banner */}
      {foundVal !== undefined && (
        <div
          data-testid="search-status-banner"
          role="status"
          aria-live="polite"
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: foundVal >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${foundVal >= 0 ? '#10b981' : '#ef4444'}`,
            color: foundVal >= 0 ? '#10b981' : '#ef4444',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <span>{foundVal >= 0 ? '🎯' : '❌'}</span>
          <span>
            {foundVal >= 0
              ? `Target found at index [${foundVal}]`
              : 'Target not found (-1)'}
          </span>
        </div>
      )}

      {/* Binary Search Window Indicator */}
      {searchBounds && (
        <div
          data-testid="binary-search-window-indicator"
          style={{
            fontSize: '0.75rem',
            padding: '0.3rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>📏</span>
            <span>
              Search Window: <strong>[{searchBounds.low} .. {searchBounds.high}]</strong>
            </span>
            {searchBounds.mid !== undefined && (
              <span style={{ color: 'var(--accent-amber, #f59e0b)' }}>
                | Midpoint: <strong>[{searchBounds.mid}]</strong>
              </span>
            )}
          </div>
          {searchBounds.low > searchBounds.high && (
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              (Search window exhausted: low &gt; high)
            </span>
          )}
        </div>
      )}

      {/* Live Comparison Notice */}
      {lastComparison && (
        <div
          data-testid="search-comparison-notice"
          role="status"
          aria-live="polite"
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <span>⚖️</span>
          <span>
            Comparing: <code>{lastComparison.left}</code> ({lastComparison.leftVal}) {lastComparison.op} <code>{lastComparison.right}</code> ({lastComparison.rightVal}) ➔ <strong>{lastComparison.outcome ? 'TRUE' : 'FALSE'}</strong>
          </span>
        </div>
      )}

      {/* Arrays Content */}
      {!hasArrays ? (
        <div
          data-testid="array-watch-empty"
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            padding: '0.25rem 0'
          }}
        >
          No arrays created yet. Use the <code>create array [name] with [values]</code> block to store items.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          {arrayEntries.map(([name, elements]) => {
            const arrLen = elements.length;
            return (
              <div
                key={name}
                data-testid={`array-container-${name}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-secondary, rgba(255, 255, 255, 0.04))',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {/* Array Info Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem'
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: 'var(--accent-emerald, #10b981)'
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '3px'
                    }}
                  >
                    length: {arrLen}
                  </span>
                </div>

                {/* Array Cells Row */}
                {arrLen === 0 ? (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic'
                    }}
                  >
                    Empty array (length 0)
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      alignItems: 'flex-start'
                    }}
                  >
                    {elements.map((val, idx) => {
                      const isMutated =
                        pulsingMutation?.name === name && pulsingMutation?.index === idx;
                      const isRead =
                        pulsingRead?.name === name && pulsingRead?.index === idx;
                      const pointers = getPointersForIndex(arrLen, idx);

                      // Check if eliminated in binary search window
                      let isEliminated = false;
                      let eliminationReason = '';
                      if (searchBounds && typeof searchBounds.low === 'number' && typeof searchBounds.high === 'number') {
                        if (idx < searchBounds.low) {
                          isEliminated = true;
                          eliminationReason = `Discarded: index ${idx} < low (${searchBounds.low}). In sorted array, all values here are smaller than target.`;
                        } else if (idx > searchBounds.high) {
                          isEliminated = true;
                          eliminationReason = `Discarded: index ${idx} > high (${searchBounds.high}). In sorted array, all values here are larger than target.`;
                        }
                      }

                      // Check binary search bounds markers
                      const isLow = searchBounds && searchBounds.low === idx;
                      const isMid = searchBounds && searchBounds.mid === idx;
                      const isHigh = searchBounds && searchBounds.high === idx;

                      return (
                        <div
                          key={idx}
                          data-testid={`array-cell-${name}-${idx}`}
                          title={isEliminated ? eliminationReason : `Index ${idx}: ${val}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.2rem',
                            opacity: isEliminated ? 0.38 : 1,
                            filter: isEliminated ? 'grayscale(70%)' : 'none',
                            transition: 'opacity 0.25s ease, filter 0.25s ease'
                          }}
                        >
                          {/* Zero-based Index Header */}
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-muted)',
                              fontWeight: 600
                            }}
                          >
                            [{idx}]
                          </span>

                          {/* Cell Value Box */}
                          <div
                            style={{
                              minWidth: '2.2rem',
                              height: '2rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.2rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isMutated
                                ? 'rgba(16, 185, 129, 0.3)'
                                : isRead
                                ? 'rgba(245, 158, 11, 0.3)'
                                : 'rgba(0, 0, 0, 0.25)',
                              border: isMutated
                                ? '2px solid var(--accent-emerald, #10b981)'
                                : isRead
                                ? '2px solid #f59e0b'
                                : isEliminated
                                ? '1px dashed rgba(255, 255, 255, 0.15)'
                                : '1px solid var(--border-subtle)',
                              boxShadow: isMutated
                                ? '0 0 10px rgba(16, 185, 129, 0.4)'
                                : isRead
                                ? '0 0 10px rgba(245, 158, 11, 0.4)'
                                : 'none',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              textDecoration: isEliminated ? 'line-through' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {val}
                          </div>

                          {/* Search Boundary Badges */}
                          {(isLow || isMid || isHigh) && (
                            <div
                              data-testid={`search-bound-${name}-${idx}`}
                              style={{
                                display: 'flex',
                                gap: '0.15rem',
                                fontSize: '0.6rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800
                              }}
                            >
                              {isLow && (
                                <span style={{ color: 'var(--accent-cyan, #06b6d4)', backgroundColor: 'rgba(6, 182, 212, 0.2)', padding: '0.05rem 0.25rem', borderRadius: '2px' }}>
                                  LOW
                                </span>
                              )}
                              {isMid && (
                                <span style={{ color: 'var(--accent-amber, #f59e0b)', backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: '0.05rem 0.25rem', borderRadius: '2px' }}>
                                  MID
                                </span>
                              )}
                              {isHigh && (
                                <span style={{ color: 'var(--accent-purple, #a855f7)', backgroundColor: 'rgba(168, 85, 247, 0.2)', padding: '0.05rem 0.25rem', borderRadius: '2px' }}>
                                  HIGH
                                </span>
                              )}
                            </div>
                          )}

                          {/* Traversal Pointer Indicator (e.g. ▲ i) */}
                          {pointers.length > 0 && (
                            <div
                              data-testid={`array-pointer-${name}-${idx}`}
                              style={{
                                fontSize: '0.68rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--accent-cyan, #06b6d4)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.15rem'
                              }}
                            >
                              <span>▲</span>
                              <span>{pointers.join(', ')}</span>
                            </div>
                          )}

                          {/* Discarded label for eliminated cells */}
                          {isEliminated && (
                            <span
                              data-testid={`cell-eliminated-${name}-${idx}`}
                              style={{
                                fontSize: '0.55rem',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--text-muted)'
                              }}
                            >
                              discarded
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Live Array Mutation Notice */}
      {mutation && (
        <div
          data-testid="array-mutation-notice"
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <span>⚡</span>
          <span>{mutation.explanation || `Updated ${mutation.name}[${mutation.index}] to ${mutation.val}`}</span>
        </div>
      )}

      {/* Live Array Read Notice */}
      {read && (
        <div
          data-testid="array-read-notice"
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <span>👁️</span>
          <span>Read {read.name}[{read.index}] = {read.value}</span>
        </div>
      )}

      {/* Educational Footnote */}
      <div
        data-testid="array-watch-footnote"
        style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          borderTop: '1px dashed var(--border-subtle)',
          paddingTop: '0.45rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}
      >
        <span>💡</span>
        <span>
          <strong>{searchBounds ? 'Binary Search: ' : 'Zero-Based Indexing: '}</strong>
          {searchBounds
            ? 'Compare middle element (mid); discard the half where target cannot exist in sorted order.'
            : <>First cell is <code>[0]</code>, second is <code>[1]</code>, up to <code>[length - 1]</code>.</>}
        </span>
      </div>
    </div>
  );
}
