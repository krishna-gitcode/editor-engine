export class PluginService {
  public static renderMathJax(container: HTMLElement, latex: string) {
    if (!container) return;
    const cleanLatex = (latex || '').trim()
      .replace(/^\$\$\s*/, '')
      .replace(/\s*\$\$$/, '')
      .replace(/^\\\(\s*/, '')
      .replace(/\s*\\\)$/, '')
      .replace(/^\\\[\s*/, '')
      .replace(/\s*\\\]$/, '');

    if (!cleanLatex) {
      container.innerHTML = '<span class="text-slate-500 italic text-xs">Empty Math equation</span>';
      return;
    }
    container.innerHTML = `$$ ${cleanLatex} $$`;

    let attempts = 0;
    const tryTypeset = () => {
      attempts++;
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        if ((window as any).MathJax.typesetClear) {
          try { (window as any).MathJax.typesetClear([container]); } catch {}
        }
        (window as any).MathJax.typesetPromise([container]).catch((err: any) => {
          console.error('MathJax render error:', err);
        });
      } else if (attempts < 25) {
        setTimeout(tryTypeset, 150);
      }
    };

    tryTypeset();
  }

  public static renderAbc(container: HTMLElement, abcNotation: string) {
    if (!container) return;
    if (!abcNotation) {
      container.innerHTML = '<span class="text-slate-500 italic text-xs">Empty ABC notation</span>';
      return;
    }

    let attempts = 0;
    const tryRender = () => {
      attempts++;
      if ((window as any).ABCJS && (window as any).ABCJS.renderAbc) {
        container.innerHTML = '';
        try {
          (window as any).ABCJS.renderAbc(container, abcNotation, {
            responsive: 'resize',
            add_classes: true,
          });
        } catch (err) {
          console.error('ABCJS render error:', err);
          container.innerHTML = `<span class="text-red-400 text-xs">ABCjs error: ${String(err)}</span>`;
        }
      } else if (attempts < 20) {
        setTimeout(tryRender, 200);
      }
    };

    tryRender();
  }

  public static renderAbcAudio(container: HTMLElement, abcNotation: string) {
    if (!container || !abcNotation) return;
    let attempts = 0;
    const tryAudio = () => {
      attempts++;
      if ((window as any).ABCJS && (window as any).ABCJS.synth) {
        container.innerHTML = '';
        try {
          const visualObj = (window as any).ABCJS.renderAbc('*', abcNotation)[0];
          if (!visualObj) return;

          const synthControl = new (window as any).ABCJS.synth.SynthController();
          synthControl.load(container, null, {
            displayLoop: true,
            displayRestart: true,
            displayPlay: true,
            displayProgress: true,
            displayWarp: true,
          });
          synthControl.setTune(visualObj, false, { chordsOff: false });
        } catch (err) {
          console.error('ABCJS audio error:', err);
        }
      } else if (attempts < 20) {
        setTimeout(tryAudio, 200);
      }
    };
    tryAudio();
  }
}
