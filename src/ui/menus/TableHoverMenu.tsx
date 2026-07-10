import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, RotateCw, GripVertical } from 'lucide-react';

interface TableHoverMenuProps {
  editor: any;
}

export const TableHoverMenu: React.FC<TableHoverMenuProps> = ({ editor }) => {
  if (!editor || !editor.isActive('table')) return null;

  // Find current table attributes by walking up depths or getAttributes
  const currentAlign = editor.getAttributes('table').alignment || 'center';
  const currentRot = editor.getAttributes('table').rotation || 0;

  const handleDragStart = (e: React.DragEvent) => {
    // Locate parent table pos to initiate drag and drop
    const { $from } = editor.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === 'table') {
        const pos = $from.before(depth);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/x-tiptap-node-drag', JSON.stringify({
          pos,
          type: 'table',
        }));
        break;
      }
    }
  };

  return (
    <div className="sticky top-2 z-30 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl text-[11px] text-slate-200 w-fit mx-auto mb-2 animate-in fade-in duration-150 select-none">
      {/* Drag & Drop Grip Button (#Drag & Drop) */}
      <div
        draggable
        onDragStart={handleDragStart}
        className="flex items-center gap-1 px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded cursor-grab active:cursor-grabbing font-semibold transition-colors border-r border-slate-700 pr-2"
        title="Click and drag to drop table anywhere in the document"
      >
        <GripVertical className="w-3.5 h-3.5" />
        <span>Drag Table</span>
      </div>

      <span className="font-semibold px-1 text-indigo-400">Table:</span>

      {/* Alignment / Positioning (#8) */}
      <div className="flex items-center gap-0.5 bg-slate-800/80 p-0.5 rounded border border-slate-700">
        <button
          onClick={() => editor.chain().focus().updateTableAttributes({ alignment: 'left' }).run()}
          className={`p-1 rounded ${currentAlign === 'left' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().updateTableAttributes({ alignment: 'center' }).run()}
          className={`p-1 rounded ${currentAlign === 'center' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().updateTableAttributes({ alignment: 'right' }).run()}
          className={`p-1 rounded ${currentAlign === 'right' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Width Preset Pills (#8) */}
      <div className="flex items-center gap-1 border-l border-slate-700 pl-1.5">
        <span className="text-[10px] text-slate-400">Width:</span>
        {['100%', '75%', '50%', 'auto'].map((w) => (
          <button
            key={w}
            onClick={() => editor.chain().focus().updateTableAttributes({ width: w }).run()}
            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300"
          >
            {w}
          </button>
        ))}
      </div>

      {/* Rotation (#8) */}
      <div className="flex items-center gap-1 border-l border-slate-700 pl-1.5">
        <button
          onClick={() => editor.chain().focus().updateTableAttributes({ rotation: (currentRot + 15) % 360 }).run()}
          className="p-1 bg-slate-800 hover:bg-slate-700 rounded flex items-center gap-1 text-cyan-300 text-[10px]"
          title="Rotate Table +15°"
        >
          <RotateCw className="w-3 h-3" />
          <span>{currentRot}°</span>
        </button>
        {currentRot !== 0 && (
          <button
            onClick={() => editor.chain().focus().updateTableAttributes({ rotation: 0 }).run()}
            className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px] text-red-300"
          >
            Reset
          </button>
        )}
      </div>

      <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

      {/* Rows & Columns (#9) */}
      <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">+ Row</button>
      <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">+ Col</button>
      <button onClick={() => editor.chain().focus().mergeCells().run()} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-amber-300">Merge</button>
      <button onClick={() => editor.chain().focus().splitCell().run()} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-amber-300">Split</button>
      <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded">Delete Table</button>
    </div>
  );
};
