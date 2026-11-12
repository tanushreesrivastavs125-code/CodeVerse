import { useEffect } from 'react';

/**
 * CampaignSelectorModal renders the sector selection dossier,
 * displaying locked/unlocked state, completion badges, and star mastery.
 */
export function CampaignSelectorModal({
  isOpen,
  onClose,
  levels = [],
  currentLevelId,
  onSelectLevel,
  isBusy = false
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 15, 24, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000, // Explicitly above Blockly workspace and flyouts
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
        aria-labelledby="campaign-modal-title"
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#0c1824',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glow)',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              REBOOT CAMPAIGN // SECTOR SELECTOR
            </div>
            <h2 id="campaign-modal-title" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              Autonomous Drone Districts
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close campaign modal"
            style={{
              background: 'none',
              border: '1px solid rgba(75, 85, 99, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {levels.map((lvl) => {
            const isCurrent = lvl.id === currentLevelId;
            const isLocked = !lvl.unlocked;
            const isCompleted = lvl.completed;
            const stars = lvl.stars || 0;

            return (
              <button
                key={lvl.id}
                type="button"
                disabled={isLocked || isBusy}
                onClick={() => {
                  if (!isLocked && !isBusy) {
                    onSelectLevel(lvl);
                    onClose();
                  }
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.2rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent
                    ? 'rgba(6, 182, 212, 0.12)'
                    : isLocked
                      ? 'rgba(17, 24, 39, 0.4)'
                      : '#111e2e',
                  border: isCurrent
                    ? '1px solid var(--accent-cyan)'
                    : isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(75, 85, 99, 0.3)',
                  cursor: isLocked || isBusy ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.5 : 1,
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: isCompleted
                        ? 'rgba(16, 185, 129, 0.15)'
                        : isLocked
                          ? 'rgba(55, 65, 81, 0.3)'
                          : 'rgba(6, 182, 212, 0.15)',
                      color: isCompleted
                        ? 'var(--accent-emerald)'
                        : isLocked
                          ? 'var(--text-muted)'
                          : 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {isCompleted ? '✓' : isLocked ? '🔒' : lvl.id}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Sector {lvl.id}: {lvl.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                      {lvl.concept} • Par {lvl.par} actions
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '1.1rem', letterSpacing: '0.1em' }}>
                    {[1, 2, 3].map((starIdx) => (
                      <span
                        key={starIdx}
                        style={{
                          color: starIdx <= stars ? '#facc15' : 'rgba(75, 85, 99, 0.5)'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      color: isCurrent
                        ? 'var(--accent-cyan)'
                        : isCompleted
                          ? 'var(--accent-emerald)'
                          : isLocked
                            ? 'var(--text-muted)'
                            : 'var(--text-secondary)'
                    }}
                  >
                    {isCurrent ? 'ACTIVE' : isCompleted ? 'CLEARED' : isLocked ? 'LOCKED' : 'READY →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CampaignSelectorModal;
