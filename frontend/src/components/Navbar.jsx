import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../api/client.js';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    theme,
    resolvedTheme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    motionSetting,
    setMotionSetting
  } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();
  const [backendHealth, setBackendHealth] = useState({ online: false, transactions: false });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);

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

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close theme menu on route change
  useEffect(() => {
    setIsThemeMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinkStyle = (path) => ({
    color: location.pathname === path ? 'var(--accent-cyan)' : 'var(--text-secondary)',
    fontWeight: location.pathname === path ? 600 : 400,
    padding: '0.4rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: location.pathname === path ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
    border: location.pathname === path ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
    transition: 'all 0.15s ease',
    fontSize: '0.88rem',
    whiteSpace: 'nowrap'
  });

  const themeIcon = {
    dark: '🌙',
    light: '☀️',
    soft: '☕',
    system: '💻'
  }[theme] || '🎨';

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Brand & Desktop Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              color: '#ffffff'
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}
          >
            Code<span style={{ color: 'var(--accent-cyan)' }}>Verse</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            alignItems: 'center'
          }}
          className="desktop-nav-links"
        >
          {isAuthenticated ? (
            <>
              <Link to="/playground" style={navLinkStyle('/playground')}>Playground</Link>
              <Link to="/dashboard" style={navLinkStyle('/dashboard')}>Campaign</Link>
              <Link to="/leaderboard" style={navLinkStyle('/leaderboard')}>Leaderboard</Link>
              <Link to="/guild" style={navLinkStyle('/guild')}>Guilds</Link>
              <Link to="/mentor" style={navLinkStyle('/mentor')}>AI Mentor</Link>
              <Link to="/profile" style={navLinkStyle('/profile')}>Profile</Link>
            </>
          ) : (
            <>
              <Link to="/leaderboard" style={navLinkStyle('/leaderboard')}>Leaderboard</Link>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Health, Theme/Settings, Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Backend health status indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.72rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-muted)'
          }}
          title={
            backendHealth.online
              ? backendHealth.transactions
                ? 'Cluster Online (Replica Set Active)'
                : 'Standalone DB Connected'
              : 'Backend Offline'
          }
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: backendHealth.online
                ? backendHealth.transactions
                  ? '#10b981'
                  : '#f59e0b'
                : '#ef4444'
            }}
          />
          <span style={{ display: 'none', md: 'inline' }}>
            {backendHealth.online ? (backendHealth.transactions ? 'ONLINE' : 'STANDALONE') : 'OFFLINE'}
          </span>
        </div>

        {/* Theme & Preferences Menu */}
        <div style={{ position: 'relative' }} ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            aria-label="Theme and display settings"
            title={`Theme: ${theme} (Resolved: ${resolvedTheme})`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              minHeight: '34px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 500
            }}
          >
            <span>{themeIcon}</span>
            <span style={{ textTransform: 'capitalize', fontSize: '0.78rem' }}>{theme}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>▾</span>
          </button>

          {isThemeMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '240px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                zIndex: 100
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Appearance Theme
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                {[
                  { id: 'dark', label: 'Dark', icon: '🌙' },
                  { id: 'light', label: 'Light', icon: '☀️' },
                  { id: 'soft', label: 'Soft Contrast', icon: '☕' },
                  { id: 'system', label: 'Follow System', icon: '💻' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTheme(item.id);
                      setIsThemeMenuOpen(false);
                    }}
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: theme === item.id ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                      backgroundColor: theme === item.id ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
                      color: theme === item.id ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontWeight: theme === item.id ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      textAlign: 'left'
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Preferences
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Audio Sound</span>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: soundEnabled ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-secondary)',
                      color: soundEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {soundEnabled ? '🔊 On' : '🔇 Off'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Motion</span>
                  <button
                    type="button"
                    onClick={() => setMotionSetting(motionSetting === 'reduced' ? 'full' : 'reduced')}
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: motionSetting === 'reduced' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-secondary)',
                      color: motionSetting === 'reduced' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {motionSetting === 'reduced' ? 'Reduced' : 'Standard'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Session Chips */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.82rem',
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {user.username}
              </span>
              {user.isGuest && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    fontWeight: 600
                  }}
                >
                  GUEST
                </span>
              )}
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {user.totalXp ?? 0} XP
              </span>
              <span style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                🪙 {user.coins ?? 0}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-red)';
                e.currentTarget.style.color = 'var(--accent-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Link
              to="/play"
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)'
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
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem'
              }}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              style={{
                backgroundColor: 'var(--accent-cyan)',
                border: 'none',
                color: '#ffffff',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 700
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

export default Navbar;
