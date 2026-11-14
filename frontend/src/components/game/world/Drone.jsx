/**
 * Animated Drone Component for CodeVerse Simulation Board.
 * Features directional heading, thrusters, antenna, and stateful event animations.
 */
export function Drone({
  x,
  y,
  direction = 0,
  event = 'ready',
  isCelebrating = false,
  tileSize = 64,
  boardOffsetX = 0,
  boardOffsetY = 0
}) {
  const headingDeg = direction * 90;
  const leftPx = boardOffsetX + x * tileSize + tileSize * 0.125;
  const topPx = boardOffsetY + y * tileSize + tileSize * 0.125;
  const sizePx = tileSize * 0.75;
  const celebratingClass = (isCelebrating || event === 'victory') ? 'drone-celebrating' : '';

  return (
    <div
      className={`drone-unit event-${event} ${celebratingClass}`.trim()}
      style={{
        position: 'absolute',
        left: `${leftPx}px`,
        top: `${topPx}px`,
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        transition: 'left 0.25s ease-out, top 0.25s ease-out, transform 0.25s ease-out',
        zIndex: 10,
        pointerEvents: 'none'
      }}
      aria-label={`Drone at (${x}, ${y}) facing ${['East', 'South', 'West', 'North'][direction] || 'East'}`}
    >
      {/* Drop Shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '15%',
          right: '15%',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          filter: 'blur(3px)',
          transition: 'all 0.25s ease-out'
        }}
      />

      {/* Main Drone Body with Heading Rotation */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: `rotate(${headingDeg}deg)`,
          transformOrigin: '50% 50%',
          transition: 'transform 0.25s ease-out'
        }}
      >
        {/* Antenna */}
        <div
          style={{
            position: 'absolute',
            top: '-5px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '2px',
            height: '6px',
            backgroundColor: '#06b6d4',
            boxShadow: '0 0 6px #06b6d4'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              left: '-2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#22d3ee',
              boxShadow: '0 0 8px #06b6d4'
            }}
          />
        </div>

        {/* Chassis / Hull */}
        <div
          style={{
            position: 'absolute',
            inset: '3px',
            borderRadius: '10px',
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: '2px solid #06b6d4',
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Visor / Optical Eyes */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '2px 6px',
              backgroundColor: '#090d16',
              borderRadius: '4px',
              border: '1px solid rgba(6, 182, 212, 0.4)'
            }}
          >
            <div
              style={{
                width: '4px',
                height: '5px',
                backgroundColor: '#22d3ee',
                borderRadius: '1px',
                boxShadow: '0 0 5px #06b6d4'
              }}
            />
            <div
              style={{
                width: '4px',
                height: '5px',
                backgroundColor: '#22d3ee',
                borderRadius: '1px',
                boxShadow: '0 0 5px #06b6d4'
              }}
            />
          </div>

          {/* Heading Nose Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              fontSize: '8px',
              lineHeight: 1,
              color: '#38bdf8',
              fontWeight: 800
            }}
          >
            ▲
          </div>

          {/* Core Power Battery Chip */}
          <div
            style={{
              width: '10px',
              height: '3px',
              backgroundColor: event === 'hazard' ? '#ef4444' : '#10b981',
              borderRadius: '1px',
              marginTop: '3px',
              boxShadow: `0 0 6px ${event === 'hazard' ? '#ef4444' : '#10b981'}`
            }}
          />
        </div>

        {/* Lateral Thrusters */}
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '5px',
            width: '4px',
            height: '7px',
            borderRadius: '2px',
            background: 'linear-gradient(to bottom, #06b6d4, #3b82f6)',
            boxShadow: '0 0 6px #06b6d4'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '5px',
            width: '4px',
            height: '7px',
            borderRadius: '2px',
            background: 'linear-gradient(to bottom, #06b6d4, #3b82f6)',
            boxShadow: '0 0 6px #06b6d4'
          }}
        />
      </div>
    </div>
  );
}

export default Drone;
