import Table from '@tiptap/extension-table';
import { mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TableComponent } from './TableComponent';

export type TableTheme = 'none' | 'modern-dark' | 'classic-blue' | 'minimal-gray' | 'warm-amber';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customTableCommands: {
      updateTableAttributes: (attrs: Record<string, any>) => ReturnType;
      updateActiveCellAttributes: (attrs: Record<string, any>) => ReturnType;
    };
  }
}

export const CustomTable = Table.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      resizable: true,
      handleWidth: 6,
      cellMinWidth: 40,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      theme: {
        default: 'none',
        parseHTML: (element) => element.getAttribute('data-theme') || 'none',
      },
      borderColor: {
        default: '#cbd5e1',
        parseHTML: (element) => element.style.borderColor || element.style.getPropertyValue('--custom-table-border-color') || '#cbd5e1',
      },
      borderWidth: {
        default: '1px',
        parseHTML: (element) => element.style.borderWidth || element.style.getPropertyValue('--custom-table-border-width') || '1px',
      },
      width: {
        default: '100%',
        parseHTML: (element) => element.style.width || element.getAttribute('width') || '100%',
      },
      height: {
        default: 'auto',
        parseHTML: (element) => element.style.height || 'auto',
      },
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
      },
      rotation: {
        default: 0,
        parseHTML: (element) => {
          const rot = element.getAttribute('data-rotation');
          return rot ? parseInt(rot, 10) : 0;
        },
      },
      cellPadding: {
        default: '8px 12px',
        parseHTML: (element) => element.getAttribute('data-cell-padding') || '8px 12px',
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableComponent);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      updateTableAttributes: (attrs: Record<string, any>) => ({ tr, state, dispatch }) => {
        const { $from } = state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name === 'table') {
            const pos = $from.before(depth);
            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...$from.node(depth).attrs,
                ...attrs,
              });
            }
            return true;
          }
        }
        return false;
      },
      updateActiveCellAttributes: (attrs: Record<string, any>) => ({ tr, state, dispatch }) => {
        const { $from } = state.selection;
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
            const pos = $from.before(depth);
            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                ...attrs,
              });
            }
            return true;
          }
        }
        return false;
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const {
      width = '100%',
      height = 'auto',
      alignment = 'center',
      rotation = 0,
      borderColor = '#cbd5e1',
      borderWidth = '1px',
      theme = 'none',
      cellPadding = '8px 12px',
    } = node.attrs;

    const styles: string[] = [];
    if (width) {
      const w = typeof width === 'number' ? `${width}px` : width;
      styles.push(`width: ${w}`);
    }
    if (height && height !== 'auto') {
      const h = typeof height === 'number' ? `${height}px` : height;
      styles.push(`height: ${h}`);
    }
    if (borderColor) styles.push(`--custom-table-border-color: ${borderColor}`);
    if (borderWidth) styles.push(`--custom-table-border-width: ${borderWidth}`);

    if (alignment === 'left') {
      styles.push('margin-left: 0 !important; margin-right: auto !important');
    } else if (alignment === 'right') {
      styles.push('margin-left: auto !important; margin-right: 0 !important');
    } else if (alignment === 'float-left') {
      styles.push('float: left !important; margin: 0 1rem 1rem 0 !important');
    } else if (alignment === 'float-right') {
      styles.push('float: right !important; margin: 0 0 1rem 1rem !important');
    } else {
      styles.push('margin-left: auto !important; margin-right: auto !important');
    }

    if (rotation && rotation !== 0) {
      styles.push(`transform: rotate(${rotation}deg) !important; transform-origin: center center !important; display: inline-table !important`);
    }

    const mergedAttrs = {
      ...HTMLAttributes,
      'data-theme': theme,
      'data-alignment': alignment,
      'data-rotation': rotation,
      'data-cell-padding': cellPadding,
      style: styles.join('; '),
      class: `table-theme-${theme} ${HTMLAttributes.class || ''}`.trim(),
    };

    return ['table', mergeAttributes(this.options.HTMLAttributes, mergedAttrs), ['tbody', 0]];
  },
});
