import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ChartComponent } from './ChartComponent';

export interface ChartOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chartBlock: {
      insertChart: (options: { chartData: any }) => ReturnType;
    };
  }
}

export const ChartExtension = Node.create<ChartOptions>({
  name: 'chartBlock',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'ai-chart-block',
      },
    };
  },

  addAttributes() {
    return {
      chartData: {
        default: {
          type: 'bar',
          title: 'Data Chart',
          labels: ['Item A', 'Item B', 'Item C', 'Item D'],
          datasets: [{ label: 'Series 1', data: [30, 50, 40, 70], color: '#6366f1' }],
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-chart]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const raw = dom.getAttribute('data-chart');
          if (!raw) return false;
          try {
            return { chartData: JSON.parse(raw) };
          } catch {
            return { chartData: raw };
          }
        },
      },
      {
        tag: 'div.ai-chart-block',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const raw = dom.getAttribute('data-chart');
          if (!raw) return false;
          try {
            return { chartData: JSON.parse(raw) };
          } catch {
            return { chartData: raw };
          }
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const dataStr = typeof HTMLAttributes.chartData === 'string'
      ? HTMLAttributes.chartData
      : JSON.stringify(HTMLAttributes.chartData);
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-chart': dataStr,
      }),
    ];
  },

  addCommands() {
    return {
      insertChart: (options) => ({ tr, dispatch }) => {
        const { selection } = tr;
        const node = this.type.create({ chartData: options.chartData });
        if (dispatch) {
          tr.replaceRangeWith(selection.from, selection.to, node);
        }
        return true;
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartComponent);
  },
});
