import React, { useState, useEffect, useRef } from 'react';
import { OpenRouterService, FREE_OPENROUTER_MODELS } from '../../services/OpenRouterService';
import { PdfService, PdfPageImage } from '../../services/PdfService';
import { parseMarkdownToTipTap, parseOcrOutput, getActiveEditorFormat, applyEditorFormatToNodes } from '../../services/markdownToHtml';
import { Sparkles, Wand2, Image as ImageIcon, Copy, Loader2, UploadCloud, FileType2, ChevronLeft, ChevronRight, Check, X, ChevronDown } from 'lucide-react';

interface OpenRouterModalProps {
  onClose: () => void;
  engine: any;
  editor?: any;
}

export const OpenRouterModal: React.FC<OpenRouterModalProps> = ({ onClose, engine, editor }) => {
  const [openrouterTab, setOpenrouterTab] = useState<'generator' | 'ocr'>('generator');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('editor_openrouter_api_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '');
  const [selectedModel, setSelectedModel] = useState<string>(() => import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'openrouter/free');
  
  const [availableModels, setAvailableModels] = useState<any[]>(FREE_OPENROUTER_MODELS);
  
  const [aiPrompt, setAiPrompt] = useState<string>('Write a comprehensive 3-paragraph executive summary outlining our new e-learning course features.');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrPrompt, setOcrPrompt] = useState<string>('Extract all text, tables, equations, and structural elements from this image accurately into clean Markdown format. Preserve exact text wording, headings, and lists. IMPORTANT: Do not interpret or solve formulas or music. Extract their exact syntactical representation. Enclose any mathematical equations in <mathjax>...</mathjax> tags and sheet music/ABC notation in <abcjs>...</abcjs> tags. Output tables as markdown tables.');
  const [ocrOutput, setOcrOutput] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const [isPdfMode, setIsPdfMode] = useState<boolean>(false);
  const [pdfPages, setPdfPages] = useState<PdfPageImage[]>([]);
  const [pdfPreviewIndex, setPdfPreviewIndex] = useState<number>(0);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');

  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/models");
        const data = await res.json();
        const liveFree = data.data.filter((model: any) => 
          model.id === "openrouter/free" || model.id.endsWith(":free")
        ).map((m: any) => ({
          id: m.id,
          name: m.name,
          isVision: m.architecture?.input_modalities?.includes('image') || false
        }));
        
        if (liveFree.length > 0) {
          const merged = [...FREE_OPENROUTER_MODELS.filter(m => m.id !== 'openrouter/free')];
          liveFree.forEach((liveModel: any) => {
            if (!merged.find(m => m.id === liveModel.id) && liveModel.id !== 'openrouter/free') {
              merged.push(liveModel);
            }
          });
          setAvailableModels(merged);
        }
      } catch (err) {
        console.error("Failed to fetch live free OpenRouter catalog:", err);
      }
    };
    fetchModels();
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (val.trim()) {
      localStorage.setItem('editor_openrouter_api_key', val.trim());
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const res = await OpenRouterService.generateText(apiKey, selectedModel, aiPrompt);
      setAiOutput(res);
    } catch (err: any) {
      setAiError(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getVisionModel = () => {
    return selectedModel.includes('vl') || selectedModel.includes('gemini')
      ? selectedModel
      : 'nvidia/nemotron-nano-12b-v2-vl:free';
  };

  const handlePerformOCR = async () => {
    if (isPdfMode) {
      if (pdfPages.length === 0) {
        setOcrError('Please upload a PDF file first.');
        return;
      }
      setIsExtracting(true);
      setOcrError(null);
      setOcrOutput('');
      const model = getVisionModel();
      const parts: string[] = [];
      try {
        for (let i = 0; i < pdfPages.length; i++) {
          const page = pdfPages[i];
          setPdfProgress(`Extracting page ${page.pageNumber} of ${page.totalPages}...`);
          const res = await OpenRouterService.performOCR(apiKey, model, page.dataUrl, ocrPrompt);
          parts.push(`## Page ${page.pageNumber}\n\n${res}`);
          setOcrOutput(parts.join('\n\n---\n\n'));
        }
        setPdfProgress('');
      } catch (err: any) {
        setOcrError(err.message || 'PDF OCR extraction failed.');
        setPdfProgress('');
      } finally {
        setIsExtracting(false);
      }
    } else {
      if (!ocrImage) {
        setOcrError('Please upload an image or PDF first.');
        return;
      }
      setIsExtracting(true);
      setOcrError(null);
      try {
        const res = await OpenRouterService.performOCR(apiKey, getVisionModel(), ocrImage, ocrPrompt);
        setOcrOutput(res);
      } catch (err: any) {
        setOcrError(err.message || 'OCR extraction failed.');
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const insertIntoEditor = (markdown: string) => {
    const activeEditor = editor || (window as any).__activeEditor;
    if (!activeEditor) {
      console.warn('[GridLeaf Editor] No active TipTap editor found. Cannot insert AI content.');
      return false;
    }
    // Capture the editor's current formatting context
    const format = getActiveEditorFormat(activeEditor);
    let nodes = parseMarkdownToTipTap(markdown);
    if (nodes.length === 0) return false;
    // Apply the active editor format to every generated node
    nodes = applyEditorFormatToNodes(nodes, format);
    activeEditor.chain().focus().insertContent(nodes).run();
    // Trigger re-pagination for large insertions
    setTimeout(() => (window as any).__repaginate?.(), 200);
    return true;
  };

  const handleInsertAIOutput = (text: string) => {
    if (!text.trim()) return;
    insertIntoEditor(text);
    onClose();
  };

  const handleInsertOcrOutput = (text: string) => {
    if (!text.trim()) return;
    const activeEditor = editor || (window as any).__activeEditor;
    const segments = parseOcrOutput(text);
    if (activeEditor) {
      // Capture the editor's current formatting context
      const format = getActiveEditorFormat(activeEditor);
      for (const seg of segments) {
        if (seg.type === 'mathjax') {
          if (activeEditor.commands.insertMathJax) {
            activeEditor.commands.insertMathJax({ latex: seg.content });
          } else {
            activeEditor.chain().focus().insertContent({ type: 'mathJax', attrs: { latex: seg.content } }).run();
          }
        } else if (seg.type === 'abcjs') {
          if (activeEditor.commands.insertAbcJs) {
            activeEditor.commands.insertAbcJs({ abc: seg.content });
          } else {
            activeEditor.chain().focus().insertContent({ type: 'abcJs', attrs: { abc: seg.content } }).run();
          }
        } else if (seg.nodes && seg.nodes.length > 0) {
          // Apply editor format to parsed tiptap nodes
          const formatted = applyEditorFormatToNodes(seg.nodes, format);
          activeEditor.chain().focus().insertContent(formatted).run();
        }
      }
      // Trigger re-pagination
      setTimeout(() => (window as any).__repaginate?.(), 200);
    }
    onClose();
  };

  const handleOcrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrError(null);
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setIsPdfMode(true);
      setOcrImage(null);
      setPdfPages([]);
      setOcrOutput('');
      setPdfFileName(file.name);
      setPdfProgress('Loading PDF and rendering pages...');
      try {
        const buffer = await PdfService.readFileAsArrayBuffer(file);
        const pages = await PdfService.pdfToImages(buffer);
        setPdfPages(pages);
        setPdfPreviewIndex(0);
        setPdfProgress('');
      } catch (err: any) {
        setOcrError(err.message || 'Failed to render PDF pages.');
        setPdfProgress('');
        setIsPdfMode(false);
      }
    } else {
      setIsPdfMode(false);
      setPdfPages([]);
      setPdfFileName('');
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setOcrImage(result);
          setOcrError(null);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleGrabCanvasImage = () => {
    if (engine && engine.canvas) {
      const activeObj = engine.canvas.getActiveObject();
      if (activeObj && (activeObj.type === 'image' || activeObj._element)) {
        const dataUrl = activeObj.toDataURL({ format: 'png', quality: 0.95 });
        setOcrImage(dataUrl);
        setOcrError(null);
      } else {
        setOcrError('No image object currently selected on canvas. Select an image object first or upload a file.');
      }
    } else {
      setOcrError('Canvas engine is not active in current view.');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ee-border)', background: 'var(--ee-surface-1)' }}>
        <div className="flex items-center gap-2 font-semibold text-[var(--ee-text-primary)]">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>OpenRouter AI Text Generator & Vision OCR Studio</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[var(--ee-surface-2)] rounded text-[var(--ee-text-secondary)] hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between border-b px-6 pt-2 gap-4 text-xs" style={{ borderColor: 'var(--ee-border)', background: 'var(--ee-surface-2)' }}>
        <div className="flex gap-4">
          <button
            onClick={() => setOpenrouterTab('generator')}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 font-medium transition-all ${openrouterTab === 'generator' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[var(--ee-text-secondary)] hover:text-[var(--ee-text-primary)]'}`}
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Text & Content Generator</span>
          </button>
          <button
            onClick={() => setOpenrouterTab('ocr')}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 font-medium transition-all ${openrouterTab === 'ocr' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[var(--ee-text-secondary)] hover:text-[var(--ee-text-primary)]'}`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Vision OCR & Document Extractor</span>
          </button>
        </div>
        <div className="mb-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--ee-surface-2)] border border-[var(--ee-border)] text-[11px] text-emerald-300 relative">
          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent border-none outline-none text-emerald-300 font-mono text-[11px] appearance-none pr-4 w-[160px] cursor-pointer truncate"
          >
            <option value="openrouter/free" style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)' }}>Default (openrouter/free)</option>
            {availableModels.map(model => (
              <option key={model.id} value={model.id} style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)' }}>
                {model.name || model.id} {model.isVision ? '👁️' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-emerald-400 absolute right-2 pointer-events-none" />
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto text-xs text-[var(--ee-text-primary)]">
        {openrouterTab === 'generator' && (
          <>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-[var(--ee-text-secondary)]">AI Prompt & Instructions</label>
                  <div className="flex gap-1.5">
                    <button onClick={() => setAiPrompt('Summarize our document into 5 concise bullet points.')} className="px-2 py-0.5 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] text-[10px] text-emerald-300">Summarize</button>
                    <button onClick={() => setAiPrompt('Rewrite the content with a formal, authoritative executive tone.')} className="px-2 py-0.5 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] text-[10px] text-emerald-300">Polish Grammar</button>
                  </div>
                </div>
                <div className="w-full gradient-border-animated rounded-xl">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want to write or generate..."
                    className="w-full h-44 border rounded-xl p-3 text-xs focus:outline-none focus:border-transparent resize-none relative z-10"
                    style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}
                  />
                </div>
              </div>
              {aiError && <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">{aiError}</div>}
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !apiKey}
                className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 font-medium text-white shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating text...</> : <><Sparkles className="w-4 h-4" /> Generate Text Content</>}
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-[var(--ee-text-secondary)]">Generated Output (Markdown)</span>
                  {aiOutput && <button onClick={() => navigator.clipboard.writeText(aiOutput)} className="flex items-center gap-1 text-[11px] text-[var(--ee-text-secondary)] hover:text-white"><Copy className="w-3 h-3" /> Copy Text</button>}
                </div>
                <div className="flex-1 min-h-[160px] p-4 border rounded-xl overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}>
                  {aiOutput || <span className="text-[var(--ee-text-faint)] italic">AI generated response will appear here.</span>}
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] font-medium text-[var(--ee-text-primary)] transition-colors">Close</button>
                <button
                  onClick={() => handleInsertAIOutput(aiOutput)}
                  disabled={!aiOutput}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-medium text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Insert into Document</span>
                </button>
              </div>
            </div>
          </>
        )}

        {openrouterTab === 'ocr' && (
          <>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-[var(--ee-text-secondary)]">Source Material</span>
                  <div className="flex gap-1.5">
                    <button onClick={handleGrabCanvasImage} className="px-2 py-1 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] text-[10px] text-[var(--ee-text-primary)] flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Canvas Obj</button>
                    <button onClick={() => ocrFileInputRef.current?.click()} className="px-2 py-1 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] text-[10px] text-[var(--ee-text-primary)] flex items-center gap-1"><UploadCloud className="w-3 h-3" /> Upload</button>
                  </div>
                </div>
                <input type="file" ref={ocrFileInputRef} onChange={handleOcrFileUpload} accept="image/*,application/pdf" className="hidden" />
                <div className="w-full h-44 border rounded-xl flex items-center justify-center bg-black/20 overflow-hidden relative group" style={{ borderColor: 'var(--ee-border)' }}>
                  {isPdfMode && pdfPages.length > 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                      <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 backdrop-blur-sm z-10"><FileType2 className="w-3 h-3 text-red-400" /> PDF Page {pdfPreviewIndex + 1} / {pdfPages.length}</div>
                      <img src={pdfPages[pdfPreviewIndex].dataUrl} alt={`PDF Page ${pdfPreviewIndex + 1}`} className="max-w-full max-h-full object-contain shadow-lg" />
                      <div className="absolute inset-y-0 left-0 flex items-center px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => setPdfPreviewIndex(p => Math.max(0, p - 1))} disabled={pdfPreviewIndex === 0} className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => setPdfPreviewIndex(p => Math.min(pdfPages.length - 1, p + 1))} disabled={pdfPreviewIndex === pdfPages.length - 1} className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : ocrImage ? (
                    <img src={ocrImage} alt="OCR Source" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center text-[var(--ee-text-secondary)]"><ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" /><div className="text-[11px]">No source uploaded</div></div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--ee-text-secondary)] mb-1.5">Extraction Instructions</label>
                <textarea
                  value={ocrPrompt}
                  onChange={(e) => setOcrPrompt(e.target.value)}
                  className="w-full h-20 border rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}
                />
              </div>
              {ocrError && <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">{ocrError}</div>}
              {pdfProgress && <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-800 text-indigo-300 text-xs font-mono animate-pulse">{pdfProgress}</div>}
              <button
                onClick={handlePerformOCR}
                disabled={isExtracting || (!ocrImage && !isPdfMode) || !apiKey}
                className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 font-medium text-white shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                {isExtracting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing OCR...</> : <><Sparkles className="w-4 h-4" /> Extract using Vision AI</>}
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-[var(--ee-text-secondary)]">Extracted Content (Markdown)</span>
                  {ocrOutput && <button onClick={() => navigator.clipboard.writeText(ocrOutput)} className="flex items-center gap-1 text-[11px] text-[var(--ee-text-secondary)] hover:text-white"><Copy className="w-3 h-3" /> Copy Text</button>}
                </div>
                <div className="flex-1 min-h-[160px] p-4 border rounded-xl overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}>
                  {ocrOutput || <span className="text-[var(--ee-text-faint)] italic">Extracted document content will appear here.</span>}
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] font-medium text-[var(--ee-text-primary)] transition-colors">Close</button>
                <button
                  onClick={() => handleInsertOcrOutput(ocrOutput)}
                  disabled={!ocrOutput}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-medium text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Insert into Document</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* API Key Modal Banner */}
      {!apiKey && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-red-600 text-white text-center text-xs font-semibold rounded-t-2xl z-50">
          An OpenRouter API key is required to use AI features. Set it in the plugin toolbar.
        </div>
      )}
    </>
  );
};
