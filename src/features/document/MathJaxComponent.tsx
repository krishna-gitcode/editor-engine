import React, { useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { PluginService } from '../../services/PluginService';

export const MathJaxComponent: React.FC<NodeViewProps> = ({ node }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const latex = node.attrs.latex || '';

  useEffect(() => {
    if (containerRef.current && latex) {
      PluginService.renderMathJax(containerRef.current, latex);
    }
  }, [latex]);

  return (
    <NodeViewWrapper className="mathjax-node-wrapper my-4">
      <div
        ref={containerRef}
        contentEditable={false}
        className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-base text-indigo-950 font-semibold shadow-sm cursor-pointer hover:border-indigo-400 transition-all overflow-x-auto select-none"
        data-latex={latex}
      >
        {`$$ ${latex} $$`}
      </div>
    </NodeViewWrapper>
  );
};
