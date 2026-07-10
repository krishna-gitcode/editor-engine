import React, { useState, useEffect, useRef } from 'react';
import { PluginService } from '../../services/PluginService';
import { OpenRouterService } from '../../services/OpenRouterService';
import { PdfService, PdfPageImage } from '../../services/PdfService';
import { X, Sigma, Music, Check, Sparkles, Wand2, Image as ImageIcon, FileText, Copy, Loader2, UploadCloud, FileType2, ChevronLeft, ChevronRight } from 'lucide-react';
import './PluginModals.css';

interface PluginModalsProps {
  activeModal: 'mathjax' | 'abcjs' | 'openrouter' | null;
  onClose: () => void;
  engine: any;
  editor?: any;
}

export const PluginModals: React.FC<PluginModalsProps> = ({
  activeModal,
  onClose,
  engine,
  editor,
}) => {
  const [latex, setLatex] = useState('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [abcNotation, setAbcNotation] = useState(
    'X:1\nT:Sarkari Anthem Melody\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c | c B A G | F E D C |]'
  );

  // OpenRouter State
  const [openrouterTab, setOpenrouterTab] = useState<'generator' | 'ocr'>('generator');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('editor_openrouter_api_key') || import.meta.env.VITE_OPENROUTER_API_KEY || '');
  const [selectedModel] = useState<string>(() => import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'openrouter/free');
  
  // Generator state
  const [aiPrompt, setAiPrompt] = useState<string>('Write a comprehensive 3-paragraph executive summary outlining our new e-learning course features.');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // OCR state — image mode
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrPrompt, setOcrPrompt] = useState<string>('Extract all text, tables, equations, and structural headings from this document image accurately into clean Markdown format.');
  const [ocrOutput, setOcrOutput] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // OCR state — PDF mode
  const [isPdfMode, setIsPdfMode] = useState<boolean>(false);
  const [pdfPages, setPdfPages] = useState<PdfPageImage[]>([]);
  const [pdfPreviewIndex, setPdfPreviewIndex] = useState<number>(0);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');

  const mathPreviewRef = useRef<HTMLDivElement>(null);
  const abcPreviewRef = useRef<HTMLDivElement>(null);
  const abcAudioRef = useRef<HTMLDivElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  // Debounced live preview rendering for Math & Music
  useEffect(() => {
    if (activeModal === 'mathjax' && mathPreviewRef.current) {
      PluginService.renderMathJax(mathPreviewRef.current, latex);
    }
  }, [activeModal, latex]);

  useEffect(() => {
    if (activeModal === 'abcjs' && abcPreviewRef.current) {
      PluginService.renderAbc(abcPreviewRef.current, abcNotation);
      if (abcAudioRef.current) {
        PluginService.renderAbcAudio(abcAudioRef.current, abcNotation);
      }
    }
  }, [activeModal, abcNotation]);

  if (!activeModal) return null;

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (val.trim()) {
      localStorage.setItem('editor_openrouter_api_key', val.trim());
    }
  };

  const handleInsertMath = () => {
    const activeEditor = editor || (window as any).__activeEditor;
    const isCanvasActive = (window as any).__isCanvasMode;
    if (isCanvasActive && engine) {
      engine.addTextbox({
        text: `$$ ${latex} $$`,
        fontSize: 24,
        fill: '#1e293b',
        pluginType: 'mathjax',
      });
    } else if (activeEditor) {
      if (activeEditor.commands.insertMathJax) {
        activeEditor.commands.insertMathJax({ latex });
      } else {
        activeEditor.commands.insertContent(
          `<div class="mathjax-render p-4 my-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono text-base text-indigo-950 font-semibold shadow-sm" contenteditable="false" data-latex="${latex.replace(/"/g, '&quot;')}">$$ ${latex} $$</div><p></p>`
        );
      }
    } else if (engine) {
      engine.addTextbox({
        text: `$$ ${latex} $$`,
        fontSize: 24,
        fill: '#1e293b',
        pluginType: 'mathjax',
      });
    }
    onClose();
  };

  const handleInsertAbc = () => {
    const activeEditor = editor || (window as any).__activeEditor;
    const isCanvasActive = (window as any).__isCanvasMode;
    if (isCanvasActive && engine) {
      engine.addTextbox({
        text: `[Sheet Music: ${abcNotation.split('\n')[1] || 'Tune'}]\n${abcNotation}`,
        fontSize: 16,
        fill: '#0f172a',
        pluginType: 'abcjs',
      });
    } else if (activeEditor) {
      if (activeEditor.commands.insertAbcJs) {
        activeEditor.commands.insertAbcJs({ abc: abcNotation });
      } else {
        activeEditor.commands.insertContent(
          `<div class="abcjs-render p-4 my-3 bg-white border border-slate-200 rounded-lg overflow-x-auto text-xs font-mono text-slate-800 shadow-sm" contenteditable="false" data-abc="${abcNotation.replace(/"/g, '&quot;')}"></div><p></p>`
        );
      }
    } else if (engine) {
      engine.addTextbox({
        text: `[Sheet Music: ${abcNotation.split('\n')[1] || 'Tune'}]\n${abcNotation}`,
        fontSize: 16,
        fill: '#0f172a',
        pluginType: 'abcjs',
      });
    }
    onClose();
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
    // Prefer a vision-capable model
    return selectedModel.includes('vl') || selectedModel.includes('gemini')
      ? selectedModel
      : 'qwen/qwen-2-vl-72b-instruct:free';
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

  const handleInsertAIOutput = (text: string) => {
    if (!text.trim()) return;
    if (engine) {
      engine.addTextbox({
        text: text,
        fontSize: 16,
        fill: '#0f172a',
      });
    } else if (editor) {
      // Split paragraphs and insert cleanly into TipTap
      const formattedHtml = text
        .split('\n\n')
        .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');
      editor.commands.insertContent(formattedHtml);
    }
    onClose();
  };

  const handleOcrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrError(null);

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // PDF path — render pages via PDF.js
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
      // Image path
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
    // Reset input so same file can be re-uploaded
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

  const SYMBOLS = [
    { label: '√', code: '\\sqrt{x}' },
    { label: 'a/b', code: '\\frac{a}{b}' },
    { label: '∫', code: '\\int_{0}^{\\infty} x dx' },
    { label: '∑', code: '\\sum_{i=1}^{n} i' },
    { label: 'α', code: '\\alpha' },
    { label: 'β', code: '\\beta' },
    { label: 'π', code: '\\pi' },
    { label: '±', code: '\\pm' },
    { label: '≤', code: '\\leq' },
    { label: '≥', code: '\\geq' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 font-semibold text-slate-100">
            {activeModal === 'mathjax' && (
              <>
                <Sigma className="w-5 h-5 text-indigo-400" />
                <span>LaTeX Math & Formula Studio</span>
              </>
            )}
            {activeModal === 'abcjs' && (
              <>
                <Music className="w-5 h-5 text-pink-400" />
                <span>ABCjs Sheet Music & MIDI Studio</span>
              </>
            )}
            {activeModal === 'openrouter' && (
              <>
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>OpenRouter AI Text Generator & Vision OCR Studio</span>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* OpenRouter Mode Tabs + Model Selector */}
        {activeModal === 'openrouter' && (
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 pt-2 gap-4 text-xs">
            <div className="flex gap-4">
              <button
                onClick={() => setOpenrouterTab('generator')}
                className={`flex items-center gap-1.5 pb-2.5 border-b-2 font-medium transition-all ${
                  openrouterTab === 'generator'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <span>AI Text & Content Generator</span>
              </button>
              <button
                onClick={() => setOpenrouterTab('ocr')}
                className={`flex items-center gap-1.5 pb-2.5 border-b-2 font-medium transition-all ${
                  openrouterTab === 'ocr'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Vision OCR & Document Extractor</span>
              </button>
            </div>
            {/* Active Model Badge */}
            <div className="mb-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="font-mono truncate max-w-[220px]" title={selectedModel}>{selectedModel}</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto text-xs text-slate-200">
          {/* ================= MATHJAX / ABCJS ================= */}
          {activeModal !== 'openrouter' && (
            <>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    {activeModal === 'mathjax' ? 'LaTeX Formula Input' : 'ABC Music Notation Input'}
                  </label>
                  <textarea
                    value={activeModal === 'mathjax' ? latex : abcNotation}
                    onChange={(e) =>
                      activeModal === 'mathjax' ? setLatex(e.target.value) : setAbcNotation(e.target.value)
                    }
                    className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {activeModal === 'mathjax' && (
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block mb-2">Visual Symbol Keypad</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {SYMBOLS.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLatex((l) => l + ' ' + s.code)}
                          className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-center font-mono text-xs font-semibold text-indigo-300 transition-colors"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeModal === 'abcjs' && (
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block mb-2">Preset Tune Templates</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setAbcNotation('X:1\nT:C Major Scale\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |]')
                        }
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        C Major Scale
                      </button>
                      <button
                        onClick={() =>
                          setAbcNotation('X:2\nT:Twinkle Twinkle\nM:4/4\nL:1/4\nK:C\nC C G G | A A G2 | F F E E | D D C2 |]')
                        }
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Twinkle Melody
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Live Render Preview</span>
                  <div
                    ref={activeModal === 'mathjax' ? mathPreviewRef : abcPreviewRef}
                    className="w-full min-h-[160px] p-4 bg-white text-slate-900 rounded-xl border border-slate-700 overflow-auto flex items-center justify-center shadow-inner"
                  />
                </div>

                {activeModal === 'abcjs' && (
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block mb-1.5">MIDI Audio Synthesizer</span>
                    <div
                      ref={abcAudioRef}
                      className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center"
                    />
                  </div>
                )}

                <div className="mt-auto pt-4 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={activeModal === 'mathjax' ? handleInsertMath : handleInsertAbc}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-white transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Insert onto Canvas</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ================= OPENROUTER AI GENERATOR ================= */}
          {activeModal === 'openrouter' && openrouterTab === 'generator' && (
            <>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-400">AI Prompt & Instructions</label>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setAiPrompt('Summarize our document into 5 concise bullet points.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-300"
                      >
                        Summarize
                      </button>
                      <button
                        onClick={() => setAiPrompt('Rewrite the content with a formal, authoritative executive tone.')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-300"
                      >
                        Polish Grammar
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want to write or generate..."
                    className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {aiError && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
                    {aiError}
                  </div>
                )}

                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 font-medium text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating with OpenRouter AI...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate AI Content</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-400">AI Response Preview</span>
                    {aiOutput && (
                      <button
                        onClick={() => navigator.clipboard.writeText(aiOutput)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-h-[180px] p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {aiOutput || <span className="text-slate-500 italic">Generated AI content will appear here...</span>}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-slate-300"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleInsertAIOutput(aiOutput)}
                    disabled={!aiOutput}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-medium text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Insert onto Document / Canvas</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ================= OPENROUTER VISION OCR ================= */}
          {activeModal === 'openrouter' && openrouterTab === 'ocr' && (
            <>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Document or Image Source</label>
                  <input
                    type="file"
                    ref={ocrFileInputRef}
                    onChange={handleOcrFileUpload}
                    accept="image/*,application/pdf,.pdf"
                    className="hidden"
                  />

                  {/* Upload Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => ocrFileInputRef.current?.click()}
                      className="py-5 px-3 rounded-xl border-2 border-dashed border-slate-800 hover:border-emerald-500/60 bg-slate-950 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-300 transition-colors"
                    >
                      <UploadCloud className="w-5 h-5 text-emerald-400" />
                      <span className="text-center text-[11px] font-medium">Image / PDF</span>
                    </button>

                    <button
                      onClick={() => { ocrFileInputRef.current!.accept = 'application/pdf,.pdf'; ocrFileInputRef.current?.click(); }}
                      className="py-5 px-3 rounded-xl border-2 border-dashed border-slate-800 hover:border-red-500/60 bg-slate-950 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-red-300 transition-colors"
                    >
                      <FileType2 className="w-5 h-5 text-red-400" />
                      <span className="text-center text-[11px] font-medium">PDF (Multi-page)</span>
                    </button>

                    <button
                      onClick={handleGrabCanvasImage}
                      className="py-5 px-3 rounded-xl border-2 border-dashed border-slate-800 hover:border-cyan-500/60 bg-slate-950 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-cyan-400" />
                      <span className="text-center text-[11px] font-medium">Canvas Object</span>
                    </button>
                  </div>
                </div>

                {/* PDF Pages Preview */}
                {isPdfMode && pdfPages.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-medium">
                        📄 {pdfFileName} — {pdfPages.length} page{pdfPages.length > 1 ? 's' : ''} rendered
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPdfPreviewIndex((i) => Math.max(0, i - 1))}
                          disabled={pdfPreviewIndex === 0}
                          className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-400"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] text-slate-400 w-14 text-center">
                          {pdfPreviewIndex + 1} / {pdfPages.length}
                        </span>
                        <button
                          onClick={() => setPdfPreviewIndex((i) => Math.min(pdfPages.length - 1, i + 1))}
                          disabled={pdfPreviewIndex === pdfPages.length - 1}
                          className="p-0.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-400"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setIsPdfMode(false); setPdfPages([]); setPdfFileName(''); setOcrOutput(''); }}
                          className="ml-2 p-0.5 rounded hover:bg-red-900/40 text-red-400"
                          title="Remove PDF"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800 max-h-36 overflow-hidden flex items-center justify-center">
                      <img
                        src={pdfPages[pdfPreviewIndex]?.dataUrl}
                        alt={`Page ${pdfPreviewIndex + 1}`}
                        className="max-h-32 object-contain rounded shadow"
                      />
                    </div>
                  </div>
                )}

                {/* PDF rendering progress */}
                {pdfProgress && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{pdfProgress}</span>
                  </div>
                )}

                {/* Single image preview */}
                {!isPdfMode && ocrImage && (
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 max-h-36 overflow-hidden flex items-center justify-center relative group">
                    <img src={ocrImage} alt="OCR Target" className="max-h-32 object-contain rounded" />
                    <button
                      onClick={() => setOcrImage(null)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">OCR Extraction Instruction</label>
                  <textarea
                    value={ocrPrompt}
                    onChange={(e) => setOcrPrompt(e.target.value)}
                    className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {ocrError && (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
                    {ocrError}
                  </div>
                )}

                {/* Multi-page progress during extraction */}
                {isExtracting && pdfProgress && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{pdfProgress}</span>
                  </div>
                )}

                <button
                  onClick={handlePerformOCR}
                  disabled={isExtracting || (!ocrImage && pdfPages.length === 0)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 font-medium text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all mt-auto"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isPdfMode ? `OCR-ing ${pdfPages.length}-page PDF...` : 'Extracting Text with Vision OCR...'}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>{isPdfMode ? `Extract All ${pdfPages.length} Pages` : 'Perform OCR Extraction'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-400">Extracted OCR Text / Markdown</span>
                    {ocrOutput && (
                      <button
                        onClick={() => navigator.clipboard.writeText(ocrOutput)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-h-[180px] p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {ocrOutput || <span className="text-slate-500 italic">Extracted document text, tables, and OCR output will appear here...</span>}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-slate-300"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleInsertAIOutput(ocrOutput)}
                    disabled={!ocrOutput}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-medium text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Insert OCR Result onto Canvas</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
