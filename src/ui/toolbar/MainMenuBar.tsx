import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ExportEngine } from '../../core/engine/ExportEngine';
import { FileCode, Download, Printer, Share2, Layers, FileText, Moon, Sun, Eye } from 'lucide-react';
import './MainMenuBar.css';

interface MainMenuBarProps {
  engine: any;
  isCanvasMode: boolean;
  setIsCanvasMode: (mode: boolean | ((m: boolean) => boolean)) => void;
  onOpenPreview?: () => void;
  onOpenPdfExport?: () => void;
}

export const MainMenuBar: React.FC<MainMenuBarProps> = ({
  engine,
  isCanvasMode,
  setIsCanvasMode,
  onOpenPreview,
  onOpenPdfExport,
}) => {
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);

  const [showFileMenu, setShowFileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  const handleExportPNG = () => {
    const el = document.querySelector('.prose')?.parentElement || document.body;
    ExportEngine.exportToPNG(el as HTMLElement, `editor-export-${Date.now()}.png`);
    setShowFileMenu(false);
  };

  const handleExportPDF = () => {
    if (onOpenPdfExport) {
      onOpenPdfExport();
    } else {
      const el = document.querySelector('.prose')?.parentElement || document.body;
      ExportEngine.exportToPDF(el as HTMLElement, `editor-document-${Date.now()}.pdf`);
    }
    setShowFileMenu(false);
  };

  const handleExportJSON = () => {
    ExportEngine.exportToJSON();
    setShowFileMenu(false);
  };

  return (
    <div className="w-full h-12 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 select-none z-50 relative print:hidden">
      {/* Brand & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-sm text-white tracking-wide">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xs shadow-md font-extrabold">
            GL
          </div>
          <span>GridLeaf Editor</span>
        </div>

        {/* File Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="px-3 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            File
          </button>

          {showFileMenu && (
            <div className="absolute left-0 top-9 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 text-xs text-slate-200">
              <button onClick={handleExportJSON} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Save JSON Template</span>
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <Download className="w-4 h-4 text-pink-400" />
                <span>Export Multi-page PDF</span>
              </button>
              <button onClick={handleExportPNG} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>Export High-Res PNG</span>
              </button>
              <div className="h-px bg-slate-800 my-1" />
              <button onClick={() => window.print()} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Document</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mode Switcher & Zoom */}
      <div className="flex items-center gap-4">
        {/* Preview Toggle */}
        <button
          onClick={onOpenPreview}
          className="p-1.5 mr-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Preview Document"
        >
          <Eye className="w-4 h-4 text-emerald-400" />
        </button>
        {/* Mode switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setIsCanvasMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              !isCanvasMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Studio</span>
          </button>
          <button
            onClick={() => setIsCanvasMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              isCanvasMode ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hybrid Canvas</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </div>
    </div>
  );
};
