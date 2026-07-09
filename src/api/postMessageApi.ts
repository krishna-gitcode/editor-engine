import { useDocumentStore } from '../store/documentStore';
import { useEditorStore } from '../store/editorStore';
import type { PostMessageCommand } from '../sdk/types';

export function initPostMessageBridge(engine: any) {
  window.addEventListener('message', (event: MessageEvent) => {
    // In production, verify event.origin against allowlist
    const cmd: PostMessageCommand = event.data;
    if (!cmd || !cmd.type) return;

    switch (cmd.type) {
      case 'EDITOR_INIT':
        if (cmd.payload?.content) {
          useDocumentStore.getState().updatePageContent('page-1', cmd.payload.content);
        }
        if (cmd.payload?.theme) {
          useEditorStore.getState().setTheme(cmd.payload.theme);
        }
        break;

      case 'SAVE_DOCUMENT': {
        const pages = useDocumentStore.getState().pages;
        const canvasJson = engine?.toJSON() || {};
        window.parent.postMessage({
          type: 'EDITOR_SAVED',
          payload: { pages, canvasJson },
        }, '*');
        break;
      }

      case 'LOAD_TEMPLATE':
        if (cmd.payload) {
          useDocumentStore.getState().applyTemplateData(cmd.payload);
          engine?.applyTemplateVariables(cmd.payload);
        }
        break;

      case 'EXPORT_SNAPSHOT':
        if (engine) {
          const dataUrl = engine.exportAsImage('png', 2);
          window.parent.postMessage({
            type: 'SNAPSHOT_READY',
            payload: { dataUrl },
          }, '*');
        }
        break;
    }
  });
}
