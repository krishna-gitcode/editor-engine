import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AbcJsComponent } from './AbcJsComponent';

export interface AbcJsOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    abcJs: {
      insertAbcJs: (options: { abc: string }) => ReturnType;
    };
  }
}

export const AbcJsExtension = Node.create<AbcJsOptions>({
  name: 'abcJs',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'abcjs-render',
      },
    };
  },

  addAttributes() {
    return {
      abc: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-abc]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          return {
            abc: dom.getAttribute('data-abc') || '',
          };
        },
      },
      {
        tag: 'div.abcjs-render',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          return {
            abc: dom.getAttribute('data-abc') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-abc': HTMLAttributes.abc })];
  },

  addCommands() {
    return {
      insertAbcJs: (options) => ({ tr, dispatch }) => {
        const { selection } = tr;
        const node = this.type.create(options);
        if (dispatch) {
          tr.replaceRangeWith(selection.from, selection.to, node);
        }
        return true;
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AbcJsComponent);
  },
});
