import React from 'react';
import { Table, Trash2, Monitor, RotateCw, Maximize2 } from 'lucide-react';

interface TextInspectorProps {
  activeEditor: any;
  isTableActive: boolean;
  tableAttrs: any;
  isIframeActive: boolean;
  iframeAttrs: any;
}

export const TextInspector: React.FC<TextInspectorProps> = ({
  activeEditor,
  isTableActive,
  tableAttrs,
  isIframeActive,
  iframeAttrs,
}) => {
  if (isTableActive) {
    return (
      <div className="space-y-5 text-xs">
        <div className="border-b border-[var(--ee-border)] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
              <Table className="w-4 h-4" />
              <span>Table Inspector</span>
            </h3>
            <p className="text-[10px] text-[var(--ee-text-secondary)] mt-0.5">Dynamically adjust table dimensions, position & columns.</p>
          </div>
          <button
            onClick={() => activeEditor.chain().focus().deleteTable().run()}
            className="p-1.5 hover:bg-red-950 text-red-400 rounded"
            title="Delete Table"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[var(--ee-text-secondary)] text-[11px] mb-1 font-semibold">Table Theme & Color Scheme</label>
            <select
              value={tableAttrs.theme || 'none'}
              onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ theme: e.target.value }).run()}
              className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-2 text-[var(--ee-text-primary)]"
            >
              <option value="none">Standard Plain Border</option>
              <option value="modern-dark">Modern Dark (Indigo Accent)</option>
              <option value="classic-blue">Classic Blue Header</option>
              <option value="minimal-gray">Minimal Slate Gray</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--ee-text-secondary)] text-[11px] mb-1 font-semibold">Width & Alignment</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={tableAttrs.width || '100%'}
                onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ width: e.target.value }).run()}
                className="bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-1.5 text-[var(--ee-text-primary)]"
              >
                <option value="100%">100% (Full Width)</option>
                <option value="80%">80% Width</option>
                <option value="50%">50% Width</option>
                <option value="auto">Auto (Fit Content)</option>
              </select>
              <select
                value={tableAttrs.alignment || 'center'}
                onChange={(e) => activeEditor.chain().focus().updateTableAttributes({ alignment: e.target.value }).run()}
                className="bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-1.5 text-[var(--ee-text-primary)]"
              >
                <option value="left">Left Align</option>
                <option value="center">Center Align</option>
                <option value="right">Right Align</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-[var(--ee-text-primary)] mb-2">Column Operations</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => activeEditor.chain().focus().addColumnBefore().run()}
              className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
            >
              Add Col Before
            </button>
            <button
              onClick={() => activeEditor.chain().focus().addColumnAfter().run()}
              className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
            >
              Add Col After
            </button>
            <button
              onClick={() => activeEditor.chain().focus().deleteColumn().run()}
              className="p-1.5 bg-red-950/40 hover:bg-red-900/60 rounded text-center text-[11px] text-red-400"
            >
              Delete Column
            </button>
            <button
              onClick={() => activeEditor.chain().focus().toggleHeaderColumn().run()}
              className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
            >
              Toggle Header
            </button>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-[var(--ee-text-primary)] mb-2">Row Operations</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => activeEditor.chain().focus().addRowBefore().run()}
              className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
            >
              Add Row Before
            </button>
            <button
              onClick={() => activeEditor.chain().focus().addRowAfter().run()}
              className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
            >
              Add Row After
            </button>
            <button
              onClick={() => activeEditor.chain().focus().deleteRow().run()}
              className="p-1.5 bg-red-950/40 hover:bg-red-900/60 rounded text-center text-[11px] text-red-400"
            >
              Delete Row
            </button>
            <button
              onClick={() => activeEditor.chain().focus().toggleHeaderRow().run()}
              className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
            >
              Toggle Header
            </button>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-[var(--ee-text-primary)] mb-2">Cell Operations</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => activeEditor.chain().focus().mergeCells().run()}
              className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
            >
              Merge Cells
            </button>
            <button
              onClick={() => activeEditor.chain().focus().splitCell().run()}
              className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
            >
              Split Cell
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isIframeActive) {
    return (
      <div className="space-y-5 text-xs">
        <div className="border-b border-[var(--ee-border)] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
              <Monitor className="w-4 h-4" />
              <span>Iframe Web Viewer</span>
            </h3>
            <p className="text-[10px] text-[var(--ee-text-secondary)] mt-0.5">Control live web embeds, aspect ratios & interactivity.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--ee-text-secondary)] text-[11px] mb-1.5 font-semibold">Source URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={iframeAttrs.src || ''}
                onChange={(e) => activeEditor.chain().focus().updateAttributes('iframe', { src: e.target.value }).run()}
                className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-1.5 text-[var(--ee-text-primary)] font-mono text-[10px]"
                placeholder="https://example.com"
              />
              <button
                onClick={() => {
                  const el = activeEditor.view.dom.querySelector(`iframe[src="${iframeAttrs.src}"]`);
                  if (el) el.src = el.src;
                }}
                className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded border border-[var(--ee-border)] text-indigo-400"
                title="Reload Frame"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[var(--ee-text-secondary)] text-[11px] mb-2 font-semibold">Presets & Layout</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => activeEditor.chain().focus().updateAttributes('iframe', { width: 480, height: 270 }).run()}
                className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
              >
                Small (480-270)
              </button>
              <button
                onClick={() => activeEditor.chain().focus().updateAttributes('iframe', { width: 640, height: 360 }).run()}
                className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
              >
                Medium 16:9 (640-360)
              </button>
              <button
                onClick={() => activeEditor.chain().focus().updateAttributes('iframe', { width: 800, height: 450 }).run()}
                className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
              >
                Large 16:9 (800-450)
              </button>
              <button
                onClick={() => activeEditor.chain().focus().updateAttributes('iframe', { width: '100%', height: 480 }).run()}
                className="p-1.5 bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] rounded text-center text-[11px] text-[var(--ee-text-primary)]"
              >
                Full Width (100%-480)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
