import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore, type SidebarTab } from '../../store/editorStore';
import { useDocumentStore } from '../../store/documentStore';
import { FileText, Sparkles, Image as ImageIcon, Shapes, Type, Layers, Search, LayoutTemplate, Plus, Trash2, Sliders, List, X } from 'lucide-react';
import { TEMPLATES } from '../../data/templates';
import { CanvaStudioPanel } from './CanvaStudioPanel';
import { ImageStudioTab } from '../../features/canvas/ImageStudioTab';
import { ShapeTools } from '../../features/canvas/ShapeTools';
import { TextPanel } from '../../features/canvas/TextPanel';
import { LayerPanel } from '../../features/canvas/LayerPanel';
import { WebImageSearch } from './WebImageSearch';
import { AIOutlinePanel } from '../../features/outline/AIOutlinePanel';
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
    { id: 'image_studio' as SidebarTab, label: 'Images', icon: ImageIcon },
    { id: 'shapes' as SidebarTab, label: 'Shapes', icon: Shapes },
    { id: 'text' as SidebarTab, label: 'Text', icon: Type },
    { id: 'layers' as SidebarTab, label: 'Layers', icon: Layers },
    { id: 'search' as SidebarTab, label: 'Web', icon: Search },
    { id: 'templates' as SidebarTab, label: 'Templates', icon: LayoutTemplate },
    { id: 'outline' as SidebarTab, label: 'Outline', icon: List },
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
              className={`sidebar-tab-btn flex-col !h-[56px] !w-[56px] ${isActive ? 'active' : ''}`}
              title={tab.label}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
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
            className="relative w-72 glass-tier-1 flex flex-col h-full overflow-hidden border-r border-slate-800"
          >
            <button 
              onClick={() => setActiveTab(null)} 
              className="absolute top-2 right-2 p-1 rounded-md bg-slate-900/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-50 shadow-sm backdrop-blur"
              title="Close Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {activeTab === 'canva_studio' && <CanvaStudioPanel engine={engine} editor={editor} />}
            {activeTab === 'image_studio' && <ImageStudioTab engine={engine} />}
            {activeTab === 'shapes' && <ShapeTools engine={engine} onOpenModal={onOpenModal} />}
            {activeTab === 'text' && <TextPanel engine={engine} />}
            {activeTab === 'layers' && <LayerPanel engine={engine} />}
            {activeTab === 'search' && <WebImageSearch engine={engine} editor={editor} />}
            {activeTab === 'outline' && <AIOutlinePanel editor={editor} />}
            {activeTab === 'templates' && (
              <div className="p-4 flex flex-col gap-3 text-slate-200 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-100">Starter Templates</h3>
                <motion.ul
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-2.5"
                >
                  {TEMPLATES.map((t, idx) => (
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
