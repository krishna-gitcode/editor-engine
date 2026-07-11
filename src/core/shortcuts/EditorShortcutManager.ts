import { historyManager } from '../history/HistoryManager';

export class EditorShortcutManager {
  private static isInitialized = false;
  private static listener: ((e: KeyboardEvent) => void) | null = null;

  public static init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.listener = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Do not intercept if user is typing inside standard form inputs (input, textarea, select) outside the editor
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const engine = (window as any).__canvasEngine;
      const editor = (window as any).__activeEditor;
      const isCanvasMode = (window as any).__isCanvasMode !== false;
      const activeCanvasObj = engine?.canvas?.getActiveObject();
      const isTipTapTextEditing = target.isContentEditable && target.classList.contains('ProseMirror');

      // ── DELETE / BACKSPACE ──
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isTipTapTextEditing) {
          if (activeCanvasObj && isCanvasMode) {
            e.preventDefault();
            engine.deleteSelected();
          }
          return;
        }

        if (activeCanvasObj && engine) {
          e.preventDefault();
          engine.deleteSelected();
          return;
        }

        if (editor) {
          const { selection } = editor.state;
          if (selection && (selection as any).node) {
            e.preventDefault();
            editor.commands.deleteSelection();
          }
        }
        return;
      }

      // ── CTRL / CMD COMMANDS ──
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();

        // ── SAVE (Ctrl+S) ──
        if (key === 's') {
          e.preventDefault();
          const saveBtn = document.querySelector('[data-action="export-json"]') as HTMLButtonElement;
          if (saveBtn) saveBtn.click();
          return;
        }

        // ── UNDO / REDO (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) ──
        if (key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            // REDO
            if (activeCanvasObj || (isCanvasMode && (!editor || !editor.isFocused))) {
              historyManager.redo();
            } else if (editor) {
              if (!editor.chain().focus().redo().run()) historyManager.redo();
            } else {
              historyManager.redo();
            }
          } else {
            // UNDO
            if (activeCanvasObj || (isCanvasMode && (!editor || !editor.isFocused))) {
              historyManager.undo();
            } else if (editor) {
              if (!editor.chain().focus().undo().run()) historyManager.undo();
            } else {
              historyManager.undo();
            }
          }
          return;
        }

        if (key === 'y') {
          e.preventDefault();
          if (activeCanvasObj || (isCanvasMode && (!editor || !editor.isFocused))) {
            historyManager.redo();
          } else if (editor) {
            if (!editor.chain().focus().redo().run()) historyManager.redo();
          } else {
            historyManager.redo();
          }
          return;
        }

        // ── TEXT FORMATTING (Ctrl+B, Ctrl+I, Ctrl+U) when Editor is present ──
        if (editor && (isTipTapTextEditing || editor.isFocused || !isCanvasMode)) {
          if (key === 'b') {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
            return;
          }
          if (key === 'i') {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
            return;
          }
          if (key === 'u') {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
            return;
          }
        }

        // ── CANVAS OBJECT shortcuts (when not actively typing inside TipTap text) ──
        if (!isTipTapTextEditing && engine && engine.canvas) {
          // SELECT ALL (Ctrl+A) on Canvas
          if (key === 'a' && isCanvasMode && !editor?.isFocused) {
            e.preventDefault();
            engine.canvas.discardActiveObject();
            const allObjs = engine.canvas.getObjects();
            if (allObjs.length > 0) {
              const sel = new (window as any).fabric.ActiveSelection(allObjs, { canvas: engine.canvas });
              engine.canvas.setActiveObject(sel);
              engine.canvas.requestRenderAll();
              engine.syncSelectedProps();
            }
            return;
          }

          // COPY (Ctrl+C)
          if (key === 'c' && activeCanvasObj) {
            e.preventDefault();
            engine.copySelected();
            return;
          }

          // PASTE (Ctrl+V)
          if (key === 'v' && (engine as any).clipboard) {
            e.preventDefault();
            engine.pasteSelected();
            return;
          }

          // CUT (Ctrl+X)
          if (key === 'x' && activeCanvasObj) {
            e.preventDefault();
            engine.copySelected();
            engine.deleteSelected();
            return;
          }

          // DUPLICATE (Ctrl+D)
          if (key === 'd' && activeCanvasObj) {
            e.preventDefault();
            engine.copySelected();
            setTimeout(() => engine.pasteSelected(), 50);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', this.listener, true);
  }

  public static dispose() {
    if (this.listener) {
      window.removeEventListener('keydown', this.listener, true);
      this.listener = null;
      this.isInitialized = false;
    }
  }
}
