import React from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useDocumentStore } from '../../store/documentStore';
import { Ruler } from './Ruler';
import { MarginHandles } from './MarginHandles';
import { DocumentPage } from '../document/DocumentPage';
import { CanvasLayer } from '../canvas/CanvasLayer';
import './WorkspaceCanvas.css';

interface WorkspaceCanvasProps {
  engine?: any;
  onEngineReady?: (engine: any) => void;
  onEditorReady?: (editor: any) => void;
  onOpenModal?: (type: 'mathjax' | 'abcjs' | 'openrouter') => void;
  isCanvasMode?: boolean;
}

export const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({
  onEngineReady,
  onEditorReady,
  onOpenModal,
  isCanvasMode = true,
}) => {
  const zoom = useWorkspaceStore((s) => s.zoom);
  const showRuler = useWorkspaceStore((s) => s.showRuler);
  const showGrid = useWorkspaceStore((s) => s.showGrid);
  const pageAlignment = useWorkspaceStore((s) => s.pageAlignment || 'center');

  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // Subscribe to showMargins and margins at the WorkspaceCanvas level
  // so it renders on the outer page white-box — not inside the padded content div.
  const showMargins = useDocumentStore(
    (s) => (s.pages.find((p) => p.id === s.activePageId) || s.pages[0])?.showMargins ?? true
  );
  const pageMargins = useDocumentStore(
    (s) => (s.pages.find((p) => p.id === s.activePageId) || s.pages[0])?.margins
  );
  const { top = 72, right = 72, bottom = 72, left = 72 } = pageMargins || {};

  const getPageDimensions = () => {
    let w = 816; // Letter width @ 96dpi
    let h = 1056;
    if (activePage.pageSize === 'A4') {
      w = 794;
      h = 1123;
    } else if (activePage.pageSize === 'A3') {
      w = 1123;
      h = 1587;
    } else if (activePage.pageSize === 'Custom') {
      w = activePage.customWidth || 800;
      h = activePage.customHeight || 1000;
    }
    if (activePage.orientation === 'landscape') {
      const temp = w;
      w = h;
      h = temp;
    }
    return { width: w, height: h };
  };

  const { width: PAGE_WIDTH, height: PAGE_HEIGHT } = getPageDimensions();

  const alignmentClass =
    pageAlignment === 'center'
      ? 'items-center justify-center'
      : pageAlignment === 'top-center'
      ? 'items-start justify-center'
      : pageAlignment === 'left'
      ? 'items-start justify-start'
      : 'items-start justify-end';

  const getPageMargin = () => {
    if (pageAlignment === 'center') return 'auto';
    if (pageAlignment === 'top-center') return '0 auto';
    if (pageAlignment === 'left') return '0 auto 0 0';
    if (pageAlignment === 'right') return '0 0 0 auto';
    return 'auto';
  };

  const getTransformOrigin = () => {
    if (pageAlignment === 'center') return 'center center';
    if (pageAlignment === 'top-center') return 'top center';
    if (pageAlignment === 'left') return 'top left';
    if (pageAlignment === 'right') return 'top right';
    return 'top left';
  };

  return (
    <div className={`relative flex-1 w-full h-full bg-[#0f172a] overflow-auto flex p-12 transition-all ${alignmentClass}`}>
      <div
        className={`relative transition-transform duration-150 bg-white shadow-2xl rounded-sm overflow-visible ${
          showGrid ? 'workspace-grid-bg' : ''
        }`}
        style={{
          width: `${PAGE_WIDTH}px`,
          height: `${PAGE_HEIGHT}px`,
          transform: `scale(${zoom})`,
          transformOrigin: getTransformOrigin(),
          margin: getPageMargin(),
        }}
      >
        {showRuler && <Ruler orientation="horizontal" length={PAGE_WIDTH} zoom={1} />}
        {showRuler && <Ruler orientation="vertical" length={PAGE_HEIGHT} zoom={1} />}

        {showMargins && <MarginHandles pageWidth={PAGE_WIDTH} pageHeight={PAGE_HEIGHT} />}

        {/* Rich Text Document Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <DocumentPage onEditorReady={onEditorReady} onOpenModal={onOpenModal} />
        </div>

        {/* Vector Canvas Overlay */}
        {isCanvasMode && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <CanvasLayer width={PAGE_WIDTH} height={PAGE_HEIGHT} onEngineReady={onEngineReady} />
          </div>
        )}
      </div>
    </div>
  );
};
