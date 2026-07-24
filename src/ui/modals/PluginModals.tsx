import React, { useState, useEffect, useRef } from 'react';
import { PluginService } from '../../services/PluginService';
import { OpenRouterService, FREE_OPENROUTER_MODELS } from '../../services/OpenRouterService';
import { PdfService, PdfPageImage } from '../../services/PdfService';
import { parseMarkdownToTipTap, parseOcrOutput } from '../../services/markdownToHtml';
import { X, Sigma, Music, Check, Sparkles, Wand2, Image as ImageIcon, FileText, Copy, Loader2, UploadCloud, FileType2, ChevronLeft, ChevronRight, BarChart2, Play, Square, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import './PluginModals.css';

interface PluginModalsProps {
  activeModal: 'mathjax' | 'abcjs' | 'openrouter' | 'chart' | null;
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
  const [selectedModel, setSelectedModel] = useState<string>(() => import.meta.env.VITE_OPENROUTER_DEFAULT_MODEL || 'openrouter/free');

  // Generator state
  const [aiPrompt, setAiPrompt] = useState<string>('Write a comprehensive 3-paragraph executive summary outlining our new e-learning course features.');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // OCR state — image mode
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrPrompt, setOcrPrompt] = useState<string>('Extract all text, tables, equations, and structural elements from this image accurately into clean Markdown format. Preserve exact text wording, headings, and lists. IMPORTANT: Do not interpret or solve formulas or music. Extract their exact syntactical representation. Enclose any mathematical equations in <mathjax>...</mathjax> tags and sheet music/ABC notation in <abcjs>...</abcjs> tags. Output tables as markdown tables.');
  const [ocrOutput, setOcrOutput] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Dynamic Models State
  const [availableModels, setAvailableModels] = useState<any[]>(FREE_OPENROUTER_MODELS);

  // Fetch live free catalog
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
          // Merge live models with our curated FREE_OPENROUTER_MODELS to preserve rich metadata
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

  // ABCjs instrument & playback state
  const [abcInstrument, setAbcInstrument] = useState<number>(0); // MIDI program 0 = Grand Piano
  const [isAbcPlaying, setIsAbcPlaying] = useState<boolean>(false);

  // AI & Manual Chart state
  const [chartMode, setChartMode] = useState<'manual' | 'ai'>('manual');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut'>('bar');
  const [chartTitle, setChartTitle] = useState<string>('Quarterly Performance 2025');
  const [chartLabels, setChartLabels] = useState<string>('Jan, Feb, Mar, Apr');
  const [chartDataValues, setChartDataValues] = useState<string>('45, 78, 62, 90');
  const [chartPrompt, setChartPrompt] = useState<string>('Bar chart comparing monthly sales for Jan-Jun 2025 vs 2024');
  const [chartOutput, setChartOutput] = useState<string>('');
  const [isChartGenerating, setIsChartGenerating] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Math symbol palette tab (must be before early return guard)
  const [activeSymbolTab, setActiveSymbolTab] = useState(0);

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

  const handleInsertMath = async () => {
    const activeEditor = editor || (window as any).__activeEditor;
    const isCanvasActive = (window as any).__isCanvasMode;
    if ((isCanvasActive || !activeEditor) && engine) {
      if (mathPreviewRef.current) {
        try {
          const canvas = await html2canvas(mathPreviewRef.current, { backgroundColor: null, scale: 2 });
          const dataUrl = canvas.toDataURL('image/png');
          engine.addImageFromUrl(dataUrl);
        } catch (e) {
          engine.addTextbox({ text: `$$ ${latex} $$`, fontSize: 24, fill: '#1e293b', pluginType: 'mathjax' });
        }
      } else {
        engine.addTextbox({ text: `$$ ${latex} $$`, fontSize: 24, fill: '#1e293b', pluginType: 'mathjax' });
      }
    } else if (activeEditor) {
      if (activeEditor.commands.insertMathJax) {
        activeEditor.commands.insertMathJax({ latex });
      } else {
        activeEditor.chain().focus().insertContent({
          type: 'mathJax',
          attrs: { latex },
        }).run();
      }
    }
    onClose();
  };

  const handleInsertAbc = async () => {
    const activeEditor = editor || (window as any).__activeEditor;
    const isCanvasActive = (window as any).__isCanvasMode;
    if ((isCanvasActive || !activeEditor) && engine) {
      if (abcPreviewRef.current) {
        try {
          const canvas = await html2canvas(abcPreviewRef.current, { backgroundColor: null, scale: 2 });
          const dataUrl = canvas.toDataURL('image/png');
          engine.addImageFromUrl(dataUrl);
        } catch (e) {
          engine.addTextbox({ text: `[Sheet Music]\n${abcNotation}`, fontSize: 16, fill: '#0f172a', pluginType: 'abcjs' });
        }
      } else {
        engine.addTextbox({ text: `[Sheet Music]\n${abcNotation}`, fontSize: 16, fill: '#0f172a', pluginType: 'abcjs' });
      }
    } else if (activeEditor) {
      if (activeEditor.commands.insertAbcJs) {
        activeEditor.commands.insertAbcJs({ abc: abcNotation });
      } else {
        activeEditor.commands.insertContent(
          `<div class="abcjs-render p-4 my-3 bg-white border border-slate-200 rounded-lg overflow-x-auto text-xs font-mono text-slate-800 shadow-sm" contenteditable="false" data-abc="${abcNotation.replace(/"/g, '&quot;')}"></div><p></p>`
        );
      }
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

  /**
   * Core insertion helper — ALWAYS inserts into TipTap as native editable nodes.
   * Canvas mode does NOT affect where AI text/table content lands.
   * The TipTap document editor is always the target for AI-generated content.
   */
  const insertIntoEditor = (markdown: string) => {
    const activeEditor = editor || (window as any).__activeEditor;

    if (!activeEditor) {
      console.warn('[GridLeaf Editor] No active TipTap editor found. Cannot insert AI content.');
      return false;
    }

    const nodes = parseMarkdownToTipTap(markdown);
    if (nodes.length === 0) return false;

    // insertContent accepts an array of TipTap JSON nodes directly
    activeEditor.chain().focus().insertContent(nodes).run();
    return true;
  };

  /** Insert AI-generated markdown as 100% editable native TipTap nodes (#3) */
  const handleInsertAIOutput = (text: string) => {
    if (!text.trim()) return;
    insertIntoEditor(text);
    onClose();
  };

  /** Insert OCR output — math/abcjs segments go to their node views, rest to TipTap (#17) */
  const handleInsertOcrOutput = (text: string) => {
    if (!text.trim()) return;
    const activeEditor = editor || (window as any).__activeEditor;
    const segments = parseOcrOutput(text);

    if (activeEditor) {
      for (const seg of segments) {
        if (seg.type === 'mathjax') {
          if (activeEditor.commands.insertMathJax) {
            activeEditor.commands.insertMathJax({ latex: seg.content });
          } else {
            activeEditor.chain().focus().insertContent({
              type: 'mathJax',
              attrs: { latex: seg.content },
            }).run();
          }
        } else if (seg.type === 'abcjs') {
          if (activeEditor.commands.insertAbcJs) {
            activeEditor.commands.insertAbcJs({ abc: seg.content });
          } else {
            activeEditor.chain().focus().insertContent({
              type: 'abcJs',
              attrs: { abc: seg.content },
            }).run();
          }
        } else if (seg.nodes && seg.nodes.length > 0) {
          activeEditor.chain().focus().insertContent(seg.nodes).run();
        }
      }
    }
    onClose();
  };


  /** Generate AI chart data via OpenRouter (#19) */
  const handleGenerateChart = async () => {
    setIsChartGenerating(true);
    setChartError(null);
    try {
      const systemPrompt = 'You are a data visualization expert. When given a chart description, respond ONLY with a JSON object in this exact format: {"type":"bar"|"line"|"pie"|"doughnut","title":"...","labels":[...],"datasets":[{"label":"...","data":[...],"color":"..."}]}. No markdown, no explanation, only valid JSON.';
      const res = await OpenRouterService.generateText(apiKey, selectedModel, chartPrompt, systemPrompt);
      const cleaned = res.trim();
      setChartOutput(cleaned);
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.type) setChartType(parsed.type);
        if (parsed.title) setChartTitle(parsed.title);
        if (parsed.labels) setChartLabels(parsed.labels.join(', '));
        if (parsed.datasets?.[0]?.data) setChartDataValues(parsed.datasets[0].data.join(', '));
      } catch {
        // ignore JSON parse error for manual fields
      }
    } catch (err: any) {
      setChartError(err.message || 'Chart generation failed.');
    } finally {
      setIsChartGenerating(false);
    }
  };

  /** Insert chart JSON or manual chart data as a native chartBlock node into the document (#19) */
  const handleInsertChart = () => {
    let chartData: any;
    if (chartMode === 'manual') {
      const labels = chartLabels.split(',').map((s) => s.trim()).filter(Boolean);
      const data = chartDataValues.split(',').map((v) => parseFloat(v.trim()) || 0);
      chartData = {
        type: chartType,
        title: chartTitle || 'Data Chart',
        labels: labels.length > 0 ? labels : ['Item A', 'Item B', 'Item C'],
        datasets: [{ label: 'Series 1', data: data.length > 0 ? data : [10, 20, 30], color: '#6366f1' }],
      };
    } else {
      if (!chartOutput.trim()) return;
      try {
        chartData = JSON.parse(chartOutput);
      } catch {
        chartData = {
          type: 'bar',
          title: 'AI Chart',
          labels: ['Data 1', 'Data 2', 'Data 3'],
          datasets: [{ label: 'AI Series', data: [50, 75, 60], color: '#6366f1' }],
        };
      }
    }

    const activeEditor = editor || (window as any).__activeEditor;
    if (activeEditor) {
      if (activeEditor.commands.insertChart) {
        activeEditor.commands.insertChart({ chartData });
      } else {
        activeEditor.chain().focus().insertContent({
          type: 'chartBlock',
          attrs: { chartData },
        }).run();
      }
    } else if (engine) {
      const labelsStr = (chartData.labels || []).join(', ');
      engine.addTextbox({
        text: `Chart: ${chartData.title}\nType: ${chartData.type}\nLabels: ${labelsStr}`,
        fontSize: 16,
        fill: '#1e293b',
      });
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

  const SYMBOL_CATEGORIES: { label: string; symbols: { label: string; code: string }[] }[] = [
    {
      label: 'Basic',
      symbols: [
        { label: '√x', code: '\\sqrt{x}' }, { label: 'a/b', code: '\\frac{a}{b}' },
        { label: 'x²', code: 'x^{2}' }, { label: 'xₙ', code: 'x_{n}' },
        { label: '±', code: '\\pm' }, { label: '÷', code: '\\div' },
        { label: '×', code: '\\times' }, { label: '≈', code: '\\approx' },
        { label: '≠', code: '\\neq' }, { label: '≤', code: '\\leq' },
        { label: '≥', code: '\\geq' }, { label: '∞', code: '\\infty' },
      ],
    },
    {
      label: 'Calculus',
      symbols: [
        { label: '∫', code: '\\int_{0}^{\\infty}' }, { label: '∬', code: '\\iint' },
        { label: '∮', code: '\\oint' }, { label: '∑', code: '\\sum_{i=1}^{n}' },
        { label: '∏', code: '\\prod_{i=1}^{n}' }, { label: 'lim', code: '\\lim_{x \\to \\infty}' },
        { label: 'd/dx', code: '\\frac{d}{dx}' }, { label: '∂', code: '\\partial' },
        { label: '∇', code: '\\nabla' }, { label: 'Δ', code: '\\Delta' },
      ],
    },
    {
      label: 'Trig',
      symbols: [
        { label: 'sin θ', code: '\\sin(\\theta)' }, { label: 'cos θ', code: '\\cos(\\theta)' },
        { label: 'tan θ', code: '\\tan(\\theta)' }, { label: 'log', code: '\\log_{b}(x)' },
        { label: 'ln x', code: '\\ln(x)' }, { label: 'e^x', code: 'e^{x}' },
      ],
    },
    {
      label: 'Greek',
      symbols: [
        { label: 'α', code: '\\alpha' }, { label: 'β', code: '\\beta' },
        { label: 'γ', code: '\\gamma' }, { label: 'δ', code: '\\delta' },
        { label: 'θ', code: '\\theta' }, { label: 'λ', code: '\\lambda' },
        { label: 'μ', code: '\\mu' }, { label: 'π', code: '\\pi' },
        { label: 'σ', code: '\\sigma' }, { label: 'φ', code: '\\phi' },
        { label: 'ω', code: '\\omega' }, { label: 'Ω', code: '\\Omega' },
      ],
    },
    {
      label: 'Matrix',
      symbols: [
        { label: '2×2', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
        { label: '3×3', code: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}' },
        { label: 'cases', code: '\\begin{cases} x & \\text{if } x > 0 \\\\ -x & \\text{if } x < 0 \\end{cases}' },
        { label: '[ ]', code: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
      ],
    },
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
            {activeModal === 'chart' && (
              <>
                <BarChart2 className="w-5 h-5 text-amber-400" />
                <span>AI Chart Builder Studio</span>
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
                className={`flex items-center gap-1.5 pb-2.5 border-b-2 font-medium transition-all ${openrouterTab === 'generator'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Wand2 className="w-4 h-4" />
                <span>AI Text & Content Generator</span>
              </button>
              <button
                onClick={() => setOpenrouterTab('ocr')}
                className={`flex items-center gap-1.5 pb-2.5 border-b-2 font-medium transition-all ${openrouterTab === 'ocr'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Vision OCR & Document Extractor</span>
              </button>
            </div>
            {/* Active Model Selector */}
            <div className="mb-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-emerald-300 relative">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent border-none outline-none text-emerald-300 font-mono text-[11px] appearance-none pr-4 w-[160px] cursor-pointer truncate"
              >
                <option value="openrouter/free" className="bg-slate-900 text-slate-200">Default (openrouter/free)</option>
                {availableModels.map(model => (
                  <option key={model.id} value={model.id} className="bg-slate-900 text-slate-200">
                    {model.name || model.id} {model.isVision ? '👁️' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-emerald-400 absolute right-2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto text-xs text-slate-200">
          {/* ================= MATHJAX / ABCJS ================= */}
          {activeModal !== 'openrouter' && activeModal !== 'chart' && (
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
                    <span className="text-[11px] font-medium text-slate-400 block mb-2">Symbol Palette</span>
                    {/* Category tabs */}
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {SYMBOL_CATEGORIES.map((cat, idx) => (
                        <button
                          key={cat.label}
                          onClick={() => setActiveSymbolTab(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${activeSymbolTab === idx ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 max-h-24 overflow-y-auto">
                      {SYMBOL_CATEGORIES[activeSymbolTab].symbols.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setLatex((l) => l + ' ' + s.code)}
                          title={s.code}
                          className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-center font-mono text-[10px] font-semibold text-indigo-300 hover:text-white transition-colors leading-tight"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeModal === 'abcjs' && (
                  <div className="flex flex-col gap-3">
                    {/* Instrument selector */}
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Instrument (MIDI Program)</span>
                      <div className="relative">
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                        <select
                          value={abcInstrument}
                          onChange={(e) => { setAbcInstrument(Number(e.target.value)); setIsAbcPlaying(false); }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-pink-500 appearance-none pr-8"
                        >
                          <option value={0}>🎹 Acoustic Grand Piano</option>
                          <option value={25}>🎸 Acoustic Guitar (Steel)</option>
                          <option value={40}>🎻 Violin</option>
                          <option value={73}>🪈 Flute</option>
                          <option value={56}>🎺 Trumpet</option>
                          <option value={104}>🪗 Sitar</option>
                          <option value={11}>🎹 Vibraphone</option>
                          <option value={19}>🪘 Church Organ</option>
                        </select>
                      </div>
                    </div>
                    {/* Play / Stop control */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const abcjs = (window as any).ABCJS;
                          if (!abcjs || !abcAudioRef.current) return;
                          if (isAbcPlaying) {
                            abcjs.stopPlaying?.();
                            setIsAbcPlaying(false);
                          } else {
                            setIsAbcPlaying(true);
                            try {
                              abcjs.renderAbc(abcPreviewRef.current, abcNotation, { responsive: 'resize' });
                              const audioCtx = abcjs.synth.activeAudioContext?.() ?? new AudioContext();
                              const synthControl = new abcjs.synth.SynthController();
                              synthControl.load(abcAudioRef.current, null, { displayPlay: false, displayProgress: false });
                              const midiBuffer = new abcjs.synth.CreateSynth();
                              const visualObj = abcjs.renderAbc('*', abcNotation, {})[0];
                              midiBuffer.init({ visualObj, audioContext: audioCtx, millisecondsPerMeasure: 1000, options: { program: abcInstrument } })
                                .then(() => midiBuffer.prime())
                                .then(() => { synthControl.setTune(visualObj, false, { chordsOff: false }); synthControl.play(); })
                                .catch(() => setIsAbcPlaying(false));
                            } catch { setIsAbcPlaying(false); }
                          }
                        }}
                        className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 font-medium text-xs transition-all ${isAbcPlaying ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-pink-600 hover:bg-pink-500 text-white'}`}
                      >
                        {isAbcPlaying ? <><Square className="w-3.5 h-3.5" /> Stop Playback</> : <><Play className="w-3.5 h-3.5" /> Play MIDI</>}
                      </button>
                    </div>
                    {/* Preset tunes */}
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Preset Tune Templates</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setAbcNotation('X:1\nT:C Major Scale\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |]')}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >C Major Scale</button>
                        <button
                          onClick={() => setAbcNotation('X:2\nT:Twinkle Twinkle\nM:4/4\nL:1/4\nK:C\nC C G G | A A G2 | F F E E | D D C2 |]')}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >Twinkle Melody</button>
                        <button
                          onClick={() => setAbcNotation('X:3\nT:Raga Yaman\nM:4/4\nL:1/4\nK:G\nN G A B ^C | D E F G |]')}
                          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                        >Raga Yaman</button>
                      </div>
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
                    onClick={() => handleInsertOcrOutput(ocrOutput)}
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

          {/* ================= AI & MANUAL CHART BUILDER ================= */}
          {activeModal === 'chart' && (
            <>
              <div className="flex flex-col gap-4">
                {/* Tabs */}
                <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1">
                  <button
                    onClick={() => setChartMode('manual')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${chartMode === 'manual' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    🛠️ Manual Chart Builder
                  </button>
                  <button
                    onClick={() => setChartMode('ai')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${chartMode === 'ai' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    ⚡ AI Chart Generator
                  </button>
                </div>

                {chartMode === 'manual' ? (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Chart Type</label>
                      <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1.5 border border-slate-800 rounded-xl">
                        {(['bar', 'line', 'pie', 'doughnut'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setChartType(t)}
                            className={`py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all flex items-center justify-center gap-1.5 ${chartType === t ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                              }`}
                          >
                            <span>{t}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Chart Title</label>
                      <input
                        type="text"
                        value={chartTitle}
                        onChange={(e) => setChartTitle(e.target.value)}
                        placeholder="e.g. Quarterly Performance 2025"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Data Labels (comma-separated)</label>
                      <input
                        type="text"
                        value={chartLabels}
                        onChange={(e) => setChartLabels(e.target.value)}
                        placeholder="e.g. Jan, Feb, Mar, Apr"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Data Values (comma-separated numbers)</label>
                      <input
                        type="text"
                        value={chartDataValues}
                        onChange={(e) => setChartDataValues(e.target.value)}
                        placeholder="e.g. 45, 78, 62, 90"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Describe Your Chart</label>
                      <textarea
                        value={chartPrompt}
                        onChange={(e) => setChartPrompt(e.target.value)}
                        placeholder="e.g. Bar chart comparing quarterly revenue 2024 vs 2025..."
                        className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Bar chart for student scores', 'Line chart showing monthly growth', 'Pie chart for budget distribution', 'Compare 2024 vs 2025 revenue'].map((p) => (
                        <button key={p} onClick={() => setChartPrompt(p)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-700 text-[10px] text-amber-300 transition-all">{p}</button>
                      ))}
                    </div>
                    {chartError && <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">{chartError}</div>}
                    <button
                      onClick={handleGenerateChart}
                      disabled={isChartGenerating}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 font-medium text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    >
                      {isChartGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Generating Chart Data...</span></> : <><BarChart2 className="w-4 h-4" /><span>Generate Chart via AI</span></>}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-400">Chart Preview & Configuration</span>
                    {chartOutput && chartMode === 'ai' && <button onClick={() => navigator.clipboard.writeText(chartOutput)} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"><Copy className="w-3 h-3" /><span>Copy JSON</span></button>}
                  </div>
                  <div className="flex-1 min-h-[180px] p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 overflow-y-auto font-mono text-xs leading-relaxed flex flex-col justify-center items-center gap-2">
                    {chartMode === 'manual' ? (
                      <div className="text-center space-y-1">
                        <div className="text-base font-sans font-bold text-amber-400">📊 {chartTitle || 'Untitled Chart'}</div>
                        <div className="text-[11px] font-sans text-slate-400 uppercase tracking-wide">Type: {chartType} Chart</div>
                        <div className="text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
                          <div><span className="text-slate-500">Labels:</span> [{chartLabels}]</div>
                          <div><span className="text-slate-500">Values:</span> [{chartDataValues}]</div>
                        </div>
                        <div className="text-[11px] font-sans text-emerald-400 pt-2">✨ Ready to insert as interactive TipTap chart node</div>
                      </div>
                    ) : (
                      chartOutput ? (
                        <div className="whitespace-pre-wrap text-left w-full">{chartOutput}</div>
                      ) : (
                        <span className="text-slate-500 italic text-center">AI chart JSON will appear here. Or switch to Manual Chart Builder tab to create customized charts directly!</span>
                      )
                    )}
                  </div>
                </div>
                <div className="pt-2 flex gap-3">
                  <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-slate-300">Close</button>
                  <button
                    onClick={handleInsertChart}
                    disabled={chartMode === 'ai' && !chartOutput}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 font-medium text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Insert Interactive Chart onto Document</span>
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
