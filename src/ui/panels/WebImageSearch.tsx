import React, { useState } from 'react';
import { Search, Image as ImageIcon } from 'lucide-react';
import './WebImageSearch.css';

interface WebImageSearchProps {
  engine: any;
}

export const WebImageSearch: React.FC<WebImageSearchProps> = ({ engine }) => {
  const [query, setQuery] = useState('');

  const SAMPLE_IMAGES = [
    { title: 'Modern Architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80' },
    { title: 'Mountain Nature', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80' },
    { title: 'Technology Workspace', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80' },
    { title: 'Abstract Gradient', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=600&q=80' },
    { title: 'Coffee & Notebook', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80' },
    { title: 'Concert & Music', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80' },
  ];

  const filtered = query
    ? SAMPLE_IMAGES.filter((img) => img.title.toLowerCase().includes(query.toLowerCase()))
    : SAMPLE_IMAGES;

  return (
    <div className="flex flex-col gap-4 p-4 h-full text-slate-200 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-2">Web Stock Library</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search stock photos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {filtered.map((img, i) => (
          <button
            key={i}
            onClick={() => engine?.addImageFromUrl(img.url)}
            className="group relative rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-900 hover:border-indigo-500 transition-all text-left"
          >
            <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-medium text-white truncate">{img.title}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
