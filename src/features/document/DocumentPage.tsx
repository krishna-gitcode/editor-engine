import React, { useEffect, useState, useCallback } from 'react';
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
import { ChartExtension } from './ChartExtension';
import { PageNumberExtension } from './PageNumberExtension';
import ImageExtension from '@tiptap/extension-image';
import { useDocumentStore } from '../../store/documentStore';
import { PluginService } from '../../services/PluginService';
import { PlusMenu } from './PlusMenu';
import { AIGhostTextExtension } from './AIGhostTextExtension';
import { AIBubbleToolbar } from './AIBubbleToolbar';
import './DocumentPage.css';

/**
 * Tracks which zone the user is currently editing.
 * - 'body'   = the main document content area
 * - 'header' = the header zone at the top
 * - 'footer' = the footer zone at the bottom
 */
type ActiveZone = 'body' | 'header' | 'footer';

interface DocumentPageProps {
  onEditorReady?: (editor: any) => void;
  onOpenModal?: (type: 'mathjax' | 'abcjs' | 'openrouter') => void;
}

export const DocumentPage: React.FC<DocumentPageProps> = ({ onEditorReady, onOpenModal }) => {
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const updatePageContent = useDocumentStore((s) => s.updatePageContent);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const { top, right, bottom, left } = activePage.margins;

  // ─── Active Zone State ────────────────────────────────────────
  const [activeZone, setActiveZone] = useState<ActiveZone>('body');

  const sharedExtensions = [
    StarterKit.configure({}),
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
    ChartExtension,
    PageNumberExtension,
    ImageExtension.configure({ allowBase64: true, inline: true }),
    AIGhostTextExtension,
  ];

  const sharedEditorProps = {
    handleKeyDown: (view: any, event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { selection, tr } = view.state;
        if (selection && (selection as any).node) {
          view.dispatch(tr.deleteSelection());
          event.preventDefault();
          return true;
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') return false;
      return false;
    },
    handleDrop: (view: any, event: any) => {
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
        } catch (err) {}
      }
      return false;
    },
  };

  // ─── Header Editor ─────────────────────────────────────────────
  const headerEditor = useEditor({
    extensions: sharedExtensions,
    content: activePage.header || '<p></p>',
    editorProps: sharedEditorProps,
    editable: true,
    onUpdate: ({ editor }) => updatePageSettings(activePage.id, { header: editor.getHTML() }),
    onFocus: ({ editor }) => {
      setActiveZone('header');
      setActiveEditorGlobally(editor);
    },
  });

  // ─── Footer Editor ─────────────────────────────────────────────
  const footerEditor = useEditor({
    extensions: sharedExtensions,
    content: activePage.footer || '<p></p>',
    editorProps: sharedEditorProps,
    editable: true,
    onUpdate: ({ editor }) => updatePageSettings(activePage.id, { footer: editor.getHTML() }),
    onFocus: ({ editor }) => {
      setActiveZone('footer');
      setActiveEditorGlobally(editor);
    },
  });

  // ─── Body Editor ───────────────────────────────────────────────
  const editor = useEditor({
    extensions: sharedExtensions,
    content: activePage.content,
    editorProps: sharedEditorProps,
    editable: true,
    onUpdate: ({ editor }) => updatePageContent(activePage.id, editor.getHTML()),
    onFocus: ({ editor }) => {
      setActiveZone('body');
      setActiveEditorGlobally(editor);
    },
  });

  const setActiveEditorGlobally = (activeEd: any) => {
    (window as any).__activeEditor = activeEd;
    window.dispatchEvent(new Event('activeEditorChanged'));
  };

  // ─── Zone Click Handlers ───────────────────────────────────────
  const handleHeaderZoneClick = useCallback(() => {
    if (activeZone !== 'header' && headerEditor) {
      setActiveZone('header');
      headerEditor.commands.focus('end');
    }
  }, [activeZone, headerEditor]);

  const handleFooterZoneClick = useCallback(() => {
    if (activeZone !== 'footer' && footerEditor) {
      setActiveZone('footer');
      footerEditor.commands.focus('end');
    }
  }, [activeZone, footerEditor]);

  const handleBodyZoneClick = useCallback(() => {
    if (activeZone !== 'body' && editor) {
      setActiveZone('body');
      editor.commands.focus();
    }
  }, [activeZone, editor]);

  // Double-click on body always brings focus back (MS Word pattern)
  const handleBodyDoubleClick = useCallback(() => {
    if (activeZone !== 'body' && editor) {
      setActiveZone('body');
      editor.commands.focus();
    }
  }, [activeZone, editor]);

  // Double-click header/footer to activate (MS Word behavior)
  const handleHeaderDoubleClick = useCallback(() => {
    if (headerEditor) {
      setActiveZone('header');
      headerEditor.commands.focus('end');
    }
  }, [headerEditor]);

  const handleFooterDoubleClick = useCallback(() => {
    if (footerEditor) {
      setActiveZone('footer');
      footerEditor.commands.focus('end');
    }
  }, [footerEditor]);

  // ESC key to return to body from header/footer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeZone !== 'body' && editor) {
        setActiveZone('body');
        editor.commands.focus();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeZone, editor]);

  useEffect(() => {
    if (editor) {
      setActiveEditorGlobally(editor);
      if (onEditorReady) onEditorReady(editor);
    }
    return () => {
      if ((window as any).__activeEditor === editor) {
        delete (window as any).__activeEditor;
        window.dispatchEvent(new Event('activeEditorChanged'));
      }
    };
  }, [editor, onEditorReady]);

  // Sync state when active page changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== activePage.content) {
      editor.commands.setContent(activePage.content, false);
    }
    if (headerEditor && headerEditor.getHTML() !== (activePage.header || '<p></p>')) {
      headerEditor.commands.setContent(activePage.header || '<p></p>', false);
    }
    if (footerEditor && footerEditor.getHTML() !== (activePage.footer || '<p></p>')) {
      footerEditor.commands.setContent(activePage.footer || '<p></p>', false);
    }
  }, [activePageId]);

  // Render Math and ABC Notation inside the Editor(s)
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
  }, [activePageId, activePage.content, activePage.header, activePage.footer]);

  // ─── Computed values ───────────────────────────────────────────
  const isHeaderActive = activeZone === 'header';
  const isFooterActive = activeZone === 'footer';
  const isBodyActive = activeZone === 'body';
  const isHfEditing = isHeaderActive || isFooterActive;

  // Header/footer zone heights — define the clickable/editable area
  const headerZoneHeight = Math.max(top, 48); // at least 48px for usability
  const footerZoneHeight = Math.max(bottom, 48);

  return (
    <div
      id="document-page-container"
      className={`document-page-surface relative w-full h-full select-text group ${isHfEditing ? 'hf-editing' : ''}`}
      style={{
        paddingTop: `${headerZoneHeight}px`,
        paddingRight: `${right}px`,
        paddingBottom: `${footerZoneHeight}px`,
        paddingLeft: `${left}px`,
      }}
    >
      {/* ═══ Watermark Overlay ═══ */}
      {activePage.watermark && (
        <div className="watermark-overlay">
          {activePage.watermark.match(/^(https?:\/\/|data:image\/)/i) ? (
            <img src={activePage.watermark} alt="watermark" className="max-w-[80%] max-h-[80%] object-contain" />
          ) : (
            <span className="watermark-text">{activePage.watermark}</span>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HEADER ZONE — Microsoft Word Style
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className={`doc-header-zone ${isHeaderActive ? 'zone-active' : ''}`}
        style={{
          height: `${headerZoneHeight}px`,
          paddingLeft: `${left}px`,
          paddingRight: `${right}px`,
        }}
        onClick={handleHeaderZoneClick}
        onDoubleClick={handleHeaderDoubleClick}
      >
        {/* Zone Label */}
        <div className="doc-zone-label" style={{ top: 4, left: `${left}px` }} data-html2canvas-ignore="true">
          <span className="label-dot" />
          <span>Header</span>
        </div>

        {/* Editor Content */}
        <div
          className="doc-zone-content"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            height: '100%',
            paddingBottom: '6px',
          }}
        >
          <div className="w-full">
            {headerEditor && <PlusMenu editor={headerEditor} onOpenModal={onOpenModal} />}
            {headerEditor && <AIBubbleToolbar editor={headerEditor} />}
            <EditorContent
              editor={headerEditor}
              className="prose prose-sm max-w-none focus:outline-none"
            />
          </div>
        </div>

        {/* Separator Line (bottom of header) */}
        <div className="doc-zone-separator" data-html2canvas-ignore="true" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BODY ZONE — Main Content
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className={`doc-body-zone ${isHfEditing ? 'body-dimmed' : ''}`}
        onClickCapture={handleBodyZoneClick}
        onDoubleClickCapture={handleBodyDoubleClick}
      >
        {editor && <PlusMenu editor={editor} onOpenModal={onOpenModal} />}
        {editor && <AIBubbleToolbar editor={editor} />}
        <EditorContent
          editor={editor}
          className="prose max-w-none focus:outline-none min-h-full print:text-black"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER ZONE — Microsoft Word Style
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className={`doc-footer-zone ${isFooterActive ? 'zone-active' : ''}`}
        style={{
          height: `${footerZoneHeight}px`,
          paddingLeft: `${left}px`,
          paddingRight: `${right}px`,
        }}
        onClick={handleFooterZoneClick}
        onDoubleClick={handleFooterDoubleClick}
      >
        {/* Separator Line (top of footer) */}
        <div className="doc-zone-separator" data-html2canvas-ignore="true" />

        {/* Zone Label */}
        <div
          className="doc-zone-label doc-zone-label-footer"
          style={{ bottom: 4, left: `${left}px` }}
          data-html2canvas-ignore="true"
        >
          <span className="label-dot" />
          <span>Footer</span>
        </div>

        {/* Editor Content */}
        <div
          className="doc-zone-content"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%',
            paddingTop: '6px',
          }}
        >
          <div className="w-full">
            {footerEditor && <PlusMenu editor={footerEditor} onOpenModal={onOpenModal} />}
            {footerEditor && <AIBubbleToolbar editor={footerEditor} />}
            <EditorContent
              editor={footerEditor}
              className="prose prose-sm max-w-none focus:outline-none"
            />
          </div>
        </div>

        {/* Page Number Badge */}
        {activePage.showPageNumber && (
          <div
            className="page-number-badge"
            style={{
              position: 'absolute',
              right: `${right}px`,
              bottom: '6px',
            }}
          >
            Page {pages.findIndex((p) => p.id === activePage.id) + 1} of {pages.length}
          </div>
        )}
      </div>
    </div>
  );
};
