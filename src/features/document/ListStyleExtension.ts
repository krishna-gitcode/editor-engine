import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    listStyle: {
      setListStyleType: (listStyleType: string, isOrdered?: boolean) => ReturnType;
    };
  }
}

export const ListStyleExtension = Extension.create({
  name: 'listStyle',

  addGlobalAttributes() {
    return [
      {
        types: ['bulletList', 'orderedList', 'listItem'],
        attributes: {
          listStyleType: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-list-style') || null,
            renderHTML: (attributes) => {
              if (!attributes.listStyleType) return {};
              
              const knownTypes = [
                'disc', 'circle', 'square', 'decimal', 'decimal-leading-zero',
                'lower-alpha', 'upper-alpha', 'lower-roman', 'upper-roman'
              ];
              
              let styleStr = '';
              if (knownTypes.includes(attributes.listStyleType)) {
                styleStr = `list-style-type: ${attributes.listStyleType} !important;`;
              } else {
                const cleanStr = attributes.listStyleType.replace(/"/g, '\\"');
                styleStr = `list-style-type: "${cleanStr} " !important;`;
              }

              return {
                'data-list-style': attributes.listStyleType,
                style: styleStr,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setListStyleType: (listStyleType: string, isOrdered: boolean = false) => ({ tr, state, dispatch, editor }) => {
        const { selection } = state;
        
        if (isOrdered && !editor.isActive('orderedList')) {
          editor.commands.toggleOrderedList();
        } else if (!isOrdered && !editor.isActive('bulletList')) {
          editor.commands.toggleBulletList();
        }

        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (['bulletList', 'orderedList', 'listItem'].includes(node.type.name)) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              listStyleType,
            });
          }
        });

        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
});
