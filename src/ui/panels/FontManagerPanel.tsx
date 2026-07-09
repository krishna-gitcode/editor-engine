import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { Plus, Trash2, X, Type } from 'lucide-react';

interface FontManagerPanelProps {
  onClose: () => void;
}

export const FontManagerPanel: React.FC<FontManagerPanelProps> = ({ onClose }) => {
  const customFonts = useEditorStore((s) => s.customFonts);
  const addCustomFont = useEditorStore((s) => s.addCustomFont);
  const removeCustomFont = useEditorStore((s) => s.removeCustomFont);

  const [fontName, setFontName] = useState('');
  const [fontUrl, setFontUrl] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fontName.trim() || !fontUrl.trim()) return;
    addCustomFont({ name: fontName.trim(), url: fontUrl.trim() });
    setFontName('');
    setFontUrl('');
  };

  const POPULAR_GOOGLE_FONTS = [
    { name: 'Montserrat', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap' },
    { name: 'Oswald', url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&display=swap' },
    { name: 'Merriweather', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' },
    { name: 'Lato', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 font-semibold text-slate-100">
            <Type className="w-5 h-5 text-indigo-400" />
            <span>Google & Custom Font Manager</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[70vh] text-xs text-slate-200">
          {/* Quick add popular */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-2.5">Popular Google Fonts (One-Click Injection)</h4>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_GOOGLE_FONTS.map((gf) => {
                const isAdded = customFonts.some((f) => f.name === gf.name);
                return (
                  <button
                    key={gf.name}
                    disabled={isAdded}
                    onClick={() => addCustomFont(gf)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      isAdded
                        ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                    }`}
                  >
                    <span className="font-medium">{gf.name}</span>
                    <span>{isAdded ? 'Active' : '+ Add'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add custom URL form */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-2.5">Add Custom CSS Font URL</h4>
            <form onSubmit={handleAdd} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
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
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-white transition-all shadow"
              >
                Inject Font Stylesheet
              </button>
            </form>
          </div>

          {/* Installed fonts list */}
          <div>
            <h4 className="font-semibold text-slate-300 mb-2.5">Active Installed Fonts ({customFonts.length})</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {customFonts.map((f) => (
                <div key={f.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="font-medium text-slate-200">{f.name}</span>
                  <button
                    onClick={() => removeCustomFont(f.name)}
                    className="p-1 hover:bg-slate-700 rounded text-red-400"
                    title="Remove Font"
                  >
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
