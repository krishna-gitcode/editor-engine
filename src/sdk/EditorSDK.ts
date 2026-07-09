import type { EditorInitOptions, PostMessageCommand } from './types';

export class EditorSDK {
  private iframe: HTMLIFrameElement | null = null;
  private options: EditorInitOptions;
  private messageListener: (event: MessageEvent) => void;

  constructor(options: EditorInitOptions) {
    this.options = options;
    this.messageListener = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageListener);
  }

  public mount(editorUrl: string = 'http://localhost:5173') {
    this.iframe = document.createElement('iframe');
    this.iframe.src = editorUrl;
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.options.container.appendChild(this.iframe);

    this.iframe.onload = () => {
      this.sendCommand({
        type: 'EDITOR_INIT',
        payload: {
          content: this.options.initialContent || '',
          theme: this.options.theme || 'dark',
        },
      });
    };
  }

  public sendCommand(cmd: PostMessageCommand) {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(cmd, '*');
    }
  }

  public save() {
    this.sendCommand({ type: 'SAVE_DOCUMENT' });
  }

  public loadTemplate(data: Record<string, string>) {
    this.sendCommand({ type: 'LOAD_TEMPLATE', payload: data });
  }

  private handleMessage(event: MessageEvent) {
    // In production, verify event.origin
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === 'EDITOR_SAVED' && this.options.onSave) {
      this.options.onSave(data.payload);
    } else if (data.type === 'EDITOR_CHANGED' && this.options.onChange) {
      this.options.onChange(data.payload.content);
    }
  }

  public destroy() {
    window.removeEventListener('message', this.messageListener);
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
    this.iframe = null;
  }
}
