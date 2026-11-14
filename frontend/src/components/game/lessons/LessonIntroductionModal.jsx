import { useEffect, useState } from 'react';
import { getLevelCurriculum, VISUAL_LEGEND } from '../../../../../shared/curriculum.js';
import { InteractiveDemoSandbox } from './InteractiveDemoSandbox.jsx';

/**
 * LessonIntroductionModal displays structured pre-flight lessons,
 * progressive block explanations, visual legends, common mistakes,
 * and an isolated interactive sandbox before running code.
 */
export function LessonIntroductionModal({
  isOpen = false,
  onClose,
  level
}) {
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !level) return null;

  const curriculum = getLevelCurriculum(level.id);
  const legendItems = curriculum.visualLegend && curriculum.visualLegend.length > 0
    ? curriculum.visualLegend
    : Object.values(VISUAL_LEGEND);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-modal-title"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700
                }}
              >
                LEVEL {level.id} // {level.zone || 'DISTRICT'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  color: 'var(--accent-cyan)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {curriculum.newConcept}
              </span>
            </div>

            <h2
              id="lesson-modal-title"
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '0.25rem',
                marginBottom: 0
              }}
            >
              📖 Lesson: {level.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close lesson"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Plain-English Objective & What You'll Learn */}
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            borderLeft: '4px solid var(--accent-cyan)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            What You'll Learn
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {curriculum.learningObjective}
          </div>
        </div>

        {/* Concept Explanation (No Jargon) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Core Concept: {curriculum.newConcept}
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {curriculum.conceptExplanation}
          </p>
        </div>

        {/* Interactive Worked Demonstration Sandbox */}
        {curriculum.workedExample && (
          <InteractiveDemoSandbox workedExample={curriculum.workedExample} />
        )}

        {/* Newly Introduced Blocks */}
        {curriculum.introducedBlocks && curriculum.introducedBlocks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              New Blocks Introduced in this Lesson
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
              {curriculum.introducedBlocks.map((blk) => (
                <div
                  key={blk.type}
                  style={{
                    padding: '0.75rem 0.9rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      {blk.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {blk.syntax}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {blk.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Tip: {blk.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Mistake & Correction */}
        {curriculum.commonMistake && (
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
              <span>⚠️</span>
              <span>Common Beginner Mistake</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              <strong>Pitfall:</strong> {curriculum.commonMistake.mistake}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', lineHeight: 1.4 }}>
              <strong>How to fix:</strong> {curriculum.commonMistake.correction}
            </div>
          </div>
        )}

        {/* Collapsible Visual Map Legend */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setShowLegend((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: 0
            }}
          >
            <span>{showLegend ? '▾ Hide Visual Map Legend' : '▸ View Visual Map Legend'}</span>
          </button>

          {showLegend && (
            <div
              style={{
                marginTop: '0.6rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {legendItems.map((item) => (
                <div key={item.name} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{item.symbol}</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.4rem',
              minHeight: '38px',
              backgroundColor: 'var(--accent-cyan)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Got it, let's code! →
          </button>
        </div>
      </div>
    </div>
  );
}

export default LessonIntroductionModal;
