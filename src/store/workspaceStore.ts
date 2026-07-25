import { create } from 'zustand';

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
}

export type TabType = 'left' | 'center' | 'right' | 'decimal';

export interface TabStop {
  id: string;
  position: number;
  type: TabType;
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
  activeTabType: TabType;
  tabStops: TabStop[];
  setZoom: (zoom: number | ((z: number) => number)) => void;
  toggleRuler: () => void;
  toggleGrid: () => void;
  addGuide: (guide: Guide) => void;
  removeGuide: (id: string) => void;
  updateIndent: (settings: Partial<IndentSettings>) => void;
  setPageAlignment: (alignment: 'center' | 'top-center' | 'left' | 'right') => void;
  toggleLinkMargins: () => void;
  setActiveTabType: (type: TabType) => void;
  addTabStop: (tab: TabStop) => void;
  removeTabStop: (id: string) => void;
  clearTabStops: () => void;
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
  activeTabType: 'left',
  tabStops: [],
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
  setActiveTabType: (activeTabType) => set({ activeTabType }),
  addTabStop: (tab) => set((s) => {
    // If a tab exists at roughly the same position (within 5px), replace it. Otherwise add.
    const existing = s.tabStops.find(t => Math.abs(t.position - tab.position) < 5);
    if (existing) {
      return { tabStops: s.tabStops.map(t => t.id === existing.id ? tab : t) };
    }
    return { tabStops: [...s.tabStops, tab] };
  }),
  removeTabStop: (id) => set((s) => ({ tabStops: s.tabStops.filter((t) => t.id !== id) })),
  clearTabStops: () => set({ tabStops: [] }),
}));
