import React, { useState, useEffect, useRef } from 'react';
import { Music, Check, X, Play, Square, ChevronDown } from 'lucide-react';
import { PluginService } from '../../services/PluginService';
import html2canvas from 'html2canvas';

interface AbcjsModalProps {
  onClose: () => void;
  engine: any;
  editor?: any;
}

export const AbcjsModal: React.FC<AbcjsModalProps> = ({ onClose, engine, editor }) => {
  const [abcNotation, setAbcNotation] = useState(
    'X:1\nT:Sarkari Anthem Melody\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c | c B A G | F E D C |]'
  );
  const [abcInstrument, setAbcInstrument] = useState<number>(0);
  const [isAbcPlaying, setIsAbcPlaying] = useState<boolean>(false);

  const abcPreviewRef = useRef<HTMLDivElement>(null);
  const abcAudioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abcPreviewRef.current) {
      PluginService.renderAbc(abcPreviewRef.current, abcNotation);
      if (abcAudioRef.current) {
        PluginService.renderAbcAudio(abcAudioRef.current, abcNotation);
      }
    }
  }, [abcNotation]);

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

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ee-border)', background: 'var(--ee-surface-1)' }}>
        <div className="flex items-center gap-2 font-semibold text-[var(--ee-text-primary)]">
          <Music className="w-5 h-5 text-pink-400" />
          <span>ABCjs Sheet Music & MIDI Studio</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[var(--ee-surface-2)] rounded text-[var(--ee-text-secondary)] hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto text-xs text-[var(--ee-text-primary)]">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-medium text-[var(--ee-text-secondary)] mb-1.5">
              ABC Music Notation Input
            </label>
            <textarea
              value={abcNotation}
              onChange={(e) => setAbcNotation(e.target.value)}
              className="w-full h-44 border rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-indigo-500 resize-none"
              style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <span className="text-[11px] font-medium text-[var(--ee-text-secondary)] block mb-1.5">Instrument (MIDI Program)</span>
              <div className="relative">
                <ChevronDown className="w-3.5 h-3.5 text-[var(--ee-text-secondary)] absolute right-3 top-2.5 pointer-events-none" />
                <select
                  value={abcInstrument}
                  onChange={(e) => { setAbcInstrument(Number(e.target.value)); setIsAbcPlaying(false); }}
                  className="w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500 appearance-none pr-8"
                  style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}
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
                      const audioCtx = abcjs.synth.activeAudioContext?.() ?? new window.AudioContext();
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

            <div>
              <span className="text-[11px] font-medium text-[var(--ee-text-secondary)] block mb-1.5">Preset Tune Templates</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAbcNotation('X:1\nT:C Major Scale\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |]')}
                  className="px-3 py-1.5 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] text-[var(--ee-text-primary)] text-xs"
                >C Major Scale</button>
                <button
                  onClick={() => setAbcNotation('X:2\nT:Twinkle Twinkle\nM:4/4\nL:1/4\nK:C\nC C G G | A A G2 | F F E E | D D C2 |]')}
                  className="px-3 py-1.5 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] text-[var(--ee-text-primary)] text-xs"
                >Twinkle Melody</button>
                <button
                  onClick={() => setAbcNotation('X:3\nT:Raga Yaman\nM:4/4\nL:1/4\nK:G\nN G A B ^C | D E F G |]')}
                  className="px-3 py-1.5 rounded bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] text-[var(--ee-text-primary)] text-xs"
                >Raga Yaman</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-[11px] font-medium text-[var(--ee-text-secondary)] block mb-1.5">Live Render Preview</span>
            <div
              ref={abcPreviewRef}
              className="w-full min-h-[160px] p-4 bg-white text-slate-900 rounded-xl border border-[var(--ee-border)] overflow-auto flex items-center justify-center shadow-inner"
            />
          </div>

          <div>
            <span className="text-[11px] font-medium text-[var(--ee-text-secondary)] block mb-1.5">MIDI Audio Synthesizer</span>
            <div
              ref={abcAudioRef}
              className="w-full p-3 rounded-xl border flex items-center justify-center"
              style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}
            />
          </div>

          <div className="mt-auto pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] font-medium text-[var(--ee-text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertAbc}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-white transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Insert onto Canvas</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
