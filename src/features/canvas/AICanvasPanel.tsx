import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Check } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';
import { OpenRouterService } from '../../services/OpenRouterService';
import { fabric } from 'fabric';

interface AICanvasPanelProps {
  fabricCanvas: any; 
  onClose: () => void;
}

export const AICanvasPanel: React.FC<AICanvasPanelProps> = ({ fabricCanvas, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { apiKey, selectedModel } = useAIStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || !fabricCanvas) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const systemPrompt = `You are a Fabric.js layout generator. Given a description, output ONLY a JSON array of Fabric.js objects.
Each object must have: type (one of: 'rect', 'circle', 'textbox', 'line'), left, top, width, height, 
fill (hex color), text (for textbox only), fontSize (for textbox only, number), 
fontFamily (for textbox only), stroke (optional), strokeWidth (optional, number).
Use realistic, visually appealing values. Dark theme preferred. Output ONLY valid JSON array.`;

      const result = await OpenRouterService.generateText(apiKey, selectedModel, prompt, systemPrompt);
      
      let objectsToCreate = [];
      try {
        const jsonStr = result.replace(/```json/gi, '').replace(/```/g, '').trim();
        objectsToCreate = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error('AI returned invalid JSON format.');
      }

      if (!Array.isArray(objectsToCreate)) {
        throw new Error('AI did not return an array of objects.');
      }

      let count = 0;
      for (const objDef of objectsToCreate) {
        let obj: any = null;
        if (objDef.type === 'rect') {
          obj = new fabric.Rect(objDef);
        } else if (objDef.type === 'circle') {
          const r = objDef.radius || (objDef.width ? objDef.width / 2 : 50);
          obj = new fabric.Circle({ ...objDef, radius: r });
        } else if (objDef.type === 'textbox' || objDef.type === 'text') {
          obj = new fabric.Textbox(objDef.text || 'Text', objDef);
        } else if (objDef.type === 'line') {
          obj = new fabric.Line([objDef.left, objDef.top, objDef.left + (objDef.width || 100), objDef.top + (objDef.height || 0)], objDef);
        }

        if (obj) {
          fabricCanvas.add(obj);
          count++;
        }
      }
      
      fabricCanvas.requestRenderAll();
      setSuccessMsg(`Added ${count} objects to canvas`);
      setPrompt('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Layout generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-16 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-emerald-400 font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Web Designer
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a web component (e.g. 'hero section with dark background, title, subtitle, and a CTA button')"
        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none resize-none"
      />

      {errorMsg && <div className="text-xs text-red-400">{errorMsg}</div>}
      {successMsg && <div className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> {successMsg}</div>}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate Layout</>
        )}
      </button>
    </motion.div>
  );
};
