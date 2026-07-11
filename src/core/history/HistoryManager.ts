import type { fabric } from 'fabric';

export interface Command {
  execute(): void;
  undo(): void;
}

export class AddObjectCommand implements Command {
  constructor(private canvas: fabric.Canvas, private object: fabric.Object) {}
  execute() {
    this.canvas.add(this.object);
    this.canvas.setActiveObject(this.object);
    this.canvas.requestRenderAll();
    if ((window as any).__canvasEngine) {
      (window as any).__canvasEngine.syncSelectedProps();
      (window as any).__canvasEngine.updateLayers();
    }
  }
  undo() {
    this.canvas.remove(this.object);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    if ((window as any).__canvasEngine) {
      (window as any).__canvasEngine.syncSelectedProps();
      (window as any).__canvasEngine.updateLayers();
    }
  }
}

export class DeleteObjectCommand implements Command {
  private objects: fabric.Object[];
  constructor(private canvas: fabric.Canvas, objectOrObjects: fabric.Object | fabric.Object[]) {
    if (Array.isArray(objectOrObjects)) {
      this.objects = objectOrObjects;
    } else if (objectOrObjects.type === 'activeSelection') {
      this.objects = (objectOrObjects as any).getObjects();
    } else {
      this.objects = [objectOrObjects];
    }
  }
  execute() {
    this.objects.forEach((obj) => {
      this.canvas.remove(obj);
    });
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    if ((window as any).__canvasEngine) {
      (window as any).__canvasEngine.syncSelectedProps();
      (window as any).__canvasEngine.updateLayers();
    }
  }
  undo() {
    this.objects.forEach((obj) => {
      this.canvas.add(obj);
    });
    if (this.objects.length === 1) {
      this.canvas.setActiveObject(this.objects[0]);
    } else if (this.objects.length > 1) {
      const sel = new (window as any).fabric.ActiveSelection(this.objects, { canvas: this.canvas });
      this.canvas.setActiveObject(sel);
    }
    this.canvas.requestRenderAll();
    if ((window as any).__canvasEngine) {
      (window as any).__canvasEngine.syncSelectedProps();
      (window as any).__canvasEngine.updateLayers();
    }
  }
}

class HistoryManagerService {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private onStateChangeCallback?: (canUndo: boolean, canRedo: boolean) => void;

  public setOnStateChange(cb: (canUndo: boolean, canRedo: boolean) => void) {
    this.onStateChangeCallback = cb;
  }

  public executeCommand(cmd: Command) {
    cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack = [];
    this.notify();
  }

  public undo() {
    const cmd = this.undoStack.pop();
    if (cmd) {
      cmd.undo();
      this.redoStack.push(cmd);
      this.notify();
    }
  }

  public redo() {
    const cmd = this.redoStack.pop();
    if (cmd) {
      cmd.execute();
      this.undoStack.push(cmd);
      this.notify();
    }
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  private notify() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.undoStack.length > 0, this.redoStack.length > 0);
    }
  }
}

export const historyManager = new HistoryManagerService();
