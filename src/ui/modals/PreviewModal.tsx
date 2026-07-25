import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, FileText, File, Monitor, ZoomIn, ZoomOut, Printer } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { PluginService } from '../../services/PluginService';
import './PreviewModal.css';

interface PreviewModalProps {
  onClose: () => void;
  editor?: any;
  engine?: any; // fabric.js canvas engine for capturing vector shapes
}

type PreviewMode = 'document' | 'pdf' | 'web';

/**
 * PreviewModal — Final Document Preview
 * 
 * Renders a faithful "what you see is what you get" preview of the document.
 * This captures:
 * - All rich text content (body, header, footer)
 * - Inline images (base64 and URL)
 * - MathJax equations (re-rendered via PluginService)
 * - ABC.js music notation (re-rendered via PluginService)
 * - Chart blocks (captured from the live editor DOM as rendered SVGs)
 * - Iframes / embeds
 * - Canvas vector shapes (exported from fabric.js as a PNG overlay)
 * - Watermarks & page numbers
 */
export const PreviewModal: React.FC<PreviewModalProps> = ({ onClose, editor, engine }) => {
  const [activeMode, setActiveMode] = useState<PreviewMode>('document');
  const [zoom, setZoom] = useState(100);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Captured content from the live editor
  const [bodyHtml, setBodyHtml] = useState('');
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);

  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // ─── Capture Content from Live Editor DOM ─────────────────────
  // Instead of relying only on editor.getHTML(), we clone the *rendered* DOM
  // from the live editor, which preserves MathJax output, chart SVGs, etc.
  const captureRenderedHtml = useCallback((containerSelector: string, fallbackHtml: string): string => {
    const liveContainer = document.querySelector(containerSelector);
    if (liveContainer) {
      // Deep clone the rendered DOM to preserve MathJax output, chart SVGs, rendered ABC.js
      const clone = liveContainer.cloneNode(true) as HTMLElement;
      
      // Remove editor-only UI elements from the clone
      clone.querySelectorAll('.ProseMirror-gapcursor, .ProseMirror-separator, .ProseMirror-trailingBreak').forEach(el => el.remove());
      // Remove TipTap node-view wrappers' interactive controls but keep rendered content
      clone.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable');
      });
      // Remove draggable attributes
      clone.querySelectorAll('[draggable]').forEach(el => {
        el.removeAttribute('draggable');
      });
      
      return clone.innerHTML;
    }
    return fallbackHtml;
  }, []);

  useEffect(() => {
    // Capture body content — prefer cloning the rendered DOM
    const bodyProse = document.querySelector('#document-page-container .doc-body-zone .ProseMirror');
    if (bodyProse) {
      const clone = bodyProse.cloneNode(true) as HTMLElement;
      // Strip editor-only artifacts
      clone.querySelectorAll('.ProseMirror-gapcursor, .ProseMirror-separator, .ProseMirror-trailingBreak').forEach(el => el.remove());
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      clone.querySelectorAll('[draggable]').forEach(el => el.removeAttribute('draggable'));
      setBodyHtml(clone.innerHTML);
    } else if (editor) {
      setBodyHtml(editor.getHTML());
    }

    // Capture header content from the live rendered DOM  
    const headerProse = document.querySelector('#document-page-container .doc-header-zone .ProseMirror');
    if (headerProse) {
      const clone = headerProse.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      setHeaderHtml(clone.innerHTML);
    } else {
      setHeaderHtml(activePage.header || '');
    }

    // Capture footer content from the live rendered DOM
    const footerProse = document.querySelector('#document-page-container .doc-footer-zone .ProseMirror');
    if (footerProse) {
      const clone = footerProse.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      setFooterHtml(clone.innerHTML);
    } else {
      setFooterHtml(activePage.footer || '');
    }

    // Capture canvas shapes as a transparent PNG overlay
    if (engine && engine.canvas) {
      try {
        const fabricCanvas = engine.canvas;
        const dataUrl = fabricCanvas.toDataURL({
          format: 'png',
          multiplier: 2, // 2x for crisp rendering
        });
        // Only set if there are actual objects on the canvas
        if (fabricCanvas.getObjects().length > 0) {
          setCanvasDataUrl(dataUrl);
        }
      } catch (err) {
        console.warn('Failed to capture canvas shapes for preview:', err);
      }
    }
  }, [editor, engine, activePage]);

  // ─── Re-render Plugins (MathJax, ABC.js) After DOM Insertion ──
  useEffect(() => {
    if (!contentRef.current) return;

    const processPlugins = () => {
      if (!contentRef.current) return;

      // Re-render MathJax equations in the preview
      const mathNodes = contentRef.current.querySelectorAll('.mathjax-render, [data-latex]');
      mathNodes.forEach((node) => {
        const latex = node.getAttribute('data-latex') || '';
        if (latex) {
          // Clear any stale rendered content and re-render
          node.setAttribute('data-rendered', 'false');
          PluginService.renderMathJax(node as HTMLElement, latex);
        }
      });

      // Re-render ABC.js music notation in the preview
      const abcNodes = contentRef.current.querySelectorAll('.abcjs-render, [data-abc]');
      abcNodes.forEach((node) => {
        const abc = node.getAttribute('data-abc') || '';
        if (abc) {
          node.setAttribute('data-rendered', 'false');
          PluginService.renderAbc(node as HTMLElement, abc);
        }
      });
    };

    // Run immediately + with delays to catch async library loading
    processPlugins();
    const t1 = setTimeout(processPlugins, 300);
    const t2 = setTimeout(processPlugins, 800);
    const t3 = setTimeout(processPlugins, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [bodyHtml, headerHtml, footerHtml]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center preview-modal-backdrop print-modal-wrapper">
      <div 
        className="preview-modal-container w-[90vw] h-[90vh] flex flex-col overflow-hidden"
        style={{ resize: 'both' }}
      >
        
        {/* ─── Glassmorphic Header ─── */}
        <div className="preview-modal-header h-14 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-400" />
            Document Preview
          </h2>

          {/* Mode Switcher */}
          <div className="preview-mode-switcher flex items-center rounded-xl p-1">
            {(['document', 'pdf', 'web'] as PreviewMode[]).map((mode) => {
              const Icon = mode === 'document' ? FileText : mode === 'pdf' ? File : Monitor;
              const label = mode === 'document' ? 'Document' : mode === 'pdf' ? 'PDF Print' : 'Infinite Web';
              return (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`preview-mode-btn flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeMode === mode
                      ? 'active'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="preview-print-btn flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            {/* Zoom Controls */}
            <div className="preview-zoom-control flex items-center gap-2 rounded-lg p-1">
              <button
                onClick={() => setZoom(z => Math.max(25, z - 25))}
                className="p-1.5 hover:bg-white/10 rounded-md text-slate-300 transition-all duration-200"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold w-10 text-center text-slate-300 font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom(z => Math.min(200, z + 25))}
                className="p-1.5 hover:bg-white/10 rounded-md text-slate-300 transition-all duration-200"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="preview-close-btn p-2 rounded-lg text-slate-400 hover:text-white transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Content Area ─── */}
        <div className="preview-content-area flex-1 overflow-auto flex justify-center p-8 relative">
          <div 
            ref={contentRef}
            className={`preview-container mode-${activeMode} bg-white text-black prose max-w-none transition-transform origin-top flex flex-col justify-between relative`}
            style={{ 
              transform: `scale(${zoom / 100})`,
              minWidth: activeMode === 'web' ? '800px' : '210mm',
              minHeight: activeMode === 'web' ? 'auto' : '297mm',
              paddingTop: `${activePage.margins.top}px`,
              paddingRight: `${activePage.margins.right}px`,
              paddingBottom: `${activePage.margins.bottom}px`,
              paddingLeft: `${activePage.margins.left}px`,
            }}
          >
            {/* ─── Watermark Overlay ─── */}
            {activePage.watermark && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 opacity-[0.12]">
                {activePage.watermark.match(/^(https?:\/\/|data:image\/)/i) ? (
                  <img src={activePage.watermark} alt="watermark" className="max-w-[80%] max-h-[80%] object-contain" />
                ) : (
                  <span className="text-7xl font-bold uppercase tracking-widest text-slate-300 rotate-[-45deg]">
                    {activePage.watermark}
                  </span>
                )}
              </div>
            )}

            {/* ─── Canvas Shapes Overlay (fabric.js export) ─── */}
            {canvasDataUrl && (
              <img
                src={canvasDataUrl}
                alt=""
                className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
                style={{ objectFit: 'fill' }}
              />
            )}

            {/* ─── Header ─── */}
            {headerHtml && headerHtml !== '<p></p>' && (
              <div className="preview-header-zone">
                <div 
                  className="preview-zone-content prose prose-sm max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: headerHtml }} 
                />
                <div className="preview-zone-separator" />
              </div>
            )}

            {/* ─── Body ─── */}
            <div className="relative z-10 flex-1 min-h-[500px]">
              <div className="ProseMirror preview-body-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </div>

            {/* ─── Footer & Page Number ─── */}
            <div className="preview-footer-zone">
              <div className="preview-zone-separator" />
              {footerHtml && footerHtml !== '<p></p>' && (
                <div 
                  className="preview-zone-content w-full prose prose-sm max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: footerHtml }} 
                />
              )}
              {activePage.showPageNumber && (
                <div className="preview-page-number">
                  Page {pages.findIndex((p) => p.id === activePage.id) + 1} of {pages.length}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
