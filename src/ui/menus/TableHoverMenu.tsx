import React from 'react';
import { Plus, Trash2, Split, Merge } from 'lucide-react';

interface TableHoverMenuProps {
  editor: any;
}

export const TableHoverMenu: React.FC<TableHoverMenuProps> = ({ editor }) => {
  if (!editor || !editor.isActive('table')) return null;

  return (
    <div className="sticky top-2 z-30 flex items-center gap-1.5 p-1.5 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl text-[11px] text-slate-200 w-fit mx-auto mb-2">
      <span className="font-semibold px-2 text-indigo-400">Table:</span>
      <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">+ Row</button>
      <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded">+ Col</button>
      <button onClick={() => editor.chain().focus().mergeCells().run()} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-amber-300">Merge</button>
      <button onClick={() => editor.chain().focus().splitCell().run()} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-amber-300">Split</button>
      <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded">Delete Table</button>
    </div>
  );
};
