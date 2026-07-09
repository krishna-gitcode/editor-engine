import { create } from 'zustand';

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
}

export interface IndentSettings {
  firstLine: number;
  left: number;
  right: number;
  lineHeight: number;
  paragraphSpacing: number;
}

interface WorkspaceStoreState {
  zoom: number;
  showRuler: boolean;
  showGrid: boolean;
  guides: Guide[];
  indent: IndentSettings;
  pageAlignment: 'center' | 'top-center' | 'left' | 'right';
  linkMargins: boolean;
  setZoom: (zoom: number | ((z: number) => number)) => void;
  toggleRuler: () => void;
  toggleGrid: () => void;
  addGuide: (guide: Guide) => void;
  removeGuide: (id: string) => void;
  updateIndent: (settings: Partial<IndentSettings>) => void;
  setPageAlignment: (alignment: 'center' | 'top-center' | 'left' | 'right') => void;
  toggleLinkMargins: () => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set) => ({
  zoom: 1.0,
  showRuler: true,
  showGrid: false,
  guides: [],
  indent: {
    firstLine: 0,
    left: 0,
    right: 0,
    lineHeight: 1.5,
    paragraphSpacing: 12,
  },
  pageAlignment: 'center',
  linkMargins: true,
  setZoom: (zoomOrFn) => set((s) => ({
    zoom: typeof zoomOrFn === 'function' ? Math.max(0.1, Math.min(5.0, zoomOrFn(s.zoom))) : Math.max(0.1, Math.min(5.0, zoomOrFn)),
  })),
  toggleRuler: () => set((s) => ({ showRuler: !s.showRuler })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  addGuide: (guide) => set((s) => ({ guides: [...s.guides, guide] })),
  removeGuide: (id) => set((s) => ({ guides: s.guides.filter((g) => g.id !== id) })),
  updateIndent: (settings) => set((s) => ({ indent: { ...s.indent, ...settings } })),
  setPageAlignment: (pageAlignment) => set({ pageAlignment }),
  toggleLinkMargins: () => set((s) => ({ linkMargins: !s.linkMargins })),
}));
