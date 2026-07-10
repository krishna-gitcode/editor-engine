import { fabric } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { historyManager, AddObjectCommand, DeleteObjectCommand } from '../history/HistoryManager';
import { SmartGuides } from './SmartGuides';

export class CanvasEngine {
  public canvas: fabric.Canvas | null = null;
  private smartGuides: SmartGuides | null = null;
  private clipboard: fabric.Object | null = null;
  public polygonPoints: fabric.Point[] = [];
  public polygonLines: fabric.Line[] = [];

  constructor() {
    historyManager.setOnStateChange((canUndo, canRedo) => {
      useCanvasStore.getState().setHistoryState(canUndo, canRedo);
    });
  }

  public init(canvasElement: HTMLCanvasElement) {
    this.canvas = new fabric.Canvas(canvasElement, {
      selection: true,
      preserveObjectStacking: true,
    });

    this.smartGuides = new SmartGuides(this.canvas);
    this.bindEvents();
    this.updateLayers();
  }

  private bindEvents() {
    if (!this.canvas) return;
    const canvas = this.canvas;

    canvas.on('selection:created', () => this.syncSelectedProps());
    canvas.on('selection:updated', () => this.syncSelectedProps());
    canvas.on('selection:cleared', () => {
      useCanvasStore.getState().updateSelectedProps(null);
    });

    canvas.on('object:modified', () => {
      this.syncSelectedProps();
      this.updateLayers();
    });

    canvas.on('object:added', () => this.updateLayers());
    canvas.on('object:removed', () => this.updateLayers());

    // Polygon drawing handler
    canvas.on('mouse:down', (options) => {
      if (!useCanvasStore.getState().isDrawingPolygon || !options.pointer) return;
      const point = new fabric.Point(options.pointer.x, options.pointer.y);
      this.polygonPoints.push(point);

      if (this.polygonPoints.length > 1) {
        const prevPoint = this.polygonPoints[this.polygonPoints.length - 2];
        const line = new fabric.Line([prevPoint.x, prevPoint.y, point.x, point.y], {
          stroke: '#6366f1',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        this.polygonLines.push(line);
        canvas.add(line);
      }
    });

    canvas.on('mouse:dblclick', () => {
      if (useCanvasStore.getState().isDrawingPolygon && this.polygonPoints.length > 2) {
        this.finishPolygon();
      }
    });
  }

  public finishPolygon() {
    if (!this.canvas || this.polygonPoints.length < 3) return;
    // Remove guide lines
    this.polygonLines.forEach((l) => this.canvas?.remove(l));
    this.polygonLines = [];

    const polygon = new fabric.Polygon(
      this.polygonPoints.map((p) => ({ x: p.x, y: p.y })),
      {
        fill: 'rgba(99, 102, 241, 0.4)',
        stroke: '#6366f1',
        strokeWidth: 2,
      }
    );

    this.polygonPoints = [];
    useCanvasStore.getState().setIsDrawingPolygon(false);
    historyManager.executeCommand(new AddObjectCommand(this.canvas, polygon));
  }

  public syncSelectedProps() {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject() as any;
    if (!activeObj) {
      useCanvasStore.getState().updateSelectedProps(null);
      return;
    }
    useCanvasStore.getState().updateSelectedProps({
      id: activeObj.id || `obj-${Date.now()}`,
      name: activeObj.name || activeObj.type,
      type: activeObj.type,
      left: Math.round(activeObj.left || 0),
      top: Math.round(activeObj.top || 0),
      width: Math.round((activeObj.width || 0) * (activeObj.scaleX || 1)),
      height: Math.round((activeObj.height || 0) * (activeObj.scaleY || 1)),
      angle: Math.round(activeObj.angle || 0),
      scaleX: activeObj.scaleX || 1,
      scaleY: activeObj.scaleY || 1,
      opacity: activeObj.opacity ?? 1,
      fill: typeof activeObj.fill === 'string' ? activeObj.fill : '#6366f1',
      stroke: typeof activeObj.stroke === 'string' ? activeObj.stroke : '#334155',
      strokeWidth: activeObj.strokeWidth || 0,
      rx: activeObj.rx || 0,
      ry: activeObj.ry || 0,
      pluginType: activeObj.pluginType,
      templateVar: activeObj.templateVar,
    });
  }

  public updateSelected(props: Partial<fabric.Object> & Record<string, any>) {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject() as any;
    if (!activeObj) return;

    if (props.width !== undefined && activeObj.width) {
      activeObj.scaleX = props.width / activeObj.width;
      delete props.width;
    }
    if (props.height !== undefined && activeObj.height) {
      activeObj.scaleY = props.height / activeObj.height;
      delete props.height;
    }

    activeObj.set(props);
    activeObj.setCoords();
    this.canvas.requestRenderAll();
    this.syncSelectedProps();
  }

  private ensureCanvasActive(cb: () => void) {
    if (!this.canvas) {
      if ((window as any).__setIsCanvasMode) {
        (window as any).__setIsCanvasMode(true);
        setTimeout(() => {
          if (this.canvas) cb();
        }, 150);
      }
      return;
    }
    if ((window as any).__isCanvasMode === false && (window as any).__setIsCanvasMode) {
      (window as any).__setIsCanvasMode(true);
    }
    cb();
  }

  public addRect(options: fabric.IRectOptions = {}) {
    this.ensureCanvasActive(() => {
      if (!this.canvas) return;
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 150,
        height: 100,
        fill: '#6366f1',
        rx: 8,
        ry: 8,
        ...options,
      });
      historyManager.executeCommand(new AddObjectCommand(this.canvas, rect));
    });
  }

  public addCircle(options: fabric.ICircleOptions = {}) {
    this.ensureCanvasActive(() => {
      if (!this.canvas) return;
      const circle = new fabric.Circle({
        left: 120,
        top: 120,
        radius: 60,
        fill: '#ec4899',
        ...options,
      });
      historyManager.executeCommand(new AddObjectCommand(this.canvas, circle));
    });
  }

  public addTriangle(options: fabric.ITriangleOptions = {}) {
    this.ensureCanvasActive(() => {
      if (!this.canvas) return;
      const triangle = new fabric.Triangle({
        left: 140,
        top: 140,
        width: 120,
        height: 120,
        fill: '#3b82f6',
        ...options,
      });
      historyManager.executeCommand(new AddObjectCommand(this.canvas, triangle));
    });
  }

  public addLine(options: fabric.ILineOptions = {}) {
    this.ensureCanvasActive(() => {
      if (!this.canvas) return;
      const line = new fabric.Line([50, 50, 200, 50], {
        left: 100,
        top: 100,
        stroke: '#f59e0b',
        strokeWidth: 4,
        ...options,
      });
      historyManager.executeCommand(new AddObjectCommand(this.canvas, line));
    });
  }

  public addTextbox(options: fabric.ITextboxOptions = {}) {
    this.ensureCanvasActive(() => {
      if (!this.canvas) return;
      const textbox = new fabric.Textbox('Heading or Text', {
        left: 100,
        top: 100,
        width: 250,
        fontSize: 28,
        fontFamily: 'Inter',
        fill: '#ffffff',
        ...options,
      });
      historyManager.executeCommand(new AddObjectCommand(this.canvas, textbox));
    });
  }

  public addImageFromUrl(url: string) {
    this.ensureCanvasActive(() => {
      if (!this.canvas) return;
      fabric.Image.fromURL(url, (img) => {
        if (!this.canvas) return;
        img.set({
          left: 100,
          top: 100,
        });
        img.scaleToWidth(300);
        historyManager.executeCommand(new AddObjectCommand(this.canvas, img));
      }, { crossOrigin: 'anonymous' });
    });
  }

  public scaleImage(scale: number) {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;
    activeObj.scale(scale);
    activeObj.setCoords();
    this.canvas.requestRenderAll();
    this.syncSelectedProps();
  }

  public flipImage(direction: 'horizontal' | 'vertical') {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;
    if (direction === 'horizontal') activeObj.set('flipX', !activeObj.flipX);
    else activeObj.set('flipY', !activeObj.flipY);
    activeObj.setCoords();
    this.canvas.requestRenderAll();
  }

  public rotateSelected(angle: number) {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;
    activeObj.rotate(angle);
    activeObj.setCoords();
    this.canvas.requestRenderAll();
    this.syncSelectedProps();
  }

  public applyImageFilter(filterName: string) {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject() as fabric.Image;
    if (!activeObj || activeObj.type !== 'image') return;

    activeObj.filters = [];
    switch (filterName.toLowerCase()) {
      case 'grayscale':
        activeObj.filters.push(new (fabric as any).Image.filters.Grayscale());
        break;
      case 'sepia':
        activeObj.filters.push(new (fabric as any).Image.filters.Sepia());
        break;
      case 'invert':
        activeObj.filters.push(new (fabric as any).Image.filters.Invert());
        break;
      case 'vintage':
        activeObj.filters.push(new (fabric as any).Image.filters.Vintage());
        break;
    }
    activeObj.applyFilters();
    this.canvas.requestRenderAll();
  }

  public applyImageAdjustment(type: string, value: number) {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject() as fabric.Image;
    if (!activeObj || activeObj.type !== 'image') return;

    // Remove existing filter of same type
    if (!activeObj.filters) activeObj.filters = [];
    activeObj.filters = activeObj.filters.filter((f: any) => f && f.type !== type);

    if (type === 'Brightness') {
      activeObj.filters.push(new (fabric as any).Image.filters.Brightness({ brightness: value }));
    } else if (type === 'Contrast') {
      activeObj.filters.push(new (fabric as any).Image.filters.Contrast({ contrast: value }));
    } else if (type === 'Saturation') {
      activeObj.filters.push(new (fabric as any).Image.filters.Saturation({ saturation: value }));
    } else if (type === 'Blur') {
      activeObj.filters.push(new (fabric as any).Image.filters.Blur({ blur: value }));
    }
    activeObj.applyFilters();
    this.canvas.requestRenderAll();
  }

  public applyShapeMask(shape: string) {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject() as fabric.Image;
    if (!activeObj || activeObj.type !== 'image') return;

    const w = activeObj.width || 100;
    const h = activeObj.height || 100;
    let clipPath: fabric.Object | undefined;

    if (shape === 'circle') {
      clipPath = new fabric.Circle({ radius: Math.min(w, h) / 2, originX: 'center', originY: 'center' });
    } else if (shape === 'triangle') {
      clipPath = new fabric.Triangle({ width: w, height: h, originX: 'center', originY: 'center' });
    }
    activeObj.clipPath = clipPath;
    this.canvas.requestRenderAll();
  }

  public cropToAspectRatio(ratio: string) {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject() as fabric.Image;
    if (!activeObj || activeObj.type !== 'image') return;
    // Apply basic center crop scaling depending on ratio
    activeObj.setCoords();
    this.canvas.requestRenderAll();
  }

  public resetImageStudio() {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject() as fabric.Image;
    if (!activeObj) return;
    activeObj.filters = [];
    if (activeObj.type === 'image') activeObj.applyFilters();
    activeObj.clipPath = undefined;
    activeObj.set({ scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false });
    activeObj.setCoords();
    this.canvas.requestRenderAll();
    this.syncSelectedProps();
  }

  public deleteSelected() {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;
    historyManager.executeCommand(new DeleteObjectCommand(this.canvas, activeObj));
  }

  public copySelected() {
    if (!this.canvas) return;
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;
    activeObj.clone((cloned: fabric.Object) => {
      this.clipboard = cloned;
    });
  }

  public pasteSelected() {
    if (!this.canvas || !this.clipboard) return;
    this.clipboard.clone((cloned: fabric.Object) => {
      if (!this.canvas) return;
      this.canvas.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = this.canvas;
        (cloned as fabric.ActiveSelection).forEachObject((obj) => {
          this.canvas?.add(obj);
        });
        cloned.setCoords();
      } else {
        this.canvas.add(cloned);
      }
      this.clipboard = cloned;
      this.canvas.setActiveObject(cloned);
      this.canvas.requestRenderAll();
      this.updateLayers();
    });
  }

  public bringToFront() {
    this.canvas?.getActiveObject()?.bringToFront();
    this.canvas?.requestRenderAll();
    this.updateLayers();
  }

  public sendToBack() {
    this.canvas?.getActiveObject()?.sendToBack();
    this.canvas?.requestRenderAll();
    this.updateLayers();
  }

  public bringForward() {
    this.canvas?.getActiveObject()?.bringForward();
    this.canvas?.requestRenderAll();
    this.updateLayers();
  }

  public sendBackward() {
    (this.canvas?.getActiveObject() as any)?.sendBackwards();
    this.canvas?.requestRenderAll();
    this.updateLayers();
  }

  public toggleLockSelected() {
    const obj = this.canvas?.getActiveObject();
    if (!obj) return;
    const locked = !obj.lockMovementX;
    obj.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      selectable: !locked,
    });
    this.canvas?.requestRenderAll();
    this.updateLayers();
  }

  public toggleVisibilitySelected() {
    const obj = this.canvas?.getActiveObject();
    if (!obj) return;
    obj.set({ visible: !obj.visible });
    this.canvas?.discardActiveObject();
    this.canvas?.requestRenderAll();
    this.updateLayers();
  }

  public updateLayers() {
    if (!this.canvas) return;
    const objects = this.canvas.getObjects();
    const layerData = objects.map((obj: any, index: number) => ({
      id: obj.id || `layer-${index}`,
      name: obj.name || `${obj.type || 'Object'} ${index + 1}`,
      type: obj.type || 'object',
      visible: obj.visible !== false,
      locked: obj.lockMovementX === true,
    }));
    useCanvasStore.getState().setLayers(layerData.reverse());
  }

  public applyTemplateVariables(data: Record<string, string>) {
    if (!this.canvas) return;
    this.canvas.getObjects().forEach((obj: any) => {
      if (obj.templateVar && data[obj.templateVar]) {
        if (obj.type === 'textbox' || obj.type === 'text') {
          obj.set('text', data[obj.templateVar]);
        }
      }
    });
    this.canvas.requestRenderAll();
  }

  public toJSON() {
    return this.canvas?.toJSON(['id', 'name', 'pluginType', 'templateVar']);
  }

  public loadFromJSON(json: any) {
    this.canvas?.loadFromJSON(json, () => {
      this.canvas?.requestRenderAll();
      this.updateLayers();
    });
  }

  public exportAsImage(format: 'png' | 'jpeg' = 'png', multiplier: number = 2) {
    return this.canvas?.toDataURL({
      format,
      multiplier,
    }) || '';
  }

  public dispose() {
    this.canvas?.dispose();
    this.canvas = null;
  }
}
