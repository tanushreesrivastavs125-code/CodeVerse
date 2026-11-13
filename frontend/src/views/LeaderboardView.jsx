import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

/**
 * LeaderboardView renders authoritative flight rankings across CodeVerse.
 * Supports All-Time XP and Weekly UTC Sprint tabs, with honest currentPlayer status,
 * UTC week window labeling, and privacy-safe pilot statistics.
 */
export function LeaderboardView() {
  const { user, isAuthenticated } = useAuth();
  const [range, setRange] = useState('all'); // 'all' | 'weekly'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);
        const result = await api.leaderboard.get(range, 25);
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to retrieve leaderboard data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const leaderboardList = data?.leaderboard || [];
  const currentPlayer = data?.currentPlayer || null;

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.08em',
              marginBottom: '0.3rem'
            }}
          >
            GLOBAL TELEMETRY // PILOT RANKINGS
          </div>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Flight Leaderboard
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              marginTop: '0.35rem',
              maxWidth: '620px'
            }}
          >
            Authoritative player standings derived strictly from verified campaign simulations and transactional rewards.
          </p>
        </div>

        {/* Range Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.3rem',
            gap: '0.25rem'
          }}
        >
          <button
            type="button"
            onClick={() => setRange('all')}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: range === 'all' ? 'var(--accent-cyan)' : 'transparent',
              color: range === 'all' ? '#050a0f' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            All-Time XP
          </button>
          <button
            type="button"
            onClick={() => setRange('weekly')}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: range === 'weekly' ? 'var(--accent-cyan)' : 'transparent',
              color: range === 'weekly' ? '#050a0f' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Weekly Sprint (UTC)
          </button>
        </div>
      </div>

      {/* Weekly Window Metadata Badge */}
      {range === 'weekly' && data?.weekLabel && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(66, 227, 198, 0.08)',
            border: '1px solid var(--border-glow)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            width: 'fit-content'
          }}
        >
          <span>🗓</span>
          <span>
            Active Sprint: <strong>{data.weekLabel}</strong> (Monday 00:00 UTC to next Monday 00:00 UTC)
          </span>
        </div>
      )}

      {/* Current Player Standings Card */}
      {isAuthenticated && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: 'rgba(66, 227, 198, 0.15)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--accent-cyan)'
              }}
            >
              {currentPlayer?.inTopResults ? `#${currentPlayer.rank}` : '—'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {user?.username}
                </span>
                {user?.isGuest && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(242, 204, 102, 0.15)',
                      color: 'var(--accent-gold)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    GUEST
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentPlayer?.inTopResults
                  ? `Ranked #${currentPlayer.rank} among active pilots`
                  : range === 'weekly'
                    ? (currentPlayer?.xp > 0 ? 'Ranked outside top results this sprint' : 'No mission completions logged in current weekly sprint')
                    : (currentPlayer?.xp > 0 ? 'Ranked outside top results' : 'Complete sectors in the campaign to establish your flight rank')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontFamily: 'var(--font-mono)' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>XP</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--accent-cyan)' }}>
                {currentPlayer?.xp ?? user?.totalXp ?? 0}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>TIER</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--accent-blue)' }}>
                Lv {currentPlayer?.level ?? user?.level ?? 1}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>STREAK</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--accent-gold)' }}>
                🔥 {currentPlayer?.streak ?? user?.streak ?? 0}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table Container */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(66, 227, 198, 0.2)',
                borderTopColor: 'var(--accent-cyan)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Querying authoritative pilot rankings...
            </span>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--accent-red)' }}>⚠</div>
            <p style={{ color: '#fca5a5', fontSize: '0.95rem', margin: '0 0 1rem' }}>{error}</p>
            <button
              type="button"
              onClick={() => setRange(range)}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Retry Connection
            </button>
          </div>
        ) : leaderboardList.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛰️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
              No flight rankings recorded
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              {range === 'weekly'
                ? 'Be the first pilot to complete a campaign sector in this weekly UTC sprint!'
                : 'No pilot flight records yet. Launch the playground to claim the first rank!'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem'
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em'
                  }}
                >
                  <th style={{ padding: '1rem 1.25rem', width: '70px' }}>RANK</th>
                  <th style={{ padding: '1rem 1.25rem' }}>PILOT</th>
                  <th style={{ padding: '1rem 1.25rem', width: '90px' }}>TIER</th>
                  <th style={{ padding: '1rem 1.25rem', width: '100px' }}>STREAK</th>
                  <th style={{ padding: '1rem 1.25rem', width: '130px' }}>SECTORS</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right', width: '140px' }}>
                    {range === 'weekly' ? 'WEEKLY XP' : 'TOTAL XP'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboardList.map((entry) => {
                  const isUser = user && (entry.userId === user.id || entry.username === user.username);

                  return (
                    <tr
                      key={entry.userId || entry.rank}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isUser ? 'rgba(66, 227, 198, 0.07)' : 'transparent',
                        transition: 'background-color 0.12s ease'
                      }}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: entry.rank === 1
                              ? 'var(--accent-gold)'
                              : entry.rank === 2
                                ? '#cbd5e1'
                                : entry.rank === 3
                                  ? '#d97706'
                                  : 'var(--text-muted)'
                          }}
                        >
                          {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span
                            style={{
                              fontWeight: isUser ? 700 : 500,
                              color: isUser ? 'var(--accent-cyan)' : 'var(--text-primary)'
                            }}
                          >
                            {entry.username}
                          </span>
                          {isUser && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '3px',
                                backgroundColor: 'rgba(66, 227, 198, 0.15)',
                                color: 'var(--accent-cyan)',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        Lv {entry.level || 1}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                        🔥 {entry.streak || 0}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {entry.sectorsCleared || 0}
                      </td>

                      <td
                        style={{
                          padding: '1rem 1.25rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: 'var(--accent-cyan)'
                        }}
                      >
                        {entry.totalXp ?? entry.weeklyXp ?? 0} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaderboardView;

