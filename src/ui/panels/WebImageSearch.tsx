import React, { useState, useMemo } from 'react';
import { Search, Image as ImageIcon, Loader2, ExternalLink, Download, Check, Sparkles, Filter, Grid, SlidersHorizontal } from 'lucide-react';
import './WebImageSearch.css';

interface WebImageSearchProps {
  engine: any;
  editor?: any;
}

interface StockPhoto {
  id: string;
  title: string;
  category: string;
  url: string;
  thumb: string;
  author: string;
  orientation: 'landscape' | 'portrait' | 'square';
  width: number;
  height: number;
}

const CATEGORIES = [
  'All', 'Education', 'Music', 'Nature', 'Technology',
  'Corporate', 'Science', 'Abstract', 'Architecture', 'Workspace'
];

const STOCK_LIBRARY: StockPhoto[] = [
  // Education
  {
    id: 'edu-1', title: 'Modern University Library', category: 'Education',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80',
    author: 'Susan Q Yin', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'edu-2', title: 'Students Collaborating with Laptops', category: 'Education',
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80',
    author: 'Alexis Brown', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'edu-3', title: 'Open Books on Desk', category: 'Education',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
    author: 'Kimberly Farmer', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'edu-4', title: 'Digital Lecture & Online Learning', category: 'Education',
    url: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=400&q=80',
    author: 'Chris Montgomery', orientation: 'landscape', width: 1200, height: 800
  },

  // Music
  {
    id: 'mus-1', title: 'Live Concert Stage & Lights', category: 'Music',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    author: 'Anthony Delanoix', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'mus-2', title: 'Grand Piano Keyboard Close-up', category: 'Music',
    url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=400&q=80',
    author: 'Jordan Whitfield', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'mus-3', title: 'Acoustic Guitar & Sheet Music', category: 'Music',
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=400&q=80',
    author: 'Michael Maasen', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'mus-4', title: 'Studio Mixing Console & Audio Gear', category: 'Music',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
    author: 'Will Francis', orientation: 'landscape', width: 1200, height: 800
  },

  // Nature
  {
    id: 'nat-1', title: 'Majestic Alpine Mountain Range', category: 'Nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    author: 'Luca Bravo', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'nat-2', title: 'Emerald Ocean Waves & Coastline', category: 'Nature',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=400&q=80',
    author: 'Jeremy Bishop', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'nat-3', title: 'Misty Redwood Forest Sunlight', category: 'Nature',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
    author: 'Casey Horner', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'nat-4', title: 'Golden Hour Sunset Over Lake', category: 'Nature',
    url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=400&q=80',
    author: 'Johannes Plenio', orientation: 'landscape', width: 1200, height: 800
  },

  // Technology
  {
    id: 'tech-1', title: 'Modern Software Development Workspace', category: 'Technology',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80',
    author: 'Christopher Gower', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'tech-2', title: 'Futuristic AI & Neural Network Code', category: 'Technology',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
    author: 'Markus Spiske', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'tech-3', title: 'Data Center Rack & Cloud Servers', category: 'Technology',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
    author: 'Taylor Vick', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'tech-4', title: 'Hardware Microchip & Circuit Board', category: 'Technology',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    author: 'Vishnu Mohanan', orientation: 'landscape', width: 1200, height: 800
  },

  // Corporate & Workspace
  {
    id: 'corp-1', title: 'Executive Team Meeting & Strategy', category: 'Corporate',
    url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80',
    author: 'Austin Distel', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'corp-2', title: 'Financial Analytics & Dashboard Charts', category: 'Corporate',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    author: 'Carlos Muza', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'work-1', title: 'Minimalist Desktop & Ergonomic Setup', category: 'Workspace',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
    author: 'Nastuh Abootalebi', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'work-2', title: 'Coffee, Notebook & iPad Workspace', category: 'Workspace',
    url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80',
    author: 'Olu Eletu', orientation: 'landscape', width: 1200, height: 800
  },

  // Science
  {
    id: 'sci-1', title: 'Biotechnology & Medical Laboratory', category: 'Science',
    url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=400&q=80',
    author: 'National Cancer Institute', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'sci-2', title: 'Microscope Close-up & Slides', category: 'Science',
    url: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=400&q=80',
    author: 'Chokniti Khongchum', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'sci-3', title: 'Deep Space Nebula & Galaxies', category: 'Science',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&q=80',
    author: 'NASA', orientation: 'landscape', width: 1200, height: 800
  },

  // Abstract & Architecture
  {
    id: 'abs-1', title: 'Vibrant Fluid Color Waves', category: 'Abstract',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=80',
    author: 'Codioful', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'abs-2', title: '3D Geometric Polygonal Mesh', category: 'Abstract',
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f888?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f888?auto=format&fit=crop&w=400&q=80',
    author: 'Shubham Dhage', orientation: 'landscape', width: 1200, height: 800
  },
  {
    id: 'arch-1', title: 'Futuristic Skyscraper Glass Facade', category: 'Architecture',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    author: 'Samson', orientation: 'portrait', width: 800, height: 1200
  },
  {
    id: 'arch-2', title: 'Golden Gate Suspension Bridge at Dusk', category: 'Architecture',
    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=80',
    author: 'Rist Art', orientation: 'landscape', width: 1200, height: 800
  }
];

export const WebImageSearch: React.FC<WebImageSearchProps> = ({ engine, editor }) => {
  const [query, setQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [orientationFilter, setOrientationFilter] = useState<'all' | 'landscape' | 'portrait'>('all');
  const [insertedId, setInsertedId] = useState<string | null>(null);

  // Filter images based on query, category, and orientation
  const filteredImages = useMemo(() => {
    return STOCK_LIBRARY.filter((photo) => {
      const matchCat = activeCategory === 'All' || photo.category === activeCategory;
      const matchQuery = !query || photo.title.toLowerCase().includes(query.toLowerCase()) || photo.category.toLowerCase().includes(query.toLowerCase()) || photo.author.toLowerCase().includes(query.toLowerCase());
      const matchOrientation = orientationFilter === 'all' || photo.orientation === orientationFilter;
      return matchCat && matchQuery && matchOrientation;
    });
  }, [query, activeCategory, orientationFilter]);

  const handleInsertImage = (photo: StockPhoto) => {
    const activeEditor = editor || (window as any).__activeEditor;
    const isCanvasMode = (window as any).__isCanvasMode;

    if (isCanvasMode && engine) {
      engine.addImageFromUrl(photo.url);
    } else if (activeEditor) {
      activeEditor.chain().focus().setImage({ src: photo.url, alt: photo.title }).run();
    } else if (engine) {
      engine.addImageFromUrl(photo.url);
    }

    setInsertedId(photo.id);
    setTimeout(() => setInsertedId(null), 1800);
  };

  const handleCustomUrlInsert = () => {
    if (!customUrl.trim()) return;
    const activeEditor = editor || (window as any).__activeEditor;
    const isCanvasMode = (window as any).__isCanvasMode;

    if (isCanvasMode && engine) {
      engine.addImageFromUrl(customUrl.trim());
    } else if (activeEditor) {
      activeEditor.chain().focus().setImage({ src: customUrl.trim(), alt: 'Web Image' }).run();
    } else if (engine) {
      engine.addImageFromUrl(customUrl.trim());
    }
    setCustomUrl('');
  };

  return (
    <div className="flex flex-col gap-3 p-3 h-full text-slate-200 overflow-hidden bg-slate-900/90 select-none">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            Web Image Search
          </span>
          <span className="text-[10px] text-cyan-400/80 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            Web & Unsplash
          </span>
        </h3>

        {/* Direct Web URL bar */}
        <div className="flex gap-1.5 mb-2">
          <input
            type="text"
            placeholder="Paste direct Web Image URL (https://...)"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCustomUrlInsert(); }}
            className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
          <button
            onClick={handleCustomUrlInsert}
            disabled={!customUrl.trim()}
            className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded-lg text-xs font-semibold text-white transition-all flex items-center gap-1"
          >
            + URL
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search high-res web photography..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Orientation & Filters strip */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80 text-[10px]">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3 text-slate-500" /> Orientation:
          </span>
          <div className="flex gap-1">
            {(['all', 'landscape', 'portrait'] as const).map((orient) => (
              <button
                key={orient}
                onClick={() => setOrientationFilter(orient)}
                className={`px-2 py-0.5 rounded-lg font-semibold capitalize transition-all ${
                  orientationFilter === orient
                    ? 'bg-cyan-600/90 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {orient}
              </button>
            ))}
          </div>
        </div>

        {/* Category tags */}
        <div className="flex gap-1 flex-wrap max-h-16 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 pr-1 pb-4">
        {filteredImages.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
            <SlidersHorizontal className="w-8 h-8 text-slate-600 animate-pulse" />
            <span className="text-xs font-medium text-slate-400">No web images match your filter</span>
            <button
              onClick={() => { setQuery(''); setActiveCategory('All'); setOrientationFilter('all'); }}
              className="text-[11px] text-cyan-400 hover:underline mt-1 font-medium"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredImages.map((photo) => {
            const isInserted = insertedId === photo.id;
            return (
              <div
                key={photo.id}
                onClick={() => handleInsertImage(photo)}
                className="group relative rounded-xl overflow-hidden border border-slate-800/80 aspect-video bg-slate-950 hover:border-cyan-500/80 transition-all cursor-pointer shadow-md"
              >
                <img
                  src={photo.thumb}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                
                {/* Overlay gradient & actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-semibold bg-slate-900/80 text-cyan-300 px-1.5 py-0.5 rounded backdrop-blur-sm border border-slate-700/50">
                      {photo.category}
                    </span>
                    <span className="text-[9px] text-slate-300 bg-slate-900/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {photo.width}×{photo.height}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-white leading-tight truncate mb-0.5">
                      {photo.title}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 truncate">
                        By {photo.author}
                      </span>
                      <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-0.5">
                        {isInserted ? <Check className="w-3 h-3 text-emerald-400" /> : '+ Insert'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instant Feedback Toast badge */}
                {isInserted && (
                  <div className="absolute inset-0 bg-cyan-600/30 backdrop-blur-[2px] flex items-center justify-center transition-all animate-in fade-in zoom-in-95">
                    <div className="bg-slate-900 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-full border border-cyan-500/60 shadow-lg flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Inserted!
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="text-[10px] text-slate-500 text-center border-t border-slate-800 pt-2 flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        Click any photo to insert directly to Canvas or Document
      </div>
    </div>
  );
};
