/**
 * PlaybackControls Component provides mission execution, reset, playback speed,
 * sound toggle, and campaign map triggers with calm design system tokens.
 */
export function PlaybackControls({
  isBusy,
  onLaunch,
  onReset,
  speed = 1,
  onSpeedToggle,
  sound = false,
  onSoundToggle,
  onOpenMap,
  onOpenMentor,
  programLength = 0,
  hasActiveLevel = true
}) {
  return (
    <div
      className="calm-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.75rem 1.25rem'
      }}
    >
      {/* Primary Actions: Launch & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onLaunch}
          disabled={isBusy || !hasActiveLevel}
          title="Run program (Ctrl+Enter)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.25rem',
            minHeight: '42px',
            backgroundColor: isBusy ? 'var(--bg-secondary)' : 'var(--accent-cyan)',
            color: isBusy ? 'var(--text-muted)' : '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: isBusy || !hasActiveLevel ? 'not-allowed' : 'pointer',
            boxShadow: isBusy ? 'none' : 'var(--shadow-sm)',
            transition: 'all 0.15s ease'
          }}
        >
          {isBusy ? (
            <>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(56, 189, 248, 0.3)',
                  borderTopColor: 'var(--accent-cyan)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.6s linear infinite'
                }}
              />
              <span>Running code...</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>Launch Program</span>
              {programLength > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.35rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '4px',
                    marginLeft: '0.2rem'
                  }}
                >
                  {programLength}
                </span>
              )}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={!hasActiveLevel}
          title="Reset board (Esc)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.6rem 1rem',
            minHeight: '42px',
            backgroundColor: 'var(--bg-secondary)',
            color: isBusy ? 'var(--accent-red)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            cursor: hasActiveLevel ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease'
          }}
        >
          <span>↺</span>
          <span>{isBusy ? 'Stop & Reset' : 'Reset World'}</span>
        </button>
      </div>

      {/* Auxiliary Controls: Speed, Sound, Map & Mentor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onSpeedToggle}
          title="Toggle execution speed"
          style={{
            padding: '0.45rem 0.75rem',
            minHeight: '38px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ⏩ {speed}×
        </button>

        <button
          type="button"
          onClick={onSoundToggle}
          title={sound ? 'Mute audio' : 'Enable audio'}
          style={{
            padding: '0.45rem 0.75rem',
            minHeight: '38px',
            backgroundColor: sound ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-secondary)',
            border: '1px solid',
            borderColor: sound ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: sound ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          {sound ? '🔊 Sound On' : '🔇 Muted'}
        </button>

        <button
          type="button"
          onClick={onOpenMap}
          style={{
            padding: '0.45rem 0.85rem',
            minHeight: '38px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🗺️ Levels
        </button>

        {onOpenMentor && (
          <button
            type="button"
            onClick={onOpenMentor}
            style={{
              padding: '0.45rem 0.85rem',
              minHeight: '38px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-cyan)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            🤖 Mentor
          </button>
        )}
      </div>
    </div>
  );
}

export default PlaybackControls;
