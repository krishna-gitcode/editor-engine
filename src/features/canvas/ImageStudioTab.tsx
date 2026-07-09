import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { Sliders, Crop, Shapes, RotateCcw } from 'lucide-react';
import './ImageStudioTab.css';

interface ImageStudioTabProps {
  engine: any;
}

export const ImageStudioTab: React.FC<ImageStudioTabProps> = ({ engine }) => {
  const selectedObject = useCanvasStore((s) => s.selectedObjectProps);
  const isImage = selectedObject?.type === 'image';

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !engine) return;
    const url = URL.createObjectURL(file);
    engine.addImageFromUrl(url);
  };

  return (
    <div className="flex flex-col h-full gap-6 p-4 text-slate-200 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-2">Upload Image</h3>
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 rounded-xl hover:border-indigo-500 cursor-pointer bg-slate-900/50 transition-all">
          <span className="text-xs text-slate-400">Click to upload from local device</span>
          <span className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, WEBP, SVG</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {!isImage ? (
        <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
          Select an image on the canvas to open adjustments, filters, cropping, and shape masks.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Adjustments */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-3">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Color & Lighting Adjustments</span>
            </div>
            <div className="space-y-3">
              {['Brightness', 'Contrast', 'Saturation', 'Blur'].map((adj) => (
                <div key={adj} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{adj}</span>
                    <span>0</span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    defaultValue="0"
                    onChange={(e) => engine?.applyImageAdjustment(adj, parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preset Filters */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2.5">Preset Filters</div>
            <div className="grid grid-cols-2 gap-2">
              {['Grayscale', 'Sepia', 'Invert', 'Vintage'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => engine?.applyImageFilter(filter)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium transition-all text-left"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Crop */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
              <Crop className="w-3.5 h-3.5 text-indigo-400" />
              <span>Aspect Ratio Crop</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['1:1', '4:3', '16:9', '9:16', '3:4', 'Free'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => engine?.cropToAspectRatio(ratio)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-center"
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Shape Masking */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
              <Shapes className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shape Masking</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['circle', 'triangle', 'star', 'hexagon', 'rounded'].map((shape) => (
                <button
                  key={shape}
                  onClick={() => engine?.applyShapeMask(shape)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] capitalize text-center"
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={() => engine?.resetImageStudio()}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Adjustments</span>
          </button>
        </div>
      )}
    </div>
  );
};
