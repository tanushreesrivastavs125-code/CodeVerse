import { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import {
  registerCodeVerseBlocks,
  getBlocklyTheme,
  gameToolbox
} from './blocklyConfig.js';
import {
  compileWorkspaceToAST,
  programToPreviewCode
} from './astCompiler.js';
import { useTheme } from '../../../context/ThemeContext.jsx';

/**
 * BlocklyEditor Component integrates the visual drag-and-drop programming workspace,
 * handles live compilation to AST, preserves code across tabs, and provides a formatted
 * Program Preview tab.
 */
export function BlocklyEditor({
  onProgramChange,
  isBusy = false,
  highlightedBlockId = null,
  initialXml = null
}) {
  const editorRef = useRef(null);
  const workspaceRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'code'
  const [previewCode, setPreviewCode] = useState('');
  const [compilationError, setCompilationError] = useState(null);

  const onProgramChangeRef = useRef(onProgramChange);
  const initialXmlRef = useRef(initialXml);
  const resolvedThemeRef = useRef(resolvedTheme);

  useEffect(() => {
    onProgramChangeRef.current = onProgramChange;
    resolvedThemeRef.current = resolvedTheme;
  });

  // Dynamic theme update for active Blockly workspace
  useEffect(() => {
    if (workspaceRef.current) {
      try {
        const themeObj = getBlocklyTheme(resolvedTheme);
        workspaceRef.current.setTheme(themeObj);
      } catch {
        // Fallback safely if theme set fails
      }
    }
  }, [resolvedTheme]);

  // Initialize workspace
  useEffect(() => {
    registerCodeVerseBlocks();

    if (!editorRef.current) return;

    // Dispose old workspace if exists
    if (workspaceRef.current) {
      workspaceRef.current.dispose();
      workspaceRef.current = null;
    }

    const currentTheme = getBlocklyTheme(resolvedThemeRef.current);

    const ws = Blockly.inject(editorRef.current, {
      toolbox: gameToolbox,
      theme: currentTheme,
      renderer: 'geras',
      grid: {
        spacing: 20,
        length: 2,
        colour: resolvedThemeRef.current === 'light' ? '#e2e8f0' : '#1f2937',
        snap: true
      },
      trashcan: true,
      scrollbars: true,
      sounds: false,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 1.6,
        minScale: 0.5,
        scaleSpeed: 1.1
      }
    });

    workspaceRef.current = ws;

    // Load initial blocks if provided
    if (initialXmlRef.current) {
      try {
        const dom = Blockly.utils.xml.textToDom(initialXmlRef.current);
        Blockly.Xml.domToWorkspace(dom, ws);
      } catch {
        // Ignore XML restoration error on first launch
      }
    }

    const handleWorkspaceChange = () => {
      if (ws.isDragging()) return;

      try {
        const ast = compileWorkspaceToAST(ws);
        const code = programToPreviewCode(ast);
        setPreviewCode(code);
        setCompilationError(null);
        if (typeof onProgramChangeRef.current === 'function') {
          onProgramChangeRef.current(ast, code);
        }
      } catch (err) {
        setCompilationError(err.message);
        if (typeof onProgramChangeRef.current === 'function') {
          onProgramChangeRef.current([], '');
        }
      }
    };

    ws.addChangeListener(handleWorkspaceChange);

    // Initial compile pass
    handleWorkspaceChange();

    // Resize observer to ensure Blockly resizes smoothly
    const resizeObserver = new ResizeObserver(() => {
      Blockly.svgResize(ws);
    });
    resizeObserver.observe(editorRef.current);

    return () => {
      resizeObserver.disconnect();
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, []);

  // Update highlighted block during execution playback
  useEffect(() => {
    if (!workspaceRef.current) return;
    if (highlightedBlockId) {
      workspaceRef.current.highlightBlock(highlightedBlockId);
    } else {
      workspaceRef.current.highlightBlock(null);
    }
  }, [highlightedBlockId]);

  // Handle Tab Switch
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'blocks' && workspaceRef.current) {
      setTimeout(() => {
        Blockly.svgResize(workspaceRef.current);
      }, 50);
    }
  }, []);

  // Clear workspace
  const handleClearWorkspace = useCallback(() => {
    if (isBusy || !workspaceRef.current) return;
    workspaceRef.current.clear();
    setPreviewCode('');
    setCompilationError(null);
    if (typeof onProgramChange === 'function') {
      onProgramChange([], '');
    }
  }, [isBusy, onProgramChange]);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Editor Header & Mode Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.65rem 1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => handleTabChange('blocks')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: activeTab === 'blocks' ? 'var(--accent-cyan)' : 'transparent',
              backgroundColor: activeTab === 'blocks' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'blocks' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🧩 Blocks
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('code')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: activeTab === 'code' ? 'var(--accent-cyan)' : 'transparent',
              backgroundColor: activeTab === 'code' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'code' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            💻 Program Preview
          </button>
        </div>

        <button
          type="button"
          onClick={handleClearWorkspace}
          disabled={isBusy}
          title="Clear all blocks"
          style={{
            padding: '0.3rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backgroundColor: 'transparent',
            color: 'var(--accent-red)',
            fontSize: '0.75rem',
            cursor: isBusy ? 'not-allowed' : 'pointer',
            opacity: isBusy ? 0.5 : 1
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {/* Main Workspace Mount Target */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          backgroundColor: 'var(--board-bg)'
        }}
      >
        <div
          ref={editorRef}
          style={{
            width: '100%',
            height: '100%',
            display: activeTab === 'blocks' ? 'block' : 'none'
          }}
        />

        {activeTab === 'code' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '1.25rem',
              overflow: 'auto',
              boxSizing: 'border-box',
              backgroundColor: 'var(--bg-input)'
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              // CODEVERSE COMMAND PROGRAM PREVIEW (SYNTHESIZED FROM BLOCKLY AST)
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6
              }}
            >
              <code>{previewCode || '# Empty program.\n# Connect action blocks in the Blocks tab.'}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Compilation Notice or Helper Banner */}
      {compilationError && (
        <div
          style={{
            padding: '0.6rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderTop: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>⚠</span>
          <span>{compilationError}</span>
        </div>
      )}
    </div>
  );
}

export default BlocklyEditor;
