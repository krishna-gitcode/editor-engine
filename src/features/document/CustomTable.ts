import Table from '@tiptap/extension-table';

export type TableTheme = 'none' | 'modern-dark' | 'classic-blue' | 'minimal-gray' | 'warm-amber';

export const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      theme: {
        default: 'none',
        parseHTML: (element) => element.getAttribute('data-theme') || 'none',
        renderHTML: (attributes) => {
          if (!attributes.theme || attributes.theme === 'none') return {};
          return {
            'data-theme': attributes.theme,
            class: `table-theme-${attributes.theme}`,
          };
        },
      },
      borderColor: {
        default: '#334155',
        parseHTML: (element) => element.style.borderColor || '#334155',
        renderHTML: (attributes) => {
          if (!attributes.borderColor) return {};
          return { style: `border-color: ${attributes.borderColor};` };
        },
      },
      borderWidth: {
        default: '1px',
        parseHTML: (element) => element.style.borderWidth || '1px',
        renderHTML: (attributes) => {
          if (!attributes.borderWidth) return {};
          return { style: `border-width: ${attributes.borderWidth};` };
        },
      },
    };
  },
});
