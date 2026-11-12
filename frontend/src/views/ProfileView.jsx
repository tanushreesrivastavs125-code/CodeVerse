import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export function ProfileView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCampaignStats() {
      try {
        const data = await api.campaign.getLevels();
        if (isMounted) {
          setLevels(data || []);
        }
      } catch {
        // Fallback gracefully without breaking profile telemetry
      } finally {
        if (isMounted) {
          setLoadingCampaign(false);
        }
      }
    }
    loadCampaignStats();
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
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Header */}
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
            PILOT CREDENTIALS // OPERATOR DOSSIER
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em'
          }}>
            {user?.username || 'Pilot'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            ID: <code style={{ color: 'var(--accent-cyan)' }}>{user?.id || '—'}</code>
          </p>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            padding: '0.65rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            cursor: signingOut ? 'wait' : 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.15s ease'
          }}
        >
          {signingOut ? 'Disconnecting...' : 'Sign Out / Terminate Session'}
        </button>
      </div>

      {/* Guest Notice */}
      {user?.isGuest && (
        <div style={{
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h4 style={{ color: '#facc15', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Guest Pilot Mode
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Your drone flight telemetry is saved on this device via secure session cookie. Register a permanent account to link your flight history across devices.
            </p>
          </div>
          <Link
            to="/signup"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#eab308',
              color: '#0b0f19',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: '0.85rem'
            }}
          >
            Create Permanent Account
          </Link>
        </div>
      )}

      {/* Player Telemetry Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            PILOT LEVEL
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            Tier {user?.level || 1}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Autopilot clearance active
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            TOTAL FLIGHT XP
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--accent-emerald)',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            {user?.totalXp || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Authoritative rewards claimed
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            DRONE CREDITS
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--accent-blue)',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            {user?.coins || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Available balance
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            CONSECUTIVE STREAK
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#f97316',
            fontFamily: 'var(--font-mono)',
            marginTop: '0.25rem'
          }}>
            🔥 {user?.streak || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Daily mission sequence
          </div>
        </div>
      </div>

      {/* Account & Campaign Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Account Details Box */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Credentials & Authorization
          </h3>

          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Registered Email</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {user?.email || 'N/A (Guest)'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Role Assignment</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: user?.role === 'admin' ? 'var(--accent-red)' : user?.isGuest ? '#facc15' : 'var(--accent-cyan)'
              }}>
                {(user?.role || 'user').toUpperCase()}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Commissioned Date</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {formattedDate}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Authentication Model</span>
              <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                HTTP-Only Secure Cookie
              </span>
            </div>
          </div>
        </div>

        {/* Campaign Progress Box */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Campaign Overview
            </h3>

            {loadingCampaign ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading sector progress...</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sectors Cleared</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {completedLevels} of {totalLevels}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Campaign Stars</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#facc15' }}>
                    ★ {earnedStars} / {totalPossibleStars}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Campaign Status</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    color: completedLevels === totalLevels && totalLevels > 0 ? 'var(--accent-emerald)' : 'var(--accent-cyan)'
                  }}>
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
                fontSize: '0.88rem'
              }}
            >
              View Dashboard
            </Link>
            <Link
              to="/playground"
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '0.65rem',
                backgroundColor: 'var(--accent-cyan)',
                borderRadius: 'var(--radius-sm)',
                color: '#0b0f19',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.88rem'
              }}
            >
              Launch Playground
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileView;

