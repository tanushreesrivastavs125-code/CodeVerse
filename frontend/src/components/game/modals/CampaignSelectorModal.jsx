import { useEffect, useMemo } from 'react';

const DISTRICTS_CONFIG = [
  { id: 1, name: 'Neon Outskirts', sectorRange: [1, 4], focus: 'Sequences, collection, turns & loops' },
  { id: 2, name: 'Cipher District', sectorRange: [5, 8], focus: 'Jumps, terminals, bridges & conditions' },
  { id: 3, name: 'Firewall Core', sectorRange: [9, 12], focus: 'Sensors, combined mechanics & guardian combat' },
  { id: 4, name: 'Shadow Network', sectorRange: [13, 16], focus: 'Longer routes, multiple objectives & advanced loops' },
  { id: 5, name: 'Quantum Grid', sectorRange: [17, 20], focus: 'Adaptive programs, sensor decisions & tight efficiency' },
  { id: 6, name: 'Singularity', sectorRange: [21, 24], focus: 'Expert combinations, demanding routes & final 8-point guardian' }
];

/**
 * CampaignSelectorModal renders the full 6-district campaign dossier,
 * displaying locked/unlocked state, completion badges, requirements, and star mastery.
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
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const totalLevels = levels.length;
  const completedCount = useMemo(() => levels.filter((l) => l.completed).length, [levels]);
  const earnedStars = useMemo(() => levels.reduce((sum, l) => sum + (Number(l.stars) || 0), 0), [levels]);
  const maxPossibleStars = totalLevels * 3;

  const nextPlayableLevel = useMemo(() => {
    return levels.find((l) => l.unlocked && !l.completed) ||
      levels.filter((l) => l.unlocked).slice(-1)[0] ||
      levels[0];
  }, [levels]);

  const districtsData = useMemo(() => {
    return DISTRICTS_CONFIG.map((d) => {
      const districtLevels = levels.filter(
        (l) => l.id >= d.sectorRange[0] && l.id <= d.sectorRange[1]
      );
      const cleared = districtLevels.filter((l) => l.completed).length;
      const isUnlocked = districtLevels.some((l) => l.unlocked);
      return {
        ...d,
        levels: districtLevels,
        cleared,
        total: districtLevels.length,
        isUnlocked
      };
    });
  }, [levels]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000, // Explicitly above Blockly workspace and flyouts
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
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
          maxWidth: '820px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glow)',
          padding: '1.75rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(75, 85, 99, 0.3)' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', letterSpacing: '0.08em' }}>
              AUTONOMOUS DRONE CAMPAIGN // 6 DISTRICTS • 24 SECTORS
            </div>
            <h2 id="campaign-modal-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              Flight Matrix Navigation
            </h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
              <span>Cleared: <strong style={{ color: 'var(--accent-emerald)' }}>{completedCount}/{totalLevels}</strong></span>
              <span>•</span>
              <span>Mastery: <strong style={{ color: '#fbbf24' }}>{earnedStars}/{maxPossibleStars}★</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {nextPlayableLevel && nextPlayableLevel.id !== currentLevelId && (
              <button
                type="button"
                onClick={() => {
                  onSelectLevel(nextPlayableLevel);
                  onClose();
                }}
                style={{
                  padding: '0.45rem 0.9rem',
                  backgroundColor: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid var(--accent-cyan)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                Resume Sector {nextPlayableLevel.id} →
              </button>
            )}

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
        </div>

        {/* Districts Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {districtsData.map((d) => (
            <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(75, 85, 99, 0.2)' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    DISTRICT {d.id} // {d.name.toUpperCase()}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {d.focus}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: d.cleared === d.total && d.total > 0
                      ? 'rgba(16, 185, 129, 0.15)'
                      : d.isUnlocked
                        ? 'rgba(6, 182, 212, 0.12)'
                        : 'rgba(55, 65, 81, 0.3)',
                    color: d.cleared === d.total && d.total > 0
                      ? 'var(--accent-emerald)'
                      : d.isUnlocked
                        ? 'var(--accent-cyan)'
                        : 'var(--text-muted)'
                  }}
                >
                  {d.cleared}/{d.total} Cleared
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: '0.75rem' }}>
                {d.levels.map((lvl) => {
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
                        padding: '0.9rem 1.15rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isCurrent
                          ? 'rgba(56, 189, 248, 0.12)'
                          : isLocked
                            ? 'var(--bg-secondary)'
                            : 'var(--bg-secondary)',
                        border: isCurrent
                          ? '1px solid var(--accent-cyan)'
                          : isCompleted
                            ? '1px solid var(--accent-emerald)'
                            : isLocked
                              ? '1px solid var(--border-subtle)'
                              : '1px solid var(--border-subtle)',
                        cursor: isLocked || isBusy ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.45 : 1,
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
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
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.85rem'
                          }}
                        >
                          {isCompleted ? '✓' : isLocked ? '🔒' : lvl.id}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                              {lvl.id}. {lvl.title}
                            </h3>
                          </div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                            {lvl.concept} • Par {lvl.par}
                          </p>

                          {/* Requirement Pills */}
                          {(lvl.requireLoops || lvl.requireSensors || lvl.bossHealth > 0 || lvl.maxBlocks) && (
                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                              {lvl.requireLoops && (
                                <span style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem', borderRadius: '3px', backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                                  ↻ Loop
                                </span>
                              )}
                              {lvl.requireSensors && (
                                <span style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem', borderRadius: '3px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontFamily: 'var(--font-mono)' }}>
                                  👁 Sensor
                                </span>
                              )}
                              {lvl.bossHealth > 0 && (
                                <span style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem', borderRadius: '3px', backgroundColor: 'rgba(217, 70, 239, 0.2)', color: '#f0abfc', fontFamily: 'var(--font-mono)' }}>
                                  ✕ Boss ({lvl.bossHealth})
                                </span>
                              )}
                              {lvl.maxBlocks && (
                                <span style={{ fontSize: '0.62rem', padding: '0.05rem 0.3rem', borderRadius: '3px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fde047', fontFamily: 'var(--font-mono)' }}>
                                  ≤{lvl.maxBlocks} blk
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                          {[1, 2, 3].map((starIdx) => (
                            <span
                              key={starIdx}
                              style={{
                                color: starIdx <= stars ? '#facc15' : 'rgba(75, 85, 99, 0.4)'
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>

                        <span
                          style={{
                            fontSize: '0.7rem',
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default CampaignSelectorModal;
