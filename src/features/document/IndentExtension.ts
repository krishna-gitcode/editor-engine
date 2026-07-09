import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const IndentExtension = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const indentAttr = element.getAttribute('data-indent');
              return indentAttr ? parseInt(indentAttr, 10) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) return {};
              return {
                'data-indent': attributes.indent,
                style: `padding-left: ${attributes.indent * 24}px;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (['paragraph', 'heading'].includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent < 8) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: currentIndent + 1 });
            }
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (['paragraph', 'heading'].includes(node.type.name)) {
            const currentIndent = node.attrs.indent || 0;
            if (currentIndent > 0) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: currentIndent - 1 });
            }
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
});
