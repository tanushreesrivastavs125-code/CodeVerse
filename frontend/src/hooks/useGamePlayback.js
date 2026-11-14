import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioSynthesizer } from '../components/game/world/AudioSynthesizer.js';
import { initialState } from '../../../shared/game.js';

/**
 * useGamePlayback Hook manages mission simulation animation frames,
 * frame-by-frame timer lifecycle, speed factor, procedural audio,
 * and robust cancellation / stale response protection.
 *
 * Implements explicit run lifecycle state machine:
 * 'idle' -> 'submitting' -> 'playing' -> 'passed' | 'failed'
 * with a recoverable 'request-error' state.
 */
export function useGamePlayback({
  level,
  onRunFinished
}) {
  const [worldState, setWorldState] = useState(null);
  const [runState, setRunState] = useState('idle'); // 'idle' | 'submitting' | 'playing' | 'passed' | 'failed' | 'request-error'
  const [speed, setSpeed] = useState(1); // 1 or 2
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generationRef = useRef(0);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const previousLevelIdRef = useRef(null);
  const previousLevelVersionRef = useRef(null);
  const submissionLockRef = useRef(false);

  // Initialize audio synthesizer once
  useEffect(() => {
    audioRef.current = new AudioSynthesizer();
    return () => {
      if (audioRef.current) {
        audioRef.current.close();
        audioRef.current = null;
      }
    };
  }, []);

  // Update audio sound enabled setting
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.setEnabled(soundEnabled);
    }
  }, [soundEnabled]);

  // Reset world state ONLY when active level identity or version actually changes.
  // Metadata / profile refreshes preserving the same level id must not erase results or the board.
  useEffect(() => {
    const currentId = level?.id ?? null;
    const currentVersion = level?.version ?? null;

    if (
      currentId !== previousLevelIdRef.current ||
      currentVersion !== previousLevelVersionRef.current
    ) {
      previousLevelIdRef.current = currentId;
      previousLevelVersionRef.current = currentVersion;
      submissionLockRef.current = false;
      generationRef.current += 1;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (level) {
        setWorldState(initialState(level));
        setResult(null);
        setError(null);
        setRunState('idle');
      }
    }
  }, [level]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      submissionLockRef.current = false;
      generationRef.current += 1;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  /**
   * Synchronously acquires the submission ownership lock.
   * If a submission is already active, returns null immediately without queuing duplicate requests.
   * If available, locks immediately, increments generation counter, transitions to 'submitting', and returns the new generation.
   */
  const acquireSubmissionLock = useCallback(() => {
    if (submissionLockRef.current) {
      return null;
    }
    submissionLockRef.current = true;
    const runGen = ++generationRef.current;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setRunState('submitting');
    setError(null);
    return runGen;
  }, []);

  /**
   * Releases the synchronous submission ownership lock.
   */
  const releaseSubmissionLock = useCallback(() => {
    submissionLockRef.current = false;
  }, []);

  /**
   * Explicitly starts a run submission, guarding against duplicate requests via synchronous lock.
   * Returns generation index if acquired, or null if locked.
   */
  const startSubmission = useCallback(() => {
    return acquireSubmissionLock();
  }, [acquireSubmissionLock]);

  /**
   * Transitions to a recoverable request error state and releases the submission lock.
   */
  const setRequestError = useCallback((errMsg) => {
    submissionLockRef.current = false;
    setRunState('request-error');
    setError(errMsg);
  }, []);

  /**
   * Checks whether a generation index remains authoritative.
   */
  const isCurrentGeneration = useCallback((gen) => {
    return generationRef.current === gen;
  }, []);

  /**
   * Immediately stops playback, resets the world to its initial state,
   * and releases any active submission locks.
   * Note: Client playback reset only resets visual representation;
   * it never uncommits or reverts server-authoritative rewards or progress.
   */
  const resetWorld = useCallback(() => {
    submissionLockRef.current = false;
    generationRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setRunState('idle');
    setResult(null);
    setError(null);

    if (level) {
      setWorldState(initialState(level));
    }
  }, [level]);

  /**
   * Executes frame-by-frame animation of server-returned frames.
   */
  const playFrames = useCallback(
    (frames, finalOutcome, runGen) => {
      const finishRun = () => {
        if (generationRef.current !== runGen) return;
        submissionLockRef.current = false;
        timerRef.current = null;
        setRunState(finalOutcome.passed ? 'passed' : 'failed');
        setResult(finalOutcome);

        if (audioRef.current) {
          audioRef.current.play(finalOutcome.passed ? 'victory' : 'fail');
        }

        if (typeof onRunFinished === 'function') {
          onRunFinished(finalOutcome);
        }
      };

      // Handle empty frames response safely
      if (!frames || frames.length === 0) {
        if (generationRef.current === runGen) {
          if (finalOutcome.state) {
            setWorldState(finalOutcome.state);
          }
          finishRun();
        } else {
          submissionLockRef.current = false;
        }
        return;
      }

      // Respect prefers-reduced-motion: jump immediately to final state without stepping delay
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReducedMotion) {
        if (generationRef.current === runGen) {
          const finalFrame = frames[frames.length - 1];
          if (finalFrame) setWorldState(finalFrame);
          finishRun();
        } else {
          submissionLockRef.current = false;
        }
        return;
      }

      let frameIdx = 0;
      const baseDelay = speed === 2 ? 160 : 320;

      function step() {
        if (generationRef.current !== runGen) {
          // Playback was cancelled or level changed; abort
          return;
        }

        const currentFrame = frames[frameIdx];
        setWorldState(currentFrame);

        // Sound trigger
        if (audioRef.current && currentFrame.event && currentFrame.event !== 'ready') {
          audioRef.current.play(currentFrame.event);
        }

        frameIdx += 1;

        if (frameIdx < frames.length) {
          timerRef.current = setTimeout(step, baseDelay);
        } else {
          finishRun();
        }
      }

      step();
    },
    [speed, onRunFinished]
  );

  /**
   * Starts playback of a mission run result.
   */
  const startPlayback = useCallback(
    (runResponse, expectedGen = null) => {
      if (expectedGen !== null && generationRef.current !== expectedGen) {
        submissionLockRef.current = false;
        return;
      }

      const runGen = expectedGen !== null ? expectedGen : ++generationRef.current;
      submissionLockRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setRunState('playing');
      setError(null);

      const frames = runResponse.frames || [];
      playFrames(frames, runResponse, runGen);
    },
    [playFrames]
  );

  const toggleSpeed = useCallback(() => {
    setSpeed((s) => (s === 1 ? 2 : 1));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((s) => !s);
  }, []);

  const isBusy = submissionLockRef.current || runState === 'submitting' || runState === 'playing';

  return {
    worldState,
    runState,
    isBusy,
    speed,
    soundEnabled,
    result,
    error,
    setError,
    setResult,
    setRunState,
    resetWorld,
    acquireSubmissionLock,
    releaseSubmissionLock,
    submissionLockRef,
    startSubmission,
    startPlayback,
    setRequestError,
    isCurrentGeneration,
    toggleSpeed,
    toggleSound,
    generationRef
  };
}

export default useGamePlayback;
