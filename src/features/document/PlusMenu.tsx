import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Table, Image, Globe, Code, Quote, Sparkles, Loader2, Check, X, Wand2, AlignLeft, Music, BarChart2 } from 'lucide-react';
import { OpenRouterService } from '../../services/OpenRouterService';
import { parseMarkdownToTipTap } from '../../services/markdownToHtml';
import { useAIStore } from '../../store/aiStore';
import { useDocumentStore } from '../../store/documentStore';

interface PlusMenuProps {
  editor: any;
  onOpenModal?: (type: 'mathjax' | 'abcjs' | 'openrouter') => void;
}

type PromptMode = 'generate' | 'abc' | 'chart' | 'web' | 'table' | null;

export const PlusMenu: React.FC<PlusMenuProps> = ({ editor, onOpenModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<PromptMode>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [showToneSelector, setShowToneSelector] = useState(false);
  
  const [isActive, setIsActive] = useState((window as any).__activeEditor === editor);
  const [topPos, setTopPos] = useState<number>(8);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { isStreaming, setStreaming, clearStreamingText, selectedModel, apiKey } = useAIStore();
  const leftMargin = useDocumentStore((s) => (s.pages.find((p) => p.id === s.activePageId) || s.pages[0])?.margins.left ?? 72);

  useEffect(() => {
    const updatePosition = () => {
      if (!editor || !editor.isEditable || !isActive) return;
      try {
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        const editorRect = editor.view.dom.getBoundingClientRect();
        const relativeTop = coords.top - editorRect.top - 2;
        setTopPos(Math.max(0, relativeTop));
      } catch (e) {
        // Fallback or ignore
      }
    };

    updatePosition();
    
    if (editor) {
      editor.on('selectionUpdate', updatePosition);
      editor.on('update', updatePosition);
    }
    
    return () => {
      if (editor) {
        editor.off('selectionUpdate', updatePosition);
        editor.off('update', updatePosition);
      }
    };
  }, [editor, isActive]);

  useEffect(() => {
    const handleActiveEditorChanged = () => {
      setIsActive((window as any).__activeEditor === editor);
    };
    window.addEventListener('activeEditorChanged', handleActiveEditorChanged);
    return () => window.removeEventListener('activeEditorChanged', handleActiveEditorChanged);
  }, [editor]);

  if (!editor || !editor.isEditable || !isActive) return null;

  const insertTable = () => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setIsOpen(false); };
  const insertBlockquote = () => { editor.chain().focus().toggleBlockquote().run(); setIsOpen(false); };
  const insertCodeBlock = () => { editor.chain().focus().toggleCodeBlock().run(); setIsOpen(false); };
  const insertImage = () => { fileInputRef.current?.click(); setIsOpen(false); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (event) => {
        editor.chain().focus().setImage({ src: event.target?.result as string }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    setStreaming(true);
    
    // Insert empty paragraph
    editor.chain().focus().insertContent('\n').run();
    
    try {
      for await (const chunk of OpenRouterService.streamText(apiKey, selectedModel, aiPrompt)) {
        editor.commands.insertContent(chunk);
      }
    } catch (err: any) {
      setAiError(err.message || 'AI generation failed.');
    } finally {
      setStreaming(false);
      clearStreamingText();
      setAiPrompt('');
      setPromptMode(null);
      setIsOpen(false);
    }
  };

  const handleAbcMusic = async () => {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    setStreaming(true); // Reusing as loading state for simple UI
    try {
      const systemPrompt = 'You are a music notation expert. Generate valid ABC notation only. Output ONLY the ABC notation starting with X:1, no explanation, no markdown.';
      const result = await OpenRouterService.generateText(apiKey, selectedModel, aiPrompt, systemPrompt);
      editor.chain().focus().insertContent(`<abcjs>${result}</abcjs>`).run();
      setAiPrompt('');
      setPromptMode(null);
      setIsOpen(false);
    } catch (err: any) {
      setAiError(err.message || 'AI ABC generation failed.');
    } finally {
      setStreaming(false);
    }
  };

  const handleChartData = async () => {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    setStreaming(true);
    try {
      const systemPrompt = 'Output ONLY a JSON object with: { "type": "bar"|"line"|"pie", "labels": [...], "datasets": [{"label": "...", "data": [...]}] }. No explanation, no markdown.';
      const result = await OpenRouterService.generateText(apiKey, selectedModel, aiPrompt, systemPrompt);
      editor.chain().focus().insertContent(`<chart data="${encodeURIComponent(result)}"></chart>`).run();
      setAiPrompt('');
      setPromptMode(null);
      setIsOpen(false);
    } catch (err: any) {
      setAiError(err.message || 'AI Chart generation failed.');
    } finally {
      setStreaming(false);
    }
  };

  const handleWebpageBlock = async () => {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    setStreaming(true);
    try {
      const systemPrompt = 'You are a web developer. Output ONLY a complete self-contained HTML block with inline CSS. Make it visually attractive with dark background, modern fonts, smooth hover effects. No explanation, no markdown, output only the HTML.';
      const result = await OpenRouterService.generateText(apiKey, selectedModel, aiPrompt, systemPrompt);
      editor.chain().focus().insertContent(`<iframe src="${encodeURIComponent(result)}"></iframe>`).run();
      setAiPrompt('');
      setPromptMode(null);
      setIsOpen(false);
    } catch (err: any) {
      setAiError(err.message || 'AI Webpage generation failed.');
    } finally {
      setStreaming(false);
    }
  };

  const handleTableBlock = async () => {
    if (!aiPrompt.trim()) return;
    setAiError(null);
    setStreaming(true);
    try {
      const systemPrompt = 'Output ONLY a valid Markdown table with appropriate headers and rows based on the user description. Do not include markdown code block backticks, just the raw table syntax. No explanations.';
      const result = await OpenRouterService.generateText(apiKey, selectedModel, aiPrompt, systemPrompt);
      const html = parseMarkdownToTipTap(result);
      editor.chain().focus().insertContent(html).run();
      setAiPrompt('');
      setPromptMode(null);
      setIsOpen(false);
    } catch (err: any) {
      setAiError(err.message || 'AI Table generation failed.');
    } finally {
      setStreaming(false);
    }
  };

  const executePrompt = () => {
    if (promptMode === 'generate') handleGenerateAI();
    else if (promptMode === 'abc') handleAbcMusic();
    else if (promptMode === 'chart') handleChartData();
    else if (promptMode === 'web') handleWebpageBlock();
    else if (promptMode === 'table') handleTableBlock();
  };

  const getSelection = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return null;
    return editor.state.doc.textBetween(from, to);
  };

  const handleRewriteTone = async (tone: string) => {
    const text = getSelection();
    if (!text) {
      setAiError("Please select text first");
      setTimeout(() => setAiError(null), 3000);
      return;
    }
    setShowToneSelector(false);
    try {
      const result = await OpenRouterService.rewriteWithTone(apiKey, selectedModel, text, tone);
      editor.chain().focus().deleteSelection().insertContent(result).run();
      setIsOpen(false);
    } catch (e) {
      setAiError("Rewrite failed");
      setTimeout(() => setAiError(null), 3000);
    }
  };

  const handleSummarize = async () => {
    const text = getSelection();
    if (!text) {
      setAiError("Please select text first");
      setTimeout(() => setAiError(null), 3000);
      return;
    }
    try {
      const summary = await OpenRouterService.summarizeText(apiKey, selectedModel, text);
      editor.chain().focus().insertContent({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: summary }] }] }).run();
      setIsOpen(false);
    } catch (e) {
      setAiError("Summarize failed");
      setTimeout(() => setAiError(null), 3000);
    }
  };

  const leftPos = Math.max(-40, 4 - leftMargin);

  return (
    <div className="absolute print:hidden transition-all duration-150" style={{ left: leftPos, top: topPos, zIndex: 9999 }} data-html2canvas-ignore="true">
      <div className="relative">
        <button
          onClick={() => { setIsOpen(!isOpen); setPromptMode(null); setAiError(null); setShowToneSelector(false); }}
          className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center shadow transition-transform active:scale-90"
          title="Insert Block"
        >
          {isStreaming ? (
            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              <Sparkles className="w-4 h-4 text-pink-400" />
            </motion.div>
          ) : (
            <Plus className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-45 text-pink-400' : ''}`} />
          )}
        </button>

        {isOpen && !promptMode && !showToneSelector && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, type: 'spring', bounce: 0 }}
            className="absolute left-9 top-0 glass-tier-2 border border-slate-700 rounded-xl p-1.5 flex flex-col gap-1 w-52 text-xs text-slate-200"
            style={{ zIndex: 9999 }}
          >
            <motion.button
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              onClick={() => { setPromptMode('generate'); }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-gradient-to-r from-emerald-900/50 to-teal-900/40 hover:from-emerald-800/70 hover:to-teal-800/60 text-emerald-300 hover:text-emerald-200 border border-emerald-800/40 transition-all text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium">/ai write</span>
            </motion.button>
            
            <div className="px-2 py-1 mt-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">AI Smart Blocks</div>

            <motion.button
              onClick={() => setShowToneSelector(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Wand2 className="w-3.5 h-3.5 text-violet-400" />
              <span>/ai rewrite</span>
            </motion.button>
            <motion.button
              onClick={handleSummarize}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <AlignLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>/ai summarize</span>
            </motion.button>
            <motion.button
              onClick={() => setPromptMode('chart')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>/ai chart</span>
            </motion.button>
            <motion.button
              onClick={() => setPromptMode('abc')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>/ai abc</span>
            </motion.button>
            <motion.button
              onClick={() => setPromptMode('table')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Table className="w-3.5 h-3.5 text-blue-400" />
              <span>/ai table</span>
            </motion.button>
            <motion.button
              onClick={() => setPromptMode('web')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span>/ai webpage</span>
            </motion.button>

            <div className="h-px bg-slate-700/50 my-0.5" />

            <motion.button
              onClick={insertTable}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Table className="w-3.5 h-3.5 text-indigo-400" />
              <span>Table (3×3)</span>
            </motion.button>
            <motion.button
              onClick={insertImage}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Image className="w-3.5 h-3.5 text-pink-400" />
              <span>Image</span>
            </motion.button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <motion.button
              onClick={insertBlockquote}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Quote className="w-3.5 h-3.5 text-amber-400" />
              <span>Blockquote</span>
            </motion.button>
            <motion.button
              onClick={insertCodeBlock}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>Code Block</span>
            </motion.button>
            
            {aiError && (
              <div className="px-2 py-1 mt-1 text-[10px] text-red-400 bg-red-950/30 rounded border border-red-900/50">
                {aiError}
              </div>
            )}
          </motion.div>
        )}

        {isOpen && showToneSelector && (
           <div className="absolute left-9 top-0 bg-slate-900 border border-violet-700/60 rounded-xl shadow-2xl p-2 flex flex-col gap-1 w-40 text-xs text-slate-200" style={{ zIndex: 9999 }}>
             <div className="px-2 py-1 font-semibold text-slate-400">Select Tone:</div>
             {['formal', 'casual', 'military', 'poetic', 'technical', 'persuasive'].map(tone => (
                <button key={tone} onClick={() => handleRewriteTone(tone)} className="px-2 py-1.5 text-left hover:bg-slate-800 rounded capitalize">{tone}</button>
             ))}
           </div>
        )}

        {isOpen && promptMode && (
          <div className="absolute left-9 top-0 bg-slate-900 border border-emerald-700/60 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-72" style={{ zIndex: 9999 }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 capitalize">
                {promptMode === 'generate' && <Sparkles className="w-3.5 h-3.5" />}
                {promptMode === 'abc' && <Music className="w-3.5 h-3.5" />}
                {promptMode === 'chart' && <BarChart2 className="w-3.5 h-3.5" />}
                {promptMode === 'table' && <Table className="w-3.5 h-3.5" />}
                {promptMode === 'web' && <Globe className="w-3.5 h-3.5" />}
                {promptMode} with AI
              </span>
              <button
                onClick={() => { setPromptMode(null); setAiError(null); setAiPrompt(''); }}
                className="p-0.5 hover:bg-slate-800 rounded text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="w-full gradient-border-animated rounded-lg">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); executePrompt(); } }}
                placeholder={
                  promptMode === 'generate' ? "Describe what to write (e.g. 'Write an intro paragraph')..." :
                  promptMode === 'abc' ? "Describe music (e.g. 'simple C major scale')..." :
                  promptMode === 'chart' ? "Describe chart (e.g. 'monthly sales')..." :
                  promptMode === 'table' ? "Describe table (e.g. 'pricing plans')..." :
                  "Describe a web component (e.g. 'pricing card')..."
                }
                className="w-full h-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-transparent resize-none relative z-10"
                autoFocus
              />
            </div>
            {aiError && (
              <p className="text-[10px] text-red-400">{aiError}</p>
            )}
            <button
              onClick={executePrompt}
              disabled={isStreaming || !aiPrompt.trim()}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-medium disabled:opacity-40 transition-all"
            >
              {isStreaming
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Generating...</span></>
                : <><Check className="w-3.5 h-3.5" /><span>Generate & Insert</span></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
