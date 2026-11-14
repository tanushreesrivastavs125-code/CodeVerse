import { useEffect } from 'react';

/**
 * Returns plain-language pedagogical correction advice based on simulation result and level mechanics.
 */
function getPlainLanguageCorrection(result, level) {
  if (!result) return 'Review your block program and try again.';
  const msg = result.message || '';
  const reason = result.reason || '';
  const text = `${msg} ${reason}`.toLowerCase();

  if (text.includes('corruption') || text.includes('jump') || text.includes('hazard')) {
    return "The drone stepped into a corruption tile. Use the 'jump' block to leap 2 tiles forward over red hazard tiles.";
  }
  if (text.includes('blocked') || text.includes('wall') || text.includes('route blocked')) {
    return "The path ahead was blocked by a wall or obstacle. Check your movement sequence and make sure to turn before hitting a wall.";
  }
  if (text.includes('energy') || text.includes('shard')) {
    return "The extraction portal requires all energy shards. Make sure your drone lands on every shard tile and uses the 'collect' block.";
  }
  if (text.includes('guardian') || text.includes('pulse') || text.includes('firewall')) {
    const hp = level?.bossHealth || 3;
    return `The firewall guardian is still active. Face the guardian from up to 3 tiles away and fire 'pulse' strikes (${hp} times) to break its shield.`;
  }
  if (text.includes('terminal') || text.includes('bridge')) {
    return "The bridge is retracted. Move onto the terminal switch ('T') and execute the 'activate' block to extend the bridge.";
  }
  if (text.includes('repeat') || text.includes('loop')) {
    return "This sector requires a repeat block. Group repeating actions inside a repeat loop to meet the sector requirement.";
  }
  if (text.includes('sensor') || text.includes('condition')) {
    return "This sector requires a sensor condition. Use an 'if' sensor block (checking wall, energy, or hazard) to adapt dynamically.";
  }
  if (text.includes('program too large') || text.includes('budget') || text.includes('block')) {
    return "You exceeded the maximum block budget. Use repeat loops to accomplish repeated movements with fewer blocks.";
  }
  if (text.includes('action limit') || text.includes('steps')) {
    return "Action step limit reached. Plan a shorter, more direct path to reach the portal before running out of steps.";
  }
  if (text.includes('portal') || text.includes('exit') || text.includes('extraction')) {
    return "Your program finished without reaching the extraction portal. Add more movement blocks to guide the drone all the way to the goal.";
  }

  return "Check your program sequence step-by-step to guide the drone to the extraction portal.";
}

/**
 * ResultModal renders victory rewards or failure feedback upon run completion.
 * Shows authoritative stars, earned XP/coins, celebratory animations,
 * plain-language corrections, and prominent navigation controls.
 */
export function ResultModal({
  result,
  isOpen = true,
  onClose,
  onNextSector,
  hasNextSector = false,
  onReplay,
  onOpenCampaign,
  onEditProgram,
  onResetToEdit,
  onRerun,
  onTryAgain,
  onShowHint,
  level
}) {
  // Listen for Escape key to close modal
  useEffect(() => {
    if (!result || !isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result, isOpen, onClose]);

  if (!result || !isOpen) return null;

  const isVictory = Boolean(result.passed);
  const stars = Number(result.stars) || 0;
  const xpEarned = result.earned?.xp ?? 0;
  const coinsEarned = result.earned?.coins ?? 0;
  const isReplay = isVictory && xpEarned === 0 && coinsEarned === 0;
  const finalX = result.state?.x;
  const finalY = result.state?.y;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
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
        aria-labelledby="result-modal-title"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: isVictory ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-red)',
          padding: '2.25rem',
          boxShadow: isVictory
            ? '0 25px 60px rgba(52, 211, 153, 0.25)'
            : '0 25px 60px rgba(255, 77, 109, 0.25)',
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

        {/* Robot Avatar & Celebratory Bounce */}
        {isVictory ? (
          <div
            className="robot-victory-avatar"
            style={{
              fontSize: '3.5rem',
              lineHeight: 1,
              marginBottom: '0.75rem'
            }}
          >
            🤖✨
          </div>
        ) : (
          <div
            style={{
              fontSize: '3.2rem',
              lineHeight: 1,
              marginBottom: '0.75rem',
              color: 'var(--accent-red)'
            }}
          >
            🤖⚡
          </div>
        )}

        <div
          style={{
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: isVictory ? 'var(--accent-emerald)' : '#f87171',
            letterSpacing: '0.1em',
            marginBottom: '0.25rem'
          }}
        >
          {isVictory ? 'MISSION ACCOMPLISHED // SECTOR SECURED' : 'SECTOR INCOMPLETE // DIAGNOSTICS LOGGED'}
        </div>

        <h2
          id="result-modal-title"
          style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}
        >
          {isVictory ? 'Level complete!' : 'Not quite yet—try again'}
        </h2>

        {/* Outcome Description */}
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            maxWidth: '460px',
            margin: '0 auto 1.25rem'
          }}
        >
          {result.message || (isVictory ? 'Drone reached the extraction portal successfully.' : 'Program terminated before extraction.')}
        </p>

        {/* VICTORY DETAILS */}
        {isVictory && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
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
            <div
              style={{ fontSize: '2.4rem', letterSpacing: '0.2em' }}
              aria-label={`Awarded ${stars} of 3 stars`}
            >
              {[1, 2, 3].map((starIdx) => (
                <span
                  key={starIdx}
                  style={{
                    color: starIdx <= stars ? '#facc15' : 'rgba(75, 85, 99, 0.4)',
                    textShadow: starIdx <= stars ? '0 0 16px rgba(250, 204, 21, 0.7)' : 'none'
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Currency rewards */}
            {isReplay ? (
              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.6rem 1rem',
                  fontSize: '0.82rem',
                  color: '#93c5fd',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                ★ Replay Cleared // First-clear XP and Credits were already collected.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  +{xpEarned} Flight XP
                </span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                  +{coinsEarned} Drone Credits 🪙
                </span>
              </div>
            )}

            {/* Final campaign level completion banner */}
            {!hasNextSector && (
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
                  🏆 CAMPAIGN COMPLETE // ALL 24 SECTORS CLEARED
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.35rem 0 0' }}>
                  Congratulations! You have completed all 24 sectors across all six districts. Autonomous drone navigation mastery achieved.
                </p>
              </div>
            )}
          </div>
        )}

        {/* FAILURE DETAILS */}
        {!isVictory && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            {/* Grid Position Indicator */}
            {typeof finalX === 'number' && typeof finalY === 'number' && (
              <div
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)'
                }}
              >
                📍 Drone stopped at board position: <code style={{ color: 'var(--accent-cyan)' }}>({finalX}, {finalY})</code>
              </div>
            )}

            {/* Plain Language Correction */}
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderLeft: '3px solid #f87171',
                padding: '0.75rem 0.9rem',
                borderRadius: '4px'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.25rem' }}>
                💡 SUGGESTED CORRECTION
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {getPlainLanguageCorrection(result, level)}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Your block program is safely preserved in the editor so you can refine and try again.
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
              Next Level →
            </button>
          )}

          {isVictory && (
            <>
              <button
                type="button"
                onClick={onReplay || onClose}
                style={{
                  padding: '0.75rem 1.3rem',
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Replay Level
              </button>

              <button
                type="button"
                onClick={onOpenCampaign || onClose}
                style={{
                  padding: '0.75rem 1.3rem',
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Campaign Map
              </button>
            </>
          )}

          {!isVictory && (
            <>
              <button
                type="button"
                onClick={onRerun || onTryAgain || onClose}
                style={{
                  padding: '0.75rem 1.4rem',
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
                Rerun Program
              </button>

              <button
                type="button"
                onClick={onResetToEdit || onTryAgain || onClose}
                style={{
                  padding: '0.75rem 1.3rem',
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Reset to Edit
              </button>

              <button
                type="button"
                onClick={onEditProgram || onClose}
                style={{
                  padding: '0.75rem 1.3rem',
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Edit Program
              </button>

              <button
                type="button"
                onClick={onShowHint || onClose}
                style={{
                  padding: '0.75rem 1.3rem',
                  backgroundColor: 'rgba(66, 227, 198, 0.12)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--accent-cyan)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Show Hint
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultModal;
