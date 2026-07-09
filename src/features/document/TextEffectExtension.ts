import { Mark, mergeAttributes } from '@tiptap/core';

export interface TextEffectOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textEffect: {
      setTextEffect: (attributes: { effect: string; color?: string }) => ReturnType;
      unsetTextEffect: () => ReturnType;
    };
  }
}

export const TextEffectExtension = Mark.create<TextEffectOptions>({
  name: 'textEffect',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      effect: {
        default: 'none',
        parseHTML: (element) => element.getAttribute('data-effect') || 'none',
        renderHTML: (attributes) => {
          if (!attributes.effect || attributes.effect === 'none') return {};
          let style = '';
          switch (attributes.effect) {
            case 'shadow':
              style = `text-shadow: 2px 2px 4px ${attributes.color || 'rgba(0,0,0,0.4)'};`;
              break;
            case 'glow':
              style = `text-shadow: 0 0 8px ${attributes.color || '#6366f1'}, 0 0 16px ${attributes.color || '#6366f1'};`;
              break;
            case 'outline':
              style = `-webkit-text-stroke: 1px ${attributes.color || '#6366f1'}; color: transparent;`;
              break;
            case 'gradient':
              style = `background: linear-gradient(45deg, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`;
              break;
          }
          return {
            'data-effect': attributes.effect,
            'data-color': attributes.color || '',
            style,
          };
        },
      },
      color: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-effect]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextEffect: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      unsetTextEffect: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
