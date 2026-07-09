import { Node, mergeAttributes } from '@tiptap/core';

export interface IframeOptions {
  allowFullscreen: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    iframe: {
      setIframe: (options: { src: string; width?: number; height?: number }) => ReturnType;
    };
  }
}

export const IframeExtension = Node.create<IframeOptions>({
  name: 'iframe',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      allowFullscreen: true,
      HTMLAttributes: {
        class: 'iframe-wrapper border border-slate-700 rounded-lg overflow-hidden my-4 shadow-md',
      },
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: 640,
      },
      height: {
        default: 360,
      },
      frameBorder: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'iframe[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', this.options.HTMLAttributes, ['iframe', mergeAttributes(HTMLAttributes)]];
  },

  addCommands() {
    return {
      setIframe: (options) => ({ tr, dispatch }) => {
        const { selection } = tr;
        const node = this.type.create(options);
        if (dispatch) {
          tr.replaceRangeWith(selection.from, selection.to, node);
        }
        return true;
      },
    };
  },
});
