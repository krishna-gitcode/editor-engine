import TableHeader from '@tiptap/extension-table-header';
import { mergeAttributes } from '@tiptap/core';

export const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.style.width || element.getAttribute('width') || '100%',
      },
      height: {
        default: '100%',
        parseHTML: (element) => element.style.height || element.getAttribute('height') || '100%',
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
    const { width = '100%', height = '100%', backgroundColor, borderColor, borderWidth, borderStyle = 'solid' } = node.attrs;

    const styles: string[] = [];
    const colW = node.attrs.colwidth?.[0];
    const cellWidth = colW ? `${colW}px` : (width ? (typeof width === 'number' ? `${width}px` : width) : '100%');
    styles.push(`width: ${cellWidth}`);
    styles.push(`min-width: ${cellWidth}`);

    const cellHeight = height ? (typeof height === 'number' ? `${height}px` : height) : '100%';
    styles.push(`height: ${cellHeight}`);
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
