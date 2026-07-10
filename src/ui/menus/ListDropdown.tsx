import React, { useState, useRef, useEffect } from 'react';
import { List, ListOrdered, Check, Plus, ChevronDown } from 'lucide-react';

interface ListDropdownProps {
  editor: any;
  isOrdered?: boolean;
}

const BULLET_STYLES = [
  { label: 'Solid Dot (•)', value: 'disc' },
  { label: 'Open Circle (◦)', value: 'circle' },
  { label: 'Square (▪)', value: 'square' },
  { label: 'Checkmark (✓)', value: '✓' },
  { label: 'Star (★)', value: '★' },
  { label: 'Arrow (➢)', value: '➢' },
  { label: 'Diamond (❖)', value: '❖' },
];

const ORDERED_STYLES = [
  { label: 'Numbers (1, 2, 3)', value: 'decimal' },
  { label: 'Leading Zero (01, 02)', value: 'decimal-leading-zero' },
  { label: 'Lower Alphabet (a, b, c)', value: 'lower-alpha' },
  { label: 'Upper Alphabet (A, B, C)', value: 'upper-alpha' },
  { label: 'Lower Roman (i, ii, iii)', value: 'lower-roman' },
  { label: 'Upper Roman (I, II, III)', value: 'upper-roman' },
];

export const ListDropdown: React.FC<ListDropdownProps> = ({ editor, isOrdered = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popupCoords, setPopupCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [customText, setCustomText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setPopupCoords({
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - 240),
      });
    }
    setIsOpen(!isOpen);
  };

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

  const handleSelectStyle = (styleVal: string) => {
    if (editor && (editor.commands as any).setListStyleType) {
      (editor.commands as any).setListStyleType(styleVal, isOrdered);
    } else if (editor) {
      if (isOrdered) editor.chain().focus().toggleOrderedList().run();
      else editor.chain().focus().toggleBulletList().run();
    }
    setIsOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customText.trim() && editor) {
      if ((editor.commands as any).setListStyleType) {
        (editor.commands as any).setListStyleType(customText.trim(), isOrdered);
      }
      setCustomText('');
      setIsOpen(false);
    }
  };

  const activeCommand = isOrdered ? 'orderedList' : 'bulletList';
  const isActive = editor?.isActive(activeCommand);
  const items = isOrdered ? ORDERED_STYLES : BULLET_STYLES;

  return (
    <div className="relative inline-block text-left select-none flex items-center" ref={dropdownRef}>
      <div className="flex items-center rounded overflow-hidden border border-transparent hover:border-slate-700">
        <button
          onClick={() => {
            if (isOrdered) editor?.chain().focus().toggleOrderedList().run();
            else editor?.chain().focus().toggleBulletList().run();
          }}
          className={`p-1.5 transition-colors ${
            isActive ? 'bg-slate-800 text-indigo-400' : 'hover:bg-slate-800 text-slate-300'
          }`}
          title={isOrdered ? 'Numbered List' : 'Bullet List'}
        >
          {isOrdered ? <ListOrdered className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleDropdown}
          className={`p-1 px-0.5 transition-colors ${
            isOpen ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title={isOrdered ? 'Numbered List Styles' : 'Bullet List Styles'}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-[999999] animate-in fade-in duration-150"
          style={{ top: popupCoords.top, left: popupCoords.left }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
            {isOrdered ? 'Number Styles' : 'Bullet Styles'}
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            {items.map((item) => (
              <button
                key={item.value}
                onClick={() => handleSelectStyle(item.value)}
                className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">
              Custom {isOrdered ? 'Prefix/Marker' : 'Bullet Marker'}
            </div>
            <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 px-1">
              <input
                type="text"
                placeholder={isOrdered ? 'e.g. Q., (a)' : 'e.g. 👉, -, ::'}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
