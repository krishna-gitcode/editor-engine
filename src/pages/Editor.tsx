import React, { useState, useRef } from 'react';
import { MainMenuBar } from '../ui/toolbar/MainMenuBar';
import { Toolbar } from '../features/document/Toolbar';
import { LeftSidebar } from '../ui/panels/LeftSidebar';
import { RightSidebar } from '../ui/panels/RightSidebar';
import { WorkspaceCanvas } from '../features/workspace/WorkspaceCanvas';
import { FloatingMenu } from '../ui/menus/FloatingMenu';
import { ContextMenu } from '../ui/menus/ContextMenu';
import { PluginModals } from '../ui/modals/PluginModals';
import { FontManagerPanel } from '../ui/panels/FontManagerPanel';
import { initPostMessageBridge } from '../api/postMessageApi';
import './Editor.css';

export default function Editor() {
  const [isCanvasMode, setIsCanvasMode] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<'mathjax' | 'abcjs' | 'openrouter' | null>(null);
  const [showFontManager, setShowFontManager] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const engineRef = useRef<any>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const handleEngineReady = (engine: any) => {
    engineRef.current = engine;
    initPostMessageBridge(engine);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!engineRef.current) return;
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#0f172a] text-slate-100 select-none">
      {/* Top Navigation Chrome */}
      <MainMenuBar
        engine={engineRef.current}
        isCanvasMode={isCanvasMode}
        setIsCanvasMode={setIsCanvasMode}
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
          engine={engineRef.current}
          onOpenModal={(type) => setActiveModal(type)}
        />

        {/* Center Viewport */}
        <WorkspaceCanvas
          onEngineReady={handleEngineReady}
          onEditorReady={(editor: any) => setEditorInstance(editor)}
          onOpenModal={(type) => setActiveModal(type)}
          isCanvasMode={isCanvasMode}
        />

        {/* Right Inspector Sidebar */}
        <RightSidebar
          engine={engineRef.current}
          editor={editorInstance || (window as any).__activeEditor}
        />
      </div>

      {/* Contextual & Overlay Menus */}
      <FloatingMenu
        editor={editorInstance || (window as any).__activeEditor}
        engine={engineRef.current}
        onOpenModal={(type) => setActiveModal(type)}
      />

      <ContextMenu
        engine={engineRef.current}
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu((s) => ({ ...s, visible: false }))}
      />

      {/* Interactive Modals */}
      <PluginModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        engine={engineRef.current}
        editor={editorInstance || (window as any).__activeEditor}
      />

      {showFontManager && (
        <FontManagerPanel onClose={() => setShowFontManager(false)} />
      )}
    </div>
  );
}
