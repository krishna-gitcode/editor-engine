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
      className={`absolute z-30 bg-slate-900 border-slate-800 select-none text-[10px] text-slate-400 pointer-events-none overflow-hidden print:hidden ${
        orientation === 'horizontal'
          ? '-top-6 left-0 right-0 h-6 border-b border-t flex items-end'
          : 'top-0 -left-6 bottom-0 w-6 border-r border-l flex flex-col items-end'
      }`}
    >
      {Array.from({ length: ticksCount + 1 }).map((_, i) => (
        <div
          key={i}
          className={`absolute border-slate-700 font-mono text-[9px] ${
            orientation === 'horizontal'
              ? 'border-l h-3 pl-1 top-3 flex items-start'
              : 'border-t w-3 pt-0.5 pl-1 left-3 flex items-start'
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
