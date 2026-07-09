import React, { useEffect, useRef } from 'react';
import { CanvasEngine } from '../../core/engine/CanvasEngine';
import { useCanvasStore } from '../../store/canvasStore';
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

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new CanvasEngine();
    engine.init(canvasRef.current);
    engineRef.current = engine;

    if (onEngineReady) {
      onEngineReady(engine);
    }

    return () => {
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
    <div className="absolute inset-0 pointer-events-auto z-10 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
