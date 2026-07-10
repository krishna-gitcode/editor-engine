import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { GripVertical, AlignLeft, AlignCenter, AlignRight, RotateCw, Trash2, Plus, Combine, Split } from 'lucide-react';

export const TableComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, getPos, editor }) => {
  const {
    width = '100%',
    height = 'auto',
    alignment = 'center',
    rotation = 0,
    theme = 'none',
    borderColor = '#cbd5e1',
    borderWidth = '1px',
  } = node.attrs;

  const [isHovered, setIsHovered] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const isRotating = useRef(false);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [colDividers, setColDividers] = useState<number[]>([]);
  const [rowDividers, setRowDividers] = useState<number[]>([]);

  const isWorkingOnTable = Boolean(
    editor &&
      editor.state &&
      typeof getPos === 'function' &&
      (
        (editor.state.selection.$from.pos >= getPos() &&
         editor.state.selection.$from.pos <= getPos() + node.nodeSize) ||
        selected
      )
  );
  const showControls = selected || isHovered || isWorkingOnTable;

  const updateDividers = useCallback(() => {
    if (!tableRef.current || !showControls) return;
    const tableEl = tableRef.current.querySelector('table');
    if (!tableEl) return;
    const rect = tableEl.getBoundingClientRect();

    // Get column dividers from first row
    const firstRowCells = tableEl.querySelectorAll('tr:first-child > td, tr:first-child > th');
    const cDivs: number[] = [];
    firstRowCells.forEach((cell, idx) => {
      if (idx < firstRowCells.length - 1) {
        const cRect = cell.getBoundingClientRect();
        cDivs.push(cRect.right - rect.left);
      }
    });
    setColDividers(cDivs);

    // Get row dividers from all rows
    const rows = tableEl.querySelectorAll('tr');
    const rDivs: number[] = [];
    rows.forEach((row, idx) => {
      if (idx < rows.length - 1) {
        const rRect = row.getBoundingClientRect();
        rDivs.push(rRect.bottom - rect.top);
      }
    });
    setRowDividers(rDivs);
  }, [showControls]);

  useEffect(() => {
    updateDividers();
    window.addEventListener('resize', updateDividers);
    return () => window.removeEventListener('resize', updateDividers);
  }, [updateDividers, width, height, node]);

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

  // Helper: batch-update all cells in one single transaction to avoid position drift
  const dispatchCellUpdates = (
    cellUpdates: Array<{ rowIdx: number; colIdx: number; attrs: Record<string, any> }>
  ) => {
    if (!editor || typeof getPos !== 'function') return;
    let tr = editor.state.tr;
    let tablePos = getPos() + 1; // start of table body

    for (let r = 0; r < node.childCount; r++) {
      const rowNode = node.child(r);
      let cellPos = tablePos + 1;
      for (let c = 0; c < rowNode.childCount; c++) {
        const cellNode = rowNode.child(c);
        const update = cellUpdates.find((u) => u.rowIdx === r && u.colIdx === c);
        if (update) {
          tr = tr.setNodeMarkup(cellPos, undefined, {
            ...cellNode.attrs,
            ...update.attrs,
          });
        }
        cellPos += cellNode.nodeSize;
      }
      tablePos += rowNode.nodeSize;
    }
    editor.view.dispatch(tr);
  };

  const handleMouseDownColResize = (e: React.MouseEvent, colIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tableRef.current || !editor || typeof getPos !== 'function') return;
    const tableEl = tableRef.current.querySelector('table');
    if (!tableEl) return;

    const firstRowCells = tableEl.querySelectorAll('tr:first-child > td, tr:first-child > th');
    if (!firstRowCells[colIdx]) return;

    const startX = e.clientX;
    // Snapshot actual DOM widths for ALL columns at drag start
    const initialWidths = Array.from(firstRowCells).map((c) => (c as HTMLElement).offsetWidth);
    const numCols = initialWidths.length;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const updates: Array<{ rowIdx: number; colIdx: number; attrs: Record<string, any> }> = [];

      if (colIdx < numCols - 1) {
        // Resize between colIdx and colIdx+1: shrink right, grow left
        const newLeft = Math.max(35, Math.round(initialWidths[colIdx] + deltaX));
        const newRight = Math.max(35, Math.round(initialWidths[colIdx + 1] - deltaX));
        if (newLeft < 35 || newRight < 35) return;

        for (let r = 0; r < node.childCount; r++) {
          for (let c = 0; c < numCols; c++) {
            // Always set ALL columns so none remain uninitialized (prevents collapse)
            let w = initialWidths[c] ?? 100;
            if (c === colIdx) w = newLeft;
            else if (c === colIdx + 1) w = newRight;
            updates.push({ rowIdx: r, colIdx: c, attrs: { width: w, colwidth: [w] } });
          }
        }
      } else {
        // Rightmost column edge → expand entire table width too
        const newLast = Math.max(35, Math.round(initialWidths[colIdx] + deltaX));
        const totalW = initialWidths.reduce((a, b) => a + b, 0) - initialWidths[colIdx] + newLast;
        for (let r = 0; r < node.childCount; r++) {
          for (let c = 0; c < numCols; c++) {
            const w = c === colIdx ? newLast : (initialWidths[c] ?? 100);
            updates.push({ rowIdx: r, colIdx: c, attrs: { width: w, colwidth: [w] } });
          }
        }
        updateAttributes({ width: totalW });
      }

      dispatchCellUpdates(updates);
      requestAnimationFrame(updateDividers);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDownRowResize = (e: React.MouseEvent, rowIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tableRef.current || !editor || typeof getPos !== 'function') return;
    const tableEl = tableRef.current.querySelector('table');
    if (!tableEl) return;

    const rows = tableEl.querySelectorAll('tr');
    if (!rows[rowIdx]) return;

    const startY = e.clientY;
    const initialHeights = Array.from(rows).map((r) => (r as HTMLElement).offsetHeight);
    const numRows = initialHeights.length;
    const numCols = node.childCount > 0 ? node.child(0).childCount : 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const updates: Array<{ rowIdx: number; colIdx: number; attrs: Record<string, any> }> = [];

      if (rowIdx < numRows - 1) {
        // Trade height between rowIdx and rowIdx+1
        const newTop = Math.max(28, Math.round(initialHeights[rowIdx] + deltaY));
        const newBottom = Math.max(28, Math.round(initialHeights[rowIdx + 1] - deltaY));
        if (newTop < 28 || newBottom < 28) return;

        for (let r = 0; r < node.childCount; r++) {
          let h = initialHeights[r] ?? 40;
          if (r === rowIdx) h = newTop;
          else if (r === rowIdx + 1) h = newBottom;
          const rowNode = node.child(r);
          for (let c = 0; c < rowNode.childCount; c++) {
            updates.push({ rowIdx: r, colIdx: c, attrs: { height: h } });
          }
        }
      } else {
        // Bottom edge of last row → expand
        const newLast = Math.max(28, Math.round(initialHeights[rowIdx] + deltaY));
        const rowNode = node.child(rowIdx);
        for (let c = 0; c < rowNode.childCount; c++) {
          updates.push({ rowIdx: rowIdx, colIdx: c, attrs: { height: newLast } });
        }
        const totalH = initialHeights.reduce((a, b) => a + b, 0) - initialHeights[rowIdx] + newLast;
        updateAttributes({ height: totalH });
      }

      dispatchCellUpdates(updates);
      requestAnimationFrame(updateDividers);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDownResize = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    if (!tableRef.current || !editor || typeof getPos !== 'function') return;
    const tableEl = tableRef.current.querySelector('table');
    if (!tableEl) return;

    const currentW = tableRef.current.offsetWidth || (typeof width === 'number' ? width : parseInt(width) || 600);
    const currentH = tableRef.current.offsetHeight || (typeof height === 'number' ? height : parseInt(height) || 200);

    const firstRowCells = tableEl.querySelectorAll('tr:first-child > td, tr:first-child > th');
    const rows = tableEl.querySelectorAll('tr');
    const initialColWidths = Array.from(firstRowCells).map((c) => (c as HTMLElement).offsetWidth);
    const initialRowHeights = Array.from(rows).map((r) => (r as HTMLElement).offsetHeight);

    startPos.current = { x: e.clientX, y: e.clientY, w: currentW, h: currentH };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const deltaX = moveEvent.clientX - startPos.current.x;
      const deltaY = moveEvent.clientY - startPos.current.y;

      let newW = startPos.current.w;
      let newH = startPos.current.h;
      if (corner.includes('right')) newW += deltaX;
      if (corner.includes('left')) newW -= deltaX;
      if (corner.includes('bottom')) newH += deltaY;
      if (corner.includes('top')) newH -= deltaY;
      newW = Math.max(150, Math.min(2400, Math.round(newW)));
      newH = Math.max(50, Math.min(2400, Math.round(newH)));

      const scaleX = newW / startPos.current.w;
      const scaleY = newH / startPos.current.h;

      const updates: Array<{ rowIdx: number; colIdx: number; attrs: Record<string, any> }> = [];
      for (let r = 0; r < node.childCount; r++) {
        const rowNode = node.child(r);
        const targetH = Math.max(28, Math.round((initialRowHeights[r] || 40) * scaleY));
        for (let c = 0; c < rowNode.childCount; c++) {
          const targetW = Math.max(35, Math.round((initialColWidths[c] || 100) * scaleX));
          updates.push({ rowIdx: r, colIdx: c, attrs: { width: targetW, colwidth: [targetW], height: targetH } });
        }
      }
      dispatchCellUpdates(updates);
      updateAttributes({ width: newW, height: newH });
      requestAnimationFrame(updateDividers);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };


  const handleMouseDownRotate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isRotating.current = true;

    if (tableRef.current) {
      const rect = tableRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isRotating.current) return;
        const angleRad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
        let angleDeg = Math.round(angleRad * (180 / Math.PI)) + 90;
        while (angleDeg > 180) angleDeg -= 360;
        while (angleDeg <= -180) angleDeg += 360;

        updateAttributes({ rotation: angleDeg });
      };

      const handleMouseUp = () => {
        isRotating.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  const getWrapperStyles = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'block',
      margin: '2rem auto',
      width: typeof width === 'number' ? `${width}px` : width || '100%',
      maxWidth: '100%',
    };

    if (alignment === 'left') {
      baseStyle.margin = '2rem 0';
      baseStyle.marginRight = 'auto';
    } else if (alignment === 'right') {
      baseStyle.margin = '2rem 0';
      baseStyle.marginLeft = 'auto';
    } else if (alignment === 'float-left') {
      baseStyle.float = 'left';
      baseStyle.margin = '0 1.5rem 1.5rem 0';
    } else if (alignment === 'float-right') {
      baseStyle.float = 'right';
      baseStyle.margin = '0 0 1.5rem 1.5rem';
    }

    return baseStyle;
  };

  return (
    <NodeViewWrapper
      className="table-node-wrapper relative block w-full transition-all group select-none"
      style={getWrapperStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Rotation Twist Handle (Twisting/stretching by mouse) */}
      {showControls && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 pointer-events-auto">
          <div
            onMouseDown={handleMouseDownRotate}
            className="w-6 h-6 bg-cyan-500 hover:bg-cyan-400 border-2 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-125"
            title="Click and drag/twist with mouse to freely rotate table"
          >
            <RotateCw className="w-3.5 h-3.5 text-white pointer-events-none" />
          </div>
          <div className="w-[2px] h-3.5 bg-cyan-500 shadow" />
        </div>
      )}

      {/* Floating Control Bar & Drag Handle when Selected or Hovered or Working inside Table */}
      {showControls && (
        <div
          contentEditable={false}
          className="absolute -top-11 left-0 z-40 flex flex-wrap items-center gap-1.5 px-2.5 py-1 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl text-[11px] text-slate-200 animate-in fade-in duration-150 whitespace-nowrap"
        >
          {/* Drag Handle (#Drag & Drop) */}
          <div
            draggable
            onDragStart={handleDragStart}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded cursor-grab active:cursor-grabbing font-semibold transition-colors mr-0.5"
            title="Click and drag to drop table anywhere in the document"
          >
            <GripVertical className="w-3.5 h-3.5" />
            <span>Drag Table</span>
          </div>

          <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />

          {/* Alignment controls (#8) */}
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

          {/* Width Presets */}
          {['100%', '75%', '50%', 'auto'].map((w) => (
            <button
              key={w}
              onClick={() => updateAttributes({ width: w })}
              className={`px-1.5 py-0.5 rounded text-[10px] ${width === w ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              {w}
            </button>
          ))}

          <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />

          {/* Rotation Toggle */}
          <button
            onClick={() => updateAttributes({ rotation: ((rotation || 0) + 15) % 360 })}
            className="p-1 bg-slate-800 hover:bg-slate-700 rounded flex items-center gap-1 text-cyan-300 text-[10px]"
            title="Rotate Table +15°"
          >
            <RotateCw className="w-3 h-3" />
            <span>{rotation || 0}°</span>
          </button>
          {rotation !== 0 && (
            <button
              onClick={() => updateAttributes({ rotation: 0 })}
              className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[9px] text-red-300"
            >
              Reset
            </button>
          )}

          <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />

          {/* Quick Row/Col Add & Cell Merge/Split */}
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] flex items-center gap-0.5 text-slate-300"
            title="Add Row Below"
          >
            <Plus className="w-2.5 h-2.5" /> Row
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] flex items-center gap-0.5 text-slate-300"
            title="Add Column Right"
          >
            <Plus className="w-2.5 h-2.5" /> Col
          </button>
          <button
            onClick={() => editor.chain().focus().mergeCells().run()}
            className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            title="Merge Selected Cells"
          >
            <Combine className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().splitCell().run()}
            className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            title="Split Cell"
          >
            <Split className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="p-1 bg-red-900/40 text-red-400 hover:bg-red-900/60 rounded ml-0.5"
            title="Delete Table"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Actual Table Rendered inside NodeViewContent with Interactive Resizing Handles around box */}
      <div
        ref={tableRef}
        onMouseMove={updateDividers}
        className={`w-full relative overflow-visible rounded transition-shadow ${
          selected || isWorkingOnTable ? 'ring-2 ring-indigo-500/80 shadow-xl' : ''
        }`}
        style={{
          transform: rotation ? `rotate(${rotation}deg)` : 'none',
          transformOrigin: 'center center',
        }}
      >
        <NodeViewContent
          as="table"
          className={`custom-prosemirror-table table-theme-${theme} w-full`}
          style={{
            width: typeof width === 'number' ? `${width}px` : width || '100%',
            height: typeof height === 'number' ? `${height}px` : height !== 'auto' ? height : undefined,
            '--custom-table-border-color': borderColor || '#cbd5e1',
            '--custom-table-border-width': borderWidth || '1px',
          } as React.CSSProperties}
        />

        {/* Interactive Column Divider Drag Bars */}
        {showControls && colDividers.map((leftPx, idx) => (
          <div
            key={`col-div-${idx}`}
            onMouseDown={(e) => handleMouseDownColResize(e, idx)}
            className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize z-40 flex justify-center group/divcol pointer-events-auto"
            style={{ left: `${leftPx}px` }}
            title="Click and drag horizontally to stretch column width"
          >
            <div className="w-[3px] h-full bg-cyan-500/80 rounded opacity-40 group-hover/divcol:opacity-100 transition-opacity shadow" />
          </div>
        ))}

        {/* Interactive Row Divider Drag Bars */}
        {showControls && rowDividers.map((topPx, idx) => (
          <div
            key={`row-div-${idx}`}
            onMouseDown={(e) => handleMouseDownRowResize(e, idx)}
            className="absolute left-0 right-0 h-3 -mt-1.5 cursor-row-resize z-40 flex items-center justify-center group/divrow pointer-events-auto"
            style={{ top: `${topPx}px` }}
            title="Click and drag vertically to stretch row height"
          >
            <div className="h-[3px] w-full bg-cyan-500/80 rounded opacity-40 group-hover/divrow:opacity-100 transition-opacity shadow" />
          </div>
        ))}

        {/* Interactive Mouse Stretching Resize Handles (4 Corners + Right/Bottom Edges) */}
        {showControls && (
          <>
            {/* Top-Left Corner */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'top-left')}
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full shadow-lg z-30 cursor-nwse-resize hover:scale-125 transition-transform pointer-events-auto"
              title="Click and drag corner with mouse to resize dimensions"
            />
            {/* Top-Right Corner */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'top-right')}
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full shadow-lg z-30 cursor-nesw-resize hover:scale-125 transition-transform pointer-events-auto"
              title="Click and drag corner with mouse to resize dimensions"
            />
            {/* Bottom-Left Corner */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'bottom-left')}
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full shadow-lg z-30 cursor-nesw-resize hover:scale-125 transition-transform pointer-events-auto"
              title="Click and drag corner with mouse to resize dimensions"
            />
            {/* Bottom-Right Corner */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'bottom-right')}
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full shadow-lg z-30 cursor-nwse-resize hover:scale-125 transition-transform pointer-events-auto"
              title="Click and drag corner with mouse to resize dimensions"
            />
            {/* Right Edge Stretch Bar */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'right')}
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-6 bg-indigo-500 border-2 border-white rounded shadow-lg z-30 cursor-ew-resize hover:scale-110 transition-transform pointer-events-auto"
              title="Click and stretch right with mouse to increase width"
            />
            {/* Bottom Edge Stretch Bar */}
            <div
              onMouseDown={(e) => handleMouseDownResize(e, 'bottom')}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-indigo-500 border-2 border-white rounded shadow-lg z-30 cursor-ns-resize hover:scale-110 transition-transform pointer-events-auto"
              title="Click and stretch down with mouse to increase height"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};
