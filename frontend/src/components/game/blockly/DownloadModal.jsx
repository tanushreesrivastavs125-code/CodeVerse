import { useEffect, useRef } from 'react';
import {
  LANGUAGE_METADATA,
  generateSnippetExport,
  generateRunnableExport,
  buildExportReadme
} from './astCompiler.js';

/**
 * DownloadModal provides honest exports of student programs:
 * - Direct learning snippet using CodeVerse helper APIs
 * - Complete runnable terminal simulation reproducing mission logic
 * - README documentation with exact compiler requirements
 */
export function DownloadModal({
  isOpen,
  onClose,
  ast,
  language = 'python',
  level = null
}) {
  const modalRef = useRef(null);
  const meta = LANGUAGE_METADATA[language] || LANGUAGE_METADATA.python;

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const triggerDownload = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSnippet = () => {
    const snippet = generateSnippetExport(ast, language);
    triggerDownload(snippet.filename, snippet.content, snippet.mimeType);
  };

  const handleDownloadRunnable = () => {
    const runnable = generateRunnableExport(ast, language, level);
    triggerDownload(runnable.filename, runnable.content, runnable.mimeType);
  };

  const handleDownloadReadme = () => {
    const readmeContent = buildExportReadme(level);
    triggerDownload('README.md', readmeContent, 'text/markdown');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.5))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💾</span>
            <h2
              id="download-modal-title"
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              Export Code ({meta.label})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export dialog"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status & Toolchain Callout */}
          <div
            style={{
              padding: '0.8rem 1rem',
              borderRadius: 'var(--radius-md, 8px)',
              backgroundColor: meta.isExecutable ? 'rgba(56, 189, 248, 0.08)' : 'rgba(234, 179, 8, 0.1)',
              border: `1px solid ${meta.isExecutable ? 'rgba(56, 189, 248, 0.25)' : 'rgba(234, 179, 8, 0.3)'}`,
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontWeight: 700, color: meta.isExecutable ? 'var(--accent-cyan)' : 'var(--accent-gold)' }}>
                {meta.isExecutable ? '⚙️ Toolchain & Execution' : '📖 Algorithm Walkthrough'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {meta.verificationStatus}
              </span>
            </div>
            <div>
              <strong>Requirements:</strong> {meta.runtimeRequirement}
            </div>
            {meta.isExecutable && (
              <div style={{ marginTop: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--accent-cyan)' }}>
                <strong>Run Command:</strong> {meta.runCommand}
              </div>
            )}
          </div>

          {/* Download Action Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* 1. Algorithm Snippet / Outline */}
            <button
              type="button"
              onClick={handleDownloadSnippet}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📄 {meta.isExecutable ? `Download Snippet (codeverse_program.${meta.extension})` : 'Download Plain-English Steps (mission_steps.txt)'}</span>
                  {meta.isExecutable && (
                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent-gold)' }}>
                      Requires CodeVerse Helpers
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {meta.isExecutable
                    ? 'Algorithmic solution snippet for study. Requires CodeVerse drone helper APIs (not standalone without simulator).'
                    : 'Human-readable step-by-step description of your program logic.'}
                </div>
              </div>
              <span style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>⬇️</span>
            </button>

            {/* 2. Complete Runnable Console Simulation (Only for executable programming languages) */}
            {meta.isExecutable && (
              <button
                type="button"
                onClick={handleDownloadRunnable}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--accent-cyan)',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🚀 Download Runnable Project ({language === 'java' ? 'DroneMission.java' : `drone_mission.${meta.extension}`})</span>
                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green, #22c55e)' }}>
                      Complete Project
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Self-contained console script with embedded grid simulator and terminal reporting. Runs independently with {meta.label}.
                  </div>
                </div>
                <span style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>⬇️</span>
              </button>
            )}

            {/* 3. README & Build Guide */}
            <button
              type="button"
              onClick={handleDownloadReadme}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                  📖 Download README & Build Guide (README.md)
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Full documentation covering snippets vs standalone projects, compiler flags, and platform-specific execution.
                </div>
              </div>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>⬇️</span>
            </button>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Local executions are completely independent and do not change cloud campaign stars.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;
