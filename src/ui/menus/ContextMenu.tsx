import React from 'react';
import { Copy, Clipboard, ArrowUp, ArrowDown, Lock, Trash2 } from 'lucide-react';
import './ContextMenu.css';

interface ContextMenuProps {
  engine: any;
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ engine, visible, x, y, onClose }) => {
  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 pointer-events-auto" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 w-48 flex flex-col gap-1 text-xs text-slate-200 pointer-events-auto select-none"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        <button
          onClick={() => { engine?.copySelected(); onClose(); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 transition-colors text-left"
        >
          <Copy className="w-4 h-4 text-indigo-400" />
          <span>Copy Object</span>
        </button>
        <button
          onClick={() => { engine?.pasteSelected(); onClose(); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 transition-colors text-left"
        >
          <Clipboard className="w-4 h-4 text-emerald-400" />
          <span>Paste Object</span>
        </button>
        <div className="h-px bg-slate-800 my-1" />
        <button
          onClick={() => { engine?.bringToFront(); onClose(); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 transition-colors text-left"
        >
          <ArrowUp className="w-4 h-4 text-blue-400" />
          <span>Bring to Front</span>
        </button>
        <button
          onClick={() => { engine?.sendToBack(); onClose(); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 transition-colors text-left"
        >
          <ArrowDown className="w-4 h-4 text-amber-400" />
          <span>Send to Back</span>
        </button>
        <button
          onClick={() => { engine?.toggleLockSelected(); onClose(); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 transition-colors text-left"
        >
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Toggle Lock</span>
        </button>
        <div className="h-px bg-slate-800 my-1" />
        <button
          onClick={() => { engine?.deleteSelected(); onClose(); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-red-900/30 text-red-400 transition-colors text-left"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Object</span>
        </button>
      </div>
    </>
  );
};
