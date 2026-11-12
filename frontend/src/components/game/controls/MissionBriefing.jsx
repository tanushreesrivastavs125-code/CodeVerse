import { useState } from 'react';

/**
 * MissionBriefing Component renders the current sector objectives,
 * educational concepts, and collapsible hint drawer.
 */
export function MissionBriefing({ level }) {
  const [showHint, setShowHint] = useState(false);

  if (!level) return null;

  return (
    <div
      style={{
        backgroundColor: '#0c1824',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                letterSpacing: '0.08em'
              }}
            >
              SECTOR {level.id} // {level.zone?.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {level.concept}
            </span>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {level.title}
          </h2>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontFamily: 'var(--font-mono)' }}>
            TACTICAL PAR
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
            {level.par} actions
          </span>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
        {level.briefing}
      </p>

      {/* Hint Accordion */}
      {level.hint && (
        <div style={{ borderTop: '1px solid rgba(75, 85, 99, 0.25)', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowHint((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: 0
            }}
          >
            <span>💡</span>
            <span>{showHint ? 'Hide Mission Hint' : 'Need a Flight Hint?'}</span>
          </button>

          {showHint && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-sm)',
                color: '#e0f2fe',
                fontSize: '0.85rem',
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
