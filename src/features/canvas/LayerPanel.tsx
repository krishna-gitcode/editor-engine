import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import './LayerPanel.css';

interface LayerPanelProps {
  engine: any;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({ engine }) => {
  const layers = useCanvasStore((s) => s.layers);

  return (
    <div className="flex flex-col gap-3 p-4 text-slate-200">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-semibold text-slate-100">Canvas Layers</h3>
        <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">{layers.length} items</span>
      </div>

      {layers.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-400">
          No vector objects on the active canvas layer yet.
        </div>
      ) : (
        <div className="space-y-2">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-all text-xs"
            >
              <span className="truncate font-medium text-slate-200 max-w-[120px]">{layer.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => engine?.toggleVisibilitySelected()}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  title="Toggle Visibility"
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                </button>
                <button
                  onClick={() => engine?.toggleLockSelected()}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  title="Toggle Lock"
                >
                  {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => engine?.bringForward()}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  title="Bring Forward"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => engine?.sendBackward()}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  title="Send Backward"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => engine?.deleteSelected()}
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
  );
};
