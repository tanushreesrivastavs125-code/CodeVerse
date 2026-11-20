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

  // Don't clutter earlier levels if arrays aren't part of the level concepts
  if (!isLevelEligible && !hasArrays) {
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
      aria-label="Array Watch Panel"
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
            Array Watch
          </span>
        </div>

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

                      return (
                        <div
                          key={idx}
                          data-testid={`array-cell-${name}-${idx}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.2rem'
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
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {val}
                          </div>

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

      {/* Educational Zero-Based Indexing Footnote */}
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
          <strong>Zero-Based Indexing:</strong> First cell is <code>[0]</code>, second is <code>[1]</code>, up to <code>[length - 1]</code>.
        </span>
      </div>
    </div>
  );
}
