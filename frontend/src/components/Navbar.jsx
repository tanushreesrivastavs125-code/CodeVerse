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
    backgroundColor: location.pathname === path ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
    transition: 'all 0.15s ease'
  });

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.9rem 1.75rem',
      backgroundColor: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#fff'
          }}>
            ⚡
          </div>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            CodeVerse
          </span>
        </Link>

        {isAuthenticated && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/playground" style={navLinkStyle('/playground')}>Playground</Link>
            <Link to="/dashboard" style={navLinkStyle('/dashboard')}>Dashboard</Link>
            <Link to="/profile" style={navLinkStyle('/profile')}>Profile</Link>
          </div>
        )}
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
              <span style={{ color: '#10b981' }}>{user.totalXp ?? 0} XP</span>
              <span style={{ color: '#fbbf24' }}>🪙 {user.coins ?? 0}</span>
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
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid var(--border-glow)',
                color: 'var(--accent-cyan)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600
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
                fontSize: '0.85rem'
              }}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              style={{
                backgroundColor: 'var(--accent-blue)',
                border: 'none',
                color: '#fff',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600
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

