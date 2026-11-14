import { useState } from 'react';

/**
 * MissionBriefing Component renders the current sector objectives,
 * educational concepts, and collapsible hint drawer with calm UI tokens.
 */
export function MissionBriefing({ level }) {
  const [showHint, setShowHint] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!level) return null;

  const hasConstraints = Boolean(
    level.requireLoops ||
    level.requireSensors ||
    level.bossHealth > 0 ||
    level.maxBlocks ||
    level.maxActions
  );

  return (
    <div
      className="calm-card"
      style={{
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                fontWeight: 600
              }}
            >
              Level {level.id} • {level.zone || 'District'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {level.concept}
            </span>

            {level.difficulty && (
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(192, 132, 252, 0.12)',
                  color: 'var(--accent-purple)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                Difficulty {level.difficulty}
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', marginBottom: 0 }}>
            {level.title}
          </h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontFamily: 'var(--font-mono)' }}>
            TARGET
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
            {level.par} actions
          </span>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
        {level.briefing}
      </p>

      {/* Collapsible Constraints Drawer */}
      {hasConstraints && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: 0
              }}
            >
              <span>{showDetails ? '▾ Hide Level Constraints' : '▸ View Level Constraints'}</span>
            </button>
          </div>

          {showDetails && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.4rem' }}>
              {level.requireLoops && (
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(192, 132, 252, 0.15)', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-subtle)' }}>
                  ↻ Loop Block Required
                </span>
              )}
              {level.requireSensors && (
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(96, 165, 250, 0.15)', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-subtle)' }}>
                  👁 Sensor Condition Required
                </span>
              )}
              {level.bossHealth > 0 && (
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(244, 114, 182, 0.15)', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-subtle)' }}>
                  ✕ Guardian Shield ({level.bossHealth} HP)
                </span>
              )}
              {level.maxBlocks && (
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(251, 191, 36, 0.15)', color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-subtle)' }}>
                  Max {level.maxBlocks} Blocks
                </span>
              )}
              {level.maxActions && (
                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', fontFamily: 'var(--font-mono)', border: '1px solid var(--border-subtle)' }}>
                  Max {level.maxActions} Actions
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hint Accordion */}
      {level.hint && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setShowHint((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: 0
            }}
          >
            <span>💡</span>
            <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
          </button>

          {showHint && (
            <div
              style={{
                marginTop: '0.4rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                lineHeight: 1.5
              }}
            >
              {level.hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MissionBriefing;
