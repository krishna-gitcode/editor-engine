import React from 'react';
import './Ruler.css';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  length: number;
  zoom?: number;
}

export const Ruler: React.FC<RulerProps> = ({ orientation, length, zoom = 1.0 }) => {
  const ticksCount = Math.floor(length / 50);

  return (
    <div
      className={`absolute z-20 bg-slate-900 border-slate-800 select-none text-[10px] text-slate-400 ${
        orientation === 'horizontal'
          ? 'top-0 left-12 right-0 h-6 border-b flex items-end'
          : 'top-12 left-0 bottom-0 w-6 border-r flex flex-col items-end'
      }`}
    >
      {Array.from({ length: ticksCount }).map((_, i) => (
        <div
          key={i}
          className={`absolute border-slate-700 ${
            orientation === 'horizontal'
              ? 'border-l h-3 pl-1 top-3'
              : 'border-t w-3 pt-1 left-3'
          }`}
          style={
            orientation === 'horizontal'
              ? { left: `${i * 50 * zoom}px` }
              : { top: `${i * 50 * zoom}px` }
          }
        >
          {i * 50}
        </div>
      ))}
    </div>
  );
};
