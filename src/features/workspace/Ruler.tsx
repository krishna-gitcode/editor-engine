import React from 'react';
import { useWorkspaceStore, TabType } from '../../store/workspaceStore';
import './Ruler.css';

const TAB_ICONS: Record<TabType, React.ReactNode> = {
  left: <path d="M2,1 L2,9 L8,9 L8,8 L3,8 L3,1 Z" fill="currentColor" />,
  right: <path d="M8,1 L8,9 L2,9 L2,8 L7,8 L7,1 Z" fill="currentColor" />,
  center: <path d="M4.5,1 L4.5,8 L1,8 L1,9 L9,9 L9,8 L5.5,8 L5.5,1 Z" fill="currentColor" />,
  decimal: (
    <>
      <path d="M4.5,1 L4.5,8 L1,8 L1,9 L9,9 L9,8 L5.5,8 L5.5,1 Z" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="1" fill="currentColor" />
    </>
  ),
};

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  length: number;
  zoom?: number;
}

export const Ruler: React.FC<RulerProps> = ({ orientation, length, zoom = 1.0 }) => {
  const ticksCount = Math.floor(length / 50);
  
  const { activeTabType, setActiveTabType, tabStops, addTabStop, removeTabStop } = useWorkspaceStore();

  const handleTabSelectorClick = () => {
    const order: TabType[] = ['left', 'center', 'right', 'decimal'];
    const nextIdx = (order.indexOf(activeTabType) + 1) % order.length;
    setActiveTabType(order[nextIdx]);
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (orientation !== 'horizontal') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const position = clickX / zoom;
    addTabStop({
      id: Math.random().toString(36).substring(2, 9),
      position,
      type: activeTabType,
    });
  };

  return (
    <div
      onClick={handleRulerClick}
      className={`absolute z-30 bg-slate-900 border-slate-800 select-none text-[10px] text-slate-400 print:hidden ${
        orientation === 'horizontal'
          ? '-top-6 left-0 right-0 h-6 border-b border-t flex items-end pointer-events-auto cursor-crosshair'
          : 'top-0 -left-6 bottom-0 w-6 border-r border-l flex flex-col items-end pointer-events-none'
      }`}
    >
      {/* Major Ticks */}
      {Array.from({ length: ticksCount + 1 }).map((_, i) => (
        <div
          key={`major-${i}`}
          className={`absolute border-slate-600 font-mono text-[9px] ${
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
      
      {/* Minor Ticks every 10px */}
      {Array.from({ length: (ticksCount * 5) + 1 }).map((_, i) => (
        <div
          key={`minor-${i}`}
          className={`absolute border-slate-700/50 ${
            orientation === 'horizontal'
              ? 'border-l h-1.5'
              : 'border-t w-1.5'
          }`}
          style={{
            ...(orientation === 'horizontal' ? { top: '18px', left: `${i * 10 * zoom}px` } : { left: '18px', top: `${i * 10 * zoom}px` })
          }}
        />
      ))}

      {/* Tab Stop Selector (MS Word Style) */}
      {orientation === 'vertical' && (
        <div 
          className="absolute -top-6 -left-[1px] w-6 h-6 border-b border-r border-slate-800 bg-slate-900 flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-slate-800 transition-colors"
          title={`Tab Stop Selector (${activeTabType.charAt(0).toUpperCase() + activeTabType.slice(1)} Tab)`}
          onClick={handleTabSelectorClick}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-slate-400">
            {TAB_ICONS[activeTabType]}
          </svg>
        </div>
      )}

      {/* Placed Tab Stops on Horizontal Ruler */}
      {orientation === 'horizontal' && tabStops.map((tab) => (
        <div
          key={tab.id}
          className="absolute top-2.5 w-2 h-2 text-slate-200 pointer-events-auto cursor-pointer hover:text-red-400 transition-colors"
          style={{ left: `${(tab.position * zoom) - 4}px` }}
          title={`Remove ${tab.type} tab stop`}
          onClick={(e) => {
            e.stopPropagation();
            removeTabStop(tab.id);
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            {TAB_ICONS[tab.type]}
          </svg>
        </div>
      ))}
    </div>
  );
};
