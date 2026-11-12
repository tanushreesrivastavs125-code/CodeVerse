import { useEffect } from 'react';

/**
 * ResultModal renders victory rewards or failure feedback upon run completion.
 * Shows authoritative stars, earned XP/coins, replay indicators, and next sector navigation.
 */
export function ResultModal({
  result,
  onClose,
  onNextSector,
  hasNextSector = false
}) {
  // Listen for Escape key to close modal
  useEffect(() => {
    if (!result) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result, onClose]);

  if (!result) return null;

  const isVictory = Boolean(result.passed);
  const stars = Number(result.stars) || 0;
  const xpEarned = result.earned?.xp ?? 0;
  const coinsEarned = result.earned?.coins ?? 0;
  const isReplay = isVictory && xpEarned === 0 && coinsEarned === 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000, // Above Blockly workspace and flyouts
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: isVictory ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-red)',
          padding: '2.25rem',
          boxShadow: isVictory
            ? '0 25px 60px rgba(52, 211, 153, 0.2)'
            : '0 25px 60px rgba(255, 77, 109, 0.2)',
          textAlign: 'center',
          animation: 'scaleIn 0.25s ease-out',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close result modal"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem'
          }}
        >
          ✕
        </button>
        {/* Emblem */}
        <div
          style={{
            fontSize: '3rem',
            lineHeight: 1,
            marginBottom: '0.75rem',
            color: isVictory ? '#34d399' : '#f87171'
          }}
        >
          {isVictory ? '✦' : '⚠'}
        </div>

        <div
          style={{
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: isVictory ? 'var(--accent-emerald)' : '#f87171',
            letterSpacing: '0.1em',
            marginBottom: '0.25rem'
          }}
        >
          {isVictory ? 'MISSION ACCOMPLISHED // SECTOR SECURED' : 'MISSION FAILED // DIAGNOSTICS LOGGED'}
        </div>

        <h2
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}
        >
          {isVictory ? 'Objective Complete!' : 'Drone Calibration Failed'}
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            maxWidth: '440px',
            margin: '0 auto 1.5rem'
          }}
        >
          {result.message || (isVictory ? 'Drone reached the extraction portal successfully.' : 'Program terminated before extraction.')}
        </p>

        {/* Victory Stars & Rewards */}
        {isVictory && (
          <div
            style={{
              backgroundColor: 'rgba(17, 24, 39, 0.8)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            {/* Stars */}
            <div style={{ fontSize: '2.2rem', letterSpacing: '0.2em' }}>
              {[1, 2, 3].map((starIdx) => (
                <span
                  key={starIdx}
                  style={{
                    color: starIdx <= stars ? '#facc15' : 'rgba(75, 85, 99, 0.4)',
                    textShadow: starIdx <= stars ? '0 0 15px rgba(250, 204, 21, 0.6)' : 'none'
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Currency rewards */}
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                +{xpEarned} Flight XP
              </span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                +{coinsEarned} Drone Credits
              </span>
            </div>

            {isReplay && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Replay completed — sector rewards already claimed on previous clearance.
              </span>
            )}

            {isVictory && !hasNextSector && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(217, 70, 239, 0.12)',
                  border: '1px solid rgba(217, 70, 239, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}
              >
                <div style={{ color: '#f0abfc', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.05em' }}>
                  🏆 CAMPAIGN MASTERED // THE SINGULARITY SECURED
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.35rem 0 0' }}>
                  All 24 sectors across all six districts are secured! Autonomous drone navigation mastery achieved.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isVictory && hasNextSector && (
            <button
              type="button"
              onClick={onNextSector}
              style={{
                padding: '0.75rem 1.6rem',
                backgroundColor: 'var(--accent-cyan)',
                color: '#070f18',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.92rem',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
              }}
            >
              Next Sector →
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.4rem',
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {isVictory && !hasNextSector ? 'Review Campaign Dossier' : isVictory ? 'Replay / Refine Code' : 'Debug & Rebuild Program'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultModal;
