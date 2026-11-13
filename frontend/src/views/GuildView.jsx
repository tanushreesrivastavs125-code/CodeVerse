import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export function GuildView() {
  const { user } = useAuth();
  const [myGuild, setMyGuild] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Guild Creation Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'create'

  // Selected guild for detail modal / preview
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [myGuildData, directoryData] = await Promise.all([
        api.guilds.me().catch(() => null),
        api.guilds.list({ search: search.trim() }).catch(() => [])
      ]);

      setMyGuild(myGuildData || null);
      setDirectory(Array.isArray(directoryData) ? directoryData : []);
    } catch (err) {
      setError(err.message || 'Unable to load guild information.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGuild = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Guild name is required.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const newGuild = await api.guilds.create({
        name: formName.trim(),
        description: formDesc.trim()
      });

      setMyGuild(newGuild);
      setFormName('');
      setFormDesc('');
      setSuccess(`Squadron "${newGuild.name}" established successfully!`);
      // Reload directory
      const updatedDir = await api.guilds.list({});
      setDirectory(updatedDir);
    } catch (err) {
      setError(err.message || 'Failed to create guild.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinGuild = async (guildId) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const updated = await api.guilds.join(guildId);
      setMyGuild(updated);
      setSelectedGuild(null);
      setSuccess(`Successfully joined "${updated.name}"!`);

      const updatedDir = await api.guilds.list({ search: search.trim() });
      setDirectory(updatedDir);
    } catch (err) {
      setError(err.message || 'Failed to join guild.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGuild = async () => {
    const isOwner = myGuild?.isOwner;
    const confirmPrompt = isOwner
      ? 'Are you sure you want to leave your guild? Ownership will be transferred to the oldest remaining member, or the guild will disband if you are the last pilot.'
      : 'Are you sure you want to leave this guild?';

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);

      const result = await api.guilds.leave();
      setMyGuild(null);
      if (result.action === 'disbanded') {
        setSuccess('You have left the guild. The squadron was disbanded as no pilots remain.');
      } else if (result.action === 'transferred') {
        setSuccess('You have left the guild. Ownership was successfully transferred to the senior pilot.');
      } else {
        setSuccess('You have left the guild.');
      }

      const updatedDir = await api.guilds.list({ search: search.trim() });
      setDirectory(updatedDir);
    } catch (err) {
      setError(err.message || 'Failed to leave guild.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewGuildDetails = async (guildId) => {
    try {
      setDetailLoading(true);
      const details = await api.guilds.getById(guildId);
      setSelectedGuild(details);
    } catch (err) {
      setError(err.message || 'Unable to load squadron details.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
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
              marginBottom: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>CODEVERSE FLEET COMMAND</span>
            <span>•</span>
            <span>PERSISTENT SQUADRONS</span>
          </div>
          <h1
            style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em'
            }}
          >
            Pilot Guilds
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              maxWidth: '650px',
              lineHeight: 1.5
            }}
          >
            Join forces with fellow pilots. Combined Member XP reflects the authoritative,
            real-time total flight experience of all active squadron members.
          </p>
        </div>

        {user?.isGuest && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              color: '#f59e0b',
              maxWidth: '340px'
            }}
          >
            <span>🛡️</span>
            <span>
              <strong>Guest Pilot:</strong> You have full guild privileges. Your squadron
              membership persists with your session.
            </span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#ef4444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem'
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#10b981',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.9rem'
          }}
        >
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#10b981',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          CONNECTING TO FLEET NETWORK...
        </div>
      ) : myGuild ? (
        /* My Guild Active HUD */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Squadron Banner & Stats */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              boxShadow: '0 0 25px rgba(66, 227, 198, 0.12)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    letterSpacing: '0.08em',
                    marginBottom: '0.3rem'
                  }}
                >
                  ACTIVE SQUADRON AFFILIATION
                </div>
                <h2
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '0 0 0.5rem 0'
                  }}
                >
                  {myGuild.name}
                </h2>
                {myGuild.description && (
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      maxWidth: '650px',
                      lineHeight: 1.5
                    }}
                  >
                    {myGuild.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={handleLeaveGuild}
                  disabled={actionLoading}
                  style={{
                    padding: '0.6rem 1.25rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    borderRadius: 'var(--radius-md)',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {actionLoading ? 'Departing...' : myGuild.isOwner ? 'Relinquish / Disband' : 'Leave Squadron'}
                </button>
              </div>
            </div>

            {/* Squadron Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  COMBINED MEMBER XP
                </div>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  ⚡ {myGuild.combinedXp.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  Sum of all members’ authoritative XP
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  SQUADRON ROSTER
                </div>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {myGuild.memberCount} {myGuild.memberCount === 1 ? 'Pilot' : 'Pilots'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  Active roster strength
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  GUILD MASTER
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.2rem'
                  }}
                >
                  <span>👑</span>
                  <span>{myGuild.owner.username}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  {myGuild.isOwner ? 'You command this squadron' : 'Squadron Founder & Leader'}
                </div>
              </div>
            </div>

            {/* Member Roster Table */}
            <div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 1rem 0'
                }}
              >
                Squadron Roster
              </h3>
              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.88rem'
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        borderBottom: '1px solid var(--border-subtle)'
                      }}
                    >
                      <th style={{ padding: '0.75rem 1rem' }}>ROLE</th>
                      <th style={{ padding: '0.75rem 1rem' }}>PILOT CALLSIGN</th>
                      <th style={{ padding: '0.75rem 1rem' }}>LEVEL</th>
                      <th style={{ padding: '0.75rem 1rem' }}>TOTAL XP</th>
                      <th style={{ padding: '0.75rem 1rem' }}>JOINED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myGuild.members?.map((member) => (
                      <tr
                        key={member.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor:
                            member.id === user?.id
                              ? 'rgba(66, 227, 198, 0.05)'
                              : 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {member.isOwner ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                color: '#eab308',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              👑 MASTER
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(148, 163, 184, 0.1)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              PILOT
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                member.id === user?.id
                                  ? 'var(--accent-cyan)'
                                  : 'var(--text-primary)'
                            }}
                          >
                            {member.username}
                          </span>
                          {member.id === user?.id && (
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.7rem',
                                color: 'var(--accent-cyan)',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              (YOU)
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Lvl {member.level}
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent-cyan)',
                            fontWeight: 600
                          }}
                        >
                          {member.totalXp.toLocaleString()} XP
                        </td>
                        <td
                          style={{
                            padding: '0.75rem 1rem',
                            color: 'var(--text-muted)',
                            fontSize: '0.78rem'
                          }}
                        >
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Directory Browse for Guild Members (to see ranking/competition) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Fleet Guild Directory
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Explore other squadrons across CodeVerse. Standings are ranked by Combined Member XP.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}
            >
              {directory.map((guild) => (
                <div
                  key={guild.id}
                  style={{
                    backgroundColor:
                      guild.id === myGuild.id ? 'rgba(66, 227, 198, 0.06)' : 'var(--bg-card)',
                    border:
                      guild.id === myGuild.id
                        ? '1px solid var(--accent-cyan)'
                        : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        marginBottom: '0.4rem'
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {guild.name}
                      </h4>
                      {guild.id === myGuild.id && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--accent-cyan)',
                            border: '1px solid var(--accent-cyan)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px'
                          }}
                        >
                          YOUR GUILD
                        </span>
                      )}
                    </div>
                    {guild.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {guild.description}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>Leader: {guild.owner.username}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent-cyan)',
                        fontWeight: 600
                      }}
                    >
                      ⚡ {guild.combinedXp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Unaffiliated Player Flow: Tabs for Directory vs Create */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <button
              onClick={() => setActiveTab('directory')}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === 'directory'
                    ? '2px solid var(--accent-cyan)'
                    : '2px solid transparent',
                color:
                  activeTab === 'directory'
                    ? 'var(--accent-cyan)'
                    : 'var(--text-secondary)',
                fontWeight: activeTab === 'directory' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Browse Squadrons ({directory.length})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === 'create'
                    ? '2px solid var(--accent-cyan)'
                    : '2px solid transparent',
                color:
                  activeTab === 'create'
                    ? 'var(--accent-cyan)'
                    : 'var(--text-secondary)',
                fontWeight: activeTab === 'create' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              + Found a New Squadron
            </button>
          </div>

          {activeTab === 'directory' ? (
            /* Directory Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Search input */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search squadrons by callsign or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    maxWidth: '450px',
                    padding: '0.7rem 1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{
                      padding: '0.7rem 1rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {directory.length === 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>🛸</div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                    {search ? 'No squadrons match your search.' : 'No active squadrons registered.'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {search
                      ? 'Try another search query or clear the filter.'
                      : 'Take the initiative and establish CodeVerse’s first pilot squadron!'}
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.7rem 1.5rem',
                      backgroundColor: 'var(--accent-cyan)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      color: '#08131b',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Found a Squadron
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {directory.map((guild) => (
                    <div
                      key={guild.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1.25rem',
                        transition: 'border-color 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {guild.name}
                          </h3>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(66, 227, 198, 0.1)',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600
                            }}
                          >
                            ⚡ {guild.combinedXp.toLocaleString()} XP
                          </span>
                        </div>

                        <p
                          style={{
                            margin: '0 0 1rem 0',
                            fontSize: '0.88rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                            minHeight: '2.8em'
                          }}
                        >
                          {guild.description || 'No squadron briefing recorded.'}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          <span>Master: {guild.owner.username}</span>
                          <span>{guild.memberCount} {guild.memberCount === 1 ? 'pilot' : 'pilots'}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleViewGuildDetails(guild.id)}
                          style={{
                            flex: 1,
                            padding: '0.6rem 0.8rem',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}
                        >
                          View Roster
                        </button>
                        <button
                          onClick={() => handleJoinGuild(guild.id)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            padding: '0.6rem 0.8rem',
                            backgroundColor: 'var(--accent-cyan)',
                            border: 'none',
                            color: '#08131b',
                            borderRadius: 'var(--radius-md)',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 700
                          }}
                        >
                          {actionLoading ? 'Joining...' : 'Join Guild'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Create Tab */
            <div
              style={{
                maxWidth: '650px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem'
              }}
            >
              <h2
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.5rem 0'
                }}
              >
                Establish a New Guild
              </h2>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  margin: '0 0 1.5rem 0',
                  lineHeight: 1.5
                }}
              >
                As founder, you will be designated Guild Master. Your personal flight XP will
                immediately contribute to the squadron’s Combined Member XP.
              </p>

              <form
                onSubmit={handleCreateGuild}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.4rem'
                    }}
                  >
                    <label
                      htmlFor="guild-name-input"
                      style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      Squadron Name *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formName.length}/30 characters
                    </span>
                  </div>
                  <input
                    id="guild-name-input"
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    placeholder="e.g. Apex Navigators"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem'
                    }}
                  />
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.3rem'
                    }}
                  >
                    3-30 characters: letters, numbers, spaces, hyphens, and underscores.
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.4rem'
                    }}
                  >
                    <label
                      htmlFor="guild-desc-input"
                      style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      Squadron Briefing (Optional)
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formDesc.length}/250 characters
                    </span>
                  </div>
                  <textarea
                    id="guild-desc-input"
                    maxLength={250}
                    rows={3}
                    placeholder="Describe your squadron’s focus, philosophy, or tactical goals..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={actionLoading || !formName.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'var(--accent-cyan)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      color: '#08131b',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: actionLoading || !formName.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {actionLoading ? 'Commissioning...' : 'Commission Squadron'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Guild Details Modal */}
      {selectedGuild && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem'
          }}
          onClick={() => setSelectedGuild(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '0 0 0.3rem 0'
                  }}
                >
                  {selectedGuild.name}
                  {detailLoading && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginLeft: '0.5rem' }}>
                      • Refreshing...
                    </span>
                  )}
                </h3>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  Founder: {selectedGuild.owner.username} • Formed{' '}
                  {new Date(selectedGuild.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedGuild(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.25rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {selectedGuild.description && (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}
              >
                {selectedGuild.description}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  COMBINED MEMBER XP
                </div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700
                  }}
                >
                  ⚡ {selectedGuild.combinedXp.toLocaleString()}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ROSTER COUNT
                </div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    fontWeight: 700
                  }}
                >
                  {selectedGuild.memberCount} Pilots
                </div>
              </div>
            </div>

            <div>
              <h4
                style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '1rem',
                  color: 'var(--text-primary)'
                }}
              >
                Active Roster ({selectedGuild.members?.length || 0})
              </h4>
              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {selectedGuild.members?.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {m.isOwner && <span>👑</span>}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.username}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        (Lvl {m.level})
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {m.totalXp.toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedGuild(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              {!myGuild && (
                <button
                  onClick={() => handleJoinGuild(selectedGuild.id)}
                  disabled={actionLoading}
                  style={{
                    padding: '0.6rem 1.25rem',
                    backgroundColor: 'var(--accent-cyan)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: '#08131b',
                    fontWeight: 700,
                    cursor: actionLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Join Squadron
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default GuildView;
