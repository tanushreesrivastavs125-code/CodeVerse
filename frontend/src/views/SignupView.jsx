import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiClientError } from '../api/client.js';

export function SignupView() {
  const { signup, guestPlay, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (isAuthenticated) {
    navigate('/playground', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || trimmedUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setErrorMsg('Username may only contain letters, numbers, underscores, and hyphens.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup({ username: trimmedUsername, email: trimmedEmail, password });
      navigate('/playground', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMsg(err.message || 'Registration failed. Please try a different username or email.');
      } else {
        setErrorMsg('Unable to connect to registration gateway.');
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
      navigate('/playground', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate guest session.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '460px',
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
          Register New Pilot
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Create your CodeVerse handle and start the campaign.
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Callsign (Username)
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="CyberPilot"
            required
            autoComplete="username"
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
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
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
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Security Key (Password)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            autoComplete="new-password"
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
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Confirm Security Key
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            autoComplete="new-password"
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
            backgroundColor: 'var(--accent-blue)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          {loading ? 'Registering Pilot...' : 'Create Account'}
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
        Already have a pilot profile?{' '}
        <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
          Sign In
        </Link>
      </p>
    </div>
  );
}

