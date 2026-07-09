import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useDocumentStore } from '../../store/documentStore';
import { ImageTools } from '../../features/canvas/ImageTools';
import { Sliders, ArrowUp, ArrowDown, Trash2, Copy, Layers } from 'lucide-react';
import './RightSidebar.css';

interface RightSidebarProps {
  engine: any;
  editor?: any;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ engine }) => {
  const selectedObject = useCanvasStore((s) => s.selectedObjectProps);
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const handlePropChange = (key: string, value: any) => {
    if (!engine) return;
    engine.updateSelected({ [key]: value });
  };

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
              <div className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700">
                <span className="text-[11px] text-slate-400">Fill</span>
                <input
                  type="color"
                  value={typeof selectedObject.fill === 'string' ? selectedObject.fill : '#6366f1'}
                  onChange={(e) => handlePropChange('fill', e.target.value)}
                  className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded"
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700">
                <span className="text-[11px] text-slate-400">Stroke</span>
                <input
                  type="color"
                  value={typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#334155'}
                  onChange={(e) => handlePropChange('stroke', e.target.value)}
                  className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded"
                />
              </div>
            </div>
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
      ) : (
        /* If No Object is Selected: Show Document Page Settings */
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
          </div>
        </div>
      )}
    </div>
  );
};
