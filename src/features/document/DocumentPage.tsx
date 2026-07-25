import React, { useEffect, useState, useCallback, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Selection } from '@tiptap/pm/state';
import { DOMSerializer } from '@tiptap/pm/model';
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
  const addPage = useDocumentStore((s) => s.addPage);
  const removePage = useDocumentStore((s) => s.removePage);
  const setActivePageId = useDocumentStore((s) => s.setActivePageId);
  const updatePageContent = useDocumentStore((s) => s.updatePageContent);
  const updatePageSettings = useDocumentStore((s) => s.updatePageSettings);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const { top, right, bottom, left } = activePage.margins;
  const paginateDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  const lastDeleteActionTime = useRef<number>(0);

  const sharedEditorProps = {
    handleKeyDown: (view: any, event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        lastDeleteActionTime.current = Date.now();
        
        // Handle deleting the page if they backspace on an already empty page
        const pmDom = view.dom as HTMLElement;
        const bodyZone = pmDom.closest('.doc-body-zone');
        if (bodyZone) {
          const isEmpty = view.state.doc.textContent.length === 0 && view.state.doc.childCount <= 1;
          const state = useDocumentStore.getState();
          if (isEmpty && state.pages.length > 1) {
            const activeIndex = state.pages.findIndex(p => p.id === state.activePageId);
            if (activeIndex > 0) {
              const prevPage = state.pages[activeIndex - 1];
              state.setActivePageId(prevPage.id);
              state.removePage(state.activePageId);
              event.preventDefault();
              return true;
            } else if (activeIndex === 0 && state.pages.length > 1) {
              const nextPage = state.pages[activeIndex + 1];
              state.setActivePageId(nextPage.id);
              state.removePage(state.activePageId);
              event.preventDefault();
              return true;
            }
          }
        }
      }
      
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
        } catch (err) { }
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

  // ─── Auto-Paginate Engine ──────────────────────────────────────
  /**
   * Compute the available body content height in pixels for the active page.
   * We cannot rely on bodyZone.clientHeight because document-page-surface has
   * overflow-y:auto and grows unboundedly. Instead we derive the height from
   * the page's paper size, orientation, and margins.
   *
   * Standard paper at 96 dpi:
   *   A4  portrait  : 1122 × 794  (297mm × 210mm)
   *   A4  landscape : 794  × 1122
   *   Letter portrait : 1056 × 816 (11in × 8.5in)
   *   A3  portrait  : 1587 × 1123 (420mm × 297mm)
   */
  const getPageContentHeight = useCallback((): number => {
    const PAGE_HEIGHTS: Record<string, { portrait: number; landscape: number }> = {
      A4:     { portrait: 1122, landscape: 794  },
      Letter: { portrait: 1056, landscape: 816  },
      A3:     { portrait: 1587, landscape: 1123 },
      Custom: { portrait: activePage.customHeight ?? 1000, landscape: activePage.customWidth ?? 800 },
    };
    const key = activePage.pageSize in PAGE_HEIGHTS ? activePage.pageSize : 'A4';
    const totalHeight = PAGE_HEIGHTS[key][activePage.orientation];
    const { top, bottom } = activePage.margins;
    // Subtract margins AND header/footer zones from total page height
    const headerZoneH = Math.max(top, 48);
    const footerZoneH = Math.max(bottom, 48);
    return totalHeight - headerZoneH - footerZoneH;
  }, [activePage]);

  /**
   * Loop-based paginate: collects blocks overflowing the computed page height
   * and moves them (all at once per iteration) to a new page.
   * Runs until content fits or the safety guard fires.
   */
  const runPaginate = useCallback((ed: any) => {
    if (!ed) return;
    const pmDom = ed.view.dom as HTMLElement;
    if (!pmDom) return;

    const maxContentHeight = getPageContentHeight();
    let guard = 0;
    const MAX_ITERATIONS = 40;

    while (guard < MAX_ITERATIONS) {
      guard++;

      // pmDom.scrollHeight is accurate even inside overflow-y:auto containers
      if (pmDom.scrollHeight <= maxContentHeight + 24) break;

      const doc = ed.state.doc;
      if (doc.childCount < 2) break;

      // Collect ALL blocks whose top edge exceeds maxContentHeight
      // Walk dom children (they correspond 1-to-1 with top-level ProseMirror nodes)
      const domChildren = Array.from(pmDom.children) as HTMLElement[];
      const editorTop = pmDom.getBoundingClientRect().top;

      // Find index of first overflowing block
      let firstOverflowIndex = -1;
      for (let ci = domChildren.length - 1; ci >= 1; ci--) {
        const childTop = domChildren[ci].getBoundingClientRect().top - editorTop;
        if (childTop < maxContentHeight - 10) {
          // This block starts within the page, so overflow starts at ci+1
          firstOverflowIndex = ci + 1;
          break;
        }
      }
      if (firstOverflowIndex === -1) firstOverflowIndex = domChildren.length - 1; // at least the last block

      if (firstOverflowIndex >= domChildren.length) break; // nothing overflowing

      // Build offset map
      const offsetMap: { offset: number; node: any }[] = [];
      doc.forEach((node: any, offset: number) => { offsetMap.push({ offset, node }); });

      // Collect blocks from firstOverflowIndex to end
      const blocksToMove = offsetMap.slice(firstOverflowIndex);
      if (blocksToMove.length === 0) break;

      // Serialize all overflowing blocks to HTML
      const div = document.createElement('div');
      for (const { offset, node } of blocksToMove) {
        const frag = doc.slice(offset, offset + node.nodeSize).content;
        const domFrag = DOMSerializer.fromSchema(ed.state.schema).serializeFragment(frag);
        div.appendChild(domFrag);
      }
      const movedHtml = div.innerHTML;

      // Delete range from first overflow block to doc end in one transaction
      const deleteFrom = blocksToMove[0].offset;
      const lastBlock = blocksToMove[blocksToMove.length - 1];
      const deleteTo = lastBlock.offset + lastBlock.node.nodeSize;
      ed.chain().deleteRange({ from: deleteFrom, to: deleteTo }).run();

      // Create a new page with the overflowing content
      useDocumentStore.getState().addPage(movedHtml);
    }
  }, [getPageContentHeight]);


  // ─── Body Editor ───────────────────────────────────────────────
  const editor = useEditor({
    extensions: sharedExtensions,
    content: activePage.content,
    editorProps: sharedEditorProps,
    editable: true,
    onUpdate: ({ editor }) => {
      const state = useDocumentStore.getState();
      updatePageContent(state.activePageId, editor.getHTML());

      // Debounced auto-paginate
      clearTimeout(paginateDebounce.current);
      paginateDebounce.current = setTimeout(() => runPaginate(editor), 400);
    },
    onFocus: ({ editor }) => {
      setActiveZone('body');
      setActiveEditorGlobally(editor);
    },
  });

  const setActiveEditorGlobally = (activeEd: any) => {
    (window as any).__activeEditor = activeEd;
    window.dispatchEvent(new Event('activeEditorChanged'));
  };

  // Expose __repaginate globally after editor is available
  useEffect(() => {
    if (editor) {
      (window as any).__repaginate = () => runPaginate(editor);
    }
    return () => { delete (window as any).__repaginate; };
  }, [editor, runPaginate]);

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
