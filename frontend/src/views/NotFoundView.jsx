import { Link } from 'react-router-dom';

export function NotFoundView() {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '4rem auto',
      padding: '2.5rem',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '4rem',
        fontWeight: 900,
        fontFamily: 'var(--font-mono)',
        color: 'var(--accent-red)',
        letterSpacing: '0.05em'
      }}>
        404
      </div>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginTop: '0.5rem',
        marginBottom: '0.75rem'
      }}>
        Sector Coordinates Out of Bounds
      </h2>
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        marginBottom: '2rem'
      }}>
        The requested navigational node does not exist in the CodeVerse flight matrix. Check coordinates or return to home base.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--accent-cyan)',
          color: '#0b0f19',
          fontWeight: 700,
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          fontSize: '0.95rem'
        }}
      >
        Return to Home Base
      </Link>
    </div>
  );
}

export default NotFoundView;

