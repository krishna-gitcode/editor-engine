import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MathJaxModal } from './MathJaxModal';
import { AbcjsModal } from './AbcjsModal';
import { ChartModal } from './ChartModal';
import { OpenRouterModal } from './OpenRouterModal';
import { useEditorStore } from '../../store/editorStore';
import './PluginModals.css';

interface PluginModalsProps {
  activeModal: 'mathjax' | 'abcjs' | 'openrouter' | 'chart' | null;
  onClose: () => void;
  engine: any;
  editor?: any;
}

export const PluginModals: React.FC<PluginModalsProps> = ({ activeModal, onClose, engine, editor }) => {
  const openRouterApiKey = useEditorStore(state => state.openRouterApiKey);
  
  if (!activeModal) return null;

  return (
    <AnimatePresence>
      <motion.div key="modal-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="fixed inset-0 z-[100] bg-[var(--ee-surface-0)]/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
        >
          <div className="glass-tier-2 rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col gradient-border-animated pointer-events-auto shadow-2xl relative bg-[var(--ee-surface-1)]" onClick={(e) => e.stopPropagation()}>
            {activeModal === 'mathjax' && <MathJaxModal onClose={onClose} engine={engine} editor={editor} />}
            {activeModal === 'abcjs' && <AbcjsModal onClose={onClose} engine={engine} editor={editor} />}
            {activeModal === 'chart' && <ChartModal onClose={onClose} engine={engine} editor={editor} apiKey={openRouterApiKey} selectedModel={import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'openrouter/free'} />}
            {activeModal === 'openrouter' && <OpenRouterModal onClose={onClose} engine={engine} editor={editor} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
