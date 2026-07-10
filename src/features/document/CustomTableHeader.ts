import TableHeader from '@tiptap/extension-table-header';
import { mergeAttributes } from '@tiptap/core';

export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.style.width || element.getAttribute('width') || null,
      },
      height: {
        default: null,
        parseHTML: (element) => element.style.height || element.getAttribute('height') || null,
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
      },
      borderColor: {
        default: null,
        parseHTML: (element) => element.style.borderColor || null,
      },
      borderWidth: {
        default: null,
        parseHTML: (element) => element.style.borderWidth || null,
      },
      borderStyle: {
        default: 'solid',
        parseHTML: (element) => element.style.borderStyle || 'solid',
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const { width, height, backgroundColor, borderColor, borderWidth, borderStyle = 'solid' } = node.attrs;

    const styles: string[] = [];
    const colW = node.attrs.colwidth?.[0];
    const cellWidth = width ? (typeof width === 'number' ? `${width}px` : width)
      : colW ? `${colW}px`
      : null;
    if (cellWidth) {
      styles.push(`width: ${cellWidth}`);
      styles.push(`min-width: ${cellWidth}`);
    }
    if (height) {
      const h = typeof height === 'number' ? `${height}px` : height;
      styles.push(`height: ${h}`);
    }
    if (backgroundColor) styles.push(`background-color: ${backgroundColor}`);
    if (borderColor) styles.push(`border-color: ${borderColor}`);
    if (borderWidth) styles.push(`border-width: ${borderWidth}`);
    if (borderStyle && (borderColor || borderWidth)) styles.push(`border-style: ${borderStyle}`);

    const mergedAttrs = {
      ...HTMLAttributes,
      style: styles.join('; '),
    };

    return ['th', mergeAttributes(this.options.HTMLAttributes, mergedAttrs), 0];
  },
});
