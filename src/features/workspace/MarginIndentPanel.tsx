import React from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import './MarginIndentPanel.css';

export const MarginIndentPanel: React.FC = () => {
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);
  const indent = useWorkspaceStore((s) => s.indent);
  const updateIndent = useWorkspaceStore((s) => s.updateIndent);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    updatePageSettings(activePage.id, {
      margins: { ...activePage.margins, [side]: val },
    });
  };

  return (
    <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-4 text-xs">
      <div>
        <h3 className="font-semibold text-slate-100 mb-2">Page Margins (px)</h3>
        <div className="grid grid-cols-2 gap-2">
          {['top', 'right', 'bottom', 'left'].map((side) => (
            <div key={side} className="flex flex-col">
              <span className="capitalize text-slate-400">{side}</span>
              <input
                type="number"
                value={(activePage.margins as any)[side]}
                onChange={(e) => handleMarginChange(side as any, parseInt(e.target.value) || 0)}
                className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-100 mb-2">Paragraph Indent & Spacing</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-slate-400">First Line (px)</span>
            <input
              type="number"
              value={indent.firstLine}
              onChange={(e) => updateIndent({ firstLine: parseInt(e.target.value) || 0 })}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400">Line Height</span>
            <input
              type="number"
              step="0.1"
              value={indent.lineHeight}
              onChange={(e) => updateIndent({ lineHeight: parseFloat(e.target.value) || 1.5 })}
              className="p-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
