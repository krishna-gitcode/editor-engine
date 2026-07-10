import { create } from 'zustand';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface DocumentPageData {
  id: string;
  content: string;
  pageSize: 'A4' | 'Letter' | 'A3' | 'Custom';
  customWidth?: number;
  customHeight?: number;
  orientation: 'portrait' | 'landscape';
  margins: PageMargins;
  watermark?: string;
  header?: string;
  footer?: string;
  showPageNumber?: boolean;
  showMargins?: boolean;
}

interface DocumentStoreState {
  pages: DocumentPageData[];
  activePageId: string;
  addPage: () => void;
  removePage: (id: string) => void;
  updatePageContent: (id: string, content: string) => void;
  updatePageSettings: (id: string, settings: Partial<DocumentPageData>) => void;
  setActivePageId: (id: string) => void;
  movePage: (id: string, direction: 'left' | 'right' | number) => void;
  applyTemplateData: (data: Record<string, string>) => void;
}

const DEFAULT_PAGE: DocumentPageData = {
  id: 'page-1',
  content: '<p>Welcome to <strong>Editor Engine</strong>. Start typing or formatting using the Ribbon above...</p>',
  pageSize: 'A4',
  customWidth: 800,
  customHeight: 1000,
  orientation: 'portrait',
  margins: { top: 72, right: 72, bottom: 72, left: 72 }, // 1 inch default (72pt)
  showPageNumber: true,
  showMargins: true,
  header: '',
  footer: '',
};

export const useDocumentStore = create<DocumentStoreState>((set) => ({
  pages: [DEFAULT_PAGE],
  activePageId: 'page-1',
  addPage: () => set((s) => {
    const newId = `page-${Date.now()}`;
    const newPage: DocumentPageData = {
      ...DEFAULT_PAGE,
      id: newId,
      content: '<p></p>',
    };
    return { pages: [...s.pages, newPage], activePageId: newId };
  }),
  removePage: (id) => set((s) => {
    if (s.pages.length <= 1) return s;
    const filtered = s.pages.filter((p) => p.id !== id);
    return {
      pages: filtered,
      activePageId: s.activePageId === id ? filtered[0].id : s.activePageId,
    };
  }),
  updatePageContent: (id, content) => set((s) => ({
    pages: s.pages.map((p) => (p.id === id ? { ...p, content } : p)),
  })),
  updatePageSettings: (id, settings) => set((s) => ({
    pages: s.pages.map((p) => (p.id === id ? { ...p, ...settings } : p)),
  })),
  setActivePageId: (activePageId) => set({ activePageId }),
  movePage: (id, direction) => set((s) => {
    const idx = s.pages.findIndex((p) => p.id === id);
    if (idx === -1) return s;
    let targetIdx = idx;
    if (direction === 'left') targetIdx = Math.max(0, idx - 1);
    else if (direction === 'right') targetIdx = Math.min(s.pages.length - 1, idx + 1);
    else if (typeof direction === 'number') targetIdx = Math.max(0, Math.min(s.pages.length - 1, direction));

    if (targetIdx === idx) return s;
    const newPages = [...s.pages];
    const [moved] = newPages.splice(idx, 1);
    newPages.splice(targetIdx, 0, moved);
    return { pages: newPages };
  }),
  applyTemplateData: (data) => set((s) => ({
    pages: s.pages.map((p) => {
      let updatedContent = p.content;
      Object.entries(data).forEach(([key, val]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        updatedContent = updatedContent.replace(regex, val);
      });
      return { ...p, content: updatedContent };
    }),
  })),
}));
