import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '../../store/editorStore';
import { useDocumentStore } from '../../store/documentStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Highlighter, Type, Sparkles, Table, Image, Globe,
  Plus, Trash2, LayoutGrid, FileText, Minimize2, Maximize2, Settings, Palette,
  Undo, Redo, RemoveFormatting, Upload, Calendar, Hash, Link, Move, BarChart2
} from 'lucide-react';
import './Toolbar.css';
import { ColorPickerDropdown } from '../../ui/menus/ColorPickerDropdown';
import { ListDropdown } from '../../ui/menus/ListDropdown';

interface ToolbarProps {
  editor: any;
  onOpenModal?: (type: 'mathjax' | 'abcjs' | 'openrouter') => void;
  onOpenFontManager?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor: defaultEditor, onOpenModal, onOpenFontManager }) => {
  const ribbonTab = useEditorStore((s) => s.ribbonTab);
  const setRibbonTab = useEditorStore((s) => s.setRibbonTab);
  const isRibbonMinimized = useEditorStore((s) => s.isRibbonMinimized);
  const toggleRibbonMinimized = useEditorStore((s) => s.toggleRibbonMinimized);
  const customFonts = useEditorStore((s) => s.customFonts);

  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const showGrid = useWorkspaceStore((s) => s.showGrid);
  const toggleGrid = useWorkspaceStore((s) => s.toggleGrid);
  const pageAlignment = useWorkspaceStore((s) => s.pageAlignment || 'center');
  const setPageAlignment = useWorkspaceStore((s) => s.setPageAlignment);
  const linkMargins = useWorkspaceStore((s) => s.linkMargins ?? true);
  const toggleLinkMargins = useWorkspaceStore((s) => s.toggleLinkMargins);

  const [tableTheme, setTableTheme] = useState('none');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSizeState] = useState('16px');
  const [lineSpacing, setLineSpacing] = useState('1.5');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic active editor state
  const [editor, setActiveEditor] = useState<any>(defaultEditor || (window as any).__activeEditor);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleActiveEditorChanged = () => {
      setActiveEditor((window as any).__activeEditor || defaultEditor);
    };
    window.addEventListener('activeEditorChanged', handleActiveEditorChanged);
    return () => {
      window.removeEventListener('activeEditorChanged', handleActiveEditorChanged);
    };
  }, [defaultEditor]);

  useEffect(() => {
    if (!editor) return;
    const forceUpdate = () => setTick((t) => t + 1);
    editor.on('selectionUpdate', forceUpdate);
    editor.on('update', forceUpdate);
    return () => {
      editor.off('selectionUpdate', forceUpdate);
      editor.off('update', forceUpdate);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="w-full bg-slate-900 border-b border-slate-800 p-3 text-xs text-slate-500 text-center">
        Formatting engine connecting...
      </div>
    );
  }

  const applyFontFamily = (font: string) => {
    setFontFamily(font);
    editor.chain().focus().setMark('textStyle', { fontFamily: font }).run();
  };

  const applyFontSize = (size: string) => {
    setFontSizeState(size);
    editor.chain().focus().setFontSize(size).run();
  };

  const adjustFontSizeStep = (delta: number) => {
    const current = parseInt(fontSize) || 16;
    const next = Math.max(10, Math.min(72, current + delta)) + 'px';
    applyFontSize(next);
  };

  const applyTextEffect = (effect: string, color: string = '#6366f1') => {
    if (effect === 'none') {
      editor.chain().focus().unsetTextEffect().run();
    } else {
      editor.chain().focus().setTextEffect({ effect, color }).run();
    }
  };

  const applyTableTheme = (theme: string) => {
    setTableTheme(theme);
    editor.chain().focus().updateAttributes('table', { theme }).run();
  };

  const applyLineSpacing = (spacing: string) => {
    setLineSpacing(spacing);
    // Use the LineHeightExtension setLineHeight command (applies to paragraphs & headings)
    editor.chain().focus().setLineHeight(spacing).run();
  };

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    const clamped = Math.max(0, Math.min(250, val));
    if (linkMargins) {
      updatePageSettings(activePage.id, {
        margins: { top: clamped, right: clamped, bottom: clamped, left: clamped },
      });
    } else {
      updatePageSettings(activePage.id, {
        margins: { ...activePage.margins, [side]: clamped },
      });
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        editor.chain().focus().setImage({ src }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="w-full glass-panel flex flex-col select-none z-40 relative shadow-lg print:hidden"
      style={{ transform: 'translateZ(0)' }}
      onMouseDown={(e) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLSelectElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Ribbon Tabs Header */}
      <div className="flex items-center justify-between px-4 pt-2 border-b border-slate-700/50 bg-slate-950/40">
        <div className="flex gap-1 text-xs">
          {(['home', 'insert', 'layout', 'table', 'plugins'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setRibbonTab(tab)}
              className={`px-4 py-2 rounded-t-lg capitalize font-medium transition-all ${
                ribbonTab === tab
                  ? 'bg-slate-900/80 backdrop-blur-md text-indigo-400 border-t-2 border-indigo-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRibbonMinimized}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isRibbonMinimized ? 'Expand Ribbon' : 'Minimize Ribbon'}
          >
            {isRibbonMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Ribbon Panels */}
      <AnimatePresence initial={false}>
        {!isRibbonMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="overflow-hidden bg-slate-900/40"
          >
            <div className="p-3 flex items-center gap-5 min-h-[68px] text-xs text-slate-200 flex-wrap">
              {/* HOME TAB */}
          {ribbonTab === 'home' && (
            <>
              {/* History Group */}
              <div className="flex items-center gap-1 border-r border-slate-800 pr-4">
                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                  title="Clear All Formatting"
                >
                  <RemoveFormatting className="w-4 h-4" />
                </button>
              </div>

              {/* Typography Group */}
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-4">
                <select
                  value={fontFamily}
                  onChange={(e) => applyFontFamily(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 min-w-[120px]"
                >
                  <option value="Inter">Inter</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Playfair Display">Playfair</option>
                  <option value="Fira Code">Fira Code</option>
                  {customFonts.map((f) => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>

                <button
                  onClick={onOpenFontManager}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-indigo-400"
                  title="Manage Google & Custom Fonts"
                >
                  <Type className="w-4 h-4" />
                </button>

                <select
                  value={fontSize}
                  onChange={(e) => applyFontSize(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none w-18"
                >
                  {['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px', '72px'].map((sz) => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>

                <button
                  onClick={() => adjustFontSizeStep(2)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold text-slate-300"
                  title="Increase Font Size (A+)"
                >
                  A+
                </button>
                <button
                  onClick={() => adjustFontSizeStep(-2)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold text-slate-300"
                  title="Decrease Font Size (A-)"
                >
                  A-
                </button>
              </div>

              {/* Formatting Group */}
              <div className="flex items-center gap-1 border-r border-slate-800 pr-4">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-1.5 rounded transition-colors ${editor.isActive('underline') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>
                <button
                  onClick={() => (editor.commands as any).toggleSubscript?.()}
                  className={`px-1.5 py-1 rounded text-xs font-mono transition-colors ${editor.isActive('subscript') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Subscript (X₂)"
                >
                  X₂
                </button>
                <button
                  onClick={() => (editor.commands as any).toggleSuperscript?.()}
                  className={`px-1.5 py-1 rounded text-xs font-mono transition-colors ${editor.isActive('superscript') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Superscript (X²)"
                >
                  X²
                </button>
              </div>

              {/* Color & Effects Group */}
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-4">
                <ColorPickerDropdown
                  label="Text Color"
                  defaultColor="#000000"
                  onSelectColor={(hex) => editor.chain().focus().setColor(hex).run()}
                />
                <ColorPickerDropdown
                  label="Highlight"
                  defaultColor="#fef08a"
                  isHighlight={true}
                  onSelectColor={(hex) => {
                    if (hex === 'transparent') {
                      editor.chain().focus().unsetHighlight().run();
                    } else {
                      editor.chain().focus().toggleHighlight({ color: hex }).run();
                    }
                  }}
                />
                <div className="flex flex-col items-center ml-1">
                  <span className="text-[10px] text-slate-400 mb-0.5">Effect</span>
                  <select
                    onChange={(e) => applyTextEffect(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px]"
                  >
                    <option value="none">Normal</option>
                    <option value="shadow">Drop Shadow</option>
                    <option value="glow">Neon Glow</option>
                    <option value="outline">Outline</option>
                    <option value="gradient">Gradient Fill</option>
                  </select>
                </div>
              </div>

              {/* Alignment & Line Spacing Group */}
              <div className="flex items-center gap-1 border-r border-slate-800 pr-4">
                <button
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={`p-1.5 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={`p-1.5 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                  className={`p-1.5 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                  title="Justify"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>

                <select
                  value={lineSpacing}
                  onChange={(e) => applyLineSpacing(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none ml-1"
                  title="Line Height"
                >
                  <option value="1.0">1.0x</option>
                  <option value="1.15">1.15x</option>
                  <option value="1.5">1.5x</option>
                  <option value="1.75">1.75x</option>
                  <option value="2.0">2.0x</option>
                  <option value="2.5">2.5x</option>
                  <option value="3.0">3.0x</option>
                </select>
              </div>

              {/* Lists & Indent Group */}
              <div className="flex items-center gap-1">
                <ListDropdown editor={editor} isOrdered={false} />
                <ListDropdown editor={editor} isOrdered={true} />
                <button
                  onClick={() => (editor.commands as any).indent?.()}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                  title="Indent Right"
                >
                  <Indent className="w-4 h-4" />
                </button>
                <button
                  onClick={() => (editor.commands as any).outdent?.()}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                  title="Indent Left"
                >
                  <Outdent className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* INSERT TAB */}
          {ribbonTab === 'insert' && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700"
              >
                <Table className="w-4 h-4 text-indigo-400" />
                <span>Table (3x3)</span>
              </button>

              <button
                onClick={() => {
                  const rows = parseInt(prompt('Number of rows:', '4') || '4');
                  const cols = parseInt(prompt('Number of columns:', '4') || '4');
                  if (rows > 0 && cols > 0) {
                    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                  }
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs border border-slate-700 text-slate-300"
              >
                + Custom Grid
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Image File</span>
              </button>

              <button
                onClick={() => {
                  const url = prompt('Enter Image URL:');
                  if (url) editor.chain().focus().setImage({ src: url }).run();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700"
              >
                <Image className="w-4 h-4 text-pink-400" />
                <span>Image URL</span>
              </button>

              <button
                onClick={() => {
                  const url = prompt('Enter Iframe or Video Embed URL:', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
                  if (url) (editor.commands as any).setIframe({ src: url, width: 560, height: 315 });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Embed Video/Iframe</span>
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => {
                  editor.chain().focus().insertContent(`<div style="padding:12px; background:#f8fafc; border-left:4px solid #6366f1; border-radius:4px; margin:10px 0;"><strong>💡 Callout Note:</strong> Type your callout text here...</div><p></p>`).run();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs border border-slate-700 text-indigo-300"
              >
                💡 Callout Box
              </button>

              <button
                onClick={() => {
                  const sym = prompt('Choose special character symbol:\n1: ©  2: ™  3: ®  4: ₹  5: °  6: ±  7: ≤  8: ≥  9: √  10: π', '©');
                  if (sym) {
                    const symbols: Record<string, string> = { '1': '©', '2': '™', '3': '®', '4': '₹', '5': '°', '6': '±', '7': '≤', '8': '≥', '9': '√', '10': 'π' };
                    editor.chain().focus().insertContent(symbols[sym] || sym).run();
                  }
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs border border-slate-700 text-amber-300 font-mono"
                title="Special Symbol / Character"
              >
                Ω Symbol
              </button>

              <button
                onClick={() => {
                  const timestamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                  editor.chain().focus().insertContent(` [${timestamp}] `).run();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs border border-slate-700 text-slate-300"
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Timestamp</span>
              </button>

              <button
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs border border-slate-700"
              >
                Horizontal Divider
              </button>

              <button
                onClick={() => editor.chain().focus().setHardBreak().run()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs border border-slate-700"
              >
                Page Break
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => (editor.commands as any).insertPageNumber?.({ type: 'current' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 rounded-lg text-xs border border-indigo-500/50 text-indigo-300 transition-colors"
                title="Insert Dynamic Page Number"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Page #</span>
              </button>
            </div>
          )}

          {/* LAYOUT TAB - FULL DYNAMIC MARGINS & ALIGNMENT */}
          {ribbonTab === 'layout' && (
            <div className="flex items-center gap-4 flex-wrap w-full py-0.5">
              {/* Page Dimensions */}
              <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800">
                <span className="text-slate-400 font-medium">Page Size:</span>
                <select
                  value={activePage.pageSize}
                  onChange={(e) => updatePageSettings(activePage.id, { pageSize: e.target.value as any })}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="A4">A4 (210x297mm)</option>
                  <option value="Letter">US Letter (8.5x11in)</option>
                  <option value="A3">A3 Large</option>
                  <option value="Custom">Custom Dimensions</option>
                </select>

                {activePage.pageSize === 'Custom' && (
                  <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-800 animate-in fade-in duration-150">
                    <span className="text-slate-400 uppercase font-mono text-[10px]">W:</span>
                    <input
                      type="number"
                      min={200}
                      max={4000}
                      value={activePage.customWidth || 800}
                      onChange={(e) => updatePageSettings(activePage.id, { customWidth: parseInt(e.target.value) || 800 })}
                      className="w-15 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-center font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-500 text-[10px]">px</span>

                    <span className="text-slate-400 uppercase font-mono text-[10px] ml-1">H:</span>
                    <input
                      type="number"
                      min={200}
                      max={4000}
                      value={activePage.customHeight || 1000}
                      onChange={(e) => updatePageSettings(activePage.id, { customHeight: parseInt(e.target.value) || 1000 })}
                      className="w-15 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-center font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-500 text-[10px]">px</span>
                  </div>
                )}

                <span className="text-slate-400 font-medium ml-2">Orientation:</span>
                <select
                  value={activePage.orientation}
                  onChange={(e) => updatePageSettings(activePage.id, { orientation: e.target.value as any })}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              {/* Page Alignment / Position inside Workspace */}
              <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800">
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400 font-medium">Page Position:</span>
                <select
                  value={pageAlignment}
                  onChange={(e) => setPageAlignment(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="center">Center Viewport</option>
                  <option value="top-center">Top-Center</option>
                  <option value="left">Left-Aligned</option>
                  <option value="right">Right-Aligned</option>
                </select>
              </div>

              {/* Dynamic Margins (Presets + Sliders + Numeric Inputs) */}
              <div className="flex items-center gap-3 bg-slate-950/50 px-3 py-1 rounded-lg border border-slate-800 flex-wrap">
                <span className="text-slate-300 font-medium text-xs">Dynamic Margins:</span>
                <select
                  value={
                    activePage.margins.top === 36 && activePage.margins.left === 36 ? 'narrow' :
                    activePage.margins.top === 108 ? 'wide' :
                    activePage.margins.top === 0 ? 'zero' :
                    activePage.margins.top === 54 ? 'moderate' : 'normal'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const m = val === 'narrow' ? 36 : val === 'wide' ? 108 : val === 'moderate' ? 54 : val === 'zero' ? 0 : 72;
                    updatePageSettings(activePage.id, { margins: { top: m, right: m, bottom: m, left: m } });
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-indigo-300 font-medium"
                >
                  <option value="normal">Normal (72px / 1in)</option>
                  <option value="narrow">Narrow (36px / 0.5in)</option>
                  <option value="moderate">Moderate (54px / 0.75in)</option>
                  <option value="wide">Wide (108px / 1.5in)</option>
                  <option value="zero">Zero Margins (0px)</option>
                </select>

                <button
                  onClick={toggleLinkMargins}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 border transition-all ${
                    linkMargins ? 'bg-indigo-600 border-indigo-400 text-white font-semibold' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title="Link all 4 margins together"
                >
                  <span>🔗 Link All Sides</span>
                </button>

                {/* Individual Sliders & Numeric inputs for Top, Bottom, Left, Right */}
                <div className="flex items-center gap-2.5 text-[11px]">
                  {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                    <div key={side} className="flex items-center gap-1">
                      <span className="text-slate-400 uppercase font-mono text-[10px] w-4">{side[0]}:</span>
                      <input
                        type="number"
                        min={0}
                        max={250}
                        value={activePage.margins[side]}
                        onChange={(e) => handleMarginChange(side, parseInt(e.target.value) || 0)}
                        className="w-13 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-slate-500 text-[10px]">px</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Show / Hide Margin Lines Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => updatePageSettings(activePage.id, { showMargins: !(activePage.showMargins ?? true) })}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    (activePage.showMargins ?? true)
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${(activePage.showMargins ?? true) ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                  {(activePage.showMargins ?? true) ? 'Hide Margin Lines' : 'Show Margin Lines'}
                </button>
              </div>

              {/* Watermark Controls */}
              <div className="flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800">
                <span className="text-slate-400">Watermark:</span>
                <input
                  type="text"
                  placeholder="e.g. DRAFT or CONFIDENTIAL"
                  value={activePage.watermark || ''}
                  onChange={(e) => updatePageSettings(activePage.id, { watermark: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>

              {/* Page Number Toggle */}
              <div className="flex items-center gap-2 bg-slate-950/40 px-2.5 py-1.5 rounded border border-slate-800">
                <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={activePage.showPageNumber !== false}
                    onChange={(e) => updatePageSettings(activePage.id, { showPageNumber: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Show Static Page # (Bottom Right)</span>
                </label>
              </div>

              <button
                onClick={toggleGrid}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors ml-auto ${
                  showGrid ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{showGrid ? 'Grid Active' : 'Show Grid'}</span>
              </button>
            </div>
          )}

          {/* TABLE TAB */}
          {ribbonTab === 'table' && (
            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-400">Table Theme:</span>
                <select
                  value={tableTheme}
                  onChange={(e) => applyTableTheme(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="none">None (Standard)</option>
                  <option value="modern-dark">Modern Dark</option>
                  <option value="classic-blue">Classic Blue</option>
                  <option value="minimal-gray">Minimal Gray</option>
                  <option value="warm-amber">Warm Amber</option>
                  <option value="emerald-green">Emerald Green</option>
                  <option value="royal-purple">Royal Purple</option>
                </select>
              </div>

              {/* Cell Background Color */}
              <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                <span className="text-slate-400">Cell Fill:</span>
                <input
                  type="color"
                  onChange={(e) => editor.chain().focus().setCellAttribute('backgroundColor', e.target.value).run()}
                  className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded"
                  defaultValue="#ffffff"
                />
              </div>

              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
                <button
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
                >
                  + Col Left
                </button>
                <button
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
                >
                  + Col Right
                </button>
                <button
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
                >
                  + Row Above
                </button>
                <button
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
                >
                  + Row Below
                </button>
              </div>

              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
                <button
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-amber-300"
                >
                  Merge Cells
                </button>
                <button
                  onClick={() => editor.chain().focus().splitCell().run()}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-amber-300"
                >
                  Split Cell
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="px-2.5 py-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded text-xs font-medium"
                >
                  Delete Table
                </button>
              </div>

              {/* Cell Border Size & Color */}
              <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                <span className="text-slate-400 text-xs">Cell Border:</span>
                <select
                  onChange={(e) => {
                    editor.chain().focus().setCellAttribute('borderWidth', e.target.value).run();
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  defaultValue="1px"
                  title="Cell Border Width"
                >
                  <option value="0px">None</option>
                  <option value="1px">1px</option>
                  <option value="2px">2px</option>
                  <option value="3px">3px</option>
                  <option value="4px">4px</option>
                  <option value="6px">6px</option>
                </select>
                <select
                  onChange={(e) => {
                    editor.chain().focus().setCellAttribute('borderStyle', e.target.value).run();
                  }}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  defaultValue="solid"
                  title="Cell Border Style"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="none">None</option>
                </select>
                <input
                  type="color"
                  onChange={(e) => editor.chain().focus().setCellAttribute('borderColor', e.target.value).run()}
                  className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer rounded"
                  defaultValue="#cbd5e1"
                  title="Cell Border Color"
                />
              </div>
            </div>
          )}

          {/* PLUGINS TAB */}
          {ribbonTab === 'plugins' && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => onOpenModal && onOpenModal('mathjax')}
                className="flex items-center gap-2.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium text-white shadow-md transition-all"
              >
                <span>∑ Insert LaTeX Equation</span>
              </button>
              <button
                onClick={() => onOpenModal && onOpenModal('abcjs')}
                className="flex items-center gap-2.5 px-4 py-1.5 bg-pink-600 hover:bg-pink-500 rounded-lg font-medium text-white shadow-md transition-all"
              >
                <span>♪ Insert Sheet Music & MIDI</span>
              </button>
              <button
                onClick={() => onOpenModal && onOpenModal('openrouter')}
                className="flex items-center gap-2.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-lg font-medium text-white shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                <span>✨ OpenRouter AI & OCR Studio</span>
              </button>

              <button
                onClick={() => {
                  editor.chain().focus().insertContent(`<div style="padding:16px; border:2px dashed #64748b; border-radius:8px; text-align:center; margin:14px 0;"><strong style="color:#6366f1;">📊 Dynamic Data Chart Placeholder</strong><p style="font-size:12px; color:#94a3b8; margin-top:4px;">Double click or open canvas studio to bind data source</p></div><p></p>`).run();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium border border-slate-700 text-cyan-400"
              >
                <BarChart2 className="w-4 h-4" />
                <span>Insert Chart Widget</span>
              </button>
            </div>
          )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
