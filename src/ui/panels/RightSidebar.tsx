import React, { useEffect, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useDocumentStore } from '../../store/documentStore';
import { ObjectInspector } from './inspectors/ObjectInspector';
import { TextInspector } from './inspectors/TextInspector';
import { LayoutInspector } from './inspectors/LayoutInspector';
import './RightSidebar.css';

interface RightSidebarProps {
  engine: any;
  editor?: any;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ engine, editor: defaultEditor }) => {
  const selectedObject = useCanvasStore((s) => s.selectedObjectProps);
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const [activeEditor, setActiveEditor] = useState<any>(defaultEditor || (window as any).__activeEditor);

  useEffect(() => {
    const handleActiveEditorChanged = () => {
      setActiveEditor((window as any).__activeEditor || defaultEditor);
    };
    window.addEventListener('activeEditorChanged', handleActiveEditorChanged);
    return () => window.removeEventListener('activeEditorChanged', handleActiveEditorChanged);
  }, [defaultEditor]);

  const [, setEditorTick] = useState(0);

  useEffect(() => {
    if (!activeEditor) return;
    const forceUpdate = () => setEditorTick((t) => t + 1);
    activeEditor.on('selectionUpdate', forceUpdate);
    activeEditor.on('update', forceUpdate);
    return () => {
      activeEditor.off('selectionUpdate', forceUpdate);
      activeEditor.off('update', forceUpdate);
    };
  }, [activeEditor]);

  const handlePropChange = (key: string, value: any) => {
    if (!engine) return;
    engine.updateSelected({ [key]: value });
  };

  const isTableActive = activeEditor && activeEditor.isActive('table');
  const isIframeActive = activeEditor && activeEditor.isActive('iframe');
  const iframeAttrs = isIframeActive ? activeEditor.getAttributes('iframe') : {};
  const tableAttrs = isTableActive ? activeEditor.getAttributes('table') : {};

  return (
    <div className="w-72 h-full bg-[var(--ee-surface-1)] border-l border-[var(--ee-border)] flex flex-col overflow-y-auto p-4 select-none z-20 text-[var(--ee-text-primary)] print:hidden">
      {selectedObject ? (
        <ObjectInspector 
          selectedObject={selectedObject} 
          engine={engine} 
          handlePropChange={handlePropChange} 
        />
      ) : isTableActive || isIframeActive ? (
        <TextInspector 
          activeEditor={activeEditor} 
          isTableActive={!!isTableActive} 
          tableAttrs={tableAttrs} 
          isIframeActive={!!isIframeActive} 
          iframeAttrs={iframeAttrs} 
        />
      ) : (
        <LayoutInspector 
          activePage={activePage} 
          updatePageSettings={updatePageSettings} 
        />
      )}
    </div>
  );
};
