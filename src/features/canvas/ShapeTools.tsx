import React from 'react';
import { Square, Circle, Triangle, Minus, Type, Hexagon, Sigma, Music } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

interface ShapeToolsProps {
  engine: any;
  onOpenModal?: (type: 'mathjax' | 'abcjs') => void;
}

export const ShapeTools: React.FC<ShapeToolsProps> = ({ engine, onOpenModal }) => {
  const setIsDrawingPolygon = useCanvasStore((s) => s.setIsDrawingPolygon);
  const isDrawingPolygon = useCanvasStore((s) => s.isDrawingPolygon);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Basic Shapes</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => engine?.addRect()}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition-all border border-slate-700/50"
          >
            <Square className="w-4 h-4 text-indigo-400" />
            <span>Rectangle</span>
          </button>
          <button
            onClick={() => engine?.addCircle()}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition-all border border-slate-700/50"
          >
            <Circle className="w-4 h-4 text-pink-400" />
            <span>Circle</span>
          </button>
          <button
            onClick={() => engine?.addTriangle()}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition-all border border-slate-700/50"
          >
            <Triangle className="w-4 h-4 text-blue-400" />
            <span>Triangle</span>
          </button>
          <button
            onClick={() => engine?.addLine()}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition-all border border-slate-700/50"
          >
            <Minus className="w-4 h-4 text-amber-400" />
            <span>Line</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Text & Custom Vectors</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => engine?.addTextbox()}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition-all border border-slate-700/50"
          >
            <Type className="w-4 h-4 text-emerald-400" />
            <span>Text Box</span>
          </button>
          <button
            onClick={() => {
              if (isDrawingPolygon) {
                if (engine && engine.polygonPoints && engine.polygonPoints.length >= 3) {
                  engine.finishPolygon();
                } else if (engine) {
                  engine.cancelPolygon();
                } else {
                  setIsDrawingPolygon(false);
                }
              } else {
                setIsDrawingPolygon(true);
              }
            }}
            className={`flex items-center gap-2.5 p-3 rounded-xl text-xs transition-all border ${
              isDrawingPolygon
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/50'
            }`}
          >
            <Hexagon className="w-4 h-4 text-purple-400" />
            <span>{isDrawingPolygon ? 'Finish Polygon' : 'Custom Polygon'}</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Interactive Plugins</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onOpenModal && onOpenModal('mathjax')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition-all border border-slate-700/50"
          >
            <Sigma className="w-4 h-4 text-indigo-400" />
            <span>LaTeX Math</span>
          </button>
          <button
            onClick={() => onOpenModal && onOpenModal('abcjs')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-200 transition-all border border-slate-700/50"
          >
            <Music className="w-4 h-4 text-pink-400" />
            <span>Sheet Music</span>
          </button>
        </div>
      </div>
    </div>
  );
};
