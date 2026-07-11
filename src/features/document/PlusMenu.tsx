import React, { useState } from 'react';
import { Plus, Table, Image, Globe, Code, Quote, Sparkles, Loader2, Check, X } from 'lucide-react';
import { OpenRouterService } from '../../services/OpenRouterService';
import { parseMarkdownToTipTap } from '../../services/markdownToHtml';

interface PlusMenuProps {
  editor: any;
  onOpenModal?: (type: 'mathjax' | 'abcjs' | 'openrouter') => void;
}

const DEFAULT_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const DEFAULT_MODEL = import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'openrouter/free';

export const PlusMenu: React.FC<PlusMenuProps> = ({ editor, onOpenModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!editor || !editor.isEditable) return null;

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    setIsOpen(false);
  };

  const insertBlockquote = () => {
    editor.chain().focus().toggleBlockquote().run();
    setIsOpen(false);
  };

  const insertCodeBlock = () => {
    editor.chain().focus().toggleCodeBlock().run();
    setIsOpen(false);
  };

  const insertImage = () => {
    const url = prompt('Enter Image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setIsOpen(false);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiError(null);
    try {
      const result = await OpenRouterService.generateText(DEFAULT_API_KEY, DEFAULT_MODEL, aiPrompt);
      const nodes = parseMarkdownToTipTap(result);
      if (nodes.length > 0) {
        editor.chain().focus().insertContent(nodes).run();
      } else {
        editor.chain().focus().insertContent(result).run();
      }
      setAiPrompt('');
      setShowAiInput(false);
      setIsOpen(false);
    } catch (err: any) {
      setAiError(err.message || 'AI generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute left-[-40px] top-2" style={{ zIndex: 9999 }}>
      <div className="relative">
        <button
          onClick={() => { setIsOpen(!isOpen); setShowAiInput(false); setAiError(null); }}
          className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center shadow transition-transform active:scale-90"
          title="Insert Block"
        >
          <Plus className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-45 text-pink-400' : ''}`} />
        </button>

        {isOpen && !showAiInput && (
          <div className="absolute left-9 top-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 w-48 text-xs text-slate-200" style={{ zIndex: 9999 }}>
            {/* AI Generate – highlighted as premium option */}
            <button
              onClick={() => { setShowAiInput(true); }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-gradient-to-r from-emerald-900/50 to-teal-900/40 hover:from-emerald-800/70 hover:to-teal-800/60 text-emerald-300 hover:text-emerald-200 border border-emerald-800/40 transition-all text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium">Generate with AI</span>
            </button>

            <div className="h-px bg-slate-800 my-0.5" />

            <button
              onClick={insertTable}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Table className="w-3.5 h-3.5 text-indigo-400" />
              <span>Table (3×3)</span>
            </button>
            <button
              onClick={insertImage}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Image className="w-3.5 h-3.5 text-pink-400" />
              <span>Web Image URL</span>
            </button>
            <button
              onClick={insertBlockquote}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Quote className="w-3.5 h-3.5 text-amber-400" />
              <span>Blockquote</span>
            </button>
            <button
              onClick={insertCodeBlock}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors text-left"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>Code Block</span>
            </button>
          </div>
        )}

        {/* AI Input sub-panel */}
        {isOpen && showAiInput && (
          <div className="absolute left-9 top-0 bg-slate-900 border border-emerald-700/60 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-72" style={{ zIndex: 9999 }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Generate with AI
              </span>
              <button
                onClick={() => { setShowAiInput(false); setAiError(null); setAiPrompt(''); }}
                className="p-0.5 hover:bg-slate-800 rounded text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateAI(); } }}
              placeholder="Describe what to write (e.g. 'Write an intro paragraph about music theory')..."
              className="w-full h-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
              autoFocus
            />
            {aiError && (
              <p className="text-[10px] text-red-400">{aiError}</p>
            )}
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || !aiPrompt.trim()}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-medium disabled:opacity-40 transition-all"
            >
              {isGenerating
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
