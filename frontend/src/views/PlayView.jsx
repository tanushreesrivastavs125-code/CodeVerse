import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function PlayView() {
  const { isAuthenticated, guestPlay } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Initializing Recon Drone Link...');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      if (isAuthenticated) {
        if (isMounted) {
          navigate('/playground', { replace: true });
        }
        return;
      }

      try {
        if (isMounted) setStatus('Generating secure guest pilot session in MongoDB...');
        await guestPlay();
        if (isMounted) {
          setStatus('Session established. Launching campaign playground...');
          navigate('/playground', { replace: true });
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || 'Unable to establish guest session with CodeVerse gateway.');
        }
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, guestPlay, navigate]);

  return (
    <div style={{
      maxWidth: '480px',
      margin: '4rem auto',
      padding: '2.5rem',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      textAlign: 'center',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
    }}>
      {errorMsg ? (
        <div>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--accent-red)', marginBottom: '0.75rem' }}>
            Connection Interrupted
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {errorMsg}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => { setErrorMsg(null); guestPlay(); }}
              style={{
                backgroundColor: 'var(--accent-cyan)',
                color: '#0b0f19',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Retry Connection
            </button>
            <Link
              to="/login"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Pilot Sign In
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 1.5rem',
            border: '3px solid var(--border-subtle)',
            borderTopColor: 'var(--accent-cyan)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Connecting to CodeVerse Grid
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {status}
          </p>
        </div>
      )}
    </div>
  );
}

