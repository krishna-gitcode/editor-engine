import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, Plus } from 'lucide-react';

interface ColorPickerDropdownProps {
  label: string;
  defaultColor?: string;
  onSelectColor: (color: string) => void;
  isHighlight?: boolean;
}

const RECOMMENDED_TEXT_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Slate', hex: '#1e293b' },
  { name: 'Indigo Brand', hex: '#6366f1' },
  { name: 'Royal Purple', hex: '#8b5cf6' },
  { name: 'Pink Rose', hex: '#ec4899' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Warm Amber', hex: '#f59e0b' },
  { name: 'Bright Blue', hex: '#3b82f6' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Teal Cyan', hex: '#06b6d4' },
];

const RECOMMENDED_HIGHLIGHT_COLORS = [
  { name: 'Soft Yellow', hex: '#fef08a' },
  { name: 'Soft Green', hex: '#bbf7d0' },
  { name: 'Soft Blue', hex: '#bfdbfe' },
  { name: 'Soft Pink', hex: '#fecdd3' },
  { name: 'Soft Purple', hex: '#e9d5ff' },
  { name: 'Soft Orange', hex: '#fed7aa' },
  { name: 'Soft Gray', hex: '#f1f5f9' },
  { name: 'Clear Highlight', hex: 'transparent' },
];

export const ColorPickerDropdown: React.FC<ColorPickerDropdownProps> = ({
  label,
  defaultColor = '#000000',
  onSelectColor,
  isHighlight = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHex, setSelectedHex] = useState(defaultColor);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [popupCoords, setPopupCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const storageKey = isHighlight ? 'editor_recent_highlights' : 'editor_recent_text_colors';

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setPopupCoords({
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - 270),
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecentColors(parsed);
      }
    } catch (err) {
      console.error('Error loading recent colors:', err);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const addRecentColor = (hex: string) => {
    if (hex === 'transparent') return;
    try {
      const filtered = recentColors.filter((c) => c.toLowerCase() !== hex.toLowerCase());
      const updated = [hex, ...filtered].slice(0, 8);
      setRecentColors(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving recent colors:', err);
    }
  };

  const handlePick = (hex: string) => {
    setSelectedHex(hex);
    onSelectColor(hex);
    addRecentColor(hex);
    setIsOpen(false);
  };

  const recommendedList = isHighlight ? RECOMMENDED_HIGHLIGHT_COLORS : RECOMMENDED_TEXT_COLORS;

  return (
    <div className="relative inline-block text-left select-none" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex flex-col items-center justify-center p-1 hover:bg-slate-800 rounded group transition-colors"
        title={`${label} Picker`}
      >
        <span className="text-[10px] text-slate-400 group-hover:text-slate-200">{label}</span>
        <div className="flex items-center gap-1 mt-0.5">
          <div
            className="w-5 h-3 rounded-sm border border-slate-600 shadow-inner"
            style={{ backgroundColor: selectedHex === 'transparent' ? '#ffffff' : selectedHex }}
          />
          <span className="text-[9px] text-slate-400">▼</span>
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3.5 z-[999999] animate-in fade-in duration-150"
          style={{ top: popupCoords.top, left: popupCoords.left }}
        >
          {/* Recommended Section */}
          <div className="mb-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Recommended Colors
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {recommendedList.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handlePick(c.hex)}
                  className="w-7 h-7 rounded-lg border border-slate-700/80 hover:scale-110 transition-transform relative flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: c.hex === 'transparent' ? '#ffffff' : c.hex }}
                  title={c.name}
                >
                  {c.hex === 'transparent' && (
                    <span className="text-[9px] font-bold text-red-500">✕</span>
                  )}
                  {selectedHex.toLowerCase() === c.hex.toLowerCase() && c.hex !== 'transparent' && (
                    <Check className={`w-3.5 h-3.5 ${['#000000', '#1e293b', '#6366f1'].includes(c.hex) ? 'text-white' : 'text-slate-900'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Recently Used Section */}
          {recentColors.length > 0 && (
            <div className="mb-3 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Frequently Used
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {recentColors.map((hex, idx) => (
                  <button
                    key={`${hex}-${idx}`}
                    onClick={() => handlePick(hex)}
                    className="w-7 h-7 rounded-lg border border-slate-700 hover:scale-110 transition-transform relative flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  >
                    {selectedHex.toLowerCase() === hex.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Color Input */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Custom Hex:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => colorInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-indigo-400 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Color Picker</span>
              </button>
              <input
                type="color"
                ref={colorInputRef}
                value={selectedHex === 'transparent' ? '#ffffff' : selectedHex}
                onChange={(e) => handlePick(e.target.value)}
                className="w-0 h-0 opacity-0 absolute pointer-events-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
