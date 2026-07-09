import React from 'react';
import './ImageStudioPanel.css';

interface ImageStudioPanelProps {
  engine: any;
}

export const ImageStudioPanel: React.FC<ImageStudioPanelProps> = ({ engine }) => {
  return (
    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex gap-2">
      <button onClick={() => engine?.applyImageFilter('grayscale')} className="px-2 py-1 bg-slate-800 text-xs rounded">Grayscale</button>
      <button onClick={() => engine?.applyImageFilter('sepia')} className="px-2 py-1 bg-slate-800 text-xs rounded">Sepia</button>
      <button onClick={() => engine?.applyImageFilter('invert')} className="px-2 py-1 bg-slate-800 text-xs rounded">Invert</button>
      <button onClick={() => engine?.resetImageStudio()} className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded">Reset</button>
    </div>
  );
};
