import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore, type SidebarTab } from '../../store/editorStore';
import { useDocumentStore } from '../../store/documentStore';
import { FileText, Sparkles, Image as ImageIcon, Shapes, Type, Layers, Search, LayoutTemplate, Plus, Trash2, Sliders } from 'lucide-react';
import { CanvaStudioPanel } from './CanvaStudioPanel';
import { ImageStudioTab } from '../../features/canvas/ImageStudioTab';
import { ShapeTools } from '../../features/canvas/ShapeTools';
import { TextPanel } from '../../features/canvas/TextPanel';
import { LayerPanel } from '../../features/canvas/LayerPanel';
import { WebImageSearch } from './WebImageSearch';
import './LeftSidebar.css';

interface LeftSidebarProps {
  engine: any;
  editor?: any;
  onOpenModal?: (type: 'mathjax' | 'abcjs') => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ engine, editor: defaultEditor, onOpenModal }) => {
  const [editor, setActiveEditor] = useState<any>(defaultEditor || (window as any).__activeEditor);

  useEffect(() => {
    const handleActiveEditorChanged = () => {
      setActiveEditor((window as any).__activeEditor || defaultEditor);
    };
    window.addEventListener('activeEditorChanged', handleActiveEditorChanged);
    return () => window.removeEventListener('activeEditorChanged', handleActiveEditorChanged);
  }, [defaultEditor]);
  const activeTab = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageContent = useDocumentStore((s) => s.updatePageContent);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);

  const TABS = [
    { id: 'canva_studio' as SidebarTab, label: 'Graphics', icon: Sparkles },
    { id: 'image_studio' as SidebarTab, label: 'Image Studio', icon: ImageIcon },
    { id: 'shapes' as SidebarTab, label: 'Shapes & Math', icon: Shapes },
    { id: 'text' as SidebarTab, label: 'Text Presets', icon: Type },
    { id: 'layers' as SidebarTab, label: 'Layers', icon: Layers },
    { id: 'search' as SidebarTab, label: 'Web Images', icon: Search },
    { id: 'templates' as SidebarTab, label: 'Templates', icon: LayoutTemplate },
  ];

  return (
    <div className="flex h-full border-r border-slate-800 bg-slate-950 select-none z-20 print:hidden">
      {/* Icon Navigation Bar */}
      <div className="w-16 flex flex-col items-center py-4 gap-2 border-r border-slate-800/80 bg-slate-950 flex-shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (activeTab === tab.id) {
                  setActiveTab(null);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`sidebar-tab-btn flex-col !h-[48px] !w-[48px] ${isActive ? 'active' : ''}`}
              title={tab.label}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Panel Drawer */}
      <AnimatePresence mode="wait">
      {activeTab !== null && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-72 glass-tier-1 flex flex-col h-full overflow-hidden border-r border-slate-800"
        >
          {activeTab === 'canva_studio' && <CanvaStudioPanel engine={engine} editor={editor} />}
          {activeTab === 'image_studio' && <ImageStudioTab engine={engine} />}
          {activeTab === 'shapes' && <ShapeTools engine={engine} onOpenModal={onOpenModal} />}
          {activeTab === 'text' && <TextPanel engine={engine} />}
          {activeTab === 'layers' && <LayerPanel engine={engine} />}
          {activeTab === 'search' && <WebImageSearch engine={engine} editor={editor} />}

          {activeTab === 'templates' && (
            <div className="p-4 flex flex-col gap-3 text-slate-200 overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-100">Starter Templates</h3>
              <motion.ul
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-2.5"
              >
                {[
                  {
                    name: 'Corporate Invoice Template',
                    desc: 'Pre-formatted invoice table with theme',
                    html: `<h1 style="color: #6366f1;">INVOICE #2026-001</h1><p><strong>Date:</strong> July 10, 2026<br/><strong>Client:</strong> Sarkari Musician App</p><table data-theme="modern-dark"><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody><tr><td>Core Plugin Architecture & UI</td><td>1</td><td>$1,200.00</td><td>$1,200.00</td></tr><tr><td>Image Studio & Canvas Hybrid Engine</td><td>1</td><td>$850.00</td><td>$850.00</td></tr></tbody></table><p style="text-align: right;"><strong>Total Amount Due: $2,050.00</strong></p>`,
                    header: 'INVOICE STATEMENT',
                    footer: 'Thank you for your business!',
                  },
                  {
                    name: 'Academic Resume / CV',
                    desc: 'Multi-column clean minimal layout',
                    html: `<h1>Krishna Kumar</h1><p>Senior Full-Stack & AI Systems Architect • New Delhi / Remote • krish@example.com</p><hr/><h2>Professional Summary</h2><p>Experienced software engineer specializing in high-performance hybrid document engines, real-time vector graphics (Fabric.js), and rich-text editing (TipTap).</p><h2>Technical Skills</h2><ul><li><strong>Frontend:</strong> React 19, TypeScript, Vite 6, Tailwind CSS</li><li><strong>Engines:</strong> TipTap (ProseMirror), Fabric.js, MathJax, ABCjs</li></ul>`,
                    header: 'Curriculum Vitae',
                    footer: 'References available upon request',
                  },
                  {
                    name: 'Sarkari Mock Test Paper',
                    desc: '2-column question layout with headers',
                    html: `<h2 style="text-align: center;">SARKARI MUSICIAN - GENERAL STUDIES MOCK TEST #4</h2><p style="text-align: center;"><em>Time Allowed: 60 Minutes | Max Marks: 100 | Negative Marking: -0.25</em></p><hr/><p><strong>Q1. Which of the following constitutional amendments is known as the 'Mini-Constitution' of India?</strong></p><ul><li>(A) 42nd Amendment Act, 1976</li><li>(B) 44th Amendment Act, 1978</li><li>(C) 73rd Amendment Act, 1992</li><li>(D) 86th Amendment Act, 2002</li></ul><p><strong>Q2. Identify the correct time signature for the standard Indian classical notation rhythm 'Teental':</strong></p><p><em>[Insert ABCjs Sheet Music from Plugins Tab above for audio verification]</em></p>`,
                    header: 'Sarkari Musician Mock Examination',
                    footer: 'All rights reserved • Sarkari Musician Core',
                  },
                  {
                    name: 'Modern Certificate of Merit',
                    desc: 'Landscape A4 vector badge layout',
                    html: `<div style="text-align: center; padding: 40px;"><h1 style="font-size: 36px; color: #6366f1; margin-bottom: 10px;">CERTIFICATE OF EXCELLENCE</h1><p style="font-size: 18px; color: #64748b;">This certificate is proudly presented to</p><h2 style="font-size: 30px; margin: 20px 0; border-bottom: 2px solid #cbd5e1; display: inline-block; padding-bottom: 5px;">Outstanding Contributor</h2><p style="font-size: 16px; max-width: 600px; margin: 0 auto;">In recognition of exceptional dedication, architectural mastery, and successful restoration of the Editor Engine vector and document hybrid system.</p></div>`,
                    header: '',
                    footer: 'Issued July 2026',
                    orientation: 'landscape' as const,
                  },
                ].map((t, idx) => (
                  <motion.li
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, x: -8 },
                      show: { opacity: 1, x: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.2 } }
                    }}
                    onClick={() => {
                      updatePageContent(activePageId, t.html);
                      updatePageSettings(activePageId, {
                        header: t.header || '',
                        footer: t.footer || '',
                        orientation: t.orientation || 'portrait',
                      });
                    }}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500 cursor-pointer transition-all active:scale-95 hover:bg-slate-800"
                  >
                    <div className="text-xs font-semibold text-slate-100">{t.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
