import { useState, useEffect } from 'react';
import { env } from './config/env.js';

export function App() {
  const [healthStatus, setHealthStatus] = useState({
    state: 'probing',
    data: null,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    async function probeHealth() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/health`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (isMounted) {
          setHealthStatus({ state: 'connected', data, error: null });
        }
      } catch (err) {
        if (isMounted) {
          setHealthStatus({
            state: 'unreachable',
            data: null,
            error: err.message || 'Unable to reach backend gateway'
          });
        }
      }
    }

    probeHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <header style={{
        textAlign: 'center',
        maxWidth: '720px',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '0.35rem 0.9rem',
          borderRadius: '999px',
          border: '1px solid var(--border-glow)',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          color: 'var(--accent-cyan)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-mono)',
          marginBottom: '1rem',
          letterSpacing: '0.05em'
        }}>
          STEP 0: FOUNDATION BOOTSTRAP ACTIVE
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.75rem'
        }}>
          CodeVerse
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.05rem',
          lineHeight: 1.6
        }}>
          Adaptive, gamified programming education platform. Application skeleton initialized for React 19 + Express 5 architecture.
        </p>
      </header>

      <main style={{
        width: '100%',
        maxWidth: '640px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '1.75rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
      }}>
        <h2 style={{
          fontSize: '1.15rem',
          marginBottom: '1rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>System Telemetry</span>
        </h2>

        <div style={{
          display: 'grid',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          fontSize: '0.92rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Client Framework</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>React 19 + Vite 6</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Backend Target</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{env.apiBaseUrl}</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>API Gateway Probe</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: healthStatus.state === 'connected' ? 'var(--accent-emerald)' : 'var(--text-muted)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: healthStatus.state === 'connected' ? 'var(--accent-emerald)' : (healthStatus.state === 'probing' ? 'var(--accent-cyan)' : 'var(--accent-red)')
              }} />
              {healthStatus.state.toUpperCase()}
            </span>
          </div>
        </div>

        {healthStatus.data && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border-glow)'
          }}>
            <div style={{ color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>✓ Backend Health Acknowledged</div>
            <div style={{ color: 'var(--text-muted)' }}>Service: {healthStatus.data.service}</div>
            <div style={{ color: 'var(--text-muted)' }}>Database State: {healthStatus.data.database}</div>
            <div style={{ color: 'var(--text-muted)' }}>Uptime: {Math.round(healthStatus.data.uptime)}s</div>
          </div>
        )}
      </main>

      <footer style={{
        marginTop: '2rem',
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-muted)'
      }}>
        CodeVerse Foundation • Clean runnable scaffold ready for business feature milestones
      </footer>
    </div>
  );
}

export default App;
