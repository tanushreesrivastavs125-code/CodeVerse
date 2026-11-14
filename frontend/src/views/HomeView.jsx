import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const TERMINAL_PREVIEWS = [
  {
    id: 'patrol',
    title: 'Sector 01 // Extraction Vector',
    district: 'District 1: Neon Outskirts',
    concept: 'Sequences & Loops',
    code: `// Autonomous Flight Vector\nrepeat(3) {\n  drone.move();\n}\ndrone.extract();`,
    logs: [
      'SYS: Telemetry initialized at [0, 0] facing EAST',
      'STEP 1: drone.move() -> coord [1, 0]',
      'STEP 2: drone.move() -> coord [2, 0]',
      'STEP 3: drone.move() -> coord [3, 0]',
      'EVENT: Reached extraction portal (G)',
      'RESULT: MISSION ACCOMPLISHED // 3 STARS ★★★'
    ]
  },
  {
    id: 'bridge',
    title: 'Sector 07 // Cipher Bridge Protocol',
    district: 'District 2: Cipher District',
    concept: 'Terminals & Bridges',
    code: `// Terminal Interface Protocol\ndrone.move();\ndrone.turnRight();\ndrone.activate(); // Deploys Bridge\ndrone.turnLeft();\ndrone.move();`,
    logs: [
      'SYS: Drone deployed onto grid platform',
      'STEP 1: drone.move() -> coord [1, 0]',
      'STEP 2: drone.turnRight() -> heading SOUTH',
      'ACTION: Terminal (T) engaged -> CYBER BRIDGE ONLINE',
      'STEP 3: drone.turnLeft() -> heading EAST',
      'STEP 4: drone.move() -> crossing deployed bridge [2, 1]',
      'RESULT: SECTOR SECURED // HAZARD BYPASSED'
    ]
  },
  {
    id: 'boss',
    title: 'Sector 12 // Firewall Pulse Strike',
    district: 'District 3: Firewall Core',
    concept: 'Sensors & Pulse Combat',
    code: `// Guardian Countermeasure\nif (sensor.enemyAhead()) {\n  drone.pulse(); // Discharge pulse beam\n} else {\n  drone.move();\n}`,
    logs: [
      'RADAR: Sensor sweep initiated...',
      'SCAN: enemyAhead() == true [Guardian X detected]',
      'ACTION: drone.pulse() -> energy beam fired',
      'IMPACT: Guardian HP reduced 3 -> 0 [PURGED]',
      'STEP 2: drone.move() -> advancing to extraction',
      'RESULT: FIREWALL RESTORED // REWARD CLAIMED'
    ]
  }
];

const DISTRICTS_SHOWCASE = [
  {
    id: 1,
    name: 'Neon Outskirts',
    range: 'Sectors 01 - 04',
    desc: 'Calibrate drone flight mechanics, directional turns, energy shard harvesting, and loop efficiency.'
  },
  {
    id: 2,
    name: 'Cipher District',
    range: 'Sectors 05 - 08',
    desc: 'Navigate chasm boundaries, activate bridge terminals, and execute precision airborne jumps over hazards.'
  },
  {
    id: 3,
    name: 'Firewall Core',
    range: 'Sectors 09 - 12',
    desc: 'Deploy proximity sensors and discharge tactical pulse beams against corrupted security guardians.'
  },
  {
    id: 4,
    name: 'Shadow Network',
    range: 'Sectors 13 - 16',
    desc: 'Tackle extended labyrinthine circuits requiring multi-objective route planning and tight par budgeting.'
  },
  {
    id: 5,
    name: 'Quantum Grid',
    range: 'Sectors 17 - 20',
    desc: 'Engineer adaptive branching logic that responds dynamically to dynamic sensor feedback in flight.'
  },
  {
    id: 6,
    name: 'The Singularity',
    range: 'Sectors 21 - 24',
    desc: 'Master the ultimate flight trial: combined sensor jumps, par optimization, and the 8-HP guardian confrontation.'
  }
];

export function HomeView() {
  const { isAuthenticated, user } = useAuth();
  const [activePreview, setActivePreview] = useState(TERMINAL_PREVIEWS[0]);

  return (
    <div
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '3.5rem 1.75rem 5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4.5rem'
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          gap: '3.5rem',
          alignItems: 'center'
        }}
      >
        {/* Left Column: Headlines & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Eyebrow Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid var(--border-glow)',
              backgroundColor: 'rgba(66, 227, 198, 0.08)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              marginBottom: '1.25rem',
              letterSpacing: '0.06em'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-cyan)',
                boxShadow: '0 0 8px var(--accent-cyan)'
              }}
            />
            AUTONOMOUS FLIGHT CAMPAIGN // 24 SECTORS
          </div>

          <h1
            style={{
              fontSize: '3.4rem',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#f2f7f8',
              margin: '0 0 1.25rem'
            }}
          >
            Code the Drone.{' '}
            <span
              style={{
                color: 'var(--accent-cyan)',
                textShadow: '0 0 35px rgba(66, 227, 198, 0.35)'
              }}
            >
              Secure the Grid.
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.12rem',
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              margin: '0 0 2rem',
              maxWidth: '560px'
            }}
          >
            Pilot an autonomous reconnaissance drone through 6 neon districts. Assemble visual logic sequences, recover glowing energy shards, activate cyber bridge terminals, leap across hazards, neutralize corrupted guardians, and extract safely to the portal.
          </p>

          {/* Primary CTA Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to="/play"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: 'var(--accent-cyan)',
                color: '#050a0f',
                fontWeight: 800,
                fontSize: '1.05rem',
                padding: '0.85rem 2rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 0 25px rgba(66, 227, 198, 0.35)',
                transition: 'all 0.15s ease',
                textDecoration: 'none'
              }}
            >
              <span>⚡</span>
              <span>{isAuthenticated ? `Continue Mission (${user?.username})` : 'Launch Mission (Quick Play)'}</span>
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '0.85rem 1.6rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Pilot Sign In
              </Link>
            ) : (
              <Link
                to="/leaderboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '0.85rem 1.6rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none'
                }}
              >
                🏆 View Leaderboard
              </Link>
            )}
          </div>

          {/* Status strip */}
          <div
            style={{
              display: 'flex',
              gap: '1.75rem',
              marginTop: '2.5rem',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <span>✓ Deterministic Engine</span>
            <span>✓ Multi-Doc ACID Rewards</span>
            <span>✓ Guest & Permanent Sessions</span>
          </div>
        </div>

        {/* Right Column: Interactive Code Terminal Preview */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(66, 227, 198, 0.08)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Terminal Window Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1.1rem',
              backgroundColor: '#0a1622',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff4d6d' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f2cc66' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#42e3c6' }} />
              <span
                style={{
                  marginLeft: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}
              >
                drone-runtime.js
              </span>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--accent-cyan)',
                letterSpacing: '0.05em'
              }}
            >
              SIMULATION READY
            </span>
          </div>

          {/* Program Selector Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#07121b',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '0.25rem 0.5rem',
              gap: '0.35rem'
            }}
          >
            {TERMINAL_PREVIEWS.map((prev) => (
              <button
                key={prev.id}
                type="button"
                onClick={() => setActivePreview(prev)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: activePreview.id === prev.id ? 'rgba(66, 227, 198, 0.15)' : 'transparent',
                  color: activePreview.id === prev.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {prev.title.split('//')[0].trim()}
              </button>
            ))}
          </div>

          {/* Code Body */}
          <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#050c13' }}>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              // {activePreview.district} • {activePreview.concept}
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                color: '#67e8f9',
                lineHeight: 1.65
              }}
            >
              <code>{activePreview.code}</code>
            </pre>
          </div>

          {/* Simulated Flight Telemetry Console */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#071520',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.7
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.35rem' }}>
              &gt; AUTONOMOUS FLIGHT TELEMETRY LOG
            </div>
            {activePreview.logs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  color: log.includes('ACCOMPLISHED') || log.includes('SECURED') || log.includes('RESTORED')
                    ? 'var(--accent-cyan)'
                    : log.includes('EVENT') || log.includes('ACTION')
                      ? 'var(--accent-gold)'
                      : log.includes('SCAN') || log.includes('IMPACT')
                        ? 'var(--accent-red)'
                        : 'var(--text-secondary)'
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6-District Campaign Overview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.08em',
              marginBottom: '0.3rem'
            }}
          >
            FLIGHT PROGRESSION ROADMAP
          </div>
          <h2
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 0.75rem'
            }}
          >
            Six Thematic Campaign Districts
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            Every district introduces new environmental challenges, mechanics, and cognitive programming demands.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '1.25rem'
          }}
        >
          {DISTRICTS_SHOWCASE.map((district) => (
            <div
              key={district.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'border-color 0.15s ease',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700
                  }}
                >
                  DISTRICT 0{district.id}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  {district.range}
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {district.name}
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {district.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeView;
