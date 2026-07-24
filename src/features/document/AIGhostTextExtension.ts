import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { useAIStore } from '../../store/aiStore';
import { OpenRouterService } from '../../services/OpenRouterService';

const ghostTextPluginKey = new PluginKey('aiGhostText');

let typingTimeout: NodeJS.Timeout | null = null;
let currentAbortController: AbortController | null = null;

export const AIGhostTextExtension = Extension.create({
  name: 'aiGhostText',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ghostTextPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            const ghostText = useAIStore.getState().ghostText;
            const ghostCursorPos = useAIStore.getState().ghostCursorPos;

            // Important: we need to update decorations if meta changes (which we trigger manually)
            const meta = tr.getMeta(ghostTextPluginKey);
            if (meta?.clear || !ghostText) {
              return DecorationSet.empty;
            }

            if (tr.docChanged || tr.selectionSet) {
               // When user types or moves cursor, the view update clears ghostText from store.
               // We'll return empty here as well.
               return DecorationSet.empty;
            }

            if (ghostText && ghostCursorPos) {
              const widget = document.createElement('span');
              widget.className = 'ai-ghost-text';
              widget.textContent = ghostText;

              const deco = Decoration.widget(ghostCursorPos, widget, {
                side: 1, // insert after cursor
              });

              return DecorationSet.create(tr.doc, [deco]);
            }

            return oldState;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleKeyDown(view, event) {
            const { ghostText } = useAIStore.getState();
            
            if (ghostText && event.key === 'Tab') {
              event.preventDefault();
              view.dispatch(view.state.tr.insertText(ghostText));
              useAIStore.getState().clearGhostText();
              return true; // handled
            }

            if (ghostText && (event.key === 'Escape' || event.key.length === 1 || event.key === 'Backspace' || event.key === 'Enter')) {
              useAIStore.getState().clearGhostText();
              view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, { clear: true }));
            }

            return false;
          },
        },
        view(editorView) {
          return {
            update(view, prevState) {
              const state = view.state;
              if (prevState.doc.eq(state.doc) && prevState.selection.eq(state.selection)) {
                return;
              }

              useAIStore.getState().clearGhostText();
              if (typingTimeout) clearTimeout(typingTimeout);
              if (currentAbortController) currentAbortController.abort();

              const { from, to, empty } = state.selection;
              if (!empty || !view.hasFocus()) return;

              // Get last character
              const textBefore = state.doc.textBetween(Math.max(0, from - 1), from);
              if (textBefore !== ' ' && textBefore !== '.') return;

              // Get context (last 400 chars)
              const context = state.doc.textBetween(Math.max(0, from - 400), from);

              typingTimeout = setTimeout(async () => {
                const { apiKey, selectedModel } = useAIStore.getState();
                currentAbortController = new AbortController();

                try {
                  const systemPrompt = "You are an inline writing assistant. Complete the user's text naturally. Output ONLY the continuation (10-30 words max). No explanation.";
                  const prompt = `Continue this text: ${context}`;
                  
                  const result = await OpenRouterService.generateText(apiKey, selectedModel, prompt, systemPrompt);
                  
                  if (result && !currentAbortController.signal.aborted) {
                    useAIStore.getState().setGhostText(result, from);
                    // Force a dummy dispatch to trigger decoration rendering
                    view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, { render: true }));
                  }
                } catch (e) {
                  // handle silently
                }
              }, 900);
            },
            destroy() {
              if (typingTimeout) clearTimeout(typingTimeout);
              if (currentAbortController) currentAbortController.abort();
            }
          };
        },
      }),
    ];
  },
});
