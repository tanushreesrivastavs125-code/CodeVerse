import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiClientError } from '../api/client.js';

export function LoginView() {
  const { login, guestPlay, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const destination = location.state?.from?.pathname || '/playground';

  // If already authenticated, redirect
  if (isAuthenticated) {
    navigate(destination, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: trimmedEmail, password });
      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMsg(err.message || 'Invalid credentials. Please try again.');
      } else {
        setErrorMsg('Unable to connect to authentication gateway.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = async () => {
    setErrorMsg(null);
    setGuestLoading(true);
    try {
      await guestPlay();
      navigate(destination, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate guest session.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '440px',
      margin: '3rem auto',
      padding: '2rem',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          Pilot Sign In
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Resume your sector clearance and synchronize progress.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--accent-red)',
          color: 'var(--accent-red)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pilot@codeverse.io"
            required
            autoComplete="email"
            disabled={loading || guestLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            disabled={loading || guestLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || guestLoading}
          style={{
            marginTop: '0.5rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: 'var(--accent-cyan)',
            color: '#0b0f19',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          {loading ? 'Authenticating Pilot...' : 'Sign In'}
        </button>
      </form>

      <div style={{
        margin: '1.75rem 0',
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        <span style={{ padding: '0 0.75rem' }}>OR</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
      </div>

      <button
        type="button"
        onClick={handleGuestPlay}
        disabled={loading || guestLoading}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-glow)',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          color: 'var(--accent-cyan)',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: guestLoading ? 'not-allowed' : 'pointer',
          opacity: guestLoading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        <span>⚡</span>
        <span>{guestLoading ? 'Connecting Guest...' : 'Quick Play as Guest'}</span>
      </button>

      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        New to CodeVerse?{' '}
        <Link to="/signup" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
          Create an Account
        </Link>
      </p>
    </div>
  );
}

