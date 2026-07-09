export class PluginService {
  public static renderMathJax(container: HTMLElement, latex: string) {
    if (!container) return;
    container.innerHTML = `$$${latex}$$`;
    if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
      (window as any).MathJax.typesetPromise([container]).catch((err: any) => {
        console.error('MathJax render error:', err);
      });
    }
  }

  public static renderAbc(container: HTMLElement, abcNotation: string) {
    if (!container || !(window as any).ABCJS) return;
    container.innerHTML = '';
    (window as any).ABCJS.renderAbc(container, abcNotation, {
      responsive: 'resize',
      add_classes: true,
    });
  }

  public static renderAbcAudio(container: HTMLElement, abcNotation: string) {
    if (!container || !(window as any).ABCJS || !(window as any).ABCJS.synth) return;
    container.innerHTML = '';
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
  }
}
