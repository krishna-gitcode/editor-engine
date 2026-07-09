import React from 'react';
import { Sparkles, Award, Star, Heart, Zap, Bookmark } from 'lucide-react';

interface CanvaStudioPanelProps {
  engine: any;
}

export const CanvaStudioPanel: React.FC<CanvaStudioPanelProps> = ({ engine }) => {
  const addVectorBadge = (label: string, color: string, shapeType: 'circle' | 'rect' | 'triangle') => {
    if (!engine) return;
    if (shapeType === 'circle') {
      engine.addCircle({ fill: color, radius: 50 });
    } else if (shapeType === 'rect') {
      engine.addRect({ fill: color, width: 140, height: 60, rx: 12, ry: 12 });
    } else {
      engine.addTriangle({ fill: color, width: 100, height: 100 });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 text-slate-200">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Canva Studio Vector Elements</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">Click any graphic item below to insert vector artwork onto the active canvas layer.</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => addVectorBadge('Premium Badge', '#6366f1', 'circle')}
            className="flex flex-col items-center justify-center p-4 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-all text-xs gap-2"
          >
            <Award className="w-6 h-6 text-indigo-400" />
            <span className="font-medium">Badge Circle</span>
          </button>

          <button
            onClick={() => addVectorBadge('Star Highlight', '#ec4899', 'triangle')}
            className="flex flex-col items-center justify-center p-4 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-all text-xs gap-2"
          >
            <Star className="w-6 h-6 text-pink-400" />
            <span className="font-medium">Star Vector</span>
          </button>

          <button
            onClick={() => addVectorBadge('Banner Tag', '#3b82f6', 'rect')}
            className="flex flex-col items-center justify-center p-4 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-all text-xs gap-2"
          >
            <Bookmark className="w-6 h-6 text-blue-400" />
            <span className="font-medium">Banner Tag</span>
          </button>

          <button
            onClick={() => addVectorBadge('Energy Spark', '#f59e0b', 'circle')}
            className="flex flex-col items-center justify-center p-4 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-all text-xs gap-2"
          >
            <Zap className="w-6 h-6 text-amber-400" />
            <span className="font-medium">Energy Spark</span>
          </button>
        </div>
      </div>
    </div>
  );
};
