import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import './MarginHandles.css';

interface MarginHandlesProps {
  pageWidth: number;
  pageHeight: number;
}

export const MarginHandles: React.FC<MarginHandlesProps> = ({ pageWidth, pageHeight }) => {
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);
  const zoom = useWorkspaceStore((s) => s.zoom);
  const linkMargins = useWorkspaceStore((s) => s.linkMargins);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const { top, right, bottom, left } = activePage.margins;

  const [draggingSide, setDraggingSide] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const [dragValue, setDragValue] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (side: 'top' | 'right' | 'bottom' | 'left', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingSide(side);
    setDragValue(activePage.margins[side]);
  };

  useEffect(() => {
    if (!draggingSide) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let newMargin = 72;
      if (draggingSide === 'top') {
        newMargin = Math.round((e.clientY - rect.top) / zoom);
        newMargin = Math.max(0, Math.min(pageHeight / 2 - 20, newMargin));
      } else if (draggingSide === 'bottom') {
        newMargin = Math.round((rect.bottom - e.clientY) / zoom);
        newMargin = Math.max(0, Math.min(pageHeight / 2 - 20, newMargin));
      } else if (draggingSide === 'left') {
        newMargin = Math.round((e.clientX - rect.left) / zoom);
        newMargin = Math.max(0, Math.min(pageWidth / 2 - 20, newMargin));
      } else if (draggingSide === 'right') {
        newMargin = Math.round((rect.right - e.clientX) / zoom);
        newMargin = Math.max(0, Math.min(pageWidth / 2 - 20, newMargin));
      }

      setDragValue(newMargin);
      if (linkMargins) {
        updatePageSettings(activePage.id, {
          margins: {
            top: newMargin,
            right: newMargin,
            bottom: newMargin,
            left: newMargin,
          },
        });
      } else {
        updatePageSettings(activePage.id, {
          margins: {
            ...activePage.margins,
            [draggingSide]: newMargin,
          },
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingSide(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingSide, zoom, pageWidth, pageHeight, activePage, updatePageSettings]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none print:hidden">
      {/* Top Margin Guide */}
      <div
        onMouseDown={(e) => handleMouseDown('top', e)}
        className="absolute left-0 right-0 h-2 -mt-1 pointer-events-auto cursor-ns-resize group flex items-center justify-center transition-colors hover:bg-indigo-500/20"
        style={{ top: `${top}px` }}
      >
        <div className="w-full border-t border-dashed border-indigo-500/60 group-hover:border-indigo-600 group-hover:border-solid" />
        <span className="absolute left-4 bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
          Top: {top}px ({(top / 72).toFixed(2)}in)
        </span>
      </div>

      {/* Bottom Margin Guide */}
      <div
        onMouseDown={(e) => handleMouseDown('bottom', e)}
        className="absolute left-0 right-0 h-2 -mb-1 pointer-events-auto cursor-ns-resize group flex items-center justify-center transition-colors hover:bg-indigo-500/20"
        style={{ bottom: `${bottom}px` }}
      >
        <div className="w-full border-b border-dashed border-indigo-500/60 group-hover:border-indigo-600 group-hover:border-solid" />
        <span className="absolute left-4 bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
          Bottom: {bottom}px ({(bottom / 72).toFixed(2)}in)
        </span>
      </div>

      {/* Left Margin Guide */}
      <div
        onMouseDown={(e) => handleMouseDown('left', e)}
        className="absolute top-0 bottom-0 w-2 -ml-1 pointer-events-auto cursor-ew-resize group flex items-center justify-center transition-colors hover:bg-indigo-500/20"
        style={{ left: `${left}px` }}
      >
        <div className="h-full border-l border-dashed border-indigo-500/60 group-hover:border-indigo-600 group-hover:border-solid" />
        <span className="absolute top-4 left-2 bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Left: {left}px ({(left / 72).toFixed(2)}in)
        </span>
      </div>

      {/* Right Margin Guide */}
      <div
        onMouseDown={(e) => handleMouseDown('right', e)}
        className="absolute top-0 bottom-0 w-2 -mr-1 pointer-events-auto cursor-ew-resize group flex items-center justify-center transition-colors hover:bg-indigo-500/20"
        style={{ right: `${right}px` }}
      >
        <div className="h-full border-r border-dashed border-indigo-500/60 group-hover:border-indigo-600 group-hover:border-solid" />
        <span className="absolute top-4 right-2 bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Right: {right}px ({(right / 72).toFixed(2)}in)
        </span>
      </div>

      {/* Active Drag Overlay feedback */}
      {draggingSide && (
        <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none flex items-center justify-center">
          <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-2xl border border-indigo-500/40">
            Adjusting {draggingSide.toUpperCase()} Margin: {dragValue}px ({(dragValue / 72).toFixed(2)} in)
          </div>
        </div>
      )}
    </div>
  );
};
