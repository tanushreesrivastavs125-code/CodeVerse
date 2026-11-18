import { useEffect, useState } from 'react';

/**
 * VariablesWatchPanel Component
 * Displays live variable bindings, counter values, animated mutation indicators,
 * and while-loop condition evaluations with snapshot isolation during playback.
 */
export function VariablesWatchPanel({
  variables = {},
  activeFrame = null,
  level = null
}) {
  const isLevelEligible = level && level.id >= 25;
  const currentVariables = activeFrame?.variables || variables || {};
  const varEntries = Object.entries(currentVariables);
  const hasVariables = varEntries.length > 0;

  const mutation = activeFrame?.varMutation || null;
  const whileCondition = activeFrame?.whileCondition || null;

  // Pulse animation state for mutated variable
  const [pulsingVar, setPulsingVar] = useState(null);
  useEffect(() => {
    if (mutation?.varName) {
      setPulsingVar(mutation.varName);
      const timer = setTimeout(() => setPulsingVar(null), 800);
      return () => clearTimeout(timer);
    }
  }, [mutation]);

  // Don't clutter earlier levels if variables aren't part of the level concepts
  if (!isLevelEligible && !hasVariables) {
    return null;
  }

  return (
    <div
      className="calm-card variables-watch-panel"
      role="region"
      aria-label="Variable Watch Panel"
      style={{
        padding: '0.85rem 1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        borderLeft: '3px solid var(--accent-cyan)'
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
          <span style={{ fontSize: '0.95rem' }}>📊</span>
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
            Variable Watch
          </span>
        </div>

        {hasVariables && (
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {varEntries.length} {varEntries.length === 1 ? 'binding' : 'bindings'} active
          </span>
        )}
      </div>

      {/* Variable Badges List */}
      {!hasVariables ? (
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            padding: '0.25rem 0'
          }}
        >
          No variables initialized yet. Use the <code>set [var] to [val]</code> block to create a variable.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.55rem',
            alignItems: 'center'
          }}
        >
          {varEntries.map(([name, val]) => {
            const isPulsing = pulsingVar === name;
            return (
              <div
                key={name}
                data-testid={`var-badge-${name}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isPulsing
                    ? 'rgba(6, 182, 212, 0.25)'
                    : 'var(--bg-secondary, rgba(255, 255, 255, 0.05))',
                  border: isPulsing
                    ? '1px solid var(--accent-cyan)'
                    : '1px solid var(--border-subtle)',
                  transition: 'all 0.25s ease',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem'
                }}
              >
                <span
                  style={{
                    color: 'var(--accent-cyan)',
                    fontWeight: 600
                  }}
                >
                  {name}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>=</span>
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    padding: '0.05rem 0.35rem',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Variable Mutation Notice */}
      {mutation && (
        <div
          data-testid="var-mutation-notice"
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          <span>⚡</span>
          <span>{mutation.changeText}</span>
        </div>
      )}

      {/* Live While-Condition Evaluation Pill */}
      {whileCondition && (
        <div
          data-testid="while-condition-pill"
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: whileCondition.outcome
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            border: whileCondition.outcome
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.35rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🔄</span>
            <span>
              While [<code>{whileCondition.expr}</code>] is{' '}
              <strong
                style={{
                  color: whileCondition.outcome
                    ? 'var(--accent-emerald, #10b981)'
                    : '#ef4444'
                }}
              >
                {whileCondition.outcome ? 'TRUE' : 'FALSE'}
              </strong>
            </span>
          </div>

          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Iteration #{whileCondition.iteration}
          </span>
        </div>
      )}
    </div>
  );
}
