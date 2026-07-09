import { fabric } from 'fabric';

export class SmartGuides {
  private canvas: fabric.Canvas;
  private ctx: CanvasRenderingContext2D | null = null;
  private snappingDistance = 8;
  private guideLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getSelectionContext();
    this.initEvents();
  }

  private initEvents() {
    this.canvas.on('object:moving', (e) => this.handleObjectMoving(e));
    this.canvas.on('mouse:up', () => this.clearGuides());
  }

  private handleObjectMoving(e: fabric.IEvent) {
    const activeObject = e.target;
    if (!activeObject || !this.canvas) return;

    this.clearGuides();
    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();
    const objCenter = activeObject.getCenterPoint();
    const objBounds = activeObject.getBoundingRect();

    // Check center vertical guide
    if (Math.abs(objCenter.x - canvasWidth / 2) < this.snappingDistance) {
      activeObject.setPositionByOrigin(new fabric.Point(canvasWidth / 2, objCenter.y), 'center', 'center');
      this.guideLines.push({ x1: canvasWidth / 2, y1: 0, x2: canvasWidth / 2, y2: canvasHeight });
    }

    // Check center horizontal guide
    if (Math.abs(objCenter.y - canvasHeight / 2) < this.snappingDistance) {
      activeObject.setPositionByOrigin(new fabric.Point(objCenter.x, canvasHeight / 2), 'center', 'center');
      this.guideLines.push({ x1: 0, y1: canvasHeight / 2, x2: canvasWidth, y2: canvasHeight / 2 });
    }

    // Check alignment with other objects
    this.canvas.getObjects().forEach((obj) => {
      if (obj === activeObject || !obj.visible) return;
      const targetCenter = obj.getCenterPoint();
      const targetBounds = obj.getBoundingRect();

      // Horizontal alignment (center y)
      if (Math.abs(objCenter.y - targetCenter.y) < this.snappingDistance) {
        activeObject.setPositionByOrigin(new fabric.Point(objCenter.x, targetCenter.y), 'center', 'center');
        this.guideLines.push({ x1: 0, y1: targetCenter.y, x2: canvasWidth, y2: targetCenter.y });
      }

      // Vertical alignment (center x)
      if (Math.abs(objCenter.x - targetCenter.x) < this.snappingDistance) {
        activeObject.setPositionByOrigin(new fabric.Point(targetCenter.x, objCenter.y), 'center', 'center');
        this.guideLines.push({ x1: targetCenter.x, y1: 0, x2: targetCenter.x, y2: canvasHeight });
      }
    });

    this.drawGuides();
  }

  private drawGuides() {
    if (!this.ctx || this.guideLines.length === 0) return;
    this.ctx.save();
    this.ctx.strokeStyle = '#ec4899'; // pink accent for snap
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);

    this.guideLines.forEach((line) => {
      this.ctx?.beginPath();
      this.ctx?.moveTo(line.x1, line.y1);
      this.ctx?.lineTo(line.x2, line.y2);
      this.ctx?.stroke();
    });

    this.ctx.restore();
  }

  private clearGuides() {
    this.guideLines = [];
    this.canvas.clearContext(this.canvas.getSelectionContext());
  }
}
