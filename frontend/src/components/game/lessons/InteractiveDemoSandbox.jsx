import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const DIRECTION_ARROWS = ['→', '↓', '←', '↑'];
const DELTAS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 }
];

/**
 * Pre-computes simulation frames for an interactive worked example.
 */
function computeDemoFrames(demoMap, demoInitialState, program) {
  const mapRows = Array.isArray(demoMap) ? demoMap : ['#####', '#S.G#', '#####'];
  const startX = demoInitialState?.x ?? 1;
  const startY = demoInitialState?.y ?? 1;
  const startDir = demoInitialState?.direction ?? 0;

  // Count boss HP if guardian is present
  const hasBoss = mapRows.some((r) => r.includes('X'));
  const initialBossHP = hasBoss ? 3 : 0;

  const initialFrame = {
    x: startX,
    y: startY,
    direction: startDir,
    collected: [],
    bridge: false,
    bossHP: initialBossHP,
    actionName: 'Initial Position',
    stepNumber: 0
  };

  const frames = [initialFrame];

  // Flatten nested program commands for sequential demo playback
  function flattenProgram(cmds) {
    const list = [];
    if (!Array.isArray(cmds)) return list;
    for (const cmd of cmds) {
      if (cmd.type === 'repeat') {
        const count = Math.min(cmd.count || 1, 10);
        for (let i = 0; i < count; i++) {
          list.push(...flattenProgram(cmd.body || []));
        }
      } else if (cmd.type === 'if') {
        // In worked example, evaluate condition against map or include body
        list.push(...flattenProgram(cmd.body || []));
      } else {
        list.push(cmd);
      }
    }
    return list;
  }

  const flattened = flattenProgram(program || []);

  let currentState = {
    x: startX,
    y: startY,
    direction: startDir,
    collected: [],
    bridge: false,
    bossHP: initialBossHP
  };

  let stepCount = 0;

  for (const cmd of flattened) {
    stepCount++;
    const nextState = {
      ...currentState,
      collected: [...currentState.collected]
    };
    let actionLabel = cmd.type;

    if (cmd.type === 'move') {
      actionLabel = 'Move Forward';
      const delta = DELTAS[nextState.direction];
      const targetX = nextState.x + delta.dx;
      const targetY = nextState.y + delta.dy;
      const row = mapRows[targetY];
      const tile = row ? row[targetX] : '#';
      if (tile !== '#') {
        nextState.x = targetX;
        nextState.y = targetY;
      }
    } else if (cmd.type === 'left') {
      actionLabel = 'Turn Left ↶';
      nextState.direction = (nextState.direction + 3) % 4;
    } else if (cmd.type === 'right') {
      actionLabel = 'Turn Right ↷';
      nextState.direction = (nextState.direction + 1) % 4;
    } else if (cmd.type === 'jump') {
      actionLabel = 'Jump Breach';
      const delta = DELTAS[nextState.direction];
      const targetX = nextState.x + delta.dx * 2;
      const targetY = nextState.y + delta.dy * 2;
      const row = mapRows[targetY];
      const tile = row ? row[targetX] : '#';
      if (tile !== '#') {
        nextState.x = targetX;
        nextState.y = targetY;
      }
    } else if (cmd.type === 'collect') {
      actionLabel = 'Collect Energy ◈';
      const key = `${nextState.x},${nextState.y}`;
      if (!nextState.collected.includes(key)) {
        nextState.collected.push(key);
      }
    } else if (cmd.type === 'activate') {
      actionLabel = 'Activate Terminal ⌘';
      nextState.bridge = true;
    } else if (cmd.type === 'pulse') {
      actionLabel = 'Fire Pulse ⚡';
      if (nextState.bossHP > 0) {
        nextState.bossHP = Math.max(0, nextState.bossHP - 1);
      }
    }

    currentState = nextState;
    frames.push({
      ...nextState,
      actionName: actionLabel,
      stepNumber: stepCount
    });
  }

  return frames;
}

/**
 * InteractiveDemoSandbox provides an isolated, zero-side-effect sandbox
 * where learners can observe and interact with a worked concept demonstration.
 */
export function InteractiveDemoSandbox({ workedExample }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  const demoMap = workedExample?.demoMap || ['#####', '#S.G#', '#####'];

  const frames = useMemo(() => {
    const map = workedExample?.demoMap || ['#####', '#S.G#', '#####'];
    const init = workedExample?.demoInitialState || { x: 1, y: 1, direction: 0 };
    const prog = workedExample?.program || [];
    return computeDemoFrames(map, init, prog);
  }, [workedExample]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

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
      }, 650);
    }
  }, [isPlaying, frameIndex, frames.length]);

  const currentFrame = frames[frameIndex] || frames[0];
  const totalSteps = frames.length - 1;

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
            INTERACTIVE DEMO // ISOLATED SANDBOX
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {workedExample?.title || 'Concept Demonstration'}
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          Step {currentFrame.stepNumber} of {totalSteps}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {workedExample?.explanation || 'Watch how the commands execute step-by-step.'}
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
                const isCollected = currentFrame.collected.includes(`${rx},${ry}`);
                const isBridgeExtended = currentFrame.bridge;

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
                  content = `🤖${DIRECTION_ARROWS[currentFrame.direction]}`;
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

      {/* Action Telemetry & Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.4rem 0.65rem',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Action:</span> {currentFrame.actionName}
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
