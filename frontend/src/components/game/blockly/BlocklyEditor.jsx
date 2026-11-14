import { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import {
  registerCodeVerseBlocks,
  getBlocklyTheme,
  getToolboxForLevel
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
  initialXml = null,
  isVisible = true,
  level = null
}) {
  const editorRef = useRef(null);
  const workspaceRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'code'
  const [previewCode, setPreviewCode] = useState('');
  const [compilationError, setCompilationError] = useState(null);
  const [disconnectedWarning, setDisconnectedWarning] = useState(null);
  const [showAllBlocks, setShowAllBlocks] = useState(false);

  const onProgramChangeRef = useRef(onProgramChange);
  const initialXmlRef = useRef(initialXml);
  const resolvedThemeRef = useRef(resolvedTheme);
  const levelRef = useRef(level);
  const showAllBlocksRef = useRef(showAllBlocks);
  const prevLevelIdRef = useRef(level?.id);
  const prevShowAllRef = useRef(showAllBlocks);

  useEffect(() => {
    onProgramChangeRef.current = onProgramChange;
    resolvedThemeRef.current = resolvedTheme;
    levelRef.current = level;
    showAllBlocksRef.current = showAllBlocks;
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

  // Dynamic toolbox update when level or showAllBlocks toggle changes (only after initial mount)
  const levelId = level?.id;
  useEffect(() => {
    if (prevLevelIdRef.current === levelId && prevShowAllRef.current === showAllBlocks) {
      return;
    }
    prevLevelIdRef.current = levelId;
    prevShowAllRef.current = showAllBlocks;

    if (workspaceRef.current) {
      try {
        const nextToolbox = getToolboxForLevel(levelId ? { id: levelId } : null, showAllBlocks);
        workspaceRef.current.updateToolbox(nextToolbox);
      } catch {
        // Fallback safely
      }
    }
  }, [levelId, showAllBlocks]);

  // Handle visibility changes (e.g. mobile tab switch to 'code')
  useEffect(() => {
    if (isVisible && workspaceRef.current) {
      const timer = setTimeout(() => {
        Blockly.svgResize(workspaceRef.current);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Window resize listener
  useEffect(() => {
    function handleWindowResize() {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current);
      }
    }
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

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
    const initialToolbox = getToolboxForLevel(levelRef.current, showAllBlocksRef.current);

    const ws = Blockly.inject(editorRef.current, {
      toolbox: initialToolbox,
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
        setPreviewCode((prev) => (prev === code ? prev : code));
        setCompilationError((prev) => (prev === null ? prev : null));

        // Check for disconnected blocks
        const topBlocks = ws.getTopBlocks(false);
        const statementStacks = topBlocks.filter((b) => !b.outputConnection);
        const looseSensors = topBlocks.filter((b) => b.outputConnection && !b.getParent());

        let nextWarning = null;
        if (statementStacks.length > 1) {
          nextWarning = 'Multiple separate block stacks detected. Only the primary stack runs in sequence; connect loose blocks together.';
        } else if (looseSensors.length > 0) {
          nextWarning = 'Unattached sensor block detected. Snap it into the condition slot of an If block.';
        }

        setDisconnectedWarning((prev) => (prev === nextWarning ? prev : nextWarning));

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowAllBlocks((prev) => !prev)}
            title={showAllBlocks ? 'Showing all available blocks. Click to show only staged blocks for this lesson.' : 'Showing staged blocks for this lesson. Click to reveal all blocks.'}
            style={{
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: showAllBlocks ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              backgroundColor: showAllBlocks ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: showAllBlocks ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {showAllBlocks ? '📦 All Blocks Active' : '📦 Show All Blocks'}
          </button>

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

      {/* Disconnected Stack Notice Banner */}
      {disconnectedWarning && (
        <div
          role="status"
          style={{
            padding: '0.55rem 1rem',
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            borderTop: '1px solid rgba(234, 179, 8, 0.3)',
            color: 'var(--accent-gold)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>⚠️</span>
          <span>{disconnectedWarning}</span>
        </div>
      )}

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
