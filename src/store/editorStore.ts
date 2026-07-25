import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActiveTool = 
  | 'select' 
  | 'shape_rect' 
  | 'shape_circle' 
  | 'shape_triangle' 
  | 'shape_line' 
  | 'shape_textbox' 
  | 'shape_polygon' 
  | 'draw' 
  | 'image';

export type SidebarTab = 
  | 'document' 
  | 'canva_studio' 
  | 'image_studio' 
  | 'shapes' 
  | 'text' 
  | 'layers' 
  | 'search' 
  | 'templates';

export type RibbonTab = 'home' | 'insert' | 'layout' | 'table' | 'plugins';

export interface CustomFont {
  name: string;
  url: string;
}

interface EditorStoreState {
  activeTool: ActiveTool;
  activeTab: SidebarTab | null;
  ribbonTab: RibbonTab;
  isRibbonMinimized: boolean;
  showRightSidebar: boolean;
  customFonts: CustomFont[];
  theme: 'dark' | 'light';
  setActiveTool: (tool: ActiveTool) => void;
  setActiveTab: (tab: SidebarTab | null) => void;
  setRibbonTab: (tab: RibbonTab) => void;
  toggleRibbonMinimized: () => void;
  toggleRightSidebar: () => void;
  setShowRightSidebar: (show: boolean) => void;
  addCustomFont: (font: CustomFont) => void;
  removeCustomFont: (name: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useEditorStore = create<EditorStoreState>()(
  persist(
    (set) => ({
      activeTool: 'select',
      activeTab: 'canva_studio',
      ribbonTab: 'home',
      isRibbonMinimized: false,
      showRightSidebar: true,
      customFonts: [
        { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' },
        { name: 'Outfit', url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap' },
      ],
      theme: 'dark',
      setActiveTool: (activeTool) => set({ activeTool }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setRibbonTab: (ribbonTab) => set({ ribbonTab }),
      toggleRibbonMinimized: () => set((s) => ({ isRibbonMinimized: !s.isRibbonMinimized })),
      toggleRightSidebar: () => set((s) => ({ showRightSidebar: !s.showRightSidebar })),
      setShowRightSidebar: (showRightSidebar) => set({ showRightSidebar }),
      addCustomFont: (font) => set((s) => {
        if (s.customFonts.some((f) => f.name === font.name)) return s;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = font.url;
        document.head.appendChild(link);
        return { customFonts: [...s.customFonts, font] };
      }),
      removeCustomFont: (name) => set((s) => ({
        customFonts: s.customFonts.filter((f) => f.name !== name)
      })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'editor-engine-prefs',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

