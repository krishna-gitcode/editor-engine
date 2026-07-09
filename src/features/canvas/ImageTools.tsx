import React from 'react';
import { FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageToolsProps {
  engine: any;
}

export const ImageTools: React.FC<ImageToolsProps> = ({ engine }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg">
      <button onClick={() => engine?.flipImage('horizontal')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="Flip Horizontal">
        <FlipHorizontal className="w-4 h-4" />
      </button>
      <button onClick={() => engine?.flipImage('vertical')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="Flip Vertical">
        <FlipVertical className="w-4 h-4" />
      </button>
      <button onClick={() => engine?.scaleImage(1.1)} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="Scale Up">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button onClick={() => engine?.scaleImage(0.9)} className="p-1.5 hover:bg-slate-800 rounded text-slate-300" title="Scale Down">
        <ZoomOut className="w-4 h-4" />
      </button>
      <button onClick={() => engine?.resetImageStudio()} className="p-1.5 hover:bg-slate-800 rounded text-red-400" title="Reset Image">
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};
