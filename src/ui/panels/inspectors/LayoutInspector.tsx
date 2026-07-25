import React from 'react';

interface LayoutInspectorProps {
  activePage: any;
  updatePageSettings: (id: string, settings: any) => void;
}

export const LayoutInspector: React.FC<LayoutInspectorProps> = ({ activePage, updatePageSettings }) => {
  if (!activePage) return null;

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-[var(--ee-border)] pb-3">
        <h3 className="text-sm font-bold text-[var(--ee-text-primary)] uppercase tracking-wide">Document Inspector</h3>
        <p className="text-[11px] text-[var(--ee-text-secondary)] mt-1">Select an object on the canvas or format page settings below.</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[var(--ee-text-secondary)] mb-1">Page Size</label>
          <select
            value={activePage.pageSize}
            onChange={(e) => updatePageSettings(activePage.id, { pageSize: e.target.value as any })}
            className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-2 text-[var(--ee-text-primary)]"
          >
            <option value="A4">A4 (210 x 297 mm)</option>
            <option value="Letter">US Letter (8.5 x 11 in)</option>
            <option value="A3">A3 Large</option>
            <option value="Custom">Custom Dimensions</option>
          </select>
        </div>

        {activePage.pageSize === 'Custom' && (
          <div className="grid grid-cols-2 gap-2 bg-[var(--ee-surface-0)]/60 p-2.5 rounded border border-[var(--ee-border)] animate-in fade-in duration-150">
            <div>
              <label className="block text-[10px] text-[var(--ee-text-secondary)] mb-1 uppercase font-mono">Width (px)</label>
              <input
                type="number"
                min={200}
                max={4000}
                value={activePage.customWidth || 800}
                onChange={(e) => updatePageSettings(activePage.id, { customWidth: parseInt(e.target.value) || 800 })}
                className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded px-2 py-1 text-[var(--ee-text-primary)] text-center font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--ee-text-secondary)] mb-1 uppercase font-mono">Height (px)</label>
              <input
                type="number"
                min={200}
                max={4000}
                value={activePage.customHeight || 1000}
                onChange={(e) => updatePageSettings(activePage.id, { customHeight: parseInt(e.target.value) || 1000 })}
                className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded px-2 py-1 text-[var(--ee-text-primary)] text-center font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[var(--ee-text-secondary)] mb-1">Orientation</label>
          <select
            value={activePage.orientation}
            onChange={(e) => updatePageSettings(activePage.id, { orientation: e.target.value as any })}
            className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-2 text-[var(--ee-text-primary)]"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <div>
          <label className="block text-[var(--ee-text-secondary)] mb-1">Watermark Overlay</label>
          <input
            type="text"
            placeholder="Text or Image URL (http...)"
            value={activePage.watermark || ''}
            onChange={(e) => updatePageSettings(activePage.id, { watermark: e.target.value })}
            className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-2 text-[var(--ee-text-primary)] focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[var(--ee-text-secondary)] mb-1">Running Header</label>
          <input
            type="text"
            placeholder="Header title text..."
            value={activePage.header || ''}
            onChange={(e) => updatePageSettings(activePage.id, { header: e.target.value })}
            className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-2 text-[var(--ee-text-primary)] focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[var(--ee-text-secondary)] mb-1">Running Footer</label>
          <input
            type="text"
            placeholder="Footer text..."
            value={activePage.footer || ''}
            onChange={(e) => updatePageSettings(activePage.id, { footer: e.target.value })}
            className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded p-2 text-[var(--ee-text-primary)] focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-[var(--ee-text-primary)]">Show Page Numbers</span>
          <input
            type="checkbox"
            checked={activePage.showPageNumber ?? true}
            onChange={(e) => updatePageSettings(activePage.id, { showPageNumber: e.target.checked })}
            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-[var(--ee-text-primary)]">Show Margin Guidelines</span>
          <input
            type="checkbox"
            checked={activePage.showMargins ?? true}
            onChange={(e) => updatePageSettings(activePage.id, { showMargins: e.target.checked })}
            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
