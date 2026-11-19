import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Blockly from 'blockly';
import {
  registerCodeVerseBlocks,
  getBlocklyTheme,
  getToolboxForLevel
} from './blocklyConfig.js';
import {
  compileWorkspaceToAST,
  generateCode,
  SUPPORTED_LANGUAGES,
  LANGUAGE_METADATA
} from './astCompiler.js';
import { DownloadModal } from './DownloadModal.jsx';
import { useTheme } from '../../../context/ThemeContext.jsx';

/**
 * BlocklyEditor Component integrates the visual drag-and-drop programming workspace,
 * live compilation to canonical CodeVerse AST, and a connected Multi-Language Code Preview
 * supporting Plain-English, JavaScript, Python, Java, C++, and C with execution line highlighting,
 * copy, download, and syntax explanations.
 */
export function BlocklyEditor({
  onProgramChange,
  isBusy = false,
  highlightedBlockId = null,
  highlightedNodeId = null,
  activeFrame = null,
  submittedProgram = null,
  initialXml = null,
  isVisible = true,
  level = null
}) {
  const editorRef = useRef(null);
  const workspaceRef = useRef(null);
  const { resolvedTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'code'
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      return localStorage.getItem('codeverse_preferred_language') || 'python';
    } catch {
      return 'python';
    }
  });
  const [currentAst, setCurrentAst] = useState([]);
  const [compilationError, setCompilationError] = useState(null);
  const [disconnectedWarning, setDisconnectedWarning] = useState(null);
  const [showAllBlocks, setShowAllBlocks] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

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

  // Dynamic toolbox update when level or showAllBlocks toggle changes
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

  // Initialize Blockly workspace
  useEffect(() => {
    registerCodeVerseBlocks();

    if (!editorRef.current) return;

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
    if (typeof window !== 'undefined') {
      window.__blocklyWorkspace = ws;
      window.Blockly = Blockly;
    }

    // Load initial blocks if provided
    if (initialXmlRef.current) {
      try {
        const dom = Blockly.utils.xml.textToDom(initialXmlRef.current);
        Blockly.Xml.domToWorkspace(dom, ws);
      } catch {
        // Ignore XML restoration error on first launch
      }
    }

    const handleWorkspaceChange = (event) => {
      // Synchronize routine name changes across matching call blocks
      if (
        event &&
        event.type === Blockly.Events.BLOCK_CHANGE &&
        event.name === 'NAME' &&
        event.oldValue &&
        event.newValue &&
        event.oldValue !== event.newValue
      ) {
        const changedBlock = ws.getBlockById(event.blockId);
        if (
          changedBlock &&
          (changedBlock.type === 'cv_fn_def' || changedBlock.type === 'cv_fn_def_param')
        ) {
          const allBlocks = ws.getAllBlocks(false);
          for (const b of allBlocks) {
            if (
              (b.type === 'cv_fn_call' || b.type === 'cv_fn_call_param') &&
              b.getFieldValue('NAME') === event.oldValue
            ) {
              b.setFieldValue(event.newValue, 'NAME');
            }
          }
        }
      }

      if (ws.isDragging()) return;

      try {
        const ast = compileWorkspaceToAST(ws);
        setCurrentAst(ast);
        setCompilationError(null);

        // Check for disconnected blocks (excluding top-level routine definitions)
        const topBlocks = ws.getTopBlocks(false);
        const statementStacks = topBlocks.filter(
          (b) => !b.outputConnection && b.type !== 'cv_fn_def' && b.type !== 'cv_fn_def_param'
        );
        const looseSensors = topBlocks.filter((b) => b.outputConnection && !b.getParent());

        let nextWarning = null;
        if (statementStacks.length > 1) {
          nextWarning = 'Multiple separate block stacks detected. Only the primary stack runs in sequence; connect loose blocks together.';
        } else if (looseSensors.length > 0) {
          nextWarning = 'Unattached sensor block detected. Snap it into the condition slot of an If block.';
        }

        setDisconnectedWarning((prev) => (prev === nextWarning ? prev : nextWarning));

        if (typeof onProgramChangeRef.current === 'function') {
          const gen = generateCode(ast, 'javascript');
          onProgramChangeRef.current(ast, gen.code);
        }
      } catch (err) {
        setCompilationError(err.message);
        setCurrentAst([]);
        if (typeof onProgramChangeRef.current === 'function') {
          onProgramChangeRef.current([], '');
        }
      }
    };

    ws.addChangeListener(handleWorkspaceChange);

    // Initial compile pass
    handleWorkspaceChange();

    // Resize observer
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

  // Update highlighted block in Blockly workspace during playback
  useEffect(() => {
    if (!workspaceRef.current) return;
    if (highlightedBlockId) {
      workspaceRef.current.highlightBlock(highlightedBlockId);
    } else {
      workspaceRef.current.highlightBlock(null);
    }
  }, [highlightedBlockId]);

  // Language selection with persistence
  const handleLanguageChange = useCallback((newLang) => {
    setSelectedLanguage(newLang);
    try {
      localStorage.setItem('codeverse_preferred_language', newLang);
    } catch {
      // safe fallback
    }
  }, []);

  // Tab switch
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
    setCurrentAst([]);
    setCompilationError(null);
    if (typeof onProgramChange === 'function') {
      onProgramChange([], '');
    }
  }, [isBusy, onProgramChange]);

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      const activeAst = isBusy && submittedProgram && submittedProgram.length > 0 ? submittedProgram : currentAst;
      const gen = generateCode(activeAst, selectedLanguage);
      await navigator.clipboard.writeText(gen.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API fails
    }
  }, [isBusy, submittedProgram, currentAst, selectedLanguage]);

  // Determine active AST to generate: snapshot of submitted program during playback, or live workspace
  const displayAst = useMemo(() => {
    if (isBusy && submittedProgram && submittedProgram.length > 0) {
      return submittedProgram;
    }
    return currentAst;
  }, [isBusy, submittedProgram, currentAst]);

  // Deterministically generate code and AST line mappings
  const generated = useMemo(() => {
    try {
      return generateCode(displayAst, selectedLanguage);
    } catch (err) {
      return {
        language: selectedLanguage,
        code: `// Generation Error: ${err.message}`,
        lines: [`// Generation Error: ${err.message}`],
        nodeLineMap: {},
        explanations: []
      };
    }
  }, [displayAst, selectedLanguage]);

  // Calculate active highlighted line number in generated code
  const activeLine = useMemo(() => {
    if (!highlightedNodeId && !highlightedBlockId) return null;
    const map = generated.nodeLineMap;
    let target = null;
    if (highlightedNodeId && map[highlightedNodeId]) {
      target = map[highlightedNodeId];
    } else if (highlightedBlockId) {
      target = Object.values(map).find((n) => n.blockId === highlightedBlockId);
    }
    if (!target) return null;
    if (activeFrame?.event === 'condition' && target.conditionLine) {
      return target.conditionLine;
    }
    return target.startLine;
  }, [highlightedNodeId, highlightedBlockId, generated, activeFrame]);

  const activeMeta = LANGUAGE_METADATA[selectedLanguage] || LANGUAGE_METADATA.python;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Editor Header & Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {/* Left: Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => handleTabChange('blocks')}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-sm, 6px)',
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
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid',
              borderColor: activeTab === 'code' ? 'var(--accent-cyan)' : 'transparent',
              backgroundColor: activeTab === 'code' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'code' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>💻 Your Code</span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                color: 'var(--text-muted)'
              }}
            >
              Read-Only
            </span>
          </button>
        </div>

        {/* Right: Actions & Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {activeTab === 'code' ? (
            <>
              {/* Language Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <label
                  htmlFor="language-select"
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500
                  }}
                >
                  Language:
                </label>
                <select
                  id="language-select"
                  aria-label="Select Code Language"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((langKey) => (
                    <option key={langKey} value={langKey}>
                      {LANGUAGE_METADATA[langKey]?.label || langKey}
                    </option>
                  ))}
                </select>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy code to clipboard"
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: copied ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                  color: copied ? 'var(--accent-green, #22c55e)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>{copied ? '✓' : '📋'}</span>
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              {/* Download Button */}
              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(true)}
                title="Download snippet or standalone simulation"
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid var(--accent-cyan)',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>💾</span>
                <span>Download</span>
              </button>
            </>
          ) : (
            <>
              {/* Show All Blocks Toggle */}
              <button
                type="button"
                onClick={() => setShowAllBlocks((prev) => !prev)}
                title={
                  showAllBlocks
                    ? 'Showing all available blocks. Click to show only staged blocks for this lesson.'
                    : 'Showing staged blocks for this lesson. Click to reveal all blocks.'
                }
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm, 6px)',
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

              {/* Clear Workspace Button */}
              <button
                type="button"
                onClick={handleClearWorkspace}
                disabled={isBusy}
                title="Clear all blocks"
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm, 6px)',
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
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Mount Target / Code View */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          backgroundColor: 'var(--board-bg)'
        }}
      >
        {/* Blockly Drag-and-Drop Container */}
        <div
          ref={editorRef}
          style={{
            width: '100%',
            height: '100%',
            display: activeTab === 'blocks' ? 'block' : 'none'
          }}
        />

        {/* Multi-Language Code View Container */}
        {activeTab === 'code' && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              backgroundColor: 'var(--bg-input)'
            }}
          >
            {/* Code Header Information Strip */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  {activeMeta.label}
                </span>
                <span>•</span>
                <span>{activeMeta.verifiedRunnable ? '✅ Verified Local Runtime' : '⚠️ Compiler Required'}</span>
              </div>
              {isBusy && submittedProgram && (
                <div style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>▶</span>
                  <span>Executing submitted program snapshot</span>
                </div>
              )}
            </div>

            {/* Condition Evaluation Live Status Banner */}
            {activeFrame?.event === 'condition' && activeFrame.condition && (
              <div
                role="status"
                data-testid="condition-feedback-banner"
                style={{
                  padding: '0.45rem 1rem',
                  backgroundColor: activeFrame.condition.outcome
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'rgba(234, 179, 8, 0.12)',
                  borderBottom: `1px solid ${
                    activeFrame.condition.outcome
                      ? 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(234, 179, 8, 0.3)'
                  }`,
                  color: activeFrame.condition.outcome
                    ? 'var(--accent-green, #22c55e)'
                    : 'var(--accent-gold, #eab308)',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{activeFrame.condition.outcome ? '✓' : 'ℹ'}</span>
                <span>{activeFrame.condition.explanation}</span>
              </div>
            )}

            {/* Line-Numbered Code Area */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '0.75rem 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                lineHeight: 1.55
              }}
            >
              {generated.lines.map((line, lineIdx) => {
                const isLineActive = activeLine === lineIdx + 1;
                return (
                  <div
                    key={lineIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 0.75rem',
                      minHeight: '1.45rem',
                      backgroundColor: isLineActive
                        ? 'rgba(56, 189, 248, 0.18)'
                        : 'transparent',
                      borderLeft: isLineActive
                        ? '3px solid var(--accent-cyan)'
                        : '3px solid transparent'
                    }}
                  >
                    {/* Line Number Gutter */}
                    <span
                      style={{
                        width: '2.5rem',
                        userSelect: 'none',
                        color: isLineActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        opacity: isLineActive ? 1 : 0.45,
                        textAlign: 'right',
                        paddingRight: '1rem',
                        fontSize: '0.76rem',
                        fontWeight: isLineActive ? 700 : 400
                      }}
                    >
                      {lineIdx + 1}
                    </span>

                    {/* Code Content */}
                    <span
                      style={{
                        color: isLineActive ? 'var(--text-primary)' : 'var(--text-primary)',
                        fontWeight: isLineActive ? 600 : 400,
                        whiteSpace: 'pre'
                      }}
                    >
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Syntax Explanations Callout */}
            {generated.explanations && generated.explanations.length > 0 && (
              <div
                style={{
                  margin: '0.5rem 0.75rem 0.75rem 0.75rem',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)'
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span>💡</span>
                  <span>Syntax & Helper Guide</span>
                </div>
                {generated.explanations.map((exp) => (
                  <div key={exp.id} style={{ marginTop: '0.2rem', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{exp.title}:</strong> {exp.text}
                  </div>
                ))}
              </div>
            )}
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

      {/* Honest Download Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        ast={displayAst}
        language={selectedLanguage}
        level={level}
      />
    </div>
  );
}

export default BlocklyEditor;
