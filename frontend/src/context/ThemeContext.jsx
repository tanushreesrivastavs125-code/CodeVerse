import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext(null);

const STORAGE_KEYS = {
  THEME: 'codeverse_theme',
  SOUND: 'codeverse_sound',
  MOTION: 'codeverse_motion',
  BG_ANIM: 'codeverse_bganim'
};

function getStorageItem(key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function setStorageItem(key, value) {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage) {
      window.localStorage.setItem(key, String(value));
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Resolves the effective theme ('dark', 'light', or 'soft') based on user choice
 * and system preferences.
 */
function resolveEffectiveTheme(themeSetting) {
  if (themeSetting === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return themeSetting || 'dark';
}

/**
 * Resolves effective reduced motion preference based on setting and system media query.
 */
function resolveReducedMotion(motionSetting) {
  if (motionSetting === 'reduced') return true;
  if (motionSetting === 'full') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

export function ThemeProvider({ children }) {
  // Theme setting: 'dark' | 'light' | 'soft' | 'system'
  const [theme, setThemeState] = useState(() => {
    return getStorageItem(STORAGE_KEYS.THEME) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => resolveEffectiveTheme(theme));

  // Sound preference: boolean
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    return getStorageItem(STORAGE_KEYS.SOUND) === 'true';
  });

  // Motion setting: 'system' | 'reduced' | 'full'
  const [motionSetting, setMotionSettingState] = useState(() => {
    return getStorageItem(STORAGE_KEYS.MOTION) || 'system';
  });

  const [isReducedMotion, setIsReducedMotion] = useState(() => resolveReducedMotion(motionSetting));

  // Background ambient animation preference: boolean
  const [backgroundAnimation, setBackgroundAnimationState] = useState(() => {
    const stored = getStorageItem(STORAGE_KEYS.BG_ANIM);
    return stored !== null ? stored === 'true' : true;
  });

  // Apply theme to document root
  const applyThemeToDOM = useCallback((effective, setting) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', effective);
    root.setAttribute('data-theme-setting', setting);
    if (effective === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark', 'theme-soft');
    } else if (effective === 'soft') {
      root.classList.add('theme-soft');
      root.classList.remove('theme-dark', 'theme-light');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light', 'theme-soft');
    }
  }, []);

  // Update theme setting
  const setTheme = useCallback((newTheme) => {
    const valid = ['dark', 'light', 'soft', 'system'].includes(newTheme) ? newTheme : 'system';
    setThemeState(valid);
    setStorageItem(STORAGE_KEYS.THEME, valid);
    const resolved = resolveEffectiveTheme(valid);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved, valid);
  }, [applyThemeToDOM]);

  // Update sound preference
  const setSoundEnabled = useCallback((enabled) => {
    const val = Boolean(enabled);
    setSoundEnabledState(val);
    setStorageItem(STORAGE_KEYS.SOUND, String(val));
  }, []);

  // Update motion setting
  const setMotionSetting = useCallback((setting) => {
    const valid = ['system', 'reduced', 'full'].includes(setting) ? setting : 'system';
    setMotionSettingState(valid);
    setStorageItem(STORAGE_KEYS.MOTION, valid);
    const reduced = resolveReducedMotion(valid);
    setIsReducedMotion(reduced);
  }, []);

  // Update background animation preference
  const setBackgroundAnimation = useCallback((enabled) => {
    const val = Boolean(enabled);
    setBackgroundAnimationState(val);
    setStorageItem(STORAGE_KEYS.BG_ANIM, String(val));
  }, []);

  // Sync with system theme media query when in 'system' mode
  useEffect(() => {
    const resolved = resolveEffectiveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved, theme);

    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const updated = mediaQuery.matches ? 'dark' : 'light';
      setResolvedTheme(updated);
      applyThemeToDOM(updated, 'system');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme, applyThemeToDOM]);

  // Sync with system reduced-motion media query
  useEffect(() => {
    const reduced = resolveReducedMotion(motionSetting);
    setIsReducedMotion(reduced);

    if (motionSetting !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setIsReducedMotion(mediaQuery.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [motionSetting]);

  const value = {
    theme,
    resolvedTheme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    motionSetting,
    isReducedMotion,
    setMotionSetting,
    backgroundAnimation,
    setBackgroundAnimation
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return safe default fallback if rendered outside provider
    return {
      theme: 'system',
      resolvedTheme: 'dark',
      setTheme: () => {},
      soundEnabled: false,
      setSoundEnabled: () => {},
      motionSetting: 'system',
      isReducedMotion: false,
      setMotionSetting: () => {},
      backgroundAnimation: true,
      setBackgroundAnimation: () => {}
    };
  }
  return context;
}
