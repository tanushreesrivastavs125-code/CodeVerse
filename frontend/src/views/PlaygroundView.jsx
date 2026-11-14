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
import { MentorModal } from '../components/game/mentor/MentorModal.jsx';
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
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [program, setProgram] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isRefreshingProgress, setIsRefreshingProgress] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const activeLevelIdRef = useRef(null);

  // Sync ref with active level id to guard against stale responses
  useEffect(() => {
    activeLevelIdRef.current = activeLevel?.id || null;
  }, [activeLevel?.id]);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlLevelId = Number(searchParams.get('level') || searchParams.get('sector')) || null;

  // Helper to sync level change with URL search parameters (?level=N)
  const selectLevelWithUrlSync = useCallback(
    (lvl, replace = false) => {
      if (!lvl) return;
      setActiveLevel(lvl);
      const currentParam = searchParams.get('level');
      if (currentParam !== String(lvl.id)) {
        setSearchParams({ level: String(lvl.id) }, { replace });
      }
    },
    [searchParams, setSearchParams]
  );

  // Load levels on initial mount or level selector param
  const loadLevels = useCallback(
    async (selectId = null) => {
      try {
        setLoadingLevels(true);
        const data = await api.campaign.getLevels();
        setLevels(data || []);

        if (data && data.length > 0) {
          if (selectId) {
            const match = data.find((l) => l.id === selectId);
            if (match && match.unlocked) {
              selectLevelWithUrlSync(match, true);
              return;
            }
          }

          // Default to current level if already set and still unlocked
          let target = null;
          if (activeLevelIdRef.current) {
            target = data.find((l) => l.id === activeLevelIdRef.current && l.unlocked);
          }
          if (!target) {
            target = data.find((l) => l.unlocked && !l.completed) || data[0];
          }
          if (target) {
            selectLevelWithUrlSync(target, true);
          }
        }
      } catch {
        // Gracefully handled by UI
      } finally {
        setLoadingLevels(false);
      }
    },
    [selectLevelWithUrlSync]
  );

  useEffect(() => {
    loadLevels(urlLevelId);
  }, [loadLevels, urlLevelId]);

  // Refresh progress helper with explicit retry support
  const syncProgress = useCallback(async () => {
    try {
      setIsRefreshingProgress(true);
      setRefreshError(null);
      const [freshLevels] = await Promise.all([
        api.campaign.getLevels(),
        refreshProfile()
      ]);
      if (freshLevels && Array.isArray(freshLevels)) {
        setLevels(freshLevels);
        if (activeLevelIdRef.current) {
          const updated = freshLevels.find((l) => l.id === activeLevelIdRef.current);
          if (updated) {
            setActiveLevel(updated);
          }
        }
      }
    } catch (err) {
      setRefreshError(err.message || 'Unable to sync sector progression with server.');
    } finally {
      setIsRefreshingProgress(false);
    }
  }, [refreshProfile]);

  // Callback when a run animation finishes
  const handleRunFinished = useCallback(
    async (finalOutcome) => {
      setLastResult(finalOutcome);
      setIsResultModalOpen(true);
      await syncProgress();
    },
    [syncProgress]
  );

  const {
    worldState,
    runState,
    isBusy,
    speed,
    soundEnabled,
    result,
    error,
    setError,
    resetWorld,
    releaseSubmissionLock,
    startSubmission,
    startPlayback,
    setRequestError,
    isCurrentGeneration,
    toggleSpeed,
    toggleSound
  } = useGamePlayback({
    level: activeLevel,
    onRunFinished: handleRunFinished
  });

  // Keep lastResult and modal in sync with playback hook result
  useEffect(() => {
    if (result) {
      setLastResult(result);
      setIsResultModalOpen(true);
    }
  }, [result]);

  // Handle program compilation updates from BlocklyEditor
  const handleProgramChange = useCallback((newAst) => {
    setProgram(newAst);
  }, []);

  // Launch program with immediate synchronous ownership lock
  const handleLaunch = useCallback(async () => {
    if (!activeLevel) return;

    // 1. Client-side AST validation
    const validation = validateProgramAST(program);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Synchronous lock acquisition: immediately blocks duplicate calls in the same tick
    const runGen = startSubmission();
    if (runGen === null) {
      return;
    }

    setError(null);
    setRefreshError(null);
    setLastResult(null);

    const currentLevelId = activeLevel.id;

    try {
      // 2. Transmit to authoritative campaign API
      const runOutcome = await api.campaign.runLevel(currentLevelId, { program });

      // 3. Stale response guard: verify player did not switch levels or trigger reset
      if (activeLevelIdRef.current !== currentLevelId || !isCurrentGeneration(runGen)) {
        releaseSubmissionLock();
        return;
      }

      // 4. Start visual playback of frames
      startPlayback(runOutcome, runGen);
    } catch (err) {
      if (activeLevelIdRef.current !== currentLevelId || !isCurrentGeneration(runGen)) {
        releaseSubmissionLock();
        return;
      }

      let errorMsg = 'Mission execution failed.';
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          errorMsg = 'Your session has expired. Please refresh or sign in to continue.';
        } else if (err.status === 403) {
          if (err.code === 'LEVEL_LOCKED') {
            errorMsg = 'This level is currently locked. Complete earlier levels to access.';
          } else if (err.code === 'CSRF_ORIGIN_INVALID') {
            errorMsg = 'Request blocked by CSRF security policy. Your origin is not recognized in CORS_ORIGIN.';
          } else {
            errorMsg = err.message || 'Access denied.';
          }
        } else if (err.status === 503) {
          errorMsg = 'Authoritative rewards currently unavailable. Replica-set transaction support required.';
        } else {
          errorMsg = err.message || 'Mission execution failed.';
        }
      } else {
        errorMsg = err.message || 'Unable to communicate with the CodeVerse simulation engine.';
      }

      setRequestError(errorMsg);
    }
  }, [activeLevel, program, setError, setRequestError, startSubmission, releaseSubmissionLock, isCurrentGeneration, startPlayback]);

  // Keyboard shortcuts (Ctrl+Enter to Run, Esc to Reset)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleLaunch();
      } else if (e.key === 'Escape' && !isResultModalOpen && !isMapModalOpen && !isMentorModalOpen) {
        resetWorld();
        setLastResult(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunch, resetWorld, isResultModalOpen, isMapModalOpen, isMentorModalOpen]);

  // Next / Prev Level Navigation
  const prevLevel = levels.find((l) => l.id === (activeLevel?.id || 0) - 1);
  const nextLevel = levels.find((l) => l.id === (activeLevel?.id || 0) + 1);
  const hasNextSector = Boolean(nextLevel && nextLevel.unlocked);

  const handleNextSector = () => {
    if (!activeLevel) return;
    if (nextLevel && nextLevel.unlocked) {
      setIsResultModalOpen(false);
      setLastResult(null);
      resetWorld();
      selectLevelWithUrlSync(nextLevel);
    }
  };

  const handlePrevSector = () => {
    if (prevLevel && prevLevel.unlocked) {
      setIsResultModalOpen(false);
      setLastResult(null);
      resetWorld();
      selectLevelWithUrlSync(prevLevel);
    }
  };

  if (loadingLevels && !activeLevel) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)' }}>Loading level workspace...</span>
      </div>
    );
  }

  const isCelebrating = Boolean((result?.passed || lastResult?.passed) && (runState === 'passed' || isResultModalOpen));

  return (
    <div className="workspace-container">
      {/* Calm, Focused Workspace Header */}
      <div
        className="calm-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              color: 'var(--accent-cyan)'
            }}
          >
            🛰️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Level {activeLevel?.id || 1}: {activeLevel?.title || 'Boot Sequence'}
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({user?.username || 'Pilot'})
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {activeLevel?.zone || 'Neon Outskirts'} • {activeLevel?.concept || 'Logic'}
            </div>
          </div>
        </div>

        {/* Quick Level Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePrevSector}
            disabled={!prevLevel || !prevLevel.unlocked}
            title={prevLevel ? `Go to Level ${prevLevel.id}` : 'No previous level'}
            style={{
              padding: '0.35rem 0.65rem',
              minHeight: '34px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: prevLevel && prevLevel.unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: prevLevel && prevLevel.unlocked ? 'pointer' : 'not-allowed',
              opacity: prevLevel && prevLevel.unlocked ? 1 : 0.5
            }}
          >
            ← Prev
          </button>

          <button
            type="button"
            onClick={() => setIsMapModalOpen(true)}
            style={{
              padding: '0.35rem 0.75rem',
              minHeight: '34px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🗺️ Level Map
          </button>

          <button
            type="button"
            onClick={handleNextSector}
            disabled={!nextLevel || !nextLevel.unlocked}
            title={nextLevel ? (nextLevel.unlocked ? `Go to Level ${nextLevel.id}` : 'Level locked') : 'Final level'}
            style={{
              padding: '0.35rem 0.65rem',
              minHeight: '34px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: nextLevel && nextLevel.unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: nextLevel && nextLevel.unlocked ? 'pointer' : 'not-allowed',
              opacity: nextLevel && nextLevel.unlocked ? 1 : 0.5
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Global Error Alert Banner */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-red)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-red)',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Telemetry Refresh Warning Banner with Retry */}
      {refreshError && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-gold)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span>
            <span>{refreshError}</span>
          </div>
          <button
            type="button"
            onClick={syncProgress}
            disabled={isRefreshingProgress}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--accent-gold)',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              color: 'var(--accent-gold)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: isRefreshingProgress ? 'wait' : 'pointer'
            }}
          >
            {isRefreshingProgress ? 'Syncing...' : 'Retry Sync'}
          </button>
        </div>
      )}

      {/* Persistent Result Summary Banner (Visible when modal is closed but run result exists) */}
      {!isResultModalOpen && lastResult && (
        <div
          className="calm-card"
          style={{
            padding: '0.8rem 1.25rem',
            backgroundColor: lastResult.passed ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: lastResult.passed ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem', color: lastResult.passed ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
              {lastResult.passed ? '✓' : '✕'}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: lastResult.passed ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                {lastResult.passed ? 'Level complete!' : 'Not quite yet—try again'}
                {lastResult.passed && (
                  <span style={{ marginLeft: '0.5rem', color: 'var(--accent-gold)' }}>
                    {'★'.repeat(lastResult.stars || 0)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {lastResult.message}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsResultModalOpen(true)}
              style={{
                padding: '0.4rem 0.85rem',
                minHeight: '36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {lastResult.passed ? 'View Rewards' : 'View Diagnostics'}
            </button>

            {lastResult.passed && hasNextSector && (
              <button
                type="button"
                onClick={handleNextSector}
                style={{
                  padding: '0.4rem 0.95rem',
                  minHeight: '36px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'var(--accent-cyan)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Next Level →
              </button>
            )}

            {!lastResult.passed && (
              <button
                type="button"
                onClick={() => {
                  resetWorld();
                  setLastResult(null);
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  minHeight: '36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset Board
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Responsive Game Shell */}
      <div className="workspace-grid">
        {/* Left Column: Board Simulation, Mission Objectives & Flight Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <WorldScene
            level={activeLevel}
            state={worldState}
            isCelebrating={isCelebrating}
          />

          <PlaybackControls
            isBusy={isBusy}
            onLaunch={handleLaunch}
            onReset={() => {
              resetWorld();
              setLastResult(null);
            }}
            speed={speed}
            onSpeedToggle={toggleSpeed}
            sound={soundEnabled}
            onSoundToggle={toggleSound}
            onOpenMap={() => setIsMapModalOpen(true)}
            onOpenMentor={() => setIsMentorModalOpen(true)}
            programLength={program.length}
            hasActiveLevel={Boolean(activeLevel)}
          />

          <MissionBriefing level={activeLevel} />
        </div>

        {/* Right Column: Blockly Drag-and-Drop Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <BlocklyEditor
            key={`blockly-${activeLevel?.id}`}
            onProgramChange={handleProgramChange}
            isBusy={isBusy}
            initialXml={STARTER_BLOCKS[activeLevel?.id] || null}
          />
        </div>
      </div>

      {/* Modals & Overlays */}
      <MentorModal
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        level={activeLevel}
        program={program}
      />

      <CampaignSelectorModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        levels={levels}
        currentLevelId={activeLevel?.id}
        onSelectLevel={(lvl) => {
          resetWorld();
          setLastResult(null);
          selectLevelWithUrlSync(lvl);
        }}
        isBusy={isBusy}
      />

      <ResultModal
        result={result || lastResult}
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        onNextSector={handleNextSector}
        hasNextSector={hasNextSector}
        onReplay={() => {
          setIsResultModalOpen(false);
          setLastResult(null);
          resetWorld();
        }}
        onOpenCampaign={() => {
          setIsResultModalOpen(false);
          setIsMapModalOpen(true);
        }}
        onEditProgram={() => {
          setIsResultModalOpen(false);
        }}
        onResetToEdit={() => {
          setIsResultModalOpen(false);
          setLastResult(null);
          resetWorld();
        }}
        onRerun={() => {
          setIsResultModalOpen(false);
          setLastResult(null);
          resetWorld();
          setTimeout(() => {
            handleLaunch();
          }, 0);
        }}
        onTryAgain={() => {
          setIsResultModalOpen(false);
          setLastResult(null);
          resetWorld();
        }}
        onShowHint={() => {
          setIsResultModalOpen(false);
          setIsMentorModalOpen(true);
        }}
        level={activeLevel}
      />
    </div>
  );
}

export default PlaygroundView;
