import { create } from 'zustand';

interface AIStore {
  // Streaming state
  isStreaming: boolean;
  streamingText: string;        // accumulates streamed tokens for display

  // Config (persisted per session)
  selectedModel: string;         // default: from VITE_OPENROUTER_DEFAULT_MODEL or 'google/gemini-2.0-flash-lite-preview-02-05:free'
  apiKey: string;                // default: from VITE_OPENROUTER_API_KEY or ''

  // Ghost text (inline autocomplete)
  ghostText: string;
  ghostCursorPos: number;

  // AI Panel UI state
  isAIPanelOpen: boolean;
  aiPanelMode: 'generate' | 'rewrite' | 'chat' | 'canvas';
  lastAIError: string | null;

  // Actions
  setStreaming: (v: boolean) => void;
  appendStreamChunk: (chunk: string) => void;
  clearStreamingText: () => void;
  setModel: (m: string) => void;
  setApiKey: (k: string) => void;
  setGhostText: (text: string, cursorPos: number) => void;
  clearGhostText: () => void;
  setAIPanelOpen: (open: boolean) => void;
  setAIPanelMode: (mode: AIStore['aiPanelMode']) => void;
  setLastAIError: (err: string | null) => void;
}

export const useAIStore = create<AIStore>((set) => ({
  isStreaming: false,
  streamingText: '',

  selectedModel: import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',

  ghostText: '',
  ghostCursorPos: 0,

  isAIPanelOpen: false,
  aiPanelMode: 'generate',
  lastAIError: null,

  setStreaming: (v) => set({ isStreaming: v }),
  appendStreamChunk: (chunk) => set((state) => ({ streamingText: state.streamingText + chunk })),
  clearStreamingText: () => set({ streamingText: '' }),
  setModel: (m) => set({ selectedModel: m }),
  setApiKey: (k) => set({ apiKey: k }),
  setGhostText: (text, cursorPos) => set({ ghostText: text, ghostCursorPos: cursorPos }),
  clearGhostText: () => set({ ghostText: '', ghostCursorPos: 0 }),
  setAIPanelOpen: (open) => set({ isAIPanelOpen: open }),
  setAIPanelMode: (mode) => set({ aiPanelMode: mode }),
  setLastAIError: (err) => set({ lastAIError: err }),
}));
