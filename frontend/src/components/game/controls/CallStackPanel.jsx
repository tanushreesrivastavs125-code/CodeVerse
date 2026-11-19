/**
 * CallStackPanel Component
 * Displays active routine execution frames, call depth (bounded to 8),
 * caller/return points, parameter arguments, and isolated local variables.
 */
export function CallStackPanel({
  activeFrame = null,
  level = null,
  program = []
}) {
  const isLevelEligible = level && level.id >= 33;
  const hasRoutinesInProgram = Array.isArray(program) && program.some(
    node => node && (node.type === 'fn_def' || node.type === 'fn_call')
  );

  const callStack = activeFrame?.callStack || [];
  const depth = callStack.length;
  const topFrame = depth > 0 ? callStack[depth - 1] : null;
  const activeRoutineName = topFrame?.name || activeFrame?.activeRoutine || null;

  // Don't clutter earlier levels if routines aren't part of the level concepts
  if (!isLevelEligible && !hasRoutinesInProgram && depth === 0) {
    return null;
  }

  const explanation = activeRoutineName
    ? `"${activeRoutineName}" runs these instructions whenever you call it.`
    : 'Main Program (Top-Level)';

  return (
    <div
      className="calm-card call-stack-panel"
      role="region"
      aria-label="Call Stack Panel"
      data-testid="call-stack-panel"
      style={{
        padding: '0.85rem 1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        borderLeft: '3px solid var(--accent-purple, #a855f7)'
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
          <span style={{ fontSize: '0.95rem' }}>📚</span>
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
            Call Stack
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            data-testid="call-stack-depth"
            style={{
              fontSize: '0.72rem',
              color: depth > 6 ? '#ef4444' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              backgroundColor: depth > 6 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${depth > 6 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`
            }}
          >
            Depth: {depth}/8
          </span>
        </div>
      </div>

      {/* Routine Explanation Banner */}
      <div
        data-testid="call-stack-explanation"
        style={{
          fontSize: '0.78rem',
          padding: '0.35rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: topFrame ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.04)',
          border: topFrame ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem'
        }}
      >
        <span>{topFrame ? '⚡' : '▶'}</span>
        <span data-testid="call-stack-active-routine">
          {explanation}
        </span>
      </div>

      {/* Stack Frames */}
      {depth === 0 ? (
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            padding: '0.2rem 0'
          }}
        >
          No active routine call. Executing at top-level main program.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem'
          }}
        >
          {/* Render call stack from newest frame down to caller */}
          {[...callStack].reverse().map((frame, idx) => {
            const isTop = idx === 0;
            const paramEntries = Object.entries(frame.params || {});
            const localEntries = Object.entries(frame.locals || {}).filter(
              ([k]) => !(k in (frame.params || {}))
            );

            return (
              <div
                key={`${frame.name}-${idx}`}
                data-testid={`stack-frame-${frame.name}`}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isTop ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-secondary, rgba(255, 255, 255, 0.03))',
                  border: isTop ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--accent-purple, #a855f7)', fontWeight: 700 }}>
                      {frame.name}()
                    </span>
                    {isTop && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          backgroundColor: 'rgba(168, 85, 247, 0.25)',
                          color: 'var(--accent-purple, #c084fc)',
                          padding: '0.05rem 0.35rem',
                          borderRadius: '3px',
                          fontWeight: 700
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    caller: {frame.caller}
                  </span>
                </div>

                {/* Parameters */}
                {paramEntries.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Params:</span>
                    {paramEntries.map(([pName, pVal]) => (
                      <span
                        key={pName}
                        data-testid={`param-${pName}`}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.1rem 0.4rem',
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '3px',
                          color: 'var(--accent-cyan)'
                        }}
                      >
                        {pName} = {pVal}
                      </span>
                    ))}
                  </div>
                )}

                {/* Local variables */}
                {localEntries.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Locals:</span>
                    {localEntries.map(([lName, lVal]) => (
                      <span
                        key={lName}
                        data-testid={`local-${lName}`}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.1rem 0.4rem',
                          backgroundColor: 'rgba(236, 72, 153, 0.12)',
                          border: '1px solid rgba(236, 72, 153, 0.3)',
                          borderRadius: '3px',
                          color: '#f472b6'
                        }}
                      >
                        {lName} = {lVal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
