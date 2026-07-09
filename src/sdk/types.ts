export interface EditorInitOptions {
  container: HTMLElement;
  initialContent?: string;
  theme?: 'dark' | 'light';
  onSave?: (data: { content: string; json: any; pdfBlob?: Blob }) => void;
  onChange?: (content: string) => void;
}

export interface PostMessageCommand {
  type: 'EDITOR_INIT' | 'SAVE_DOCUMENT' | 'LOAD_TEMPLATE' | 'EXPORT_SNAPSHOT' | 'INJECT_PLUGIN';
  payload?: any;
}
