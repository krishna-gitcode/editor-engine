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
  }
  undo() {
    this.canvas.remove(this.object);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }
}

export class DeleteObjectCommand implements Command {
  constructor(private canvas: fabric.Canvas, private object: fabric.Object) {}
  execute() {
    this.canvas.remove(this.object);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }
  undo() {
    this.canvas.add(this.object);
    this.canvas.setActiveObject(this.object);
    this.canvas.requestRenderAll();
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
