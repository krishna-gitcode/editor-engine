import React from 'react';
import { ArrowUp, ArrowDown, Trash2, Copy } from 'lucide-react';
import { ImageTools } from '../../../features/canvas/ImageTools';

interface ObjectInspectorProps {
  selectedObject: any;
  engine: any;
  handlePropChange: (key: string, value: any) => void;
}

export const ObjectInspector: React.FC<ObjectInspectorProps> = ({ selectedObject, engine, handlePropChange }) => {
  if (!selectedObject) return null;

  return (
    <div className="space-y-5 text-xs">
      <div className="flex items-center justify-between border-b border-[var(--ee-border)] pb-3">
        <div>
          <div className="text-sm font-bold text-[var(--ee-text-primary)] uppercase tracking-wide">{selectedObject.type}</div>
          <div className="text-[10px] text-[var(--ee-text-secondary)] truncate max-w-[160px]">ID: {selectedObject.id}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => engine?.copySelected()} className="p-1.5 rounded hover:bg-[var(--ee-surface-2)] text-[var(--ee-text-primary)]" title="Duplicate">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={() => engine?.deleteSelected()} className="p-1.5 rounded hover:bg-[var(--ee-surface-2)] text-red-400" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedObject.type === 'image' && (
        <div>
          <div className="font-semibold text-[var(--ee-text-primary)] mb-2">Image Quick Actions</div>
          <ImageTools engine={engine} />
        </div>
      )}

      <div>
        <div className="font-semibold text-[var(--ee-text-primary)] mb-2.5">Position & Dimensions</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--ee-text-secondary)]">X Position</span>
            <input
              type="number"
              value={selectedObject.left ?? 0}
              onChange={(e) => handlePropChange('left', parseInt(e.target.value) || 0)}
              className="p-1.5 bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded text-[var(--ee-text-primary)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--ee-text-secondary)]">Y Position</span>
            <input
              type="number"
              value={selectedObject.top ?? 0}
              onChange={(e) => handlePropChange('top', parseInt(e.target.value) || 0)}
              className="p-1.5 bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded text-[var(--ee-text-primary)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--ee-text-secondary)]">Width</span>
            <input
              type="number"
              value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
              onChange={(e) => {
                const w = parseInt(e.target.value) || 0;
                handlePropChange('width', w);
                handlePropChange('scaleX', 1);
              }}
              className="p-1.5 bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded text-[var(--ee-text-primary)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--ee-text-secondary)]">Height</span>
            <input
              type="number"
              value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
              onChange={(e) => {
                const h = parseInt(e.target.value) || 0;
                handlePropChange('height', h);
                handlePropChange('scaleY', 1);
              }}
              className="p-1.5 bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded text-[var(--ee-text-primary)]"
            />
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-[11px] text-[var(--ee-text-secondary)]">Rotation (deg)</span>
            <input
              type="number"
              value={selectedObject.angle ?? 0}
              onChange={(e) => handlePropChange('angle', parseInt(e.target.value) || 0)}
              className="p-1.5 bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded text-[var(--ee-text-primary)]"
            />
          </div>
        </div>
      </div>

      {(selectedObject.type === 'textbox' || selectedObject.type === 'i-text') && (
        <div>
          <div className="font-semibold text-[var(--ee-text-primary)] mb-2">Text Properties</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col col-span-2">
              <span className="text-[11px] text-[var(--ee-text-secondary)]">Content</span>
              <textarea
                value={selectedObject.text || ''}
                onChange={(e) => handlePropChange('text', e.target.value)}
                className="p-1.5 bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded text-[var(--ee-text-primary)] resize-y min-h-[60px]"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[var(--ee-text-secondary)]">Font Family</span>
              <select
                value={selectedObject.fontFamily || 'Inter'}
                onChange={(e) => handlePropChange('fontFamily', e.target.value)}
                className="p-1.5 bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded text-[var(--ee-text-primary)]"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[var(--ee-text-secondary)]">Font Size</span>
              <input
                type="number"
                value={selectedObject.fontSize || 16}
                onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value) || 16)}
                className="p-1.5 bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded text-[var(--ee-text-primary)]"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="font-semibold text-[var(--ee-text-primary)] mb-2">Styling</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1 p-2 rounded bg-[var(--ee-surface-2)] border border-[var(--ee-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--ee-text-secondary)]">Fill</span>
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
                  : 'bg-[var(--ee-surface-1)] hover:bg-[var(--ee-surface-3)] text-[var(--ee-text-primary)]'
              }`}
            >
              <span>{selectedObject.fill === 'transparent' ? 'No Transparent' : 'Make Transparent'}</span>
            </button>
          </div>
          <div className="flex flex-col justify-between p-2 rounded bg-[var(--ee-surface-2)] border border-[var(--ee-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--ee-text-secondary)]">Stroke</span>
              <input
                type="color"
                value={typeof selectedObject.stroke === 'string' ? selectedObject.stroke : '#334155'}
                onChange={(e) => handlePropChange('stroke', e.target.value)}
                className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded"
              />
            </div>
            <div className="text-[10px] text-[var(--ee-text-secondary)] pt-1 border-t border-[var(--ee-border)]">
              Color for outline border
            </div>
          </div>
        </div>

        {['rect', 'circle', 'triangle', 'polygon', 'path', 'group'].includes(selectedObject.type || '') && (
          <div className="mt-3 p-2.5 rounded bg-[var(--ee-surface-2)]/80 border border-[var(--ee-border)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-400">Text Inside Shape</span>
              <span className="text-[10px] text-[var(--ee-text-secondary)]">Overlay Center</span>
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
              className="w-full bg-[var(--ee-surface-1)] border border-[var(--ee-border)] rounded p-1.5 text-xs text-[var(--ee-text-primary)] focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>
        )}

        <div className="mt-2 flex flex-col">
          <div className="flex justify-between text-[11px] text-[var(--ee-text-secondary)] mb-1">
            <span>Stroke Width</span>
            <span>{selectedObject.strokeWidth ?? 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={selectedObject.strokeWidth ?? 0}
            onChange={(e) => handlePropChange('strokeWidth', parseInt(e.target.value) || 0)}
            className="w-full accent-indigo-500 h-1.5 bg-[var(--ee-surface-2)] rounded-lg cursor-pointer"
          />
        </div>
        <div className="mt-3 flex flex-col">
          <div className="flex justify-between text-[11px] text-[var(--ee-text-secondary)] mb-1">
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
            className="w-full accent-indigo-500 h-1.5 bg-[var(--ee-surface-2)] rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div>
        <div className="font-semibold text-[var(--ee-text-primary)] mb-2">Layer Ordering</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => engine?.bringForward()}
            className="flex items-center justify-center gap-1.5 p-2 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] border border-[var(--ee-border)]"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Bring Forward</span>
          </button>
          <button
            onClick={() => engine?.sendBackward()}
            className="flex items-center justify-center gap-1.5 p-2 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] border border-[var(--ee-border)]"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
