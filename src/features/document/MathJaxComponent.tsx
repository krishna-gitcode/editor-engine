import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { PluginService } from '../../services/PluginService';

export const MathJaxComponent: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const latex = node.attrs.latex || '';

  const renderCurrent = () => {
    if (containerRef.current && latex) {
      PluginService.renderMathJax(containerRef.current, latex);
    }
  };

  useLayoutEffect(() => {
    renderCurrent();
  }, [latex]);

  useEffect(() => {
    renderCurrent();
    // Re-render if container is re-inserted into DOM by TipTap reconciliation
    const timer = setTimeout(renderCurrent, 150);
    return () => clearTimeout(timer);
  }, [latex]);

  return (
    <NodeViewWrapper className="mathjax-node-wrapper my-3">
      <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl flex flex-col gap-2 shadow-sm hover:border-indigo-400 transition-all">
        {/* Editable LaTeX text string */}
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300">
          <span className="text-slate-500 font-bold">$$</span>
          <input
            type="text"
            value={latex}
            onChange={(e) => updateAttributes({ latex: e.target.value })}
            placeholder="Enter LaTeX equation e.g. E = mc^2..."
            className="w-full bg-transparent border-none text-indigo-200 focus:outline-none text-xs font-mono"
          />
          <span className="text-slate-500 font-bold">$$</span>
        </div>
        
        {/* Rendered MathJax preview */}
        <div
          ref={containerRef}
          contentEditable={false}
          className="p-3 min-h-[44px] flex items-center justify-center text-slate-100 overflow-auto select-text bg-slate-950/60 rounded-lg border border-slate-800"
          style={{ resize: 'both', minWidth: '100px', minHeight: '60px' }}
          data-latex={latex}
        />
      </div>
    </NodeViewWrapper>
  );
};

