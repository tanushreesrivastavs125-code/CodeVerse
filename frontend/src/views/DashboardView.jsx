import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

const DISTRICTS_CONFIG = [
  { id: 1, name: 'Neon Outskirts', sectorRange: [1, 4], focus: 'Sequences, collection, turns & loops' },
  { id: 2, name: 'Cipher District', sectorRange: [5, 8], focus: 'Jumps, terminals, bridges & conditions' },
  { id: 3, name: 'Firewall Core', sectorRange: [9, 12], focus: 'Sensors, combined mechanics & guardian combat' },
  { id: 4, name: 'Shadow Network', sectorRange: [13, 16], focus: 'Longer routes, multiple objectives & advanced loops' },
  { id: 5, name: 'Quantum Grid', sectorRange: [17, 20], focus: 'Adaptive programs, sensor decisions & tight efficiency' },
  { id: 6, name: 'Singularity', sectorRange: [21, 24], focus: 'Expert combinations, demanding routes & final 8-point guardian' }
];

export function DashboardView() {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCampaign() {
      try {
        setLoading(true);
        const data = await api.campaign.getLevels();
        if (isMounted) {
          setLevels(data || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load campaign data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCampaign();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute dynamic stats from real returned levels (never hardcode 3 or 24)
  const totalLevels = levels.length;
  const completedLevels = levels.filter((l) => l.completed).length;
  const earnedStars = levels.reduce((sum, l) => sum + (Number(l.stars) || 0), 0);
  const totalPossibleStars = totalLevels * 3;
  const completionPercentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

  // Identify next playable level: first unlocked but incomplete, or the first unlocked, or level 0
  const activeLevel = levels.find((l) => l.unlocked && !l.completed) ||
    levels.filter((l) => l.unlocked).slice(-1)[0] ||
    levels[0];

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '0.25rem'
          }}>
            FLIGHT COMMAND CENTER // SECTOR CAMPAIGN
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            Drone Campaign Operations
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Pilot: <strong style={{ color: 'var(--accent-cyan)' }}>{user?.username || 'Autonomous Unit'}</strong>
            {user?.isGuest && (
              <span style={{
                marginLeft: '0.6rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: '#eab308',
                border: '1px solid rgba(234, 179, 8, 0.4)'
              }}>
                GUEST SESSION
              </span>
            )}
          </p>
        </div>

        {activeLevel && (
          <Link
            to={`/playground?level=${activeLevel.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-cyan)',
              color: '#050a0f',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              boxShadow: '0 0 20px rgba(66, 227, 198, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>▶</span>
            <span>Resume Mission ({activeLevel.title || activeLevel.name || `Sector ${activeLevel.id}`})</span>
          </Link>
        )}
      </div>

      {/* Dynamic Telemetry Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            SECTORS CLEARED
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            {completedLevels} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ {totalLevels}</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '999px',
            marginTop: '0.75rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: '100%',
              backgroundColor: 'var(--accent-cyan)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            STARS EARNED
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--accent-gold)',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            ★ {earnedStars} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ {totalPossibleStars}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {totalLevels > 0 ? `${Math.round((earnedStars / (totalPossibleStars || 1)) * 100)}% mastery achieved` : 'No sectors loaded'}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            TOTAL FLIGHT XP
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            {user?.totalXp || 0} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>XP</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Level {user?.level || 1} Pilot Certification
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            DRONE CREDITS
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--accent-gold)',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            {user?.coins || 0} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>CR</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Available balance
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            FLIGHT STREAK
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fb923c',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            🔥 {user?.streak || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Daily mission sequence
          </div>
        </div>
      </div>

      {/* Campaign Levels Grid */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '1.75rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            District Sectors Dossier
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {totalLevels} AUTHORITATIVE SECTOR{totalLevels === 1 ? '' : 'S'}
          </span>
        </div>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(6, 182, 212, 0.2)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite'
            }} />
            Accessing authoritative campaign sector telemetry...
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#fca5a5',
            fontSize: '0.9rem'
          }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {DISTRICTS_CONFIG.map((d) => {
              const districtLevels = levels.filter(
                (l) => l.id >= d.sectorRange[0] && l.id <= d.sectorRange[1]
              );
              const cleared = districtLevels.filter((l) => l.completed).length;

              return (
                <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid rgba(75, 85, 99, 0.25)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        DISTRICT {d.id} // {d.name.toUpperCase()}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {d.focus}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      backgroundColor: cleared === districtLevels.length && districtLevels.length > 0
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(6, 182, 212, 0.12)',
                      color: cleared === districtLevels.length && districtLevels.length > 0
                        ? 'var(--accent-emerald)'
                        : 'var(--accent-cyan)'
                    }}>
                      {cleared}/{districtLevels.length} Cleared
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.25rem'
                  }}>
                    {districtLevels.map((lvl) => {
                      const isLocked = !lvl.unlocked;
                      const isCompleted = lvl.completed;
                      const stars = lvl.stars || 0;

                      return (
                        <div
                          key={lvl.id}
                          style={{
                            backgroundColor: isLocked ? 'rgba(17, 24, 39, 0.5)' : 'var(--bg-secondary)',
                            border: isCompleted
                              ? '1px solid rgba(16, 185, 129, 0.4)'
                              : isLocked
                                ? '1px solid var(--border-subtle)'
                                : '1px solid var(--border-glow)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem',
                            opacity: isLocked ? 0.6 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            position: 'relative',
                            transition: 'transform 0.15s ease, border-color 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '0.5rem'
                            }}>
                              <span style={{
                                fontSize: '0.75rem',
                                fontFamily: 'var(--font-mono)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: isCompleted
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : isLocked
                                    ? 'rgba(75, 85, 99, 0.2)'
                                    : 'rgba(6, 182, 212, 0.15)',
                                color: isCompleted
                                  ? 'var(--accent-emerald)'
                                  : isLocked
                                    ? 'var(--text-muted)'
                                    : 'var(--accent-cyan)'
                              }}>
                                {isCompleted ? '✓ CLEARED' : isLocked ? '🔒 LOCKED' : '⚡ READY'}
                              </span>

                              <div style={{
                                fontSize: '1rem',
                                letterSpacing: '0.1em',
                                color: '#facc15'
                              }}>
                                {[1, 2, 3].map((starIdx) => (
                                  <span
                                    key={starIdx}
                                    style={{
                                      color: starIdx <= stars ? '#facc15' : 'rgba(75, 85, 99, 0.6)'
                                    }}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>

                            <h3 style={{
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
                              marginBottom: '0.35rem'
                            }}>
                              Sector {lvl.id}: {lvl.title}
                            </h3>

                            <p style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-muted)',
                              lineHeight: 1.5,
                              margin: '0 0 0.5rem'
                            }}>
                              {lvl.concept} • {lvl.briefing}
                            </p>

                            {/* Constraints badge strip */}
                            {(lvl.requireLoops || lvl.requireSensors || lvl.bossHealth > 0 || lvl.maxBlocks) && (
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                                {lvl.requireLoops && (
                                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                                    ↻ Loop Required
                                  </span>
                                )}
                                {lvl.requireSensors && (
                                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontFamily: 'var(--font-mono)' }}>
                                    👁 Sensor Required
                                  </span>
                                )}
                                {lvl.bossHealth > 0 && (
                                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '3px', backgroundColor: 'rgba(217, 70, 239, 0.2)', color: '#f0abfc', fontFamily: 'var(--font-mono)' }}>
                                    ✕ Boss ({lvl.bossHealth} HP)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid rgba(75, 85, 99, 0.25)',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            <span style={{ color: 'var(--text-muted)' }}>
                              Par: <strong style={{ color: 'var(--text-secondary)' }}>{lvl.par || '-'}</strong> actions
                            </span>

                            {!isLocked ? (
                              <Link
                                to={`/playground?level=${lvl.id}`}
                                style={{
                                  color: 'var(--accent-cyan)',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <span>Launch</span>
                                <span>→</span>
                              </Link>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Locked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardView;

