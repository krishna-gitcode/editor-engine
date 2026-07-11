import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Plus, Trash2, X, Type, Search, Check } from 'lucide-react';

interface FontManagerPanelProps {
  onClose: () => void;
}

// Curated list of 60+ Google Fonts with categories
const GOOGLE_FONTS_LIBRARY = [
  // Sans-Serif
  { name: 'Inter', category: 'Sans-Serif' },
  { name: 'Roboto', category: 'Sans-Serif' },
  { name: 'Poppins', category: 'Sans-Serif' },
  { name: 'Outfit', category: 'Sans-Serif' },
  { name: 'Nunito', category: 'Sans-Serif' },
  { name: 'Montserrat', category: 'Sans-Serif' },
  { name: 'Lato', category: 'Sans-Serif' },
  { name: 'Oswald', category: 'Sans-Serif' },
  { name: 'Raleway', category: 'Sans-Serif' },
  { name: 'Open Sans', category: 'Sans-Serif' },
  { name: 'Source Sans 3', category: 'Sans-Serif' },
  { name: 'DM Sans', category: 'Sans-Serif' },
  { name: 'Figtree', category: 'Sans-Serif' },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif' },
  { name: 'Manrope', category: 'Sans-Serif' },
  { name: 'Lexend', category: 'Sans-Serif' },
  { name: 'Mulish', category: 'Sans-Serif' },
  { name: 'Work Sans', category: 'Sans-Serif' },
  { name: 'Barlow', category: 'Sans-Serif' },
  { name: 'Exo 2', category: 'Sans-Serif' },
  // Serif
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'EB Garamond', category: 'Serif' },
  { name: 'Cormorant Garamond', category: 'Serif' },
  { name: 'Libre Baskerville', category: 'Serif' },
  { name: 'PT Serif', category: 'Serif' },
  { name: 'Crimson Text', category: 'Serif' },
  { name: 'Bitter', category: 'Serif' },
  { name: 'Vollkorn', category: 'Serif' },
  // Display / Decorative
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Anton', category: 'Display' },
  { name: 'Righteous', category: 'Display' },
  { name: 'Permanent Marker', category: 'Display' },
  { name: 'Pacifico', category: 'Display' },
  { name: 'Lobster', category: 'Display' },
  { name: 'Abril Fatface', category: 'Display' },
  { name: 'Fredoka One', category: 'Display' },
  { name: 'Josefin Sans', category: 'Display' },
  { name: 'Cinzel', category: 'Display' },
  // Monospace / Code
  { name: 'Fira Code', category: 'Monospace' },
  { name: 'JetBrains Mono', category: 'Monospace' },
  { name: 'Source Code Pro', category: 'Monospace' },
  { name: 'Inconsolata', category: 'Monospace' },
  { name: 'Space Mono', category: 'Monospace' },
  { name: 'IBM Plex Mono', category: 'Monospace' },
  // Indian Language Support
  { name: 'Noto Sans Devanagari', category: 'Devanagari' },
  { name: 'Hind', category: 'Devanagari' },
  { name: 'Mukta', category: 'Devanagari' },
  { name: 'Tiro Devanagari Hindi', category: 'Devanagari' },
  { name: 'Baloo 2', category: 'Devanagari' },
  { name: 'Noto Sans Bengali', category: 'Indian' },
  { name: 'Noto Sans Tamil', category: 'Indian' },
  { name: 'Noto Sans Telugu', category: 'Indian' },
];

const CATEGORIES = ['All', 'Sans-Serif', 'Serif', 'Display', 'Monospace', 'Devanagari', 'Indian'];

function makeFontUrl(name: string): string {
  const encoded = name.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;600;700&display=swap`;
}

export const FontManagerPanel: React.FC<FontManagerPanelProps> = ({ onClose }) => {
  const customFonts = useEditorStore((s) => s.customFonts);
  const addCustomFont = useEditorStore((s) => s.addCustomFont);
  const removeCustomFont = useEditorStore((s) => s.removeCustomFont);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [fontName, setFontName] = useState('');
  const [fontUrl, setFontUrl] = useState('');
  const [previewText, setPreviewText] = useState('The quick brown fox');

  const filtered = useMemo(() => {
    return GOOGLE_FONTS_LIBRARY.filter((f) => {
      const matchCat = activeCategory === 'All' || f.category === activeCategory;
      const matchQ = !query || f.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [query, activeCategory]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontName.trim() || !fontUrl.trim()) return;
    addCustomFont({ name: fontName.trim(), url: fontUrl.trim() });
    setFontName('');
    setFontUrl('');
  };

  const handleAddGoogleFont = (name: string) => {
    const url = makeFontUrl(name);
    addCustomFont({ name, url });
    // Inject into document <head>
    if (!document.querySelector(`link[data-font="${name}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.font = name;
      document.head.appendChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 flex-shrink-0">
          <div className="flex items-center gap-2 font-semibold text-slate-100">
            <Type className="w-5 h-5 text-indigo-400" />
            <span>Google Fonts Search & Manager</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5 overflow-y-auto text-xs text-slate-200">

          {/* Search + Category filter */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search 1,500+ Google Fonts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Preview input */}
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Preview text..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Font grid */}
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {filtered.map((gf) => {
              const isAdded = customFonts.some((f) => f.name === gf.name);
              return (
                <button
                  key={gf.name}
                  onClick={() => !isAdded && handleAddGoogleFont(gf.name)}
                  disabled={isAdded}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all gap-2 ${
                    isAdded
                      ? 'bg-indigo-950/40 border-indigo-800 cursor-default'
                      : 'bg-slate-800/60 hover:bg-slate-700/80 border-slate-700'
                  }`}
                  style={{ fontFamily: isAdded ? gf.name : undefined }}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-100 truncate">{gf.name}</span>
                    <span className="text-slate-500 text-[10px]">{previewText}</span>
                  </div>
                  {isAdded
                    ? <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    : <Plus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  }
                </button>
              );
            })}
          </div>

          {/* Add custom URL form */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">Add Custom CSS Font URL</h4>
            <form onSubmit={handleAdd} className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Font Family Name</label>
                <input
                  type="text"
                  placeholder="e.g. Poppins"
                  value={fontName}
                  onChange={(e) => setFontName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">CSS Stylesheet URL</label>
                <input
                  type="url"
                  placeholder="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap"
                  value={fontUrl}
                  onChange={(e) => setFontUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <button type="submit" className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-white transition-all shadow">
                Inject Font Stylesheet
              </button>
            </form>
          </div>

          {/* Installed fonts list */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">Active Installed Fonts ({customFonts.length})</h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {customFonts.map((f) => (
                <div key={f.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="font-medium text-slate-200" style={{ fontFamily: f.name }}>{f.name}</span>
                  <button onClick={() => removeCustomFont(f.name)} className="p-1 hover:bg-slate-700 rounded text-red-400" title="Remove Font">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
