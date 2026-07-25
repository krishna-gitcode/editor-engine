import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { MainMenuBar } from '../ui/toolbar/MainMenuBar';
import { Toolbar } from '../features/document/Toolbar';
import { LeftSidebar } from '../ui/panels/LeftSidebar';
import { RightSidebar } from '../ui/panels/RightSidebar';
import { BottomPageStrip } from '../ui/panels/BottomPageStrip';
import { WorkspaceCanvas } from '../features/workspace/WorkspaceCanvas';
import { FloatingMenu } from '../ui/menus/FloatingMenu';
import { ContextMenu } from '../ui/menus/ContextMenu';
import { PluginModals } from '../ui/modals/PluginModals';
import { FontManagerPanel } from '../ui/panels/FontManagerPanel';
import { initPostMessageBridge } from '../api/postMessageApi';
import { EditorShortcutManager } from '../core/shortcuts/EditorShortcutManager';
import { PreviewModal } from '../ui/modals/PreviewModal';
import { PdfExportDialog } from '../ui/modals/PdfExportDialog';
import './Editor.css';

export default function Editor() {
  const showRightSidebar = useEditorStore((s) => s.showRightSidebar);
  const [isCanvasMode, setIsCanvasMode] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<'mathjax' | 'abcjs' | 'openrouter' | null>(null);
  const [showFontManager, setShowFontManager] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showPdfExportDialog, setShowPdfExportDialog] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const engineRef = useRef<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const handleEngineReady = (engine: any) => {
    engineRef.current = engine;
    (window as any).__canvasEngine = engine;
    initPostMessageBridge(engine);
  };

  React.useEffect(() => {
    EditorShortcutManager.init();
    return () => {
      EditorShortcutManager.dispose();
    };
  }, []);

  React.useEffect(() => {
    (window as any).__setIsCanvasMode = setIsCanvasMode;
    (window as any).__isCanvasMode = isCanvasMode;
    if (engineRef.current) {
      (window as any).__canvasEngine = engineRef.current;
    }
  }, [isCanvasMode]);

  React.useEffect(() => {
    const handleActiveEditorChange = () => {
      setEditorInstance((window as any).__activeEditor);
    };
    window.addEventListener('activeEditorChanged', handleActiveEditorChange);
    return () => {
      window.removeEventListener('activeEditorChanged', handleActiveEditorChange);
    };
  }, []);

  React.useEffect(() => {
    if (!contextMenu.visible) return;
    const close = () => setContextMenu(s => ({ ...s, visible: false }));
    document.addEventListener('click', close, { once: true });
    return () => document.removeEventListener('click', close);
  }, [contextMenu.visible]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-none"
         style={{ background: 'var(--ee-bg)', color: 'var(--ee-text-primary)' }}>
      {/* Top Navigation Chrome */}
      <MainMenuBar
        engine={engineRef.current || (window as any).__canvasEngine}
        editor={editorInstance || (window as any).__activeEditor}
        isCanvasMode={isCanvasMode}
        setIsCanvasMode={setIsCanvasMode}
        onOpenPreview={() => setShowPreviewModal(true)}
        onOpenPdfExport={() => setShowPdfExportDialog(true)}
      />

      {/* Ribbon Formatting Toolbar */}
      <Toolbar
        editor={editorInstance || (window as any).__activeEditor}
        onOpenModal={(type) => setActiveModal(type)}
        onOpenFontManager={() => setShowFontManager(true)}
      />

      {/* Middle 3-Column Workspace */}
      <div
        className="flex-1 flex overflow-hidden relative"
        onContextMenu={handleContextMenu}
      >
        {/* Left Sidebar */}
        <LeftSidebar
          engine={engineRef.current || (window as any).__canvasEngine}
          editor={editorInstance || (window as any).__activeEditor}
          onOpenModal={(type) => setActiveModal(type)}
        />

        {/* Center Viewport + Sticky Bottom Pages Strip */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <WorkspaceCanvas
            onEngineReady={handleEngineReady}
            onEditorReady={(editor: any) => setEditorInstance(editor)}
            onOpenModal={(type) => setActiveModal(type)}
            isCanvasMode={isCanvasMode}
          />
          <BottomPageStrip />
        </div>

        {/* Right Inspector Sidebar */}
        {showRightSidebar && (
          <RightSidebar
            engine={engineRef.current || (window as any).__canvasEngine}
            editor={editorInstance || (window as any).__activeEditor}
          />
        )}
      </div>

      {/* Contextual & Overlay Menus */}
      <FloatingMenu
        editor={editorInstance || (window as any).__activeEditor}
        engine={engineRef.current || (window as any).__canvasEngine}
        onOpenModal={(type) => setActiveModal(type)}
      />

      <ContextMenu
        engine={engineRef.current || (window as any).__canvasEngine}
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((s) => ({ ...s, visible: false }))}
      />

      {/* Interactive Modals */}
      <PluginModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        engine={engineRef.current || (window as any).__canvasEngine}
        editor={editorInstance || (window as any).__activeEditor}
      />

      {showFontManager && (
        <FontManagerPanel onClose={() => setShowFontManager(false)} />
      )}

      {showPreviewModal && (
        <PreviewModal 
          onClose={() => setShowPreviewModal(false)}
          editor={editorInstance || (window as any).__activeEditor}
          engine={engineRef.current || (window as any).__canvasEngine}
        />
      )}

      {showPdfExportDialog && (
        <PdfExportDialog onClose={() => setShowPdfExportDialog(false)} />
      )}
    </div>
  );
}
