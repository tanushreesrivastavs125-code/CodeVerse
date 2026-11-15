import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { simulate } from '../../../../../shared/game.js';

const DIRECTION_ARROWS = ['→', '↓', '←', '↑'];
const DIRECTION_NAMES = ['East (0°)', 'South (90°)', 'West (180°)', 'North (270°)'];

function formatFrameAction(frame) {
  if (frame.condition) {
    return frame.condition.explanation;
  }
  switch (frame.event) {
    case 'ready':
      return 'Initial Position';
    case 'move':
      return 'Move Forward';
    case 'turn':
      return `Turn Facing: ${DIRECTION_NAMES[frame.direction] || frame.direction}`;
    case 'jump':
      return 'Jump Across Breach';
    case 'collect':
      return 'Collect Energy ◈';
    case 'activate':
      return 'Activate Terminal ⌘';
    case 'pulse':
      return 'Fire Pulse ⚡';
    case 'crash':
      return `Collision / Crash 💥: ${frame.message}`;
    case 'miss':
      return `Action Missed ⚠️: ${frame.message}`;
    default:
      return frame.message || frame.event || 'Action';
  }
}

/**
 * InteractiveDemoSandbox provides an isolated, zero-side-effect sandbox
 * where learners can observe and interact with a worked concept demonstration.
 * Powered directly by the canonical CodeVerse simulation engine.
 */
export function InteractiveDemoSandbox({ workedExample }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  const demoMap = useMemo(() => {
    return workedExample?.demoMap || workedExample?.demoLevel?.map || ['#####', '#S.G#', '#####'];
  }, [workedExample]);

  const demoLevel = useMemo(() => {
    const map = demoMap;
    const direction = workedExample?.demoInitialState?.direction ?? workedExample?.demoLevel?.direction ?? 0;
    const bossHealth = workedExample?.bossHealth ?? workedExample?.demoLevel?.bossHealth ?? (map.some((r) => r.includes('X')) ? 3 : 0);
    return {
      id: workedExample?.demoLevel?.id || 'demo-sandbox',
      title: workedExample?.title || 'Concept Demonstration',
      map,
      direction,
      bossHealth
    };
  }, [demoMap, workedExample]);

  const frames = useMemo(() => {
    const prog = workedExample?.program || [];
    try {
      const outcome = simulate(demoLevel, prog, { recordConditions: true });
      return outcome.frames.map((frame, idx) => ({
        ...frame,
        stepNumber: idx,
        actionName: formatFrameAction(frame)
      }));
    } catch (err) {
      // Safe fallback frame on invalid payload
      return [{
        x: 1,
        y: 1,
        direction: demoLevel.direction,
        collected: [],
        bridge: false,
        bossHP: demoLevel.bossHealth,
        event: 'ready',
        message: err.message || 'Ready to demonstrate.',
        stepNumber: 0,
        actionName: 'Initial Position'
      }];
    }
  }, [demoLevel, workedExample]);

  // Clean timer on unmount or program change
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [workedExample]);

  const handleReset = useCallback(() => {
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    setIsPlaying(false);
    setFrameIndex(0);
  }, []);

  const handleStepForward = useCallback(() => {
    setFrameIndex((prev) => Math.min(prev + 1, frames.length - 1));
  }, [frames.length]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      setIsPlaying(false);
    } else {
      if (frameIndex >= frames.length - 1) {
        setFrameIndex(0);
      }
      setIsPlaying(true);
      playTimerRef.current = setInterval(() => {
        setFrameIndex((prev) => {
          if (prev >= frames.length - 1) {
            clearInterval(playTimerRef.current);
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
  }, [isPlaying, frameIndex, frames.length]);

  const currentFrame = frames[frameIndex] || frames[0];
  const totalSteps = Math.max(0, frames.length - 1);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
            INTERACTIVE DEMO // CANONICAL SIMULATOR
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {workedExample?.title || 'Concept Demonstration'}
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          Step {currentFrame.stepNumber} of {totalSteps}
        </div>
      </div>

      {workedExample?.isIntentionalFailure && (
        <div
          data-testid="intentional-failure-banner"
          style={{
            padding: '0.45rem 0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-danger, #ef4444)',
            fontSize: '0.8rem',
            fontWeight: 600,
            lineHeight: 1.4
          }}
        >
          ⚠️ <strong>Intentional Failure Demonstration:</strong> Shows what happens when an obstacle or mistake is encountered without the correct action.
        </div>
      )}

      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {workedExample?.explanation || 'Watch how the commands execute step-by-step using canonical simulation.'}
      </p>

      {/* Mini Demo Board Grid */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0.75rem',
          backgroundColor: 'var(--board-bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto'
        }}
      >
        <div style={{ display: 'inline-grid', gap: '3px' }}>
          {demoMap.map((row, ry) => (
            <div key={ry} style={{ display: 'flex', gap: '3px' }}>
              {[...row].map((char, rx) => {
                const isDrone = currentFrame.x === rx && currentFrame.y === ry;
                const isCollected = currentFrame.collected?.includes(`${rx},${ry}`);
                const isBridgeExtended = Boolean(currentFrame.bridge);

                let tileBg = 'rgba(255, 255, 255, 0.04)';
                let tileBorder = '1px solid rgba(255, 255, 255, 0.06)';
                let content = '';

                if (char === '#') {
                  tileBg = 'rgba(15, 23, 42, 0.9)';
                  tileBorder = '1px solid rgba(30, 41, 59, 0.9)';
                } else if (char === 'G') {
                  tileBg = 'rgba(52, 211, 153, 0.2)';
                  tileBorder = '1px solid rgba(52, 211, 153, 0.5)';
                  content = '🟢';
                } else if (char === 'C' && !isCollected) {
                  content = '💎';
                } else if (char === 'H') {
                  tileBg = 'rgba(239, 68, 68, 0.25)';
                  tileBorder = '1px solid rgba(239, 68, 68, 0.5)';
                  content = '🟥';
                } else if (char === 'T') {
                  content = '🕹️';
                } else if (char === 'B') {
                  tileBg = isBridgeExtended ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 0, 0, 0.4)';
                  content = isBridgeExtended ? '🌉' : '░';
                } else if (char === 'X') {
                  content = currentFrame.bossHP > 0 ? '👾' : '💥';
                }

                if (isDrone) {
                  content = `🤖${DIRECTION_ARROWS[currentFrame.direction] || '→'}`;
                }

                return (
                  <div
                    key={`${rx}-${ry}`}
                    style={{
                      width: '38px',
                      height: '38px',
                      backgroundColor: tileBg,
                      border: tileBorder,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      userSelect: 'none'
                    }}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Condition Evaluation Callout */}
      {currentFrame.condition && (
        <div
          data-testid="condition-explanation"
          style={{
            padding: '0.45rem 0.75rem',
            backgroundColor: currentFrame.condition.outcome ? 'rgba(52, 211, 153, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: currentFrame.condition.outcome ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-sm)',
            color: currentFrame.condition.outcome ? '#34d399' : '#f59e0b',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <strong>Sensor Check:</strong> {currentFrame.condition.explanation}
        </div>
      )}

      {/* Action Telemetry & Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.45rem 0.75rem',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Action:</span> {currentFrame.actionName}
          {currentFrame.message && currentFrame.event !== 'ready' && !currentFrame.condition && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {currentFrame.message}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '0.3rem 0.6rem',
              minHeight: '30px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⏮ Reset
          </button>

          <button
            type="button"
            onClick={handleStepForward}
            disabled={frameIndex >= frames.length - 1 || isPlaying}
            style={{
              padding: '0.3rem 0.6rem',
              minHeight: '30px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: frameIndex >= frames.length - 1 || isPlaying ? 'not-allowed' : 'pointer',
              opacity: frameIndex >= frames.length - 1 || isPlaying ? 0.5 : 1
            }}
          >
            ⏭ Step
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              padding: '0.3rem 0.75rem',
              minHeight: '30px',
              backgroundColor: isPlaying ? 'var(--accent-purple)' : 'var(--accent-cyan)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play Demo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InteractiveDemoSandbox;
