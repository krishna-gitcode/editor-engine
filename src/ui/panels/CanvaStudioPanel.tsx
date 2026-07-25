import React, { useState } from 'react';
import { Sparkles, Search, Loader2, Wand2 } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';
import { generateCanvasLayout } from '../../features/canvas/AICanvasService';

interface CanvaStudioPanelProps {
  engine: any;
  editor?: any;
}

interface VectorItem {
  label: string;
  category: string;
  emoji: string;
  svgPath: string;
  fill: string;
  stroke?: string;
  viewBox: string;
}

const VECTOR_LIBRARY: VectorItem[] = [
  // Badges
  {
    label: 'Star Badge', category: 'Badges', emoji: '⭐', fill: '#f59e0b', viewBox: '0 0 100 100',
    svgPath: 'M50 5 L61 35 L95 35 L68 57 L79 91 L50 70 L21 91 L32 57 L5 35 L39 35 Z',
  },
  {
    label: 'Shield Badge', category: 'Badges', emoji: '🛡️', fill: '#6366f1', viewBox: '0 0 100 120',
    svgPath: 'M50 5 L95 25 L95 65 Q95 100 50 115 Q5 100 5 65 L5 25 Z',
  },
  {
    label: 'Circle Badge', category: 'Badges', emoji: '🔵', fill: '#3b82f6', viewBox: '0 0 100 100',
    svgPath: 'M50 5 A45 45 0 1 1 49.99 5 Z',
  },
  {
    label: 'Diamond', category: 'Badges', emoji: '💎', fill: '#06b6d4', viewBox: '0 0 100 100',
    svgPath: 'M50 5 L95 50 L50 95 L5 50 Z',
  },
  {
    label: 'Hexagon', category: 'Badges', emoji: '🔷', fill: '#8b5cf6', viewBox: '0 0 100 100',
    svgPath: 'M50 5 L93 27.5 L93 72.5 L50 95 L7 72.5 L7 27.5 Z',
  },
  {
    label: 'Ribbon Badge', category: 'Badges', emoji: '🎖️', fill: '#ec4899', viewBox: '0 0 100 120',
    svgPath: 'M50 5 A35 35 0 1 1 49.99 5 Z M30 75 L50 100 L70 75 L65 95 L50 115 L35 95 Z',
  },
  // Arrows
  {
    label: 'Right Arrow', category: 'Arrows', emoji: '➡️', fill: '#10b981', viewBox: '0 0 100 60',
    svgPath: 'M5 20 L65 20 L65 5 L95 30 L65 55 L65 40 L5 40 Z',
  },
  {
    label: 'Double Arrow', category: 'Arrows', emoji: '↔️', fill: '#f59e0b', viewBox: '0 0 120 60',
    svgPath: 'M5 30 L30 5 L30 20 L90 20 L90 5 L115 30 L90 55 L90 40 L30 40 L30 55 Z',
  },
  {
    label: 'Curved Arrow', category: 'Arrows', emoji: '↪️', fill: '#6366f1', viewBox: '0 0 100 100',
    svgPath: 'M10 80 Q10 20 70 20 L70 5 L95 30 L70 55 L70 40 Q25 40 25 80 Z',
  },
  {
    label: 'Up Arrow', category: 'Arrows', emoji: '⬆️', fill: '#3b82f6', viewBox: '0 0 60 100',
    svgPath: 'M30 5 L55 40 L40 40 L40 95 L20 95 L20 40 L5 40 Z',
  },
  // Speech Bubbles
  {
    label: 'Speech Bubble', category: 'Bubbles', emoji: '💬', fill: '#6366f1', stroke: '#4f46e5', viewBox: '0 0 120 100',
    svgPath: 'M10 10 Q10 5 15 5 L105 5 Q110 5 110 10 L110 65 Q110 70 105 70 L40 70 L20 90 L25 70 L15 70 Q10 70 10 65 Z',
  },
  {
    label: 'Thought Bubble', category: 'Bubbles', emoji: '🤔', fill: '#ec4899', viewBox: '0 0 120 110',
    svgPath: 'M15 10 Q15 5 20 5 L100 5 Q105 5 105 10 L105 60 Q105 65 100 65 L20 65 Q15 65 15 60 Z M30 75 A5 5 0 1 1 29.99 75 Z M20 88 A4 4 0 1 1 19.99 88 Z M12 100 A3 3 0 1 1 11.99 100 Z',
  },
  {
    label: 'Info Bubble', category: 'Bubbles', emoji: '💡', fill: '#10b981', viewBox: '0 0 120 100',
    svgPath: 'M10 10 Q10 5 15 5 L105 5 Q110 5 110 10 L110 65 Q110 70 105 70 L15 70 Q10 70 10 65 Z M55 90 L65 90 L60 70 Z',
  },
  // Educational
  {
    label: 'Book Icon', category: 'Education', emoji: '📚', fill: '#3b82f6', viewBox: '0 0 100 100',
    svgPath: 'M10 10 Q10 5 15 5 L55 5 L55 95 L15 95 Q10 95 10 90 Z M55 5 L85 15 L85 95 L55 95 Z',
  },
  {
    label: 'Pencil', category: 'Education', emoji: '✏️', fill: '#f59e0b', viewBox: '0 0 100 100',
    svgPath: 'M70 5 L95 30 L30 95 L5 95 L5 70 Z M75 10 L90 25 L80 35 L65 20 Z M5 95 L15 75 L25 85 Z',
  },
  {
    label: 'Target', category: 'Education', emoji: '🎯', fill: '#ef4444', viewBox: '0 0 100 100',
    svgPath: 'M50 5 A45 45 0 1 1 49.99 5 Z',
  },
  {
    label: 'Trophy', category: 'Education', emoji: '🏆', fill: '#f59e0b', viewBox: '0 0 100 120',
    svgPath: 'M20 5 L80 5 L80 50 Q80 80 50 85 Q20 80 20 50 Z M5 10 L20 10 L20 45 Q5 40 5 25 Z M80 10 L95 10 L95 25 Q95 40 80 45 Z M35 85 L65 85 L70 110 L30 110 Z M25 110 L75 110 L75 115 L25 115 Z',
  },
  // Musical Symbols
  {
    label: 'Music Note', category: 'Musical', emoji: '🎵', fill: '#ec4899', viewBox: '0 0 80 100',
    svgPath: 'M30 10 L70 5 L70 35 L30 40 Z M20 55 A12 12 0 1 1 19.99 55 Z M60 50 A12 12 0 1 1 59.99 50 Z M30 40 L30 55 M70 35 L70 50',
  },
  // Geometric
  {
    label: 'Burst Star', category: 'Geometric', emoji: '✨', fill: '#f59e0b', viewBox: '0 0 100 100',
    svgPath: 'M50 5 L55 38 L88 20 L68 48 L98 55 L68 62 L88 90 L55 72 L50 95 L45 72 L12 90 L32 62 L2 55 L32 48 L12 20 L45 38 Z',
  },
  {
    label: 'Triangle', category: 'Geometric', emoji: '🔺', fill: '#6366f1', viewBox: '0 0 100 90',
    svgPath: 'M50 5 L95 85 L5 85 Z',
  },
  {
    label: 'Rounded Rect', category: 'Geometric', emoji: '🟦', fill: '#3b82f6', viewBox: '0 0 120 80',
    svgPath: 'M15 5 Q5 5 5 15 L5 65 Q5 75 15 75 L105 75 Q115 75 115 65 L115 15 Q115 5 105 5 Z',
  },
];

const CATEGORIES = ['All', 'Badges', 'Arrows', 'Bubbles', 'Education', 'Musical', 'Geometric'];

export const CanvaStudioPanel: React.FC<CanvaStudioPanelProps> = ({ engine, editor }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [aiLayoutPrompt, setAiLayoutPrompt] = useState('');
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const { apiKey, selectedModel } = useAIStore();

  const handleGenerateLayout = async () => {
    if (!engine || !aiLayoutPrompt.trim()) return;
    setIsGeneratingLayout(true);
    setLayoutError(null);
    try {
      const objects = await generateCanvasLayout(aiLayoutPrompt, apiKey, selectedModel);
      // Wait for engine/fabric context
      if (engine.canvas) {
        // use fabric util to enliven objects
        (window as any).fabric.util.enlivenObjects(objects, (enlivenedObjects: any[]) => {
          enlivenedObjects.forEach((obj) => {
            engine.canvas.add(obj);
          });
          engine.canvas.renderAll();
        }, '');
      }
      setAiLayoutPrompt('');
    } catch (err: any) {
      setLayoutError(err.message || 'Failed to generate layout.');
    } finally {
      setIsGeneratingLayout(false);
    }
  };

  const filtered = VECTOR_LIBRARY.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchQ = !query || item.label.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  const handleInsert = (item: VectorItem) => {
    const activeEditor = editor || (window as any).__activeEditor;
    const isCanvasMode = (window as any).__isCanvasMode;
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${item.viewBox}" width="100" height="100" style="display:inline-block;vertical-align:middle;margin:8px;"><path d="${item.svgPath}" fill="${item.fill}" stroke="${item.stroke || 'none'}" stroke-width="2"/></svg>`;

    if (isCanvasMode && engine) {
      if (engine.addSvgString) {
        engine.addSvgString(svgString);
      } else if (engine.addPath) {
        engine.addPath({ path: item.svgPath, fill: item.fill, stroke: item.stroke, scaleX: 1, scaleY: 1 });
      }
    } else if (activeEditor) {
      activeEditor.chain().focus().insertContent(svgString).run();
    } else if (engine) {
      if (engine.addSvgString) {
        engine.addSvgString(svgString);
      } else if (engine.addPath) {
        engine.addPath({ path: item.svgPath, fill: item.fill, stroke: item.stroke, scaleX: 1, scaleY: 1 });
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 h-full text-slate-200 overflow-hidden">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Vector Elements Studio
        </h3>

        {/* AI Canvas Layout Generator */}
        <div className="mb-4 bg-slate-900/50 p-2 rounded-xl border border-amber-900/40">
          <label className="text-[10px] font-semibold text-amber-400 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
            <Wand2 className="w-3 h-3" /> AI Page Designer
          </label>
          <div className="flex flex-col gap-1.5">
            <div className="w-full gradient-border-animated rounded-lg">
              <input
                type="text"
                placeholder="e.g. 'hero section with dark background...'"
                value={aiLayoutPrompt}
                onChange={(e) => setAiLayoutPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateLayout(); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-transparent relative z-10"
              />
            </div>
            {layoutError && <div className="text-[10px] text-red-400 leading-tight">{layoutError}</div>}
            <button
              onClick={handleGenerateLayout}
              disabled={isGeneratingLayout || !aiLayoutPrompt.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[11px] font-medium transition-colors"
            >
              {isGeneratingLayout ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isGeneratingLayout ? 'Generating Layout...' : 'Generate Layout on Canvas'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search vectors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>
        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${activeCategory === cat ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vector grid */}
      <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1">
        {filtered.map((item) => (
          <button
            key={item.label}
            onClick={() => handleInsert(item)}
            title={`Insert ${item.label}`}
            className="flex flex-col items-center justify-center p-3 bg-slate-800/80 hover:bg-slate-700/90 rounded-xl border border-slate-700 hover:border-amber-500 transition-all text-xs gap-1.5 group"
          >
            {/* Inline SVG preview */}
            <svg
              viewBox={item.viewBox}
              className="w-10 h-10 group-hover:scale-110 transition-transform"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d={item.svgPath} fill={item.fill} stroke={item.stroke || 'none'} strokeWidth="2" />
            </svg>
            <span className="text-slate-400 text-[10px] font-medium leading-tight text-center">{item.label}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-600 text-center">Click any element to add it to the canvas.</p>
    </div>
  );
};
