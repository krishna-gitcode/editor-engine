import React, { useEffect, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { PluginService } from '../../services/PluginService';

export const AbcJsComponent: React.FC<NodeViewProps> = ({ node }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const abc = node.attrs.abc || '';

  useEffect(() => {
    if (containerRef.current && abc) {
      PluginService.renderAbc(containerRef.current, abc);
    }
  }, [abc]);

  return (
    <NodeViewWrapper className="abcjs-node-wrapper my-4">
      <div
        ref={containerRef}
        contentEditable={false}
        className="p-4 bg-white border border-slate-200 rounded-xl overflow-x-auto text-xs font-mono text-slate-800 shadow-sm cursor-pointer hover:border-pink-400 transition-all select-none min-h-[80px]"
        data-abc={abc}
      />
    </NodeViewWrapper>
  );
};
