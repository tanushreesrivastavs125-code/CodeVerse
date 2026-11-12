import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [backendHealth, setBackendHealth] = useState({ online: false, transactions: false });

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const health = await api.health.check();
        if (isMounted) {
          setBackendHealth({
            online: health.status === 'ok',
            transactions: Boolean(health.transactions)
          });
        }
      } catch {
        if (isMounted) {
          setBackendHealth({ online: false, transactions: false });
        }
      }
    }
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinkStyle = (path) => ({
    color: location.pathname === path ? 'var(--accent-cyan)' : 'var(--text-secondary)',
    fontWeight: location.pathname === path ? 600 : 400,
    padding: '0.4rem 0.8rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: location.pathname === path ? 'rgba(66, 227, 198, 0.12)' : 'transparent',
    border: location.pathname === path ? '1px solid rgba(66, 227, 198, 0.3)' : '1px solid transparent',
    transition: 'all 0.15s ease'
  });

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 1.75rem',
      backgroundColor: 'rgba(8, 19, 27, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #0b2f33, #164e56)',
            border: '1px solid #42e3c6',
            boxShadow: '0 0 12px rgba(66, 227, 198, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: '#42e3c6'
          }}>
            ⚡
          </div>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#f2f7f8',
            letterSpacing: '-0.02em'
          }}>
            Code<span style={{ color: 'var(--accent-cyan)' }}>Verse</span>
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAuthenticated ? (
            <>
              <Link to="/playground" style={navLinkStyle('/playground')}>Playground</Link>
              <Link to="/dashboard" style={navLinkStyle('/dashboard')}>Campaign</Link>
              <Link to="/leaderboard" style={navLinkStyle('/leaderboard')}>Leaderboard</Link>
              <Link to="/profile" style={navLinkStyle('/profile')}>Profile</Link>
            </>
          ) : (
            <>
              <Link to="/leaderboard" style={navLinkStyle('/leaderboard')}>Leaderboard</Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Backend health status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '999px',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(31, 41, 55, 0.5)',
          color: 'var(--text-muted)'
        }} title={backendHealth.online ? (backendHealth.transactions ? 'Database connected (Replica Set Active)' : 'Database connected (Standalone mode)') : 'Backend offline'}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: backendHealth.online ? (backendHealth.transactions ? '#10b981' : '#f59e0b') : '#ef4444',
            boxShadow: backendHealth.online ? '0 0 6px #10b981' : 'none'
          }} />
          <span>{backendHealth.online ? (backendHealth.transactions ? 'CLUSTER ONLINE' : 'STANDALONE') : 'GATEWAY OFFLINE'}</span>
        </div>

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.85rem',
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {user.username}
              </span>
              {user.isGuest && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontWeight: 600
                }}>
                  GUEST
                </span>
              )}
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{user.totalXp ?? 0} XP</span>
              <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>🪙 {user.coins ?? 0}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-red)'; e.currentTarget.style.color = 'var(--accent-red)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link
              to="/play"
              style={{
                backgroundColor: 'rgba(66, 227, 198, 0.12)',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ Quick Play
            </Link>
            <Link
              to="/login"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                transition: 'all 0.15s ease'
              }}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              style={{
                backgroundColor: 'var(--accent-cyan)',
                border: 'none',
                color: '#050a0f',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.15s ease'
              }}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

