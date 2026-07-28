import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlignLeft, Briefcase, MessageCircle, CheckCircle, Maximize2, Loader2 } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';
import { OpenRouterService } from '../../services/OpenRouterService';
import { parseMarkdownToTipTap, getActiveEditorFormat, applyEditorFormatToNodes } from '../../services/markdownToHtml';

interface AIBubbleToolbarProps {
  editor: any;
}

export const AIBubbleToolbar: React.FC<AIBubbleToolbarProps> = ({ editor }) => {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { apiKey, selectedModel } = useAIStore();

  if (!editor || !editor.isEditable) return null;

  const { from, to, empty } = editor.state.selection;
  if (empty || from === to) return null;

  // Position calculation
  let coords = null;
  try {
    coords = editor.view.coordsAtPos(from);
  } catch (e) {
    return null;
  }

  if (!coords) return null;
  
  const top = coords.top - 50; // Place above selection
  const left = coords.left;

  const handleAction = async (action: string, handler: (text: string) => Promise<string>) => {
    setIsProcessing(action);
    setErrorMsg(null);
    try {
      const text = editor.state.doc.textBetween(from, to);
      // Capture editor format BEFORE the AI call so we can apply it to the result
      const format = getActiveEditorFormat(editor);
      const result = await handler(text);
      // Parse markdown into TipTap nodes and apply editor's active formatting
      let nodes: object[] = parseMarkdownToTipTap(result);
      if (nodes.length === 0) {
        nodes = [{ type: 'paragraph', content: [{ type: 'text', text: result.trim() }] }];
      }
      nodes = applyEditorFormatToNodes(nodes, format);
      editor.chain().focus().deleteSelection().insertContent(nodes).run();
      // Trigger re-pagination for large insertions
      setTimeout(() => (window as any).__repaginate?.(), 200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsProcessing(null);
    }
  };

  const buttons = [
    { id: 'enhance', icon: Sparkles, label: 'Enhance', color: 'text-emerald-400', hover: 'hover:bg-emerald-400/10',
      action: (t: string) => OpenRouterService.enhanceText(apiKey, selectedModel, t) },
    { id: 'summarize', icon: AlignLeft, label: 'Summarize', color: 'text-sky-400', hover: 'hover:bg-sky-400/10',
      action: (t: string) => OpenRouterService.summarizeText(apiKey, selectedModel, t) },
    { id: 'formal', icon: Briefcase, label: 'Formal', color: 'text-indigo-400', hover: 'hover:bg-indigo-400/10',
      action: (t: string) => OpenRouterService.rewriteWithTone(apiKey, selectedModel, t, 'formal') },
    { id: 'casual', icon: MessageCircle, label: 'Casual', color: 'text-violet-400', hover: 'hover:bg-violet-400/10',
      action: (t: string) => OpenRouterService.rewriteWithTone(apiKey, selectedModel, t, 'casual') },
    { id: 'fix', icon: CheckCircle, label: 'Fix Grammar', color: 'text-green-400', hover: 'hover:bg-green-400/10',
      action: (t: string) => OpenRouterService.checkSpellingGrammar(apiKey, selectedModel, t) },
    { id: 'expand', icon: Maximize2, label: 'Expand', color: 'text-orange-400', hover: 'hover:bg-orange-400/10',
      action: (t: string) => OpenRouterService.expandText(apiKey, selectedModel, t) },
  ];

  return (
    <div style={{ position: 'fixed', top, left, zIndex: 99999 }}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="flex items-center gap-1 p-1 glass-tier-2 rounded-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          {buttons.map(btn => (
            <button
              key={btn.id}
              disabled={isProcessing !== null}
              onClick={() => handleAction(btn.id, btn.action)}
              className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${btn.hover} disabled:opacity-50 group`}
              title={btn.label}
            >
              {isProcessing === btn.id ? (
                <Loader2 className={`w-4 h-4 animate-spin ${btn.color}`} />
              ) : (
                <btn.icon className={`w-4 h-4 ${btn.color} group-hover:scale-110 transition-transform`} />
              )}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 left-0 bg-red-900/90 text-red-200 text-[10px] px-2 py-1 rounded border border-red-700 whitespace-nowrap"
        >
          {errorMsg}
        </motion.div>
      )}
    </div>
  );
};
