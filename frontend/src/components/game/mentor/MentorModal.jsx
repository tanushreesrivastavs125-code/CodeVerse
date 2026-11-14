import { useState, useEffect } from 'react';
import { api, ApiClientError } from '../../../api/client.js';

/**
 * Safely parses and renders a bounded subset of markdown without using dangerouslySetInnerHTML.
 *
 * @param {string} text
 * @returns {React.ReactNode}
 */
export function SafeMarkdownRenderer({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let keyCounter = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${keyCounter++}`}
          style={{
            margin: '0.5rem 0 0.85rem 1.25rem',
            padding: 0,
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            lineHeight: 1.6
          }}
        >
          {listItems.map((item, idx) => (
            <li key={`li-${idx}`} style={{ marginBottom: '0.35rem' }}>
              {renderInlineSpans(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  /**
   * Parses bold (`**text**`) and inline code (`code`) into React elements.
   */
  function renderInlineSpans(str) {
    const tokens = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        tokens.push(str.slice(lastIdx, match.index));
      }
      const val = match[0];
      if (val.startsWith('**') && val.endsWith('**')) {
        tokens.push(
          <strong key={`b-${match.index}`} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {val.slice(2, -2)}
          </strong>
        );
      } else if (val.startsWith('`') && val.endsWith('`')) {
        tokens.push(
          <code
            key={`c-${match.index}`}
            style={{
              padding: '0.15rem 0.35rem',
              backgroundColor: 'rgba(66, 227, 198, 0.12)',
              borderRadius: '4px',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem'
            }}
          >
            {val.slice(1, -1)}
          </code>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < str.length) {
      tokens.push(str.slice(lastIdx));
    }

    return tokens.length > 0 ? tokens : str;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();

    if (!rawLine) {
      flushList();
      continue;
    }

    if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
      listItems.push(rawLine.slice(2));
      continue;
    }

    flushList();

    if (rawLine.startsWith('### ')) {
      elements.push(
        <h4
          key={`h4-${keyCounter++}`}
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--accent-cyan)',
            margin: '0.75rem 0 0.4rem',
            letterSpacing: '-0.01em'
          }}
        >
          {renderInlineSpans(rawLine.slice(4))}
        </h4>
      );
    } else if (rawLine.startsWith('> ')) {
      elements.push(
        <div
          key={`quote-${keyCounter++}`}
          style={{
            padding: '0.65rem 0.85rem',
            margin: '0.6rem 0',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            borderLeft: '3px solid #eab308',
            borderRadius: '0 6px 6px 0',
            fontSize: '0.84rem',
            color: '#fef08a'
          }}
        >
          {renderInlineSpans(rawLine.slice(2))}
        </div>
      );
    } else {
      elements.push(
        <p
          key={`p-${keyCounter++}`}
          style={{
            margin: '0 0 0.65rem',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            lineHeight: 1.6
          }}
        >
          {renderInlineSpans(rawLine)}
        </p>
      );
    }
  }

  flushList();
  return <div>{elements}</div>;
}

export function MentorModal({ isOpen, onClose, level, program }) {
  const [mode, setMode] = useState('hint');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConsult = async (overrideMode = mode) => {
    try {
      setLoading(true);
      setError(null);

      const targetLevelId = overrideMode === 'recommend' ? level?.id || null : level?.id || 1;
      const res = await api.ai.mentor({
        mode: overrideMode,
        levelId: targetLevelId,
        message: message.trim() || undefined,
        program: program && program.length > 0 ? program : undefined
      });

      setResponse(res);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setError('Your flight session has expired. Please refresh and log in.');
        } else if (err.status === 403) {
          setError('This sector is locked. Complete prior missions before seeking mentor guidance.');
        } else if (err.status === 429) {
          setError('Mentor rate limit reached. Please wait a minute before sending another request.');
        } else {
          setError(err.message || 'Unable to consult Flight Mentor.');
        }
      } else {
        setError('Communication failure with CodeVerse AI Gateway.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    handleConsult(newMode);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentor-modal-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0f3d42, #1b656f)',
                border: '1px solid #42e3c6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                color: '#42e3c6'
              }}
            >
              🤖
            </div>
            <div>
              <h2
                id="mentor-modal-title"
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0
                }}
              >
                AI Flight Mentor
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {level ? (
                  <>
                    Sector {level.id}: <span style={{ color: 'var(--accent-cyan)' }}>{level.title}</span> • {level.zone}
                  </>
                ) : (
                  'Tactical Mission & Concept Advisory'
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close mentor modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1
          }}
        >
          {/* Mode Selector Tabs */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {[
              { id: 'hint', label: '💡 Hint', desc: 'Graduated clue' },
              { id: 'explain', label: '📖 Explain', desc: 'Concept breakdown' },
              { id: 'debug', label: '🐛 Debug', desc: 'Simulation diagnostics' },
              { id: 'recommend', label: '🎯 Next', desc: 'Tactical target' }
            ].map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleModeChange(tab.id)}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: active ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    backgroundColor: active ? 'rgba(66, 227, 198, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                    color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.85rem' }}>{tab.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {tab.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Program Telemetry Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.85rem',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <span>
              WORKSPACE AST:{' '}
              <strong style={{ color: program && program.length > 0 ? 'var(--accent-cyan)' : '#f59e0b' }}>
                {program && program.length > 0 ? `${program.length} instruction blocks attached` : 'Empty workspace'}
              </strong>
            </span>
            <span>PAR BUDGET: {level?.par || '—'} steps</span>
          </div>

          {/* Custom Message Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label
                htmlFor="mentor-query-input"
                style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}
              >
                PILOT INQUIRY (OPTIONAL)
              </label>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: message.length >= 480 ? '#f87171' : 'var(--text-muted)'
                }}
              >
                {message.length} / 500
              </span>
            </div>
            <textarea
              id="mentor-query-input"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="Ask about turns, hazards, bridge triggers, or par efficiency..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                backgroundColor: 'rgba(8, 14, 23, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>

          {/* Action Trigger Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleConsult()}
              disabled={loading}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent-cyan)',
                backgroundColor: 'rgba(66, 227, 198, 0.15)',
                color: 'var(--accent-cyan)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {loading ? (
                <>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid rgba(66, 227, 198, 0.3)',
                      borderTopColor: 'var(--accent-cyan)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}
                  />
                  <span>ANALYZING FLIGHT DATA...</span>
                </>
              ) : (
                <span>CONSULT FLIGHT MENTOR</span>
              )}
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#fca5a5',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <span>⚠ {error}</span>
              <button
                type="button"
                onClick={() => handleConsult()}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Response Telemetry Container */}
          {response && (
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'rgba(11, 20, 31, 0.75)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {/* Header Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(66, 227, 198, 0.15)',
                      color: 'var(--accent-cyan)',
                      border: '1px solid rgba(66, 227, 198, 0.3)'
                    }}
                  >
                    MODE: {response.mode.toUpperCase()}
                  </span>
                  {response.sector && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Sector {response.sector.id}
                    </span>
                  )}
                </div>

                {/* Source Badge distinguishing AI from Offline Fallback */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    border:
                      response.source === 'ai'
                        ? '1px solid rgba(6, 182, 212, 0.4)'
                        : '1px solid rgba(234, 179, 8, 0.4)',
                    backgroundColor:
                      response.source === 'ai'
                        ? 'rgba(6, 182, 212, 0.15)'
                        : 'rgba(234, 179, 8, 0.15)',
                    color: response.source === 'ai' ? '#38bdf8' : '#facc15'
                  }}
                  title={
                    response.source === 'ai'
                      ? 'Guidance synthesized via neural language model'
                      : 'Guidance computed authoritatively via game-engine diagnostic rules'
                  }
                >
                  <span>{response.source === 'ai' ? '🤖 AI Neural Guidance' : '🛡️ Autonomous Offline Guidance'}</span>
                </div>
              </div>

              {/* Render Guidance Content */}
              <SafeMarkdownRenderer text={response.text} />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Session-scoped guidance • Assembled code is safely preserved on the flight deck
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            Return to Flight Deck
          </button>
        </div>
      </div>
    </div>
  );
}

export default MentorModal;

