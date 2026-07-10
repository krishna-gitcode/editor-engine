import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MathJaxComponent } from './MathJaxComponent';

export interface MathJaxOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathJax: {
      insertMathJax: (options: { latex: string }) => ReturnType;
    };
  }
}

export const MathJaxExtension = Node.create<MathJaxOptions>({
  name: 'mathJax',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'mathjax-render',
      },
    };
  },

  addAttributes() {
    return {
      latex: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-latex]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          return {
            latex: dom.getAttribute('data-latex') || '',
          };
        },
      },
      {
        tag: 'div.mathjax-render',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          return {
            latex: dom.getAttribute('data-latex') || dom.textContent?.replace(/\$\$/g, '').trim() || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-latex': HTMLAttributes.latex }), `$$ ${HTMLAttributes.latex} $$`];
  },

  addCommands() {
    return {
      insertMathJax: (options) => ({ tr, dispatch }) => {
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
    return ReactNodeViewRenderer(MathJaxComponent);
  },
});
