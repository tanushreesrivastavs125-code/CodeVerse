import { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly';
import {
  registerCodeVerseBlocks,
  codeVerseTheme,
  gameToolbox
} from './blocklyConfig.js';
import {
  compileWorkspaceToAST,
  programToPreviewCode
} from './astCompiler.js';

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
  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'code'
  const [previewCode, setPreviewCode] = useState('');
  const [compilationError, setCompilationError] = useState(null);

  const onProgramChangeRef = useRef(onProgramChange);
  const initialXmlRef = useRef(initialXml);

  useEffect(() => {
    onProgramChangeRef.current = onProgramChange;
  });

  // Initialize workspace
  useEffect(() => {
    registerCodeVerseBlocks();

    if (!editorRef.current) return;

    // Dispose old workspace if exists
    if (workspaceRef.current) {
      workspaceRef.current.dispose();
      workspaceRef.current = null;
    }

    const ws = Blockly.inject(editorRef.current, {
      toolbox: gameToolbox,
      theme: codeVerseTheme,
      renderer: 'geras',
      grid: {
        spacing: 20,
        length: 2,
        colour: '#1f2937',
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
        backgroundColor: '#0c1824',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Editor Header & Mode Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: '#08121c',
          borderBottom: '1px solid rgba(75, 85, 99, 0.3)'
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
              backgroundColor: activeTab === 'blocks' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
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
              backgroundColor: activeTab === 'code' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
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
            color: '#f87171',
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
          backgroundColor: '#0b0f19'
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
              padding: '1rem',
              overflow: 'auto',
              boxSizing: 'border-box',
              backgroundColor: '#070f18'
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
                color: '#38bdf8',
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
