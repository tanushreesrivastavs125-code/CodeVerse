/**
 * PlaybackControls Component provides mission execution, reset, playback speed,
 * sound toggle, and campaign map triggers.
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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.9rem 1.25rem',
        backgroundColor: '#0c1824',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Primary Actions: Launch & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onLaunch}
          disabled={isBusy || !hasActiveLevel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.4rem',
            backgroundColor: isBusy ? '#1f2937' : 'var(--accent-cyan)',
            color: isBusy ? 'var(--text-muted)' : '#070f18',
            fontWeight: 700,
            fontSize: '0.92rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: isBusy || !hasActiveLevel ? 'not-allowed' : 'pointer',
            boxShadow: isBusy ? 'none' : '0 0 15px rgba(6, 182, 212, 0.4)',
            transition: 'all 0.15s ease'
          }}
        >
          {isBusy ? (
            <>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(6, 182, 212, 0.2)',
                  borderTopColor: 'var(--accent-cyan)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.6s linear infinite'
                }}
              />
              <span>Executing Mission...</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>Launch Program</span>
              {programLength > 0 && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.4rem',
                    backgroundColor: 'rgba(7, 15, 24, 0.25)',
                    borderRadius: '4px',
                    marginLeft: '0.25rem'
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.65rem 1.1rem',
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            color: isBusy ? '#f87171' : 'var(--text-secondary)',
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

      {/* Auxiliary Controls: Speed, Sound & Campaign Map */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <button
          type="button"
          onClick={onSpeedToggle}
          title="Toggle execution speed"
          style={{
            padding: '0.5rem 0.8rem',
            backgroundColor: 'rgba(17, 24, 39, 0.7)',
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
          title={sound ? 'Mute procedural audio' : 'Enable procedural audio'}
          style={{
            padding: '0.5rem 0.8rem',
            backgroundColor: sound ? 'rgba(6, 182, 212, 0.15)' : 'rgba(17, 24, 39, 0.7)',
            border: '1px solid',
            borderColor: sound ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: sound ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          {sound ? '🔊 Sound On' : '🔇 Muted'}
        </button>

        <button
          type="button"
          onClick={onOpenMap}
          style={{
            padding: '0.5rem 0.9rem',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: '#60a5fa',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🗺️ Campaign Sectors
        </button>

        {onOpenMentor && (
          <button
            type="button"
            onClick={onOpenMentor}
            style={{
              padding: '0.5rem 0.9rem',
              backgroundColor: 'rgba(66, 227, 198, 0.12)',
              border: '1px solid rgba(66, 227, 198, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-cyan)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            🤖 AI Mentor
          </button>
        )}
      </div>
    </div>
  );
}

export default PlaybackControls;
