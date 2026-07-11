import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Trash2, Table, FileText, Target, Layers } from 'lucide-react';
import './LayerPanel.css';

interface LayerPanelProps {
  engine: any;
}

interface DocLayerItem {
  id: string;
  name: string;
  type: string;
  pos: number;
  nodeSize: number;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({ engine }) => {
  const layers = useCanvasStore((s) => s.layers);
  const [docLayers, setDocLayers] = useState<DocLayerItem[]>([]);
  const activeEditor = (window as any).__activeEditor;

  useEffect(() => {
    const updateDocLayers = () => {
      const activeEditor = (window as any).__activeEditor;
      if (!activeEditor || !activeEditor.state || !activeEditor.state.doc) {
        setDocLayers([]);
        return;
      }
      const items: DocLayerItem[] = [];
      activeEditor.state.doc.descendants((node: any, offset: number) => {
        if (node.type.name === 'table' || node.type.name === 'customTable') {
          const rows = node.childCount;
          const cols = node.firstChild?.childCount || 0;
          items.push({
            id: `doc-${offset}`,
            name: `Table (${rows}x${cols})`,
            type: 'table',
            pos: offset,
            nodeSize: node.nodeSize,
          });
        } else if (node.type.name === 'heading') {
          const text = node.textContent.slice(0, 26) || 'Heading';
          items.push({
            id: `doc-${offset}`,
            name: `H${node.attrs.level}: ${text}`,
            type: 'heading',
            pos: offset,
            nodeSize: node.nodeSize,
          });
        } else if (node.type.name === 'paragraph' && node.textContent.trim()) {
          const text = node.textContent.slice(0, 26) || 'Paragraph';
          items.push({
            id: `doc-${offset}`,
            name: `Text: "${text}"`,
            type: 'paragraph',
            pos: offset,
            nodeSize: node.nodeSize,
          });
        } else if (node.type.name === 'mathJax') {
          items.push({
            id: `doc-${offset}`,
            name: `LaTeX Formula`,
            type: 'mathJax',
            pos: offset,
            nodeSize: node.nodeSize,
          });
        } else if (node.type.name === 'abcJs') {
          items.push({
            id: `doc-${offset}`,
            name: `Sheet Music`,
            type: 'abcJs',
            pos: offset,
            nodeSize: node.nodeSize,
          });
        } else if (node.type.name === 'iframe') {
          items.push({
            id: `doc-${offset}`,
            name: `Iframe Embed`,
            type: 'iframe',
            pos: offset,
            nodeSize: node.nodeSize,
          });
        } else if (node.type.name === 'image') {
          items.push({
            id: `doc-${offset}`,
            name: `Image Block`,
            type: 'image',
            pos: offset,
            nodeSize: node.nodeSize,
          });
        }
      });
      setDocLayers(items);
    };

    updateDocLayers();
    const ed = (window as any).__activeEditor;
    if (ed) {
      ed.on('update', updateDocLayers);
      ed.on('selectionUpdate', updateDocLayers);
    }

    const handleEditorChanged = () => {
      updateDocLayers();
      const currEditor = (window as any).__activeEditor;
      if (currEditor) {
        currEditor.off('update', updateDocLayers);
        currEditor.off('selectionUpdate', updateDocLayers);
        currEditor.on('update', updateDocLayers);
        currEditor.on('selectionUpdate', updateDocLayers);
      }
    };

    window.addEventListener('activeEditorChanged', handleEditorChanged);
    const interval = setInterval(updateDocLayers, 800);

    return () => {
      window.removeEventListener('activeEditorChanged', handleEditorChanged);
      clearInterval(interval);
      const currEditor = (window as any).__activeEditor;
      if (currEditor) {
        currEditor.off('update', updateDocLayers);
        currEditor.off('selectionUpdate', updateDocLayers);
      }
    };
  }, []);

  const handleSelectDocNode = (layer: DocLayerItem) => {
    const activeEditor = (window as any).__activeEditor;
    if (!activeEditor) return;
    try {
      activeEditor.commands.setNodeSelection(layer.pos);
      const domNode = activeEditor.view.nodeDOM(layer.pos) as HTMLElement;
      if (domNode && domNode.scrollIntoView) {
        domNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch {
      // Ignore if node position drifted
    }
  };

  const handleDeleteDocNode = (layer: DocLayerItem) => {
    const activeEditor = (window as any).__activeEditor;
    if (!activeEditor) return;
    try {
      activeEditor.chain().focus().deleteRange({ from: layer.pos, to: layer.pos + layer.nodeSize }).run();
    } catch {
      // Ignore if node position drifted
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 text-slate-200 overflow-y-auto max-h-full">
      {/* Canvas Vector Layers */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Canvas Vector Layers</span>
          </h3>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{layers.length}</span>
        </div>

        {layers.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500">
            No vector objects on active canvas.
          </div>
        ) : (
          <div className="space-y-1.5">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-all text-xs"
              >
                <span className="truncate font-medium text-slate-200 max-w-[110px]">{layer.name}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => engine?.toggleVisibilitySelected(layer.id)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Toggle Visibility"
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  <button
                    onClick={() => engine?.toggleLockSelected(layer.id)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Toggle Lock"
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => engine?.bringForward(layer.id)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Bring Forward"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => engine?.sendBackward(layer.id)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Send Backward"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => engine?.deleteSelected(layer.id)}
                    className="p-1 hover:bg-slate-700 rounded text-red-400 hover:bg-red-500/20"
                    title="Delete Object"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Content Layers (Tables & Text) */}
      <div>
        <div className="flex justify-between items-center mb-2 pt-2 border-t border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Document Layers</span>
          </h3>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{docLayers.length}</span>
        </div>

        {docLayers.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500">
            No tables or text blocks in active page.
          </div>
        ) : (
          <div className="space-y-1.5">
            {docLayers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-emerald-500/50 transition-all text-xs"
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {layer.type === 'table' ? (
                    <Table className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate font-medium text-slate-300 max-w-[130px]" title={layer.name}>
                    {layer.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleSelectDocNode(layer)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-300"
                    title="Select and Scroll To Element"
                  >
                    <Target className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocNode(layer)}
                    className="p-1 hover:bg-slate-700 rounded text-red-400 hover:bg-red-500/20"
                    title="Delete Document Block"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
