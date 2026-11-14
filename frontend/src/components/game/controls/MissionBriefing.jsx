import { useState } from 'react';
import { getLevelCurriculum } from '../../../../../shared/curriculum.js';

/**
 * MissionBriefing Component renders the current sector objectives,
 * educational concepts, interactive lesson trigger, and collapsible 3-tier
 * graduated hints drawer with calm UI tokens.
 */
export function MissionBriefing({ level, onOpenLesson }) {
  const [showHint, setShowHint] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [revealedTier, setRevealedTier] = useState(1); // 1, 2, or 3

  if (!level) return null;

  const curriculum = getLevelCurriculum(level.id);
  const hints = curriculum?.hints || [
    { level: 1, label: 'Notice the Goal', text: level.hint || 'Review the grid path to the goal.' },
    { level: 2, label: 'Helpful Concept', text: `Apply the "${level.concept}" concept to solve this level.` },
    { level: 3, label: 'Step-by-Step Suggestion', text: 'Break down your movement step-by-step.' }
  ];

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

            {typeof onOpenLesson === 'function' && (
              <button
                type="button"
                onClick={onOpenLesson}
                title="Open interactive lesson, demonstration, and visual legend"
                style={{
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <span>📖</span>
                <span>Learn</span>
              </button>
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

      {/* Graduated 3-Tier Hints Accordion */}
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
          <span>{showHint ? 'Hide Hints' : 'Need a Hint?'}</span>
        </button>

        {showHint && (
          <div
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            {/* Tier 1: Notice the Goal */}
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                lineHeight: 1.5
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Hint 1 // Notice the Goal
              </div>
              {hints[0]?.text || level.hint}
            </div>

            {/* Tier 2: Helpful Concept */}
            {revealedTier >= 2 ? (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Hint 2 // Helpful Concept
                </div>
                {hints[1]?.text}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevealedTier(2)}
                style={{
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'rgba(192, 132, 252, 0.12)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-purple)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🔍 Reveal Hint 2: Helpful Concept →
              </button>
            )}

            {/* Tier 3: Step-by-Step Suggestion */}
            {revealedTier >= 3 ? (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  lineHeight: 1.5
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Hint 3 // Step-by-Step Suggestion
                </div>
                {hints[2]?.text}
              </div>
            ) : revealedTier >= 2 ? (
              <button
                type="button"
                onClick={() => setRevealedTier(3)}
                style={{
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-emerald)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                📝 Reveal Hint 3: Step-by-Step Suggestion →
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default MissionBriefing;
