import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';

const CHARS = '01CODEVERSEλπ<>{}[]/*+-=~!#$_;';

/**
 * CodeFlow renders a subtle, restrained falling matrix stream in the background.
 * Respects user preferences (reduced motion, animation toggle) and halts rendering in light theme.
 */
export function CodeFlow() {
  const canvasRef = useRef(null);
  const { isReducedMotion, backgroundAnimation, resolvedTheme } = useTheme();

  useEffect(() => {
    // Disable completely if motion is reduced, background animations disabled, or in light theme
    if (isReducedMotion || !backgroundAnimation || resolvedTheme === 'light') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = null;
    let isHidden = false;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return;
    }

    const fontSize = 14;
    let columns = 0;
    let drops = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
    };

    resize();
    window.addEventListener('resize', resize);

    const handleVisibilityChange = () => {
      isHidden = document.hidden;
      if (!isHidden && !animationFrameId) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();
    const frameInterval = 65; // ~15 FPS to stay lightweight and restrained

    const render = (time) => {
      if (isHidden) {
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(render);

      if (time - lastTime < frameInterval) return;
      lastTime = time;

      ctx.fillStyle = 'rgba(5, 10, 15, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Subtle teal/cyan code glyph
        ctx.fillStyle = Math.random() > 0.85 ? '#42e3c6' : 'rgba(66, 227, 198, 0.45)';
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    const handleMotionChange = (e) => {
      if (e.matches) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [isReducedMotion, backgroundAnimation, resolvedTheme]);

  if (isReducedMotion || !backgroundAnimation || resolvedTheme === 'light') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="code-flow"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        opacity: 0.18
      }}
    />
  );
}

export default CodeFlow;

