import React, { useState, useEffect, useRef } from 'react';
import { Sigma, Check, X } from 'lucide-react';
import { PluginService } from '../../services/PluginService';
import html2canvas from 'html2canvas';

const SYMBOL_CATEGORIES = [
  {
    label: 'Basic',
    symbols: [
      { label: '√x', code: '\\sqrt{x}' }, { label: 'a/b', code: '\\frac{a}{b}' },
      { label: 'x²', code: 'x^{2}' }, { label: 'xₙ', code: 'x_{n}' },
      { label: '±', code: '\\pm' }, { label: '÷', code: '\\div' },
      { label: '×', code: '\\times' }, { label: '≈', code: '\\approx' },
      { label: '≠', code: '\\neq' }, { label: '≤', code: '\\leq' },
      { label: '≥', code: '\\geq' }, { label: '∞', code: '\\infty' },
    ],
  },
  {
    label: 'Calculus',
    symbols: [
      { label: '∫', code: '\\int_{0}^{\\infty}' }, { label: '∬', code: '\\iint' },
      { label: '∮', code: '\\oint' }, { label: '∑', code: '\\sum_{i=1}^{n}' },
      { label: '∏', code: '\\prod_{i=1}^{n}' }, { label: 'lim', code: '\\lim_{x \\to \\infty}' },
      { label: 'd/dx', code: '\\frac{d}{dx}' }, { label: '∂', code: '\\partial' },
      { label: '∇', code: '\\nabla' }, { label: 'Δ', code: '\\Delta' },
    ],
  },
  {
    label: 'Trig',
    symbols: [
      { label: 'sin θ', code: '\\sin(\\theta)' }, { label: 'cos θ', code: '\\cos(\\theta)' },
      { label: 'tan θ', code: '\\tan(\\theta)' }, { label: 'log', code: '\\log_{b}(x)' },
      { label: 'ln x', code: '\\ln(x)' }, { label: 'e^x', code: 'e^{x}' },
    ],
  },
  {
    label: 'Greek',
    symbols: [
      { label: 'α', code: '\\alpha' }, { label: 'β', code: '\\beta' },
      { label: 'γ', code: '\\gamma' }, { label: 'δ', code: '\\delta' },
      { label: 'θ', code: '\\theta' }, { label: 'λ', code: '\\lambda' },
      { label: 'μ', code: '\\mu' }, { label: 'π', code: '\\pi' },
      { label: 'σ', code: '\\sigma' }, { label: 'φ', code: '\\phi' },
      { label: 'ω', code: '\\omega' }, { label: 'Ω', code: '\\Omega' },
    ],
  },
  {
    label: 'Matrix',
    symbols: [
      { label: '2×2', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
      { label: '3×3', code: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}' },
      { label: 'cases', code: '\\begin{cases} x & \\text{if } x > 0 \\\\ -x & \\text{if } x < 0 \\end{cases}' },
      { label: '[ ]', code: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
    ],
  },
];

interface MathJaxModalProps {
  onClose: () => void;
  engine: any;
  editor?: any;
}

export const MathJaxModal: React.FC<MathJaxModalProps> = ({ onClose, engine, editor }) => {
  const [latex, setLatex] = useState('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [activeSymbolTab, setActiveSymbolTab] = useState(0);
  const mathPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mathPreviewRef.current) {
      PluginService.renderMathJax(mathPreviewRef.current, latex);
    }
  }, [latex]);

  const handleInsertMath = async () => {
    const activeEditor = editor || (window as any).__activeEditor;
    const isCanvasActive = (window as any).__isCanvasMode;
    if ((isCanvasActive || !activeEditor) && engine) {
      if (mathPreviewRef.current) {
        try {
          const canvas = await html2canvas(mathPreviewRef.current, { backgroundColor: null, scale: 2 });
          const dataUrl = canvas.toDataURL('image/png');
          engine.addImageFromUrl(dataUrl);
        } catch (e) {
          engine.addTextbox({ text: `$$ ${latex} $$`, fontSize: 24, fill: '#1e293b', pluginType: 'mathjax' });
        }
      } else {
        engine.addTextbox({ text: `$$ ${latex} $$`, fontSize: 24, fill: '#1e293b', pluginType: 'mathjax' });
      }
    } else if (activeEditor) {
      if (activeEditor.commands.insertMathJax) {
        activeEditor.commands.insertMathJax({ latex });
      } else {
        activeEditor.chain().focus().insertContent({
          type: 'mathJax',
          attrs: { latex },
        }).run();
      }
    }
    onClose();
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ee-border)', background: 'var(--ee-surface-1)' }}>
        <div className="flex items-center gap-2 font-semibold text-[var(--ee-text-primary)]">
          <Sigma className="w-5 h-5 text-indigo-400" />
          <span>LaTeX Math & Formula Studio</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[var(--ee-surface-2)] rounded text-[var(--ee-text-secondary)] hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto text-xs text-[var(--ee-text-primary)]">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-medium text-[var(--ee-text-secondary)] mb-1.5">
              LaTeX Formula Input
            </label>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              className="w-full h-44 border rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 resize-none"
              style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}
            />
          </div>

          <div>
            <span className="text-[11px] font-medium text-[var(--ee-text-secondary)] block mb-2">Symbol Palette</span>
            <div className="flex gap-1 mb-2 flex-wrap">
              {SYMBOL_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveSymbolTab(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${activeSymbolTab === idx ? 'bg-indigo-600 text-white' : 'bg-[var(--ee-surface-2)] text-[var(--ee-text-secondary)] hover:text-[var(--ee-text-primary)]'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1.5 max-h-24 overflow-y-auto">
              {SYMBOL_CATEGORIES[activeSymbolTab].symbols.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setLatex((l) => l + ' ' + s.code)}
                  title={s.code}
                  className="p-1.5 rounded bg-[var(--ee-surface-2)] hover:bg-indigo-600 text-center font-mono text-[10px] font-semibold text-indigo-300 hover:text-white transition-colors leading-tight"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[11px] font-medium text-[var(--ee-text-secondary)] block mb-1.5">Live Render Preview</span>
            <div
              ref={mathPreviewRef}
              className="w-full min-h-[160px] p-4 bg-white text-slate-900 rounded-xl border border-[var(--ee-border)] overflow-auto flex items-center justify-center shadow-inner"
            />
          </div>

          <div className="mt-auto pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] font-medium text-[var(--ee-text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertMath}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-white transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Insert onto Canvas</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
