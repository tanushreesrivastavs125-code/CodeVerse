import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

/**
 * ProfileView displays authoritative pilot dossier, honest session status,
 * dynamic campaign achievements, and recent flight attempt history.
 */
export function ProfileView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        setLoadingStats(true);
        const data = await api.campaign.getLevels();
        if (isMounted) {
          setLevels(data || []);
        }
      } catch {
        // Fallback gracefully without breaking view
      } finally {
        if (isMounted) {
          setLoadingStats(false);
        }
      }
    }

    async function loadHistory() {
      try {
        setLoadingHistory(true);
        const attempts = await api.campaign.getHistory(15);
        if (isMounted) {
          setHistory(attempts || []);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    }

    loadStats();
    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  };

  const totalLevels = levels.length;
  const completedLevels = levels.filter((l) => l.completed).length;
  const earnedStars = levels.reduce((sum, l) => sum + (Number(l.stars) || 0), 0);
  const totalPossibleStars = totalLevels * 3;

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Active Session';

  return (
    <div
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}
    >
      {/* Dossier Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.08em',
              marginBottom: '0.3rem'
            }}
          >
            PILOT CREDENTIALS // OPERATOR DOSSIER
          </div>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 0.35rem'
            }}
          >
            {user?.username || 'Pilot'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, fontFamily: 'var(--font-mono)' }}>
            PILOT ID: <span style={{ color: 'var(--accent-cyan)' }}>{user?.id || '—'}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            padding: '0.65rem 1.3rem',
            backgroundColor: 'rgba(255, 77, 109, 0.12)',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            cursor: signingOut ? 'wait' : 'pointer',
            fontSize: '0.88rem',
            transition: 'all 0.15s ease'
          }}
        >
          {signingOut ? 'Disconnecting...' : 'Sign Out / Terminate Session'}
        </button>
      </div>

      {/* Honest Guest vs Account Status Banner */}
      {user?.isGuest ? (
        <div
          style={{
            backgroundColor: 'rgba(242, 204, 102, 0.08)',
            border: '1px solid var(--accent-gold)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.1rem' }}>⚠</span>
              <strong style={{ color: 'var(--accent-gold)', fontSize: '0.95rem' }}>
                Temporary Guest Session
              </strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
              Your flight progress and claimed rewards are stored in this browser session. Creating a registered account will establish a fresh permanent pilot identity (guest progress is not automatically merged into new accounts).
            </p>
          </div>
          <Link
            to="/signup"
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: 'var(--accent-gold)',
              color: '#050a0f',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: '0.88rem',
              whiteSpace: 'nowrap'
            }}
          >
            Create Permanent Account →
          </Link>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(52, 211, 153, 0.08)',
            border: '1px solid var(--accent-emerald)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <span style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)' }}>✓</span>
          <div>
            <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.92rem' }}>
              Permanent Pilot Account Verified
            </strong>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Session authenticated via secure HTTP-Only cookie. Flight history and rewards persisted across sessions.
            </div>
          </div>
        </div>
      )}

      {/* Core Player Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            PILOT TIER
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              marginTop: '0.25rem'
            }}
          >
            Tier {user?.level || 1}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Autopilot clearance active
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            TOTAL FLIGHT XP
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              marginTop: '0.25rem'
            }}
          >
            {user?.totalXp || 0} XP
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Authoritative rewards claimed
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            DRONE CREDITS
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--accent-gold)',
              fontFamily: 'var(--font-mono)',
              marginTop: '0.25rem'
            }}
          >
            🪙 {user?.coins || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Operational balance
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ACTIVE STREAK
          </div>
          <div
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#fb923c',
              fontFamily: 'var(--font-mono)',
              marginTop: '0.25rem'
            }}
          >
            🔥 {user?.streak || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Consecutive daily operations
          </div>
        </div>
      </div>

      {/* Account Info & Dynamic Campaign Achievements */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Credentials Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Security & Authentication
          </h3>

          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.88rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Registered Email</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {user?.email || 'N/A (Guest)'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Commissioned Date</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formattedDate}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Role Clearance</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {(user?.role || 'user').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Campaign Achievements Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
              Campaign Mastery Overview
            </h3>

            {loadingStats ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading sector telemetry...</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.88rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Sectors Secured</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {completedLevels} of {totalLevels}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Campaign Stars</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                    ★ {earnedStars} / {totalPossibleStars}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Campaign Status</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: completedLevels === totalLevels && totalLevels > 0 ? 'var(--accent-emerald)' : 'var(--accent-cyan)'
                    }}
                  >
                    {completedLevels === totalLevels && totalLevels > 0 ? 'ALL DISTRICTS CLEARED' : 'ACTIVE CAMPAIGN'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              to="/dashboard"
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '0.65rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-cyan)',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}
            >
              Campaign Map
            </Link>
            <Link
              to="/playground"
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '0.65rem',
                backgroundColor: 'var(--accent-cyan)',
                borderRadius: 'var(--radius-sm)',
                color: '#050a0f',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}
            >
              Launch Drone
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Flight Attempt History */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Recent Flight Attempts
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Bounded audit log of recent drone simulation runs
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {history.length} logged
          </span>
        </div>

        {loadingHistory ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                border: '3px solid rgba(66, 227, 198, 0.2)',
                borderTopColor: 'var(--accent-cyan)',
                borderRadius: '50%',
                margin: '0 auto 0.75rem',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading flight attempt log...</span>
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              No flight attempts logged yet. Launch the drone in the Playground to record telemetry!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'rgba(5, 10, 15, 0.5)',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em'
                  }}
                >
                  <th style={{ padding: '0.85rem 1.25rem', width: '100px' }}>SECTOR</th>
                  <th style={{ padding: '0.85rem 1.25rem', width: '130px' }}>OUTCOME</th>
                  <th style={{ padding: '0.85rem 1.25rem', width: '90px' }}>ACTIONS</th>
                  <th style={{ padding: '0.85rem 1.25rem', width: '100px' }}>STARS</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>DIAGNOSTICS</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right', width: '150px' }}>TIME</th>
                </tr>
              </thead>
              <tbody>
                {history.map((attempt) => {
                  const dateStr = attempt.createdAt
                    ? new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '—';

                  return (
                    <tr
                      key={attempt.id || `${attempt.levelId}-${attempt.createdAt}`}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        Sector {attempt.levelId}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            backgroundColor: attempt.passed ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 77, 109, 0.15)',
                            color: attempt.passed ? 'var(--accent-emerald)' : 'var(--accent-red)',
                            border: attempt.passed ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255, 77, 109, 0.3)'
                          }}
                        >
                          {attempt.passed ? '✓ PASSED' : '✕ FAILED'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {attempt.steps ?? attempt.actionsCount ?? 0}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                        {'★'.repeat(attempt.stars || 0) || '—'}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {attempt.reason || (attempt.passed ? 'Extraction portal reached' : 'Mission failed')}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileView;
