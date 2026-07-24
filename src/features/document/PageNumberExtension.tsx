import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { useDocumentStore } from '../../store/documentStore';

const PageNumberComponent = (props: any) => {
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const type = props.node.attrs.type;

  const pageIndex = pages.findIndex((p) => p.id === activePageId);
  const pageNumber = pageIndex !== -1 ? pageIndex + 1 : 1;
  const totalPages = pages.length;

  return (
    <NodeViewWrapper as="span" className="inline-block px-1 bg-slate-100 rounded text-slate-500 font-mono text-[0.9em] select-none print:bg-transparent print:text-black print:p-0" contentEditable={false}>
      {type === 'current' ? pageNumber : totalPages}
    </NodeViewWrapper>
  );
};

export const PageNumberExtension = Node.create({
  name: 'pageNumber',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      type: {
        default: 'current', // 'current' or 'total'
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="page-number"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'page-number' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageNumberComponent);
  },

  addCommands() {
    return {
      insertPageNumber:
        (options?: { type?: 'current' | 'total' }) =>
        ({ chain }: any) => {
          return chain()
            .insertContent({
              type: 'pageNumber',
              attrs: { type: options?.type || 'current' },
            })
            .run();
        },
    } as any;
  },
});
