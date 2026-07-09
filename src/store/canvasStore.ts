import { create } from 'zustand';
import type { fabric } from 'fabric';

export interface SelectedObjectProps {
  id?: string;
  name?: string;
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  pluginType?: 'mathjax' | 'abcjs';
  templateVar?: string;
}

export interface CanvasLayerData {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

interface CanvasStoreState {
  layers: CanvasLayerData[];
  selectedObjectProps: SelectedObjectProps | null;
  canUndo: boolean;
  canRedo: boolean;
  isDrawingPolygon: boolean;
  setLayers: (layers: CanvasLayerData[]) => void;
  updateSelectedProps: (props: SelectedObjectProps | null) => void;
  setHistoryState: (canUndo: boolean, canRedo: boolean) => void;
  setIsDrawingPolygon: (drawing: boolean) => void;
}

export const useCanvasStore = create<CanvasStoreState>((set) => ({
  layers: [],
  selectedObjectProps: null,
  canUndo: false,
  canRedo: false,
  isDrawingPolygon: false,
  setLayers: (layers) => set({ layers }),
  updateSelectedProps: (selectedObjectProps) => set({ selectedObjectProps }),
  setHistoryState: (canUndo, canRedo) => set({ canUndo, canRedo }),
  setIsDrawingPolygon: (isDrawingPolygon) => set({ isDrawingPolygon }),
}));
