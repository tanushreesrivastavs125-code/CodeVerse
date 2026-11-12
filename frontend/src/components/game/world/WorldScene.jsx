import { useMemo } from 'react';
import { Drone } from './Drone.jsx';

/**
 * WorldScene Component renders the isometric-perspective arena board,
 * level map tiles, energy shards, portals, hazards, bridges, and the animated drone.
 */
export function WorldScene({
  level,
  state,
  tileSize = 56
}) {
  const map = useMemo(() => level?.map || [], [level?.map]);
  const rows = map.length;
  const cols = useMemo(() => {
    return map.reduce((max, row) => Math.max(max, row.length), 0);
  }, [map]);

  const totalEnergy = useMemo(() => {
    if (!map) return 0;
    return map.join('').split('C').length - 1;
  }, [map]);

  const collectedCount = state?.collected?.length || 0;
  const boardWidth = cols * tileSize;
  const boardHeight = rows * tileSize;

  return (
    <div
      style={{
        backgroundColor: '#071018',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Telemetry HUD Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: '#0c1824',
          borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>SECTOR: </span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{level?.id || 1}</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>{level?.title}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>ZONE: </span>
            <span style={{ color: 'var(--text-secondary)' }}>{level?.zone || 'Neon Outskirts'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {totalEnergy > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: '#fbbf24' }}>◈</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>ENERGY:</span>
              <strong style={{ color: collectedCount === totalEnergy ? 'var(--accent-emerald)' : '#fbbf24' }}>
                {collectedCount}/{totalEnergy}
              </strong>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>ACTIONS:</span>
            <strong style={{ color: state?.steps <= (level?.par || 10) ? 'var(--accent-cyan)' : '#f97316' }}>
              {state?.steps || 0}
            </strong>
            <span style={{ color: 'var(--text-muted)' }}>/ par {level?.par || 10}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: '#ef4444' }}>♥</span>
            <strong style={{ color: (state?.health ?? 3) > 1 ? 'var(--accent-emerald)' : '#ef4444' }}>
              {state?.health ?? 3}
            </strong>
          </div>
        </div>
      </div>

      {/* Arena Viewport with Grid Perspective */}
      <div
        style={{
          minHeight: '340px',
          padding: '2.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(6, 182, 212, 0.08), transparent 70%), linear-gradient(to bottom, #070d14, #0b1522)',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Grid Scanline Effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.35,
            pointerEvents: 'none'
          }}
        />

        {/* Board Surface Container */}
        <div
          style={{
            position: 'relative',
            width: `${boardWidth}px`,
            height: `${boardHeight}px`,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Tiles Layer */}
          {map.map((rowStr, y) => {
            return [...rowStr].map((char, x) => {
              const isWall = char === '#';
              const isPortal = char === 'G';
              const isHazard = char === 'H';
              const isTerminal = char === 'T';
              const isBridge = char === 'B';
              const isBoss = char === 'X';

              const isShardTile = char === 'C';
              const shardKey = `${x},${y}`;
              const isCollected = state?.collected?.includes(shardKey);
              const bridgeActive = Boolean(state?.bridge);

              return (
                <div
                  key={`${x}-${y}`}
                  style={{
                    position: 'absolute',
                    left: `${x * tileSize}px`,
                    top: `${y * tileSize}px`,
                    width: `${tileSize}px`,
                    height: `${tileSize}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Tile Backplate */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '2px',
                      borderRadius: '6px',
                      backgroundColor: isWall
                        ? '#0b111a'
                        : isHazard
                          ? '#1c0e15'
                          : isBridge && bridgeActive
                            ? '#0c2423'
                            : isBridge
                              ? '#070f16'
                              : '#131e2b',
                      border: isWall
                        ? '1px solid rgba(30, 41, 59, 0.5)'
                        : isHazard
                          ? '1px solid rgba(239, 68, 68, 0.5)'
                          : isBridge && bridgeActive
                            ? '1px solid rgba(16, 185, 129, 0.7)'
                            : isBridge
                              ? '1px dashed rgba(75, 85, 99, 0.4)'
                              : '1px solid rgba(30, 58, 82, 0.5)',
                      boxShadow: isHazard
                        ? '0 0 10px rgba(239, 68, 68, 0.2)'
                        : isBridge && bridgeActive
                          ? '0 0 12px rgba(16, 185, 129, 0.3)'
                          : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />

                  {/* Tile Inner Graphics */}
                  {isPortal && (
                    <div
                      style={{
                        position: 'relative',
                        width: '70%',
                        height: '70%',
                        borderRadius: '50%',
                        border: '2px solid #10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.5), inset 0 0 8px rgba(16, 185, 129, 0.3)',
                        animation: 'spin 6s linear infinite'
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#34d399',
                          boxShadow: '0 0 10px #10b981'
                        }}
                      />
                    </div>
                  )}

                  {isShardTile && !isCollected && (
                    <div
                      style={{
                        fontSize: `${tileSize * 0.45}px`,
                        color: '#fbbf24',
                        textShadow: '0 0 12px rgba(251, 191, 36, 0.8)',
                        animation: 'bounce 2s ease-in-out infinite',
                        zIndex: 4
                      }}
                      title="Energy Shard"
                    >
                      ◈
                    </div>
                  )}

                  {isHazard && (
                    <div
                      style={{
                        fontSize: `${tileSize * 0.35}px`,
                        color: '#ef4444',
                        fontWeight: 900,
                        textShadow: '0 0 8px rgba(239, 68, 68, 0.7)',
                        zIndex: 3
                      }}
                      title="Corruption Hazard"
                    >
                      ▲
                    </div>
                  )}

                  {isTerminal && (
                    <div
                      style={{
                        width: '50%',
                        height: '60%',
                        backgroundColor: '#0f2937',
                        border: '2px solid #06b6d4',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: bridgeActive ? '#10b981' : '#06b6d4',
                        fontSize: '12px',
                        fontWeight: 700,
                        boxShadow: bridgeActive ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
                      }}
                      title="Bridge Control Terminal"
                    >
                      ⌘
                    </div>
                  )}

                  {isBridge && (
                    <div
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: bridgeActive ? '#34d399' : '#4b5563',
                        fontWeight: 600,
                        letterSpacing: '0.05em'
                      }}
                    >
                      {bridgeActive ? '====' : '----'}
                    </div>
                  )}

                  {isBoss && (
                    <div
                      style={{
                        width: '75%',
                        height: '75%',
                        backgroundColor: '#3b0764',
                        border: '2px solid #d946ef',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f0abfc',
                        fontSize: '14px',
                        fontWeight: 800,
                        boxShadow: '0 0 14px rgba(217, 70, 239, 0.6)'
                      }}
                      title="Firewall Guardian"
                    >
                      <span>✕</span>
                      <span style={{ fontSize: '7px', color: '#f5d0fe' }}>SHIELD</span>
                    </div>
                  )}
                </div>
              );
            });
          })}

          {/* Animated Drone Unit */}
          {state && (
            <Drone
              x={state.x}
              y={state.y}
              direction={state.direction}
              event={state.event}
              tileSize={tileSize}
            />
          )}
        </div>
      </div>

      {/* Flight Controller Event Status Footer */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: '#08121c',
          borderTop: '1px solid rgba(75, 85, 99, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem',
          fontFamily: 'var(--font-mono)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: state?.event === 'fail' ? '#ef4444' : state?.event === 'extract' ? '#10b981' : '#06b6d4',
              boxShadow: `0 0 8px ${state?.event === 'fail' ? '#ef4444' : '#06b6d4'}`
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {state?.message || 'Awaiting launch sequence...'}
          </span>
        </div>

        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          POS: ({state?.x ?? 0}, {state?.y ?? 0}) // HDG: {['0° E', '90° S', '180° W', '270° N'][state?.direction ?? 0]}
        </span>
      </div>
    </div>
  );
}

export default WorldScene;
