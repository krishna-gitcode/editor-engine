import React from 'react';
import { Type, Heading1, Heading2, Quote, Code, AlertCircle } from 'lucide-react';

interface TextPanelProps {
  engine: any;
}

export const TextPanel: React.FC<TextPanelProps> = ({ engine }) => {
  const addTextPreset = (text: string, fontSize: number, fontWeight: string = 'normal', fill: string = '#ffffff') => {
    if (!engine) return;
    engine.addTextbox({
      text,
      fontSize,
      fontWeight,
      fill,
      width: 300,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-200">
      <h3 className="text-sm font-semibold text-slate-100 mb-1">Text Typography Presets</h3>
      
      <button
        onClick={() => addTextPreset('Add a Heading 1', 36, 'bold', '#f8fafc')}
        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all text-left"
      >
        <Heading1 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
        <div>
          <div className="text-sm font-bold text-slate-100">Heading 1</div>
          <div className="text-[11px] text-slate-400">Large title font (36px, bold)</div>
        </div>
      </button>

      <button
        onClick={() => addTextPreset('Add a Heading 2', 28, 'semibold', '#f1f5f9')}
        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all text-left"
      >
        <Heading2 className="w-5 h-5 text-pink-400 flex-shrink-0" />
        <div>
          <div className="text-xs font-semibold text-slate-100">Heading 2</div>
          <div className="text-[11px] text-slate-400">Section header font (28px)</div>
        </div>
      </button>

      <button
        onClick={() => addTextPreset('Add body text paragraph...', 16, 'normal', '#e2e8f0')}
        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all text-left"
      >
        <Type className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <div>
          <div className="text-xs font-medium text-slate-100">Body Text</div>
          <div className="text-[11px] text-slate-400">Standard paragraph block (16px)</div>
        </div>
      </button>

      <button
        onClick={() => addTextPreset('“Creativity is intelligence having fun.”', 20, 'italic', '#cbd5e1')}
        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all text-left"
      >
        <Quote className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <div className="text-xs font-medium italic text-slate-100">Quote Block</div>
          <div className="text-[11px] text-slate-400">Italic quote block with padding</div>
        </div>
      </button>
    </div>
  );
};
