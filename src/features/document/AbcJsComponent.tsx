import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { PluginService } from '../../services/PluginService';

export const AbcJsComponent: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const abc = node.attrs.abc || '';

  const renderCurrent = () => {
    if (containerRef.current && abc) {
      PluginService.renderAbc(containerRef.current, abc);
    }
  };

  useLayoutEffect(() => {
    renderCurrent();
  }, [abc]);

  useEffect(() => {
    renderCurrent();
    const timer = setTimeout(renderCurrent, 150);
    return () => clearTimeout(timer);
  }, [abc]);

  return (
    <NodeViewWrapper className="abcjs-node-wrapper my-4">
      <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl flex flex-col gap-2 shadow-sm hover:border-pink-400 transition-all">
        {/* Editable ABC string */}
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-pink-300">
          <span className="text-slate-500 font-bold">ABC:</span>
          <input
            type="text"
            value={abc}
            onChange={(e) => updateAttributes({ abc: e.target.value })}
            placeholder="Enter ABC music notation e.g. X:1 T:Scale K:C..."
            className="w-full bg-transparent border-none text-pink-200 focus:outline-none text-xs font-mono"
          />
        </div>

        {/* Rendered sheet music preview */}
        <div
          ref={containerRef}
          contentEditable={false}
          className="p-4 bg-white border border-slate-200 rounded-xl overflow-auto text-xs font-mono text-slate-800 shadow-sm transition-all select-none min-h-[80px]"
          style={{ resize: 'both', minWidth: '150px', minHeight: '80px' }}
          data-abc={abc}
        />
      </div>
    </NodeViewWrapper>
  );
};

