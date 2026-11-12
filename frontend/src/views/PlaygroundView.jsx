import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiClientError } from '../api/client.js';

export function PlaygroundView() {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCampaign() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.campaign.getLevels();
        if (isMounted) {
          setLevels(data);
          // Auto-select the first uncompleted unlocked sector, or level 1
          const active = data.find((l) => l.unlocked && !l.completed) || data[0];
          if (active) {
            setSelectedLevelId(active.id);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiClientError) {
            setError(err.message);
          } else {
            setError('Failed to load campaign sector telemetry from the gateway.');
          }
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

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          margin: '0 auto 1rem',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--accent-cyan)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
          DOWNLOADING SECTOR TELEMETRY FROM GRID...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '3rem auto',
        padding: '2rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--accent-red)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
        <h3 style={{ color: 'var(--accent-red)', marginBottom: '0.5rem' }}>Sector Telemetry Unavailable</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: 'var(--accent-cyan)',
            color: '#0b0f19',
            border: 'none',
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const selectedLevel = levels.find((l) => l.id === selectedLevelId) || levels[0];

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Player HUD Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 1.75rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid var(--border-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            🛰️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.username}
              </h2>
              {user?.isGuest && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontWeight: 600
                }}>
                  GUEST RECON
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Callsign ID: {user?.id}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TIER</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Level {user?.level ?? 1}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUMULATIVE XP</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{user?.totalXp ?? 0} XP</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>COINS</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>🪙 {user?.coins ?? 0}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STREAK</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f97316' }}>🔥 {user?.currentStreak ?? 0}d</span>
          </div>
        </div>
      </div>

      {/* Sector Navigation Selector Tabs */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Select Campaign Sector ({levels.length} Total)
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {levels.map((lvl) => {
            const isSelected = lvl.id === selectedLevelId;
            return (
              <button
                key={lvl.id}
                onClick={() => lvl.unlocked && setSelectedLevelId(lvl.id)}
                disabled={!lvl.unlocked}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected
                    ? 'rgba(6, 182, 212, 0.15)'
                    : lvl.unlocked
                    ? 'var(--bg-card)'
                    : 'rgba(31, 41, 55, 0.4)',
                  color: isSelected ? 'var(--accent-cyan)' : lvl.unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: lvl.unlocked ? 'pointer' : 'not-allowed',
                  opacity: lvl.unlocked ? 1 : 0.6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{lvl.unlocked ? (lvl.completed ? '✅' : '🎯') : '🔒'}</span>
                <span style={{ fontWeight: 600 }}>Sector {lvl.id}</span>
                {lvl.completed && (
                  <span style={{ color: '#fbbf24', fontSize: '0.85rem' }}>
                    {'★'.repeat(lvl.stars)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Sector Mission Dossier */}
      {selectedLevel && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Mission Briefing Card */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-cyan)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em'
                }}>
                  {selectedLevel.zone?.toUpperCase()} • SECTOR {selectedLevel.id}
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedLevel.title}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TACTICAL PAR</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>{selectedLevel.par} actions</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>MISSION OBJECTIVE</span>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                {selectedLevel.briefing}
              </p>
            </div>

            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-blue)', display: 'block' }}>
                💡 FLIGHT DIRECTIVE
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {selectedLevel.hint}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div>
                <span>Concept: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedLevel.concept}</strong>
              </div>
              <div>
                <span>Stars: </span>
                <strong style={{ color: '#fbbf24' }}>
                  {selectedLevel.stars > 0 ? '★'.repeat(selectedLevel.stars) : 'None'}
                </strong>
              </div>
              <div>
                <span>Status: </span>
                <strong style={{ color: selectedLevel.completed ? '#10b981' : '#f59e0b' }}>
                  {selectedLevel.completed ? 'Cleared' : 'Active'}
                </strong>
              </div>
            </div>
          </div>

          {/* Tactical Map Grid View */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sector Reconnaissance Grid
            </h4>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.2rem',
              lineHeight: '1.4',
              letterSpacing: '0.3em',
              flex: 1
            }}>
              {selectedLevel.map.map((row, rIdx) => (
                <div key={rIdx} style={{ whiteSpace: 'pre' }}>
                  {row.split('').map((char, cIdx) => {
                    let color = 'var(--text-muted)';
                    let bg = 'transparent';
                    if (char === '#') color = 'rgba(75, 85, 99, 0.5)';
                    if (char === 'S') { color = 'var(--accent-cyan)'; bg = 'rgba(6, 182, 212, 0.2)'; }
                    if (char === 'G') { color = '#10b981'; bg = 'rgba(16, 185, 129, 0.2)'; }
                    if (char === 'C') { color = '#fbbf24'; bg = 'rgba(251, 191, 36, 0.2)'; }
                    return (
                      <span key={cIdx} style={{ color, backgroundColor: bg, padding: '0 2px', borderRadius: '3px' }}>
                        {char}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span><strong style={{ color: 'var(--accent-cyan)' }}>S</strong> Drone Start</span>
              <span><strong style={{ color: '#10b981' }}>G</strong> Portal Exit</span>
              <span><strong style={{ color: '#fbbf24' }}>C</strong> Energy Shard</span>
              <span><strong style={{ color: 'rgba(75, 85, 99, 0.8)' }}>#</strong> Barrier Wall</span>
            </div>
          </div>
        </div>
      )}

      {/* Stage 4 Notice Box */}
      <div style={{
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(6, 182, 212, 0.05)',
        border: '1px solid var(--border-glow)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>🔧</span>
        <div>
          <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
            Stage 3 Shell Online:
          </strong>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
            Live sector mission data and player sessions are authoritative and verified against the backend. The interactive Blockly visual code editor and animated canvas renderer are scheduled for Stage 4.
          </p>
        </div>
      </div>
    </div>
  );
}

