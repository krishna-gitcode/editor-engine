import React, { useState, useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '../../store/canvasStore';
import { OpenRouterService } from '../../services/OpenRouterService';
import { parseMarkdownToTipTap, getActiveEditorFormat, applyEditorFormatToNodes } from '../../services/markdownToHtml';
import {
  Bold, Italic, Underline, Trash2, Copy, Layers, Sparkles, Wand2,
  Loader2, Check, X as XIcon, SpellCheck, Pencil, Settings,
  AlignLeft, Briefcase, MessageCircle, CheckCircle, Maximize2,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useAIStore } from '../../store/aiStore';
import './FloatingMenu.css';

interface FloatingMenuProps {
  editor: any;
  engine: any;
  onOpenModal?: (type: 'mathjax' | 'abcjs' | 'openrouter') => void;
}


const DEFAULT_MODEL = import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'openrouter/free';

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ editor: defaultEditor, engine, onOpenModal }) => {
  const selectedObject = useCanvasStore((s) => s.selectedObjectProps);
  const openRouterApiKey = (useEditorStore((s) => s.openRouterApiKey) || import.meta.env.VITE_OPENROUTER_API_KEY || '') as string;

  // Global AI state from aiStore (also used by quick-action buttons)
  const { isAIPanelOpen, aiPanelMode, setAIPanelOpen, setAIPanelMode, apiKey: storeApiKey, selectedModel: storeModel } = useAIStore();
  const effectiveApiKey = openRouterApiKey || storeApiKey;
  const effectiveModel = storeModel || DEFAULT_MODEL;

  // Quick-action processing state (for the merged AIBubbleToolbar actions)
  const [quickActionProcessing, setQuickActionProcessing] = useState<string | null>(null);

  const [editor, setActiveEditor] = useState<any>(defaultEditor || (window as any).__activeEditor);

  useEffect(() => {
    const handleActiveEditorChanged = () => {
      setActiveEditor((window as any).__activeEditor || defaultEditor);
    };
    window.addEventListener('activeEditorChanged', handleActiveEditorChanged);
    return () => window.removeEventListener('activeEditorChanged', handleActiveEditorChanged);
  }, [defaultEditor]);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiStatusMsg, setAiStatusMsg] = useState('');

  // Canvas object enhance state
  const [showCanvasEnhance, setShowCanvasEnhance] = useState(false);
  const [canvasEnhancePrompt, setCanvasEnhancePrompt] = useState('');
  const [isCanvasEnhancing, setIsCanvasEnhancing] = useState(false);
  const [canvasEnhanceError, setCanvasEnhanceError] = useState<string | null>(null);

  const closeAiPanel = () => {
    setAIPanelOpen(false);
    setAiError(null);
    setAiPrompt('');
    setAiStatusMsg('');
  };

  /**
   * Parse markdown and insert into editor — never falls back to raw string.
   * If the parser produces nothing, wraps the text in a plain paragraph.
   */
  const insertMarkdownContent = (markdownText: string, from?: number, to?: number) => {
    if (!editor) return;
    // Capture the editor's current formatting context (font, size, lineHeight, etc.)
    const format = getActiveEditorFormat(editor);
    let nodes: object[] = parseMarkdownToTipTap(markdownText);
    if (nodes.length === 0) {
      // Wrap as plain paragraph so markdown syntax is never inserted verbatim
      nodes = [{ type: 'paragraph', content: [{ type: 'text', text: markdownText.trim() }] }];
    }
    // Apply the active editor format to every generated node
    nodes = applyEditorFormatToNodes(nodes, format);
    if (from !== undefined && to !== undefined) {
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, nodes).run();
    } else {
      editor.chain().focus().insertContent(nodes).run();
    }
    // Trigger auto-pagination immediately after large content insertions
    setTimeout(() => {
      (window as any).__repaginate?.();
    }, 200);
  };

  // ─── Generate new content at cursor position ───────────────────────────────
  const handleGenerateInline = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessing(true);
    setAiError(null);
    setAiStatusMsg('Generating with AI...');
    try {
      const result = await OpenRouterService.generateText(openRouterApiKey, DEFAULT_MODEL, aiPrompt);
      insertMarkdownContent(result);
      setAiPrompt('');
      closeAiPanel();
    } catch (err: any) {
      setAiError(err.message || 'AI generation failed.');
      setAiStatusMsg('');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Enhance selected text (REPLACE selection) ─────────────────────────────
  const handleEnhanceSelected = async () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    if (empty) {
      setAiError('Please select text to enhance first.');
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to, '\n');
    if (!selectedText.trim()) {
      setAiError('No text selected.');
      return;
    }
    setIsProcessing(true);
    setAiError(null);
    setAiStatusMsg('Enhancing selected text...');
    try {
      const enhanced = await OpenRouterService.enhanceText(openRouterApiKey, DEFAULT_MODEL, selectedText);
      insertMarkdownContent(enhanced, from, to);
      closeAiPanel();
    } catch (err: any) {
      setAiError(err.message || 'Enhancement failed.');
      setAiStatusMsg('');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Spelling & Grammar Check (REPLACE selection or full content) ───────────
  const handleGrammarCheck = async () => {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    let textToCheck = '';
    let isSelectionMode = false;

    if (!empty) {
      textToCheck = editor.state.doc.textBetween(from, to, '\n');
      isSelectionMode = true;
    } else {
      // Use full document text if nothing selected
      textToCheck = editor.state.doc.textContent;
      isSelectionMode = false;
    }

    if (!textToCheck.trim()) {
      setAiError('No text to check. Write or select some content first.');
      return;
    }

    setIsProcessing(true);
    setAiError(null);
    setAiStatusMsg(isSelectionMode ? 'Checking selected text...' : 'Checking full document...');
    try {
      const corrected = await OpenRouterService.checkSpellingGrammar(openRouterApiKey, DEFAULT_MODEL, textToCheck);

      if (isSelectionMode) {
        insertMarkdownContent(corrected, from, to);
      } else {
        const format = getActiveEditorFormat(editor);
        let nodes = parseMarkdownToTipTap(corrected);
        const content = nodes.length > 0 ? nodes : [{ type: 'paragraph', content: [{ type: 'text', text: corrected.trim() }] }];
        const formatted = applyEditorFormatToNodes(content, format);
        editor.chain().focus().setContent(formatted as any).run();
      }
      closeAiPanel();
    } catch (err: any) {
      setAiError(err.message || 'Grammar check failed.');
      setAiStatusMsg('');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Canvas object enhance ─────────────────────────────────────────────────
  const handleCanvasEnhance = async () => {
    if (!engine || !canvasEnhancePrompt.trim()) return;
    setIsCanvasEnhancing(true);
    setCanvasEnhanceError(null);
    try {
      const obj = engine.canvas?.getActiveObject();
      const currentText = obj?.text || '';
      const result = await OpenRouterService.enhanceText(
        openRouterApiKey,
        DEFAULT_MODEL,
        currentText || canvasEnhancePrompt,
        canvasEnhancePrompt
      );
      if (obj && obj.set) {
        obj.set('text', result);
        engine.canvas.renderAll();
      }
      setShowCanvasEnhance(false);
      setCanvasEnhancePrompt('');
    } catch (err: any) {
      setCanvasEnhanceError(err.message || 'Canvas enhancement failed.');
    } finally {
      setIsCanvasEnhancing(false);
    }
  };

  const toggleMode = (mode: 'generate' | 'rewrite' | 'chat' | 'canvas') => {
    if (isAIPanelOpen && aiPanelMode === mode) {
      closeAiPanel();
    } else {
      setAIPanelMode(mode);
      setAIPanelOpen(true);
      setAiError(null);
      setAiStatusMsg('');
    }
  };

  return (
    <>
      {/* TipTap Document Text Bubble Menu */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{
            duration: 100,
            maxWidth: 560,
            zIndex: 9999,        // ← fix: render above editor margins
            placement: 'top',
          }}
        >
          <div className="flex flex-col glass-menu rounded-xl overflow-hidden"
               style={{ zIndex: 9999 }}>
            {/* Formatting Row */}
            <div className="flex items-center gap-1 p-1 text-xs text-slate-200 flex-wrap">
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
                className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
                className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
                className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <input
                type="color"
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer rounded"
                title="Text Color"
              />

              {/* Divider */}
              <div className="h-4 w-px bg-slate-700 mx-1" />

              {/* AI Buttons or Configure */}
              {!openRouterApiKey ? (
                <button
                  onMouseDown={(e) => { e.preventDefault(); onOpenModal?.('openrouter'); }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-200 transition-all"
                  title="Configure AI API Key"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure AI &rarr;</span>
                </button>
              ) : (
                <>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); toggleMode('generate'); }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                      isAIPanelOpen && aiPanelMode === 'generate'
                        ? 'bg-emerald-600 text-white'
                        : 'hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-200'
                    }`}
                    title="Generate new content with AI at cursor position"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Generate</span>
                  </button>
                </>
              )}

              {/* Full Studio shortcut */}
              <button
                onMouseDown={(e) => { e.preventDefault(); onOpenModal && onOpenModal('openrouter'); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Open full AI & OCR Studio"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Studio</span>
              </button>
            </div>

            {/* ── Quick AI Actions Row (merged from AIBubbleToolbar) ── */}
            {effectiveApiKey && (
              <div className="flex items-center gap-0.5 px-1 pb-1 pt-0 border-t border-slate-700/40 flex-wrap">
                <span className="text-[9px] text-slate-500 font-medium px-1 py-0.5">AI Quick:</span>
                {([
                  { id: 'enhance', icon: Sparkles, label: 'Enhance', color: 'text-emerald-400', hover: 'hover:bg-emerald-400/10',
                    fn: (t: string) => OpenRouterService.enhanceText(effectiveApiKey, effectiveModel, t) },
                  { id: 'summarize', icon: AlignLeft, label: 'Summarize', color: 'text-sky-400', hover: 'hover:bg-sky-400/10',
                    fn: (t: string) => OpenRouterService.summarizeText(effectiveApiKey, effectiveModel, t) },
                  { id: 'formal', icon: Briefcase, label: 'Formal', color: 'text-indigo-400', hover: 'hover:bg-indigo-400/10',
                    fn: (t: string) => OpenRouterService.rewriteWithTone(effectiveApiKey, effectiveModel, t, 'formal') },
                  { id: 'casual', icon: MessageCircle, label: 'Casual', color: 'text-violet-400', hover: 'hover:bg-violet-400/10',
                    fn: (t: string) => OpenRouterService.rewriteWithTone(effectiveApiKey, effectiveModel, t, 'casual') },
                  { id: 'grammar', icon: CheckCircle, label: 'Fix Grammar', color: 'text-green-400', hover: 'hover:bg-green-400/10',
                    fn: (t: string) => OpenRouterService.checkSpellingGrammar(effectiveApiKey, effectiveModel, t) },
                  { id: 'expand', icon: Maximize2, label: 'Expand', color: 'text-orange-400', hover: 'hover:bg-orange-400/10',
                    fn: (t: string) => OpenRouterService.expandText(effectiveApiKey, effectiveModel, t) },
                ] as const).map((btn) => (
                  <button
                    key={btn.id}
                    disabled={quickActionProcessing !== null}
                    onMouseDown={async (e) => {
                      e.preventDefault();
                      if (!editor) return;
                      const { from, to, empty } = editor.state.selection;
                      if (empty) return;
                      const selectedText = editor.state.doc.textBetween(from, to, '\n');
                      setQuickActionProcessing(btn.id);
                      try {
                        const result = await (btn as any).fn(selectedText);
                        insertMarkdownContent(result, from, to);
                      } catch (err: any) {
                        // silent
                      } finally {
                        setQuickActionProcessing(null);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-medium ${
                      btn.hover
                    } disabled:opacity-40 group`}
                    title={btn.label}
                  >
                    {quickActionProcessing === btn.id
                      ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${btn.color}`} />
                      : <btn.icon className={`w-3.5 h-3.5 ${btn.color} group-hover:scale-110 transition-transform`} />}
                    <span className={btn.color}>{btn.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── AI Generate Panel ── */}
            <AnimatePresence>
              {isAIPanelOpen && aiPanelMode === 'generate' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-2 pb-2 flex flex-col gap-1.5 border-t border-slate-700/50 pt-2">
                    <p className="text-[10px] text-emerald-400 font-medium px-0.5">
                      ✨ Generate new content at cursor position
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateInline(); } }}
                        placeholder="Describe what to write and press Enter..."
                        className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 w-72"
                        autoFocus
                      />
                      <button
                        onMouseDown={(e) => { e.preventDefault(); handleGenerateInline(); }}
                        disabled={isProcessing || !aiPrompt.trim()}
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors"
                        title="Generate"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); closeAiPanel(); }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Close"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {aiStatusMsg && <p className="text-[10px] text-emerald-400 px-1 animate-pulse">{aiStatusMsg}</p>}
                    {aiError && <p className="text-[10px] text-red-400 px-1">{aiError}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Enhance Panel ── */}
            <AnimatePresence>
              {isAIPanelOpen && aiPanelMode === 'rewrite' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-2 pb-2 flex flex-col gap-1.5 border-t border-slate-700/50 pt-2">
                    <p className="text-[10px] text-violet-400 font-medium px-0.5">
                      ✏️ Enhance selected text — AI will <strong>replace</strong> the selection with improved writing
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEnhanceSelected(); } }}
                        placeholder="Optional: custom instruction (e.g. 'make it more formal')"
                        className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 w-72"
                        autoFocus
                      />
                      <button
                        onMouseDown={async (e) => {
                          e.preventDefault();
                          // If custom instruction given, override default
                          if (aiPrompt.trim()) {
                            setIsProcessing(true);
                            setAiError(null);
                            setAiStatusMsg('Enhancing...');
                            try {
                              const { from, to, empty } = editor.state.selection;
                              if (empty) { setAiError('Select text first.'); setIsProcessing(false); return; }
                              const selectedText = editor.state.doc.textBetween(from, to, '\n');
                              const enhanced = await OpenRouterService.enhanceText(openRouterApiKey, DEFAULT_MODEL, selectedText, aiPrompt);
                              insertMarkdownContent(enhanced, from, to);
                              closeAiPanel();
                            } catch (err: any) {
                              setAiError(err.message || 'Enhancement failed.');
                              setAiStatusMsg('');
                            } finally {
                              setIsProcessing(false);
                            }
                          } else {
                            handleEnhanceSelected();
                          }
                        }}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors"
                        title="Enhance Selection"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); closeAiPanel(); }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {aiStatusMsg && <p className="text-[10px] text-violet-400 px-1 animate-pulse">{aiStatusMsg}</p>}
                    {aiError && <p className="text-[10px] text-red-400 px-1">{aiError}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Spelling & Grammar Panel ── */}
            <AnimatePresence>
              {isAIPanelOpen && aiPanelMode === 'chat' && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-2 pb-2 flex flex-col gap-2 border-t border-slate-700/50 pt-2">
                    <p className="text-[10px] text-sky-400 font-medium px-0.5">
                      🔤 Spelling & Grammar — select text to check selection, or check full document
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onMouseDown={(e) => { e.preventDefault(); handleGrammarCheck(); }}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                      >
                        {isProcessing
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Checking...</span></>
                          : <><SpellCheck className="w-3.5 h-3.5" /><span>Check & Fix</span></>
                        }
                      </button>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); closeAiPanel(); }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {aiStatusMsg && <p className="text-[10px] text-sky-400 px-1 animate-pulse">{aiStatusMsg}</p>}
                    {aiError && <p className="text-[10px] text-red-400 px-1">{aiError}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BubbleMenu>
      )}

      {/* Fabric Canvas Object Floating Toolbar */}
      <AnimatePresence>
        {selectedObject && selectedObject.left !== undefined && selectedObject.top !== undefined && (() => {
          const canvasEl = engine?.canvas?.getElement()?.getBoundingClientRect();
          const adjustedLeft = (canvasEl?.left ?? 0) + selectedObject.left;
          const adjustedTop = (canvasEl?.top ?? 0) + selectedObject.top - 52;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="absolute flex flex-col gap-1 pointer-events-auto"
              style={{
                left: `${adjustedLeft}px`,
                top: `${Math.max(10, adjustedTop)}px`,
                zIndex: 9999,
              }}
            >
              {/* Main toolbar row */}
            <div className="flex items-center gap-1.5 p-1 glass-menu rounded-xl text-xs text-slate-200">
              <input
                type="color"
                value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#6366f1'}
                onChange={(e) => engine?.updateSelected({ fill: e.target.value })}
                className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer rounded"
              title="Object Fill"
            />
            <button onClick={() => engine?.bringForward()} className="p-1 hover:bg-slate-800 rounded text-slate-300" title="Bring Forward">
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => engine?.copySelected()} className="p-1 hover:bg-slate-800 rounded text-slate-300" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />
              
              {!openRouterApiKey ? (
                <button
                  onMouseDown={(e) => { e.preventDefault(); onOpenModal?.('openrouter'); }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-200 transition-all"
                  title="Configure AI API Key"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configure AI &rarr;</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowCanvasEnhance(!showCanvasEnhance)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                    showCanvasEnhance
                      ? 'bg-emerald-600 text-white shadow shadow-emerald-500/20'
                      : 'hover:bg-emerald-900/60 text-emerald-400'
                  }`}
                  title="AI Enhance Object"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Enhance</span>
                </button>
              )}

            <button onClick={() => engine?.deleteSelected()} className="p-1 hover:bg-slate-800 rounded text-red-400" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Enhance Sub-panel */}
          {showCanvasEnhance && (
            <div className="flex flex-col gap-1.5 p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl">
              <p className="text-[10px] text-violet-400 font-medium">✏️ Enhance canvas object text</p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={canvasEnhancePrompt}
                  onChange={(e) => setCanvasEnhancePrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCanvasEnhance(); }}
                  placeholder="Instruction e.g. 'make it catchy'..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-violet-500 w-48"
                  autoFocus
                />
                <button
                  onClick={handleCanvasEnhance}
                  disabled={isCanvasEnhancing || !canvasEnhancePrompt.trim()}
                  className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white"
                >
                  {isCanvasEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setShowCanvasEnhance(false); setCanvasEnhanceError(null); }}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              {canvasEnhanceError && <p className="text-[10px] text-red-400">{canvasEnhanceError}</p>}
            </div>
          )}
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
};
