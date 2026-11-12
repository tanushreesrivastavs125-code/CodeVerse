import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioSynthesizer } from '../components/game/world/AudioSynthesizer.js';
import { initialState } from '../../../shared/game.js';

/**
 * useGamePlayback Hook manages mission simulation animation frames,
 * frame-by-frame timer lifecycle, speed factor, procedural audio,
 * and robust cancellation / stale response protection.
 */
export function useGamePlayback({
  level,
  onRunFinished
}) {
  const [worldState, setWorldState] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [speed, setSpeed] = useState(1); // 1 or 2
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generationRef = useRef(0);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const abortControllerRef = useRef(null);

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

  // Reset world state whenever active level changes
  useEffect(() => {
    // Invalidate any ongoing run from previous level
    generationRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (level) {
      setWorldState(initialState(level));
      setResult(null);
      setError(null);
      setIsBusy(false);
    }
  }, [level]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      generationRef.current += 1;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Immediately stops playback and resets the world to its initial state.
   */
  const resetWorld = useCallback(() => {
    generationRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsBusy(false);
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
      if (!frames || frames.length === 0) {
        if (generationRef.current === runGen) {
          setIsBusy(false);
          setResult(finalOutcome);
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
          // Playback complete
          timerRef.current = null;
          if (generationRef.current === runGen) {
            setIsBusy(false);
            setResult(finalOutcome);

            if (audioRef.current) {
              audioRef.current.play(finalOutcome.passed ? 'victory' : 'fail');
            }

            if (typeof onRunFinished === 'function') {
              onRunFinished(finalOutcome);
            }
          }
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
    (runResponse) => {
      const runGen = ++generationRef.current;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setIsBusy(true);
      setResult(null);
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

  return {
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
    toggleSound,
    generationRef
  };
}

export default useGamePlayback;
