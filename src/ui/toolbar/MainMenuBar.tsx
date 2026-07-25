import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ExportEngine } from '../../core/engine/ExportEngine';
import { ImportEngine } from '../../core/engine/ImportEngine';
import { FileCode, Download, Printer, Share2, Layers, FileText, Moon, Sun, Eye, Upload } from 'lucide-react';
import './MainMenuBar.css';

interface MainMenuBarProps {
  engine: any;
  editor?: any;
  isCanvasMode: boolean;
  setIsCanvasMode: (mode: boolean | ((m: boolean) => boolean)) => void;
  onOpenPreview?: () => void;
  onOpenPdfExport?: () => void;
}

export const MainMenuBar: React.FC<MainMenuBarProps> = ({
  engine,
  editor,
  isCanvasMode,
  setIsCanvasMode,
  onOpenPreview,
  onOpenPdfExport,
}) => {
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);

  const [showFileMenu, setShowFileMenu] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    if (!showFileMenu) return;
    const close = () => setShowFileMenu(false);
    // Add on next tick so we don't immediately catch the open click
    const timer = setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [showFileMenu]);

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

  const handleExportMarkdown = () => {
    const activeEditor = editor || (window as any).__activeEditor;
    if (activeEditor) {
      ExportEngine.exportToMarkdown(activeEditor.getHTML(), `document-${Date.now()}.md`);
    }
    setShowFileMenu(false);
  };

  const handleExportDOCX = () => {
    const activeEditor = editor || (window as any).__activeEditor;
    if (activeEditor) {
      ExportEngine.exportToDOCX(activeEditor.getHTML(), `document-${Date.now()}.docx`);
    }
    setShowFileMenu(false);
  };

  const handleImportDOCX = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const activeEditor = editor || (window as any).__activeEditor;
        if (activeEditor) {
          try {
            await ImportEngine.importDOCX(file, activeEditor);
          } catch (error) {
            console.error("Failed to import DOCX", error);
            setErrorToast("Failed to import DOCX file.");
            setTimeout(() => setErrorToast(null), 3000);
          }
        }
      }
    };
    input.click();
    setShowFileMenu(false);
  };

  return (
    <div className="w-full h-12 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 select-none z-50 relative print:hidden">
      {/* Brand & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-sm text-white tracking-wide">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="2" fill="#10b981"/>
            <rect x="13" y="2" width="9" height="9" rx="2" fill="#0d9488" opacity="0.7"/>
            <rect x="2" y="13" width="9" height="9" rx="2" fill="#0d9488" opacity="0.7"/>
            <rect x="13" y="13" width="9" height="9" rx="2" fill="#10b981" opacity="0.4"/>
          </svg>
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
            <div className="absolute left-0 top-9 w-48 glass-tier-2 rounded-xl p-1.5 flex flex-col gap-1 z-50 text-xs" style={{ color: 'var(--ee-text-primary)' }}>
              <button onClick={handleImportDOCX} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Import Word (DOCX)</span>
                <span className="ml-auto text-slate-600 text-[10px]">Ctrl+I</span>
              </button>
              
              <div className="h-px bg-slate-800 my-1" />

              <button onClick={handleExportJSON} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <FileCode className="w-4 h-4 text-slate-400" />
                <span>Save JSON Template</span>
                <span className="ml-auto text-slate-600 text-[10px]">Ctrl+S</span>
              </button>
              <button onClick={handleExportMarkdown} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Export Markdown</span>
                <span className="ml-auto text-slate-600 text-[10px]">Ctrl+M</span>
              </button>
              <button onClick={handleExportDOCX} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Export Word (DOCX)</span>
                <span className="ml-auto text-slate-600 text-[10px]">Ctrl+D</span>
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <Download className="w-4 h-4 text-slate-400" />
                <span>Export Multi-page PDF</span>
                <span className="ml-auto text-slate-600 text-[10px]">Ctrl+E</span>
              </button>
              <button onClick={handleExportPNG} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Export High-Res PNG</span>
              </button>
              <div className="h-px bg-slate-800 my-1" />
              <button onClick={() => window.print()} className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-slate-800 text-left">
                <Printer className="w-4 h-4 text-slate-400" />
                <span>Print Document</span>
                <span className="ml-auto text-slate-600 text-[10px]">Ctrl+P</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {errorToast && (
        <div className="fixed bottom-4 right-4 glass-tier-3 text-red-400 px-4 py-2 rounded-lg shadow-lg text-sm z-[9999]">
          {errorToast}
        </div>
      )}

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
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>
    </div>
  );
};
