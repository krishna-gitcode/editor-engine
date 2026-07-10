import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '../../store/documentStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useEditorStore } from '../../store/editorStore';
import { Plus, Trash2, Maximize, Minimize, LayoutGrid, List, X, ZoomIn, ZoomOut } from 'lucide-react';

export const BottomPageStrip: React.FC = () => {
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const addPage = useDocumentStore((s) => s.addPage);
  const removePage = useDocumentStore((s) => s.removePage);
  const setActivePageId = useDocumentStore((s) => s.setActivePageId);

  const zoom = useWorkspaceStore((s) => s.zoom);
  const setZoom = useWorkspaceStore((s) => s.setZoom);

  const toggleRightSidebar = useEditorStore((s) => s.toggleRightSidebar);

  const [viewOverlay, setViewOverlay] = useState<'grid' | 'list' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const activePageIndex = Math.max(0, pages.findIndex((p) => p.id === activePageId));

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  return (
    <>
      {/* Grid / List View Modal Overlay (Points #3 & #4) */}
      {viewOverlay !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col overflow-hidden select-none animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                {viewOverlay === 'grid' ? <LayoutGrid className="w-5 h-5 text-indigo-400" /> : <List className="w-5 h-5 text-indigo-400" />}
                <span>Document Pages — {viewOverlay === 'grid' ? 'Grid View' : 'List View'} ({pages.length})</span>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700/60">
                💡 Double-click any page to select & edit
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewOverlay(viewOverlay === 'grid' ? 'list' : 'grid')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
              >
                {viewOverlay === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                <span>Switch to {viewOverlay === 'grid' ? 'List View' : 'Grid View'}</span>
              </button>
              <button
                onClick={() => setViewOverlay(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors"
                title="Close View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-8">
            <div
              className={
                viewOverlay === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto'
                  : 'flex flex-col gap-4 max-w-2xl mx-auto'
              }
            >
              {pages.map((p, i) => {
                const isActive = activePageId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePageId(p.id)}
                    onDoubleClick={() => {
                      setActivePageId(p.id);
                      setViewOverlay(null);
                    }}
                    className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 border-indigo-500 shadow-xl shadow-indigo-600/10 ring-2 ring-indigo-500/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center font-bold text-sm text-indigo-400 shadow">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-100">Page {i + 1}</div>
                          <div className="text-[11px] text-slate-400 uppercase mt-0.5">
                            {p.pageSize} • {p.orientation}
                          </div>
                        </div>
                      </div>

                      {pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePage(p.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete Page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Miniature Page Thumbnail Simulation */}
                    <div className="w-full aspect-[1/1.3] rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                      <div className="text-[10px] text-slate-500 font-mono line-clamp-4 leading-relaxed">
                        {p.content ? p.content.replace(/<[^>]+>/g, ' ').trim() || 'Empty Page Content...' : 'Empty Page Content...'}
                      </div>
                      <div className="mt-auto pt-2 text-[10px] text-indigo-400/80 font-medium">
                        Double click to edit →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Page Strip */}
      <div className="w-full h-16 bg-slate-950/95 border-t border-slate-800/80 flex items-center justify-between px-4 gap-4 select-none z-20 flex-shrink-0 backdrop-blur-sm">
        {/* Left: Plus icon button replacing 'Document Pages' (Point #2) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={addPage}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-md shadow-indigo-600/20 flex items-center justify-center transition-all"
            title="Add New Page"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Page Cards Strip */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar">
          {pages.map((p, i) => {
            const isActive = activePageId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  if (isActive) {
                    toggleRightSidebar();
                  } else {
                    setActivePageId(p.id);
                  }
                }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border cursor-pointer transition-all flex-shrink-0 group ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {/* Click on page number badge toggles Inspector (Point #1) */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePageId(p.id);
                    toggleRightSidebar();
                  }}
                  className="w-5 h-6 rounded border border-slate-700/60 bg-slate-950 flex items-center justify-center text-[10px] font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                  title="Click Page Number to Toggle Inspector"
                >
                  {i + 1}
                </div>
                <div className="flex flex-col text-left">
                  <div className="text-xs font-medium leading-none">Page {i + 1}</div>
                  <div className="text-[9px] text-slate-400 uppercase mt-0.5">
                    {p.pageSize} • {p.orientation === 'landscape' ? 'Land' : 'Port'}
                  </div>
                </div>

                {pages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePage(p.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isActive ? 'text-slate-300 hover:text-red-400 hover:bg-indigo-600/40' : 'text-slate-500 hover:text-red-400 hover:bg-slate-700'
                    }`}
                    title="Delete Page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Controls: Page count, Zoom, Full screen, Grid/List view (Point #3) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Page Count */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-300">
            <span>{activePageIndex + 1} / {pages.length} Pages</span>
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-300">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-11 text-center font-semibold text-xs">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Full Screen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-indigo-400" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Grid View & List View Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewOverlay(viewOverlay === 'grid' ? null : 'grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewOverlay === 'grid'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Show Pages in Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewOverlay(viewOverlay === 'list' ? null : 'list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewOverlay === 'list'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Show Pages in List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
