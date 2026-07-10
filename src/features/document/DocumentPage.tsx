import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Selection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TableRow from '@tiptap/extension-table-row';
import { CustomTableHeader } from './CustomTableHeader';
import { CustomTable } from './CustomTable';
import { CustomTableCell } from './CustomTableCell';
import { IndentExtension } from './IndentExtension';
import { ListStyleExtension } from './ListStyleExtension';
import { TextEffectExtension } from './TextEffectExtension';
import { FontSizeExtension } from './FontSizeExtension';
import { LineHeightExtension } from './LineHeightExtension';
import { IframeExtension } from './IframeExtension';
import { MathJaxExtension } from './MathJaxExtension';
import { AbcJsExtension } from './AbcJsExtension';
import { useDocumentStore } from '../../store/documentStore';
import { PluginService } from '../../services/PluginService';
import { PlusMenu } from './PlusMenu';
import './DocumentPage.css';

interface DocumentPageProps {
  onEditorReady?: (editor: any) => void;
  onOpenModal?: (type: 'mathjax' | 'abcjs' | 'openrouter') => void;
}

export const DocumentPage: React.FC<DocumentPageProps> = ({ onEditorReady, onOpenModal }) => {
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageContent = useDocumentStore((s) => s.updatePageContent);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const { top, right, bottom, left } = activePage.margins;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable built-in link or other duplicates if present
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CustomTable.configure({ resizable: true }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      IndentExtension,
      ListStyleExtension,
      TextEffectExtension,
      FontSizeExtension,
      LineHeightExtension,
      IframeExtension,
      MathJaxExtension,
      AbcJsExtension,
    ],
    content: activePage.content,
    editorProps: {
      handleKeyDown: (view, event) => {
        // Delete / Backspace on selected node views (e.g. table, image, iframe)
        if (event.key === 'Delete' || event.key === 'Backspace') {
          const { selection, tr } = view.state;
          if (selection && (selection as any).node) {
            view.dispatch(tr.deleteSelection());
            event.preventDefault();
            return true;
          }
        }
        // Ctrl/Cmd + A — Select all
        if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
          return false; // let prosemirror handle
        }
        return false;
      },
      handleDrop: (view, event, _slice, _moved) => {
        const dragData = event.dataTransfer?.getData('application/x-tiptap-node-drag');
        if (dragData) {
          try {
            const { pos, type } = JSON.parse(dragData);
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coords && typeof pos === 'number' && pos >= 0) {
              event.preventDefault();
              const tr = view.state.tr;
              const nodeToMove = view.state.doc.nodeAt(pos);
              if (nodeToMove && nodeToMove.type.name === type) {
                const targetPos = coords.pos;
                if (targetPos !== pos) {
                  if (targetPos > pos) {
                    tr.delete(pos, pos + nodeToMove.nodeSize);
                    tr.insert(Math.max(0, targetPos - nodeToMove.nodeSize), nodeToMove);
                  } else {
                    tr.delete(pos, pos + nodeToMove.nodeSize);
                    tr.insert(targetPos, nodeToMove);
                  }
                  tr.setSelection(Selection.near(tr.doc.resolve(targetPos)));
                  view.dispatch(tr);
                  return true;
                }
              }
            }
          } catch (err) {
            console.error('Failed to drag-and-drop node:', err);
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      updatePageContent(activePage.id, editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      (window as any).__activeEditor = editor;
      window.dispatchEvent(new Event('activeEditorChanged'));
      if (onEditorReady) {
        onEditorReady(editor);
      }
    }
    // Clean up window.__activeEditor on unmount
    return () => {
      if ((window as any).__activeEditor === editor) {
        delete (window as any).__activeEditor;
        window.dispatchEvent(new Event('activeEditorChanged'));
      }
    };
  }, [editor, onEditorReady]);

  // Keep window.__activeEditor updated for non-polling clean access where needed
  useEffect(() => {
    if (editor) {
      (window as any).__activeEditor = editor;
      window.dispatchEvent(new Event('activeEditorChanged'));
    }
  }, [editor]);

  // Sync state when active page changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== activePage.content) {
      editor.commands.setContent(activePage.content, false);
    }
  }, [activePageId]);

  // Render Math and ABC Notation inside the Editor
  useEffect(() => {
    const processPlugins = () => {
      const mathNodes = document.querySelectorAll('.mathjax-render:not([data-rendered="true"])');
      mathNodes.forEach((node) => {
        node.setAttribute('data-rendered', 'true');
        const latex = node.getAttribute('data-latex') || '';
        if (latex) PluginService.renderMathJax(node as HTMLElement, latex);
      });

      const abcNodes = document.querySelectorAll('.abcjs-render:not([data-rendered="true"])');
      abcNodes.forEach((node) => {
        node.setAttribute('data-rendered', 'true');
        const abc = node.getAttribute('data-abc') || '';
        if (abc) PluginService.renderAbc(node as HTMLElement, abc);
      });
    };

    processPlugins();
    const timer = setTimeout(processPlugins, 200);
    return () => clearTimeout(timer);
  }, [activePageId, activePage.content]);

  return (
    <div
      className="relative w-full h-full bg-white text-slate-900 overflow-y-auto flex flex-col justify-between select-text"
      style={{
        paddingTop: `${top}px`,
        paddingRight: `${right}px`,
        paddingBottom: `${bottom}px`,
        paddingLeft: `${left}px`,
      }}
    >
      {/* Watermark overlay */}
      {activePage.watermark && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 opacity-15">
          <span className="text-7xl font-bold uppercase tracking-widest text-slate-400 rotate-[-45deg]">
            {activePage.watermark}
          </span>
        </div>
      )}

      {/* Header */}
      {activePage.header && (
        <div className="absolute top-4 left-12 right-12 text-center text-xs text-slate-400 border-b border-slate-200 pb-1 pointer-events-none">
          {activePage.header}
        </div>
      )}

      {/* Editor Main Content Area */}
      <div className="relative z-10 flex-1 min-h-[500px]">
        {editor && <PlusMenu editor={editor} onOpenModal={onOpenModal} />}
        <EditorContent editor={editor} className="prose max-w-none focus:outline-none min-h-full" />
      </div>

      {/* Footer & Page Number */}
      <div className="relative z-10 mt-6 pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 pointer-events-none">
        <div>{activePage.footer || ''}</div>
        {activePage.showPageNumber && (
          <div>Page {pages.findIndex((p) => p.id === activePage.id) + 1} of {pages.length}</div>
        )}
      </div>
    </div>
  );
};
