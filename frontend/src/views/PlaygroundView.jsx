import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, ApiClientError } from '../api/client.js';
import { WorldScene } from '../components/game/world/WorldScene.jsx';
import { BlocklyEditor } from '../components/game/blockly/BlocklyEditor.jsx';
import { validateProgramAST } from '../components/game/blockly/astCompiler.js';
import { PlaybackControls } from '../components/game/controls/PlaybackControls.jsx';
import { MissionBriefing } from '../components/game/controls/MissionBriefing.jsx';
import { CampaignSelectorModal } from '../components/game/modals/CampaignSelectorModal.jsx';
import { ResultModal } from '../components/game/modals/ResultModal.jsx';
import { useGamePlayback } from '../hooks/useGamePlayback.js';

const STARTER_BLOCKS = {
  1: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="cv_repeat" x="30" y="30">
    <field name="COUNT">3</field>
    <statement name="DO">
      <block type="cv_move"></block>
    </statement>
  </block>
</xml>`
};

export function PlaygroundView() {
  const { user, refreshProfile } = useAuth();
  const [levels, setLevels] = useState([]);
  const [activeLevel, setActiveLevel] = useState(null);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [program, setProgram] = useState([]);
  const activeLevelIdRef = useRef(null);

  // Sync ref with active level id to guard against stale responses
  useEffect(() => {
    activeLevelIdRef.current = activeLevel?.id || null;
  }, [activeLevel?.id]);

  // Load levels on initial mount
  const loadLevels = useCallback(async (selectId = null) => {
    try {
      setLoadingLevels(true);
      const data = await api.campaign.getLevels();
      setLevels(data || []);

      if (data && data.length > 0) {
        if (selectId) {
          const match = data.find((l) => l.id === selectId);
          if (match && match.unlocked) {
            setActiveLevel(match);
            return;
          }
        }

        // Default to current level if already set and still unlocked
        setActiveLevel((current) => {
          if (current) {
            const updated = data.find((l) => l.id === current.id);
            if (updated && updated.unlocked) return updated;
          }
          // Otherwise first incomplete unlocked level, or first level
          return data.find((l) => l.unlocked && !l.completed) || data[0];
        });
      }
    } catch {
      // Gracefully handled by UI
    } finally {
      setLoadingLevels(false);
    }
  }, []);

  const [searchParams] = useSearchParams();
  const urlLevelId = Number(searchParams.get('level') || searchParams.get('sector')) || null;

  useEffect(() => {
    loadLevels(urlLevelId);
  }, [loadLevels, urlLevelId]);

  // Callback when a run animation finishes
  const handleRunFinished = useCallback(
    async (_finalOutcome) => {
      // Reconcile user profile and campaign progress on server
      try {
        await Promise.all([
          refreshProfile(),
          api.campaign.getLevels().then((freshLevels) => {
            setLevels(freshLevels || []);
            // Update active level metadata in place without switching away
            if (activeLevelIdRef.current) {
              const updated = freshLevels.find((l) => l.id === activeLevelIdRef.current);
              if (updated) {
                setActiveLevel(updated);
              }
            }
          })
        ]);
      } catch {
        // Telemetry refresh failure does not block result presentation
      }
    },
    [refreshProfile]
  );

  const {
    worldState,
    isBusy,
    speed,
    soundEnabled,
    result,
    error,
    setError,
    setResult,
    resetWorld,
    startPlayback,
    toggleSpeed,
    toggleSound
  } = useGamePlayback({
    level: activeLevel,
    onRunFinished: handleRunFinished
  });

  // Handle program compilation updates from BlocklyEditor
  const handleProgramChange = useCallback((newAst) => {
    setProgram(newAst);
  }, []);

  // Launch program
  const handleLaunch = async () => {
    if (isBusy || !activeLevel) return;

    setError(null);
    setResult(null);

    // 1. Client-side AST validation
    const validation = validateProgramAST(program);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const currentLevelId = activeLevel.id;

    try {
      // 2. Transmit to authoritative campaign API
      const runOutcome = await api.campaign.runLevel(currentLevelId, { program });

      // 3. Stale response guard: verify player did not switch levels while fetch was in flight
      if (activeLevelIdRef.current !== currentLevelId) {
        return;
      }

      // 4. Start visual playback of frames
      startPlayback(runOutcome);
    } catch (err) {
      if (activeLevelIdRef.current !== currentLevelId) {
        return;
      }

      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          setError('Your session has expired. Please refresh or sign in to continue.');
        } else if (err.status === 403) {
          setError('This sector is currently locked. Complete earlier sectors to access.');
        } else if (err.status === 503) {
          setError('Authoritative rewards currently unavailable. Replica-set transaction support required.');
        } else {
          setError(err.message || 'Mission execution failed.');
        }
      } else {
        setError(err.message || 'Unable to communicate with the CodeVerse simulation engine.');
      }
    }
  };

  // Next Sector Action
  const handleNextSector = () => {
    if (!activeLevel) return;
    const nextLvl = levels.find((l) => l.id === activeLevel.id + 1);
    if (nextLvl && nextLvl.unlocked) {
      setResult(null);
      setActiveLevel(nextLvl);
    }
  };

  const hasNextSector = Boolean(
    activeLevel && levels.find((l) => l.id === activeLevel.id + 1 && l.unlocked)
  );

  if (loadingLevels && !activeLevel) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Initialising flight matrix & sector telemetry...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}
    >
      {/* Flight Control Telemetry Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem'
            }}
          >
            🛰️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {user?.username || 'Autonomous Pilot'}
              </h1>
              {user?.isGuest && (
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    color: '#eab308',
                    border: '1px solid rgba(234, 179, 8, 0.4)'
                  }}
                >
                  GUEST SESSION
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              ID: <code style={{ color: 'var(--accent-cyan)' }}>{user?.id}</code> • Campaign Operations
            </div>
          </div>
        </div>

        {/* Player Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>PILOT TIER</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              Level {user?.level || 1}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL XP</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {user?.totalXp || 0} XP
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>CREDITS</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
              🪙 {user?.coins || 0}
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>STREAK</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fb923c' }}>
              🔥 {user?.streak || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Global Error Alert Banner */}
      {error && (
        <div
          style={{
            padding: '0.9rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Dual-Column Game Shell */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: World Simulation & Mission HUD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <WorldScene
            level={activeLevel}
            state={worldState}
          />

          <MissionBriefing level={activeLevel} />

          <PlaybackControls
            isBusy={isBusy}
            onLaunch={handleLaunch}
            onReset={resetWorld}
            speed={speed}
            onSpeedToggle={toggleSpeed}
            sound={soundEnabled}
            onSoundToggle={toggleSound}
            onOpenMap={() => setIsMapModalOpen(true)}
            programLength={program.length}
            hasActiveLevel={Boolean(activeLevel)}
          />
        </div>

        {/* Right Column: Blockly Editor & Program Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <BlocklyEditor
            key={`blockly-${activeLevel?.id}`}
            onProgramChange={handleProgramChange}
            isBusy={isBusy}
            initialXml={STARTER_BLOCKS[activeLevel?.id] || null}
          />

          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(17, 24, 39, 0.6)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>💡</span>
            <span>
              Tip: Drag action blocks from the toolbox to build your sequence. Use repeat blocks for compact tactical par execution.
            </span>
          </div>
        </div>
      </div>

      {/* Modals & Overlays */}
      <CampaignSelectorModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        levels={levels}
        currentLevelId={activeLevel?.id}
        onSelectLevel={(lvl) => {
          resetWorld();
          setActiveLevel(lvl);
        }}
        isBusy={isBusy}
      />

      <ResultModal
        result={result}
        onClose={() => setResult(null)}
        onNextSector={handleNextSector}
        hasNextSector={hasNextSector}
      />
    </div>
  );
}

export default PlaygroundView;
