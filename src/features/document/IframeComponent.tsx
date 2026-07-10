import React, { useState, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, ExternalLink, GripVertical } from 'lucide-react';

export const IframeComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, getPos }) => {
  const { src, width = 640, height = 360, alignment = 'center' } = node.attrs;
  const [isHovered, setIsHovered] = useState(false);
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleDragStart = (e: React.DragEvent) => {
    if (typeof getPos === 'function') {
      const pos = getPos();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-tiptap-node-drag', JSON.stringify({
        pos,
        type: node.type.name,
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      w: typeof width === 'number' ? width : parseInt(width) || 640,
      h: typeof height === 'number' ? height : parseInt(height) || 360,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const deltaX = moveEvent.clientX - startPos.current.x;
      const deltaY = moveEvent.clientY - startPos.current.y;

      let newWidth = startPos.current.w;
      let newHeight = startPos.current.h;

      if (corner.includes('right')) newWidth += deltaX;
      if (corner.includes('left')) newWidth -= deltaX;
      if (corner.includes('bottom')) newHeight += deltaY;
      if (corner.includes('top')) newHeight -= deltaY;

      newWidth = Math.max(200, Math.min(1600, Math.round(newWidth)));
      newHeight = Math.max(120, Math.min(1200, Math.round(newHeight)));

      updateAttributes({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getWrapperStyles = (): React.CSSProperties => {
    if (alignment === 'float-left') {
      return { float: 'left', margin: '0 1rem 1rem 0' };
    }
    if (alignment === 'float-right') {
      return { float: 'right', margin: '0 0 1rem 1rem' };
    }
    if (alignment === 'left') {
      return { display: 'flex', justifyContent: 'flex-start', margin: '1rem 0' };
    }
    if (alignment === 'right') {
      return { display: 'flex', justifyContent: 'flex-end', margin: '1rem 0' };
    }
    // Default center
    return { display: 'flex', justifyContent: 'center', margin: '1rem auto' };
  };

  return (
    <NodeViewWrapper
      className="iframe-node-wrapper relative inline-block transition-all group select-none"
      style={getWrapperStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Toolbar when selected or hovered */}
      {(selected || isHovered) && (
        <div
          contentEditable={false}
          className="absolute -top-11 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl text-[11px] text-slate-200 animate-in fade-in duration-150 select-none whitespace-nowrap"
        >
          {/* Drag Handle (#Drag & Drop) */}
          <div
            draggable
            onDragStart={handleDragStart}
            className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded cursor-grab active:cursor-grabbing font-semibold transition-colors border-r border-slate-700 pr-2 mr-0.5"
            title="Click and drag to drop iframe anywhere in document"
          >
            <GripVertical className="w-3.5 h-3.5" />
            <span>Drag Embed</span>
          </div>

          <span className="font-semibold text-cyan-400">Embed:</span>

          <button
            onClick={() => updateAttributes({ alignment: 'left' })}
            className={`p-1 rounded ${alignment === 'left' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateAttributes({ alignment: 'center' })}
            className={`p-1 rounded ${alignment === 'center' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateAttributes({ alignment: 'right' })}
            className={`p-1 rounded ${alignment === 'right' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />

          {/* Quick Presets */}
          <button
            onClick={() => updateAttributes({ width: 480, height: 270 })}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px]"
          >
            Small
          </button>
          <button
            onClick={() => updateAttributes({ width: 640, height: 360 })}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px]"
          >
            Medium
          </button>
          <button
            onClick={() => updateAttributes({ width: 800, height: 450 })}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px]"
          >
            Large
          </button>
          <button
            onClick={() => updateAttributes({ width: '100%', height: 480 })}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px]"
          >
            Full
          </button>

          <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />

          <span className="font-mono text-slate-400 text-[10px]">
            {typeof width === 'number' ? `${width}px` : width} × {typeof height === 'number' ? `${height}px` : height}
          </span>

          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-slate-800 text-cyan-400 rounded ml-0.5"
              title="Open Source URL"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Iframe Box Container */}
      <div
        className={`relative rounded-xl overflow-hidden transition-shadow ${
          selected ? 'ring-2 ring-indigo-500 shadow-xl' : 'border border-slate-700/80 shadow-md'
        }`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          maxWidth: '100%',
        }}
      >
        {/* Transparent overlay when selected to enable drag handles & prevent iframe from capturing clicks */}
        {selected && <div className="absolute inset-0 z-10 bg-indigo-500/10 pointer-events-auto" />}

        <iframe
          src={src || ''}
          width="100%"
          height="100%"
          frameBorder={0}
          allowFullScreen
          className="block w-full h-full bg-slate-900"
        />

        {/* 4 Corner Resizing Drag Handles */}
        {(selected || isHovered) && (
          <>
            {/* Top-Left */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'top-left')}
              className="absolute top-1 left-1 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full shadow-lg z-20 cursor-nwse-resize hover:scale-125 transition-transform"
            />
            {/* Top-Right */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'top-right')}
              className="absolute top-1 right-1 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full shadow-lg z-20 cursor-nesw-resize hover:scale-125 transition-transform"
            />
            {/* Bottom-Left */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
              className="absolute bottom-1 left-1 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full shadow-lg z-20 cursor-nesw-resize hover:scale-125 transition-transform"
            />
            {/* Bottom-Right */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
              className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full shadow-lg z-20 cursor-nwse-resize hover:scale-125 transition-transform"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};
