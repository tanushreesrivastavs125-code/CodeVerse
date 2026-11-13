import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiClientError } from '../api/client.js';
import { SafeMarkdownRenderer } from '../components/game/mentor/MentorModal.jsx';

export function MentorView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [levels, setLevels] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [mode, setMode] = useState('hint');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Load unlocked campaign levels for dropdown selection
  useEffect(() => {
    let isMounted = true;
    async function loadCampaign() {
      try {
        const data = await api.campaign.getLevels();
        if (isMounted && data) {
          setLevels(data);
          const firstUnlocked = data.find((l) => l.unlocked && !l.completed) || data[0];
          if (firstUnlocked) {
            setSelectedLevelId(firstUnlocked.id);
          }
        }
      } catch {
        // Fallback default
      }
    }
    loadCampaign();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleConsult = useCallback(
    async (overrideMode = mode) => {
      try {
        setLoading(true);
        setError(null);

        const targetLevelId = overrideMode === 'recommend' ? selectedLevelId || null : selectedLevelId || 1;
        const res = await api.ai.mentor({
          mode: overrideMode,
          levelId: targetLevelId,
          message: message.trim() || undefined
        });

        setResponse(res);

        // Prepend to session history (bounded to 10 entries)
        setSessionHistory((prev) => [
          {
            id: Date.now(),
            mode: res.mode,
            levelId: res.levelId,
            source: res.source,
            text: res.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev.slice(0, 9)
        ]);
      } catch (err) {
        if (err instanceof ApiClientError) {
          if (err.status === 401) {
            setError('Your flight session has expired. Please sign in again.');
          } else if (err.status === 403) {
            setError('This sector is locked. Complete prior missions before seeking mentor guidance.');
          } else if (err.status === 429) {
            setError('Mentor rate limit reached. Please wait a moment before sending another query.');
          } else {
            setError(err.message || 'Unable to consult Flight Mentor.');
          }
        } else {
          setError('Communication error with CodeVerse AI Gateway.');
        }
      } finally {
        setLoading(false);
      }
    },
    [mode, selectedLevelId, message]
  );

  const selectedLevel = levels.find((l) => l.id === Number(selectedLevelId)) || null;

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0b2f33, #164e56)',
              border: '1px solid #42e3c6',
              boxShadow: '0 0 16px rgba(66, 227, 198, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              color: '#42e3c6'
            }}
          >
            🤖
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.02em'
              }}
            >
              Autonomous Flight Mentor
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Contextual algorithmic guidance, concept breakdowns & graduated telemetry diagnostics
            </p>
          </div>
        </div>

        {/* Pilot Badge Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>PILOT</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {user?.username || 'Pilot'}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>LEVEL</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              Lvl {user?.level || 1}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>CREDITS</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
              🪙 {user?.coins || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Control Panel + Guidance Results */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(0, 1.8fr)',
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Mission Select & Inquiry Controls */}
        <div
          style={{
            backgroundColor: 'rgba(11, 20, 31, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem'
          }}
        >
          {/* Sector Selector */}
          <div>
            <label
              htmlFor="mentor-sector-select"
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              SELECT MISSION SECTOR
            </label>
            <select
              id="mentor-sector-select"
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(8, 14, 23, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id} disabled={!lvl.unlocked}>
                  Sector {lvl.id}: {lvl.title} {!lvl.unlocked ? '(Locked)' : lvl.completed ? `(${lvl.stars}⭐)` : '(Open)'}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Snapshot Card */}
          {selectedLevel && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {selectedLevel.title}
              </div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                {selectedLevel.zone} • Par: {selectedLevel.par} steps
              </div>
              <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                Concept: {selectedLevel.concept}
              </div>
            </div>
          )}

          {/* Mode Selector */}
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              ADVISORY MODE
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {[
                { id: 'hint', label: '💡 Hint', sub: 'Tactical clue' },
                { id: 'explain', label: '📖 Explain', sub: 'Concept' },
                { id: 'debug', label: '🐛 Debug', sub: 'Telemetry' },
                { id: 'recommend', label: '🎯 Next', sub: 'Campaign' }
              ].map((t) => {
                const active = mode === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setMode(t.id);
                      handleConsult(t.id);
                    }}
                    style={{
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: active ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      backgroundColor: active ? 'rgba(66, 227, 198, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                      color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{t.label}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{t.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Query Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label
                htmlFor="mentor-view-query"
                style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
              >
                CUSTOM PILOT QUERY
              </label>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: message.length >= 480 ? '#f87171' : 'var(--text-muted)'
                }}
              >
                {message.length} / 500
              </span>
            </div>
            <textarea
              id="mentor-view-query"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="E.g., How do I avoid colliding with the red corruption tiles?"
              rows={3}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(8, 14, 23, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>

          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => handleConsult()}
            disabled={loading}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--accent-cyan)',
              backgroundColor: 'rgba(66, 227, 198, 0.15)',
              color: 'var(--accent-cyan)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(66, 227, 198, 0.3)',
                    borderTopColor: 'var(--accent-cyan)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <span>CONSULTING FLIGHT MENTOR...</span>
              </>
            ) : (
              <span>REQUEST GUIDANCE</span>
            )}
          </button>

          {/* Launch Mission Shortcut */}
          {selectedLevel && selectedLevel.unlocked && (
            <button
              type="button"
              onClick={() => navigate(`/playground?level=${selectedLevel.id}`)}
              style={{
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)'
              }}
            >
              🚀 Launch Flight Deck (Sector {selectedLevel.id})
            </button>
          )}
        </div>

        {/* Right Column: Guidance Result View */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-md)',
                color: '#fca5a5',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <span>⚠ {error}</span>
              <button
                type="button"
                onClick={() => handleConsult()}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Response Display */}
          {response ? (
            <div
              style={{
                backgroundColor: 'rgba(11, 20, 31, 0.75)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Telemetry Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(66, 227, 198, 0.15)',
                      color: 'var(--accent-cyan)',
                      border: '1px solid rgba(66, 227, 198, 0.3)'
                    }}
                  >
                    MODE: {response.mode.toUpperCase()}
                  </span>
                  {response.sector && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Sector {response.sector.id}: {response.sector.title}
                    </span>
                  )}
                </div>

                {/* Honest Source Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    border:
                      response.source === 'ai'
                        ? '1px solid rgba(6, 182, 212, 0.4)'
                        : '1px solid rgba(234, 179, 8, 0.4)',
                    backgroundColor:
                      response.source === 'ai'
                        ? 'rgba(6, 182, 212, 0.15)'
                        : 'rgba(234, 179, 8, 0.15)',
                    color: response.source === 'ai' ? '#38bdf8' : '#facc15'
                  }}
                >
                  <span>{response.source === 'ai' ? '🤖 AI Neural Guidance' : '🛡️ Autonomous Offline Guidance'}</span>
                </div>
              </div>

              {/* Guidance Text */}
              <SafeMarkdownRenderer text={response.text} />
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'rgba(11, 20, 31, 0.5)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '3rem 2rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛰️</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                Flight Advisory Standby
              </h3>
              <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '0.86rem' }}>
                Select a mission sector and advisory mode on the left, then click{' '}
                <strong style={{ color: 'var(--accent-cyan)' }}>Request Guidance</strong> to consult the flight mentor.
              </p>
            </div>
          )}

          {/* Session History Feed */}
          {sessionHistory.length > 1 && (
            <div
              style={{
                backgroundColor: 'rgba(11, 20, 31, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem'
              }}
            >
              <h4
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  margin: '0 0 0.75rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                RECENT SESSION INQUIRIES (TRANSIENT)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sessionHistory.slice(1).map((hist) => (
                  <div
                    key={hist.id}
                    style={{
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                        {hist.mode.toUpperCase()}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {hist.levelId ? `Sector ${hist.levelId}` : 'Campaign Overview'}
                      </span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {hist.timestamp} • {hist.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MentorView;

