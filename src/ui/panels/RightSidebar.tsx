import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useDocumentStore } from '../../store/documentStore';
import { ImageTools } from '../../features/canvas/ImageTools';
import { Sliders, ArrowUp, ArrowDown, Trash2, Copy, Layers, Table, Monitor, RotateCw, Maximize2 } from 'lucide-react';
import './RightSidebar.css';

interface RightSidebarProps {
  engine: any;
  editor?: any;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ engine, editor }) => {
  const selectedObject = useCanvasStore((s) => s.selectedObjectProps);
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const activeEditor = editor || (window as any).__activeEditor;
  const [, setEditorTick] = useState(0);

  useEffect(() => {
    if (!activeEditor) return;
    const forceUpdate = () => setEditorTick((t) => t + 1);
    activeEditor.on('selectionUpdate', forceUpdate);
    activeEditor.on('update', forceUpdate);
    return () => {
      activeEditor.off('selectionUpdate', forceUpdate);
      activeEditor.off('update', forceUpdate);
    };
  }, [activeEditor]);

  const handlePropChange = (key: string, value: any) => {
    if (!engine) return;
    engine.updateSelected({ [key]: value });
  };

  const isTableActive = activeEditor && activeEditor.isActive('table');
  const isIframeActive = activeEditor && activeEditor.isActive('iframe');
  const iframeAttrs = isIframeActive ? activeEditor.getAttributes('iframe') : {};
  const tableAttrs = isTableActive ? activeEditor.getAttributes('table') : {};

  return (
    <div className="w-72 h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto p-4 select-none z-20 text-slate-200">
      {/* If Canvas Object is Selected */}
      {selectedObject ? (
        <div className="space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-sm font-bold text-slate-100 uppercase tracking-wide">{selectedObject.type}</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[160px]">ID: {selectedObject.id}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => engine?.copySelected()} className="p-1.5 rounded hover:bg-slate-800 text-slate-300" title="Duplicate">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={() => engine?.deleteSelected()} className="p-1.5 rounded hover:bg-slate-800 text-red-400" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* If object is an Image, render ImageTools */}
          {selectedObject.type === 'image' && (
            <div>
              <div className="font-semibold text-slate-300 mb-2">Image Quick Actions</div>
              <ImageTools engine={engine} />
            </div>
          )}

          {/* Position & Size */}
          <div>
            <div className="font-semibold text-slate-300 mb-2.5">Position & Dimensions</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">X Position</span>
                <input
                  type="number"
                  value={selectedObject.left ?? 0}
                  onChange={(e) => handlePropChange('left', parseInt(e.target.value) || 0)}
                  className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Y Position</span>
                <input
                  type="number"
                  value={selectedObject.top ?? 0}
                  onChange={(e) => handlePropChange('top', parseInt(e.target.value) || 0)}
                  className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Width</span>
                <input
                  type="number"
                  value={selectedObject.width ?? 0}
                  onChange={(e) => handlePropChange('width', Math.max(10, parseInt(e.target.value) || 10))}
                  className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Height</span>
                <input
                  type="number"
                  value={selectedObject.height ?? 0}
                  onChange={(e) => handlePropChange('height', Math.max(10, parseInt(e.target.value) || 10))}
                  className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Rotation & Corner Radius */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400">Rotation (deg)</span>
              <input
                type="number"
                value={selectedObject.angle ?? 0}
                onChange={(e) => handlePropChange('angle', parseInt(e.target.value) || 0)}
                className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              />
            </div>
            {['rect', 'textbox'].includes(selectedObject.type || '') && (
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Corner Radius</span>
                <input
                  type="number"
                  value={selectedObject.rx ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    handlePropChange('rx', val);
                    handlePropChange('ry', val);
                  }}
                  className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
                />
              </div>
            )}
          </div>

          {/* Color & Styling */}
          <div>
            <div className="font-semibold text-slate-300 mb-2.5">Fill & Border Styling</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 p-2 rounded bg-slate-800 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Fill</span>
                  <input
                    type="color"
                    value={typeof selectedObject.fill === 'string' && selectedObject.fill !== 'transparent' ? selectedObject.fill : '#6366f1'}
                    onChange={(e) => handlePropChange('fill', e.target.value)}
                    disabled={selectedObject.fill === 'transparent'}
                    className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded disabled:opacity-40"
                  />
                </div>
                <button
                  onClick={() => handlePropChange('fill', selectedObject.fill === 'transparent' ? '#6366f1' : 'transparent')}
                  className={`w-full py-1 px-1.5 rounded text-[10px] font-medium transition-all flex items-center justify-center gap-1 ${
                    selectedObject.fill === 'transparent'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span>{selectedObject.fill === 'transparent' ? '🚫 Transparent' : '✨ Make Transparent'}</span>
                </button>
              </div>
              <div className="flex flex-col justify-between p-2 rounded bg-slate-800 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Stroke</span>
                  <input
                    type="color"
                    value={typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#334155'}
                    onChange={(e) => handlePropChange('stroke', e.target.value)}
                    className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded"
                  />
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                  Color for outline border
                </div>
              </div>
            </div>

            {/* Insertion of text into shapes */}
            {['rect', 'circle', 'triangle', 'polygon', 'path', 'group'].includes(selectedObject.type || '') && (
              <div className="mt-3 p-2.5 rounded bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-400">📝 Text Inside Shape</span>
                  <span className="text-[10px] text-slate-400">Overlay Center</span>
                </div>
                <input
                  type="text"
                  value={selectedObject.text || ''}
                  onChange={(e) => {
                    if (engine?.addOrUpdateShapeText) {
                      engine.addOrUpdateShapeText(e.target.value);
                    } else {
                      handlePropChange('text', e.target.value);
                    }
                  }}
                  placeholder="Type text inside shape..."
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>
            )}

            <div className="mt-2 flex flex-col">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Stroke Width</span>
                <span>{selectedObject.strokeWidth ?? 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={selectedObject.strokeWidth ?? 0}
                onChange={(e) => handlePropChange('strokeWidth', parseInt(e.target.value) || 0)}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
            <div className="mt-3 flex flex-col">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Opacity</span>
                <span>{Math.round((selectedObject.opacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedObject.opacity ?? 1}
                onChange={(e) => handlePropChange('opacity', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Layer Ordering */}
          <div>
            <div className="font-semibold text-slate-300 mb-2">Layer Ordering</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => engine?.bringForward()}
                className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Bring Forward</span>
              </button>
              <button
                onClick={() => engine?.sendBackward()}
                className="flex items-center justify-center gap-1.5 p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : isTableActive ? (
        /* Table Dynamic Adjustment Inspector (#8, #9) */
        <div className="space-y-5 text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Table className="w-4 h-4" />
                <span>Table Inspector</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Dynamically adjust table dimensions, position & columns.</p>
            </div>
            <button
              onClick={() => activeEditor.chain().focus().deleteTable().run()}
              className="p-1.5 hover:bg-red-950 text-red-400 rounded"
              title="Delete Table"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Table Theme & Borders */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Table Theme & Color Scheme</label>
              <select
                value={tableAttrs.theme || 'none'}
                onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ theme: e.target.value }).run()}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100"
              >
                <option value="none">Standard Plain Border</option>
                <option value="modern-dark">Modern Dark (Indigo Accent)</option>
                <option value="classic-blue">Classic Blue Header</option>
                <option value="minimal-gray">Minimal Slate Gray</option>
                <option value="warm-amber">Warm Amber Highlight</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Border Color</label>
                <input
                  type="color"
                  value={tableAttrs.borderColor || '#cbd5e1'}
                  onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ borderColor: e.target.value }).run()}
                  className="w-full h-8 p-1 bg-slate-800 border border-slate-700 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Border Width</label>
                <select
                  value={tableAttrs.borderWidth || '1px'}
                  onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ borderWidth: e.target.value }).run()}
                  className="w-full h-8 bg-slate-800 border border-slate-700 rounded px-2 text-slate-100"
                >
                  <option value="0px">0px (Invisible)</option>
                  <option value="1px">1px Standard</option>
                  <option value="2px">2px Medium</option>
                  <option value="3px">3px Bold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Dimensions, Alignment & Rotation (#8) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="font-semibold text-slate-300 text-[11px]">Table Dimensions & Alignment</div>

            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Table Overall Width</label>
              <div className="grid grid-cols-4 gap-1 mb-1.5">
                {['100%', '75%', '50%', 'auto'].map((w) => (
                  <button
                    key={w}
                    onClick={() => activeEditor.chain().focus().updateTableAttributes({ width: w }).run()}
                    className={`py-1 rounded text-center text-[10px] ${tableAttrs.width === w ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Custom width (e.g. 500px or 80%)"
                value={tableAttrs.width || '100%'}
                onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ width: e.target.value }).run()}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Table Position / Alignment</label>
              <select
                value={tableAttrs.alignment || 'center'}
                onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ alignment: e.target.value }).run()}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
              >
                <option value="left">Left Aligned</option>
                <option value="center">Center Aligned</option>
                <option value="right">Right Aligned</option>
                <option value="float-left">Float Left (Wrap Text Right)</option>
                <option value="float-right">Float Right (Wrap Text Left)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                <span>Table Rotation</span>
                <span className="font-mono text-cyan-300">{tableAttrs.rotation || 0}°</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={tableAttrs.rotation || 0}
                  onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ rotation: parseInt(e.target.value) || 0 }).run()}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => activeEditor.chain().focus().updateTableAttributes({ rotation: 0 }).run()}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-red-300 rounded"
                >
                  Reset
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Cell Padding</label>
              <select
                value={tableAttrs.cellPadding || '8px 12px'}
                onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ cellPadding: e.target.value }).run()}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
              >
                <option value="4px 8px">Small / Compact (4px 8px)</option>
                <option value="8px 12px">Medium Standard (8px 12px)</option>
                <option value="12px 16px">Large Spacious (12px 16px)</option>
                <option value="16px 24px">Extra Large (16px 24px)</option>
              </select>
            </div>
          </div>

          {/* Column & Row Dimensions (#9) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="font-semibold text-slate-300 text-[11px] flex items-center justify-between">
              <span>Column & Row Dimensions</span>
              <span className="text-[10px] text-emerald-400 font-normal">Active Cell</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Cell Width (px/% / auto)</label>
                <input
                  type="text"
                  placeholder="e.g. 150px or 25%"
                  onBlur={(e) => activeEditor.chain().focus().updateActiveCellAttributes({ width: e.target.value }).run()}
                  onKeyDown={(e) => e.key === 'Enter' && activeEditor.chain().focus().updateActiveCellAttributes({ width: e.currentTarget.value }).run()}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Row Height (px / auto)</label>
                <input
                  type="text"
                  placeholder="e.g. 45px or auto"
                  onBlur={(e) => activeEditor.chain().focus().updateActiveCellAttributes({ height: e.target.value }).run()}
                  onKeyDown={(e) => e.key === 'Enter' && activeEditor.chain().focus().updateActiveCellAttributes({ height: e.currentTarget.value }).run()}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Cell Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  onChange={(e) => activeEditor.chain().focus().updateActiveCellAttributes({ backgroundColor: e.target.value }).run()}
                  className="w-12 h-7 bg-slate-800 border border-slate-700 rounded cursor-pointer"
                />
                <button
                  onClick={() => activeEditor.chain().focus().updateActiveCellAttributes({ backgroundColor: null }).run()}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded"
                >
                  Clear Color
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => activeEditor.chain().focus().addColumnBefore().run()}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-slate-300 text-[11px]"
              >
                + Col Before
              </button>
              <button
                onClick={() => activeEditor.chain().focus().addColumnAfter().run()}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-slate-300 text-[11px]"
              >
                + Col After
              </button>
              <button
                onClick={() => activeEditor.chain().focus().addRowBefore().run()}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-slate-300 text-[11px]"
              >
                + Row Before
              </button>
              <button
                onClick={() => activeEditor.chain().focus().addRowAfter().run()}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-slate-300 text-[11px]"
              >
                + Row After
              </button>
            </div>
          </div>

          {/* Table Structural Operations */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="font-semibold text-slate-300 text-[11px]">Table Structure</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => activeEditor.chain().focus().toggleHeaderRow().run()}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-slate-300 text-[11px]"
              >
                Toggle Header
              </button>
              <button
                onClick={() => activeEditor.chain().focus().mergeCells().run()}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded text-center text-amber-300 text-[11px]"
              >
                Merge Cells
              </button>
              <button
                onClick={() => activeEditor.chain().focus().deleteRow().run()}
                className="py-1.5 px-2 bg-red-950/40 hover:bg-red-900/50 rounded text-center text-red-300 text-[11px]"
              >
                Delete Row
              </button>
              <button
                onClick={() => activeEditor.chain().focus().deleteColumn().run()}
                className="py-1.5 px-2 bg-red-950/40 hover:bg-red-900/50 rounded text-center text-red-300 text-[11px]"
              >
                Delete Column
              </button>
            </div>
          </div>
        </div>
      ) : isIframeActive ? (
        /* Iframe Position & Dimension Inspector (#10) */
        <div className="space-y-5 text-xs">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                <Monitor className="w-4 h-4" />
                <span>Iframe Inspector</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Dynamically resize & position embedded iframe.</p>
            </div>
            <button
              onClick={() => activeEditor.chain().focus().deleteSelection().run()}
              className="p-1.5 hover:bg-red-950 text-red-400 rounded"
              title="Delete Iframe Embed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Iframe Source URL</label>
              <input
                type="text"
                value={iframeAttrs.src || ''}
                onChange={(e) => activeEditor.chain().focus().updateAttributes('iframe', { src: e.target.value }).run()}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Width (px)</label>
                <input
                  type="number"
                  value={iframeAttrs.width || 640}
                  onChange={(e) => activeEditor.chain().focus().updateAttributes('iframe', { width: parseInt(e.target.value) || 200 }).run()}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Height (px)</label>
                <input
                  type="number"
                  value={iframeAttrs.height || 360}
                  onChange={(e) => activeEditor.chain().focus().updateAttributes('iframe', { height: parseInt(e.target.value) || 150 }).run()}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Width Scale</span>
                <span>{iframeAttrs.width || 640}px</span>
              </div>
              <input
                type="range"
                min="200"
                max="1200"
                step="20"
                value={iframeAttrs.width || 640}
                onChange={(e) => activeEditor.chain().focus().updateAttributes('iframe', { width: parseInt(e.target.value) }).run()}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Height Scale</span>
                <span>{iframeAttrs.height || 360}px</span>
              </div>
              <input
                type="range"
                min="150"
                max="900"
                step="20"
                value={iframeAttrs.height || 360}
                onChange={(e) => activeEditor.chain().focus().updateAttributes('iframe', { height: parseInt(e.target.value) }).run()}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Iframe Alignment & Wrapping</label>
              <select
                value={iframeAttrs.alignment || 'center'}
                onChange={(e) => activeEditor.chain().focus().updateAttributes('iframe', { alignment: e.target.value }).run()}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-100"
              >
                <option value="left">Left Aligned</option>
                <option value="center">Center Aligned</option>
                <option value="right">Right Aligned</option>
                <option value="float-left">Float Left (Wrap Text Right)</option>
                <option value="float-right">Float Right (Wrap Text Left)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Quick Aspect Ratio Presets</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => activeEditor.chain().focus().updateAttributes('iframe', { width: 480, height: 270 }).run()}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-center text-[11px] text-slate-300"
                >
                  Small (480×270)
                </button>
                <button
                  onClick={() => activeEditor.chain().focus().updateAttributes('iframe', { width: 640, height: 360 }).run()}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-center text-[11px] text-slate-300"
                >
                  Medium 16:9 (640×360)
                </button>
                <button
                  onClick={() => activeEditor.chain().focus().updateAttributes('iframe', { width: 800, height: 450 }).run()}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-center text-[11px] text-slate-300"
                >
                  Large 16:9 (800×450)
                </button>
                <button
                  onClick={() => activeEditor.chain().focus().updateAttributes('iframe', { width: '100%', height: 480 }).run()}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-center text-[11px] text-slate-300"
                >
                  Full Width (100%×480)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* If No Object/Table/Iframe is Selected: Show Document Page Settings */
        <div className="space-y-6 text-xs">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Document Inspector</h3>
            <p className="text-[11px] text-slate-400 mt-1">Select an object on the canvas or format page settings below.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 mb-1">Page Size</label>
              <select
                value={activePage.pageSize}
                onChange={(e) => updatePageSettings(activePage.id, { pageSize: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="Letter">US Letter (8.5 x 11 in)</option>
                <option value="A3">A3 Large</option>
                <option value="Custom">Custom Dimensions</option>
              </select>
            </div>

            {activePage.pageSize === 'Custom' && (
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded border border-slate-700 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase font-mono">Width (px)</label>
                  <input
                    type="number"
                    min={200}
                    max={4000}
                    value={activePage.customWidth || 800}
                    onChange={(e) => updatePageSettings(activePage.id, { customWidth: parseInt(e.target.value) || 800 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-center font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 uppercase font-mono">Height (px)</label>
                  <input
                    type="number"
                    min={200}
                    max={4000}
                    value={activePage.customHeight || 1000}
                    onChange={(e) => updatePageSettings(activePage.id, { customHeight: parseInt(e.target.value) || 1000 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 text-center font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Orientation</label>
              <select
                value={activePage.orientation}
                onChange={(e) => updatePageSettings(activePage.id, { orientation: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Watermark Overlay</label>
              <input
                type="text"
                placeholder="e.g. CONFIDENTIAL / DRAFT"
                value={activePage.watermark || ''}
                onChange={(e) => updatePageSettings(activePage.id, { watermark: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Running Header</label>
              <input
                type="text"
                placeholder="Header title text..."
                value={activePage.header || ''}
                onChange={(e) => updatePageSettings(activePage.id, { header: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Running Footer</label>
              <input
                type="text"
                placeholder="Footer text..."
                value={activePage.footer || ''}
                onChange={(e) => updatePageSettings(activePage.id, { footer: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-300">Show Page Numbers</span>
              <input
                type="checkbox"
                checked={activePage.showPageNumber ?? true}
                onChange={(e) => updatePageSettings(activePage.id, { showPageNumber: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-300">Show Margin Guidelines</span>
              <input
                type="checkbox"
                checked={activePage.showMargins ?? true}
                onChange={(e) => updatePageSettings(activePage.id, { showMargins: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
