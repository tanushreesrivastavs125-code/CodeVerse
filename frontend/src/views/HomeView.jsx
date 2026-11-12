import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function HomeView() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '3.5rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      {/* Sector Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.9rem',
        borderRadius: '999px',
        border: '1px solid var(--border-glow)',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        color: 'var(--accent-cyan)',
        fontSize: '0.85rem',
        fontFamily: 'var(--font-mono)',
        marginBottom: '1.5rem',
        letterSpacing: '0.05em'
      }}>
        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
        CODEVERSE CAMPAIGN ENGINE v1
      </div>

      {/* Hero Headline */}
      <h1 style={{
        fontSize: '3rem',
        fontWeight: 800,
        lineHeight: 1.15,
        marginBottom: '1.25rem',
        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #10b981 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.03em',
        maxWidth: '780px'
      }}>
        Code the Drone. Secure the Grid.
      </h1>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '1.15rem',
        lineHeight: 1.6,
        maxWidth: '640px',
        marginBottom: '2.5rem'
      }}>
        Pilot an autonomous reconnaissance drone through futuristic neon districts. Solve procedural obstacles, collect energy shards, activate cyber bridges, and extract safely using visual coding commands.
      </p>

      {/* Primary Actions */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3.5rem' }}>
        <Link
          to="/play"
          style={{
            backgroundColor: 'var(--accent-cyan)',
            color: '#0b0f19',
            fontWeight: 700,
            fontSize: '1.05rem',
            padding: '0.85rem 2rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <span>⚡</span>
          <span>{isAuthenticated ? `Continue Mission (${user?.username})` : 'Launch Mission (Quick Play)'}</span>
        </Link>

        {!isAuthenticated && (
          <Link
            to="/login"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              fontWeight: 600,
              fontSize: '1.05rem',
              padding: '0.85rem 1.75rem',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.2s ease'
            }}
          >
            Pilot Sign In
          </Link>
        )}
      </div>

      {/* Tactical Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        textAlign: 'left'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>🛰️</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Deterministic Drone Physics
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Grid-based movement, 90° rotational vectors, collision boundaries, and safe portal extraction mechanics.
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>💠</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Energy & Par Optimization
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Recover required energy shards and optimize command efficiency to achieve full 3-star tactical ratings.
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>🔒</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Authoritative Transactions
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Server-side simulation validation with multi-document ACID replica-set consistency for rewards and progress.
          </p>
        </div>
      </div>
    </div>
  );
}

