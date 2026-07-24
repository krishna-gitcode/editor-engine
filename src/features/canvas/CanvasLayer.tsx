import React, { useEffect, useRef, useState } from 'react';
import { CanvasEngine } from '../../core/engine/CanvasEngine';
import { useCanvasStore } from '../../store/canvasStore';
import { AICanvasPanel } from './AICanvasPanel';
import { Sparkles } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import './CanvasLayer.css';

interface CanvasLayerProps {
  width?: number;
  height?: number;
  onEngineReady?: (engine: CanvasEngine) => void;
}

export const CanvasLayer: React.FC<CanvasLayerProps> = ({
  width = 816,
  height = 1056,
  onEngineReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new CanvasEngine();
    engine.init(canvasRef.current);
    engineRef.current = engine;

    if (onEngineReady) {
      onEngineReady(engine);
    }

    // Dynamic pointer pass-through for Hybrid Canvas mode (Point #5)
    const fabricCanvas = engine.canvas as any;
    let rafId: number | null = null;

    const handlePointerPassThrough = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      
      rafId = requestAnimationFrame(() => {
        if (!fabricCanvas || !fabricCanvas.upperCanvasEl) return;
        const upperCanvas = fabricCanvas.upperCanvasEl;

        const state = useCanvasStore.getState();
        const activeObj = fabricCanvas.getActiveObject();

        if (state.isDrawingPolygon || activeObj || fabricCanvas._isCurrentlyDrawing || fabricCanvas.isDrawingMode) {
          upperCanvas.style.setProperty('pointer-events', 'auto', 'important');
          return;
        }

        // Fast bounds check
        const rect = upperCanvas.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          upperCanvas.style.setProperty('pointer-events', 'none', 'important');
          return;
        }

        // Check if mouse coordinate hits any vector object on canvas
        const target = fabricCanvas.findTarget(e, false);
        if (target && target.type !== 'canvas') {
          upperCanvas.style.setProperty('pointer-events', 'auto', 'important');
        } else {
          upperCanvas.style.setProperty('pointer-events', 'none', 'important');
        }
      });
    };

    window.addEventListener('mousemove', handlePointerPassThrough, { passive: true });

    if (fabricCanvas) {
      fabricCanvas.on('mouse:down', (e: any) => {
        if (!e.target) {
          const editor = (window as any).__activeEditor;
          if (editor) {
            editor.commands.focus();
            fabricCanvas.discardActiveObject();
            fabricCanvas.requestRenderAll();
          }
        }
      });
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerPassThrough);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && engineRef.current.canvas) {
      engineRef.current.canvas.setDimensions({ width, height });
      engineRef.current.canvas.requestRenderAll();
    }
  }, [width, height]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute top-4 right-4 pointer-events-auto flex flex-col items-end gap-2 z-50">
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="bg-slate-800 text-emerald-400 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border border-slate-700 shadow-lg"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Layout
        </button>
        <AnimatePresence>
          {showAIPanel && engineRef.current?.canvas && (
            <AICanvasPanel
              fabricCanvas={engineRef.current.canvas}
              onClose={() => setShowAIPanel(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
