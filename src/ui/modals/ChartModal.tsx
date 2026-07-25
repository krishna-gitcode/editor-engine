import React, { useState } from 'react';
import { BarChart2, Check, X, Loader2 } from 'lucide-react';
import { OpenRouterService } from '../../services/OpenRouterService';

interface ChartModalProps {
  onClose: () => void;
  engine: any;
  editor?: any;
  apiKey: string;
  selectedModel: string;
}

export const ChartModal: React.FC<ChartModalProps> = ({ onClose, engine, editor, apiKey, selectedModel }) => {
  const [chartMode, setChartMode] = useState<'manual' | 'ai'>('manual');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut'>('bar');
  const [chartTitle, setChartTitle] = useState<string>('Quarterly Performance 2025');
  const [chartLabels, setChartLabels] = useState<string>('Jan, Feb, Mar, Apr');
  const [chartDataValues, setChartDataValues] = useState<string>('45, 78, 62, 90');
  const [chartPrompt, setChartPrompt] = useState<string>('Bar chart comparing monthly sales for Jan-Jun 2025 vs 2024');
  const [chartOutput, setChartOutput] = useState<string>('');
  const [isChartGenerating, setIsChartGenerating] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  const handleGenerateChart = async () => {
    setIsChartGenerating(true);
    setChartError(null);
    try {
      const systemPrompt = 'You are a data visualization expert. When given a chart description, respond ONLY with a JSON object in this exact format: {"type":"bar"|"line"|"pie"|"doughnut","title":"...","labels":[...],"datasets":[{"label":"...","data":[...],"color":"..."}]}. No markdown, no explanation, only valid JSON.';
      const res = await OpenRouterService.generateText(apiKey, selectedModel, chartPrompt, systemPrompt);
      const cleaned = res.trim();
      setChartOutput(cleaned);
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed.type) setChartType(parsed.type);
        if (parsed.title) setChartTitle(parsed.title);
        if (parsed.labels) setChartLabels(parsed.labels.join(', '));
        if (parsed.datasets?.[0]?.data) setChartDataValues(parsed.datasets[0].data.join(', '));
      } catch {
        // ignore JSON parse error for manual fields
      }
    } catch (err: any) {
      setChartError(err.message || 'Chart generation failed.');
    } finally {
      setIsChartGenerating(false);
    }
  };

  const handleInsertChart = () => {
    let chartData: any;
    if (chartMode === 'manual') {
      const labels = chartLabels.split(',').map((s) => s.trim()).filter(Boolean);
      const data = chartDataValues.split(',').map((v) => parseFloat(v.trim()) || 0);
      chartData = {
        type: chartType,
        title: chartTitle || 'Data Chart',
        labels: labels.length > 0 ? labels : ['Item A', 'Item B', 'Item C'],
        datasets: [{ label: 'Series 1', data: data.length > 0 ? data : [10, 20, 30], color: '#6366f1' }],
      };
    } else {
      if (!chartOutput.trim()) return;
      try {
        chartData = JSON.parse(chartOutput);
      } catch {
        chartData = {
          type: 'bar',
          title: 'AI Chart',
          labels: ['Data 1', 'Data 2', 'Data 3'],
          datasets: [{ label: 'AI Series', data: [50, 75, 60], color: '#6366f1' }],
        };
      }
    }

    const activeEditor = editor || (window as any).__activeEditor;
    if (activeEditor) {
      if (activeEditor.commands.insertChart) {
        activeEditor.commands.insertChart({ chartData });
      } else {
        activeEditor.chain().focus().insertContent({
          type: 'chartBlock',
          attrs: { chartData },
        }).run();
      }
    } else if (engine) {
      const labelsStr = (chartData.labels || []).join(', ');
      engine.addTextbox({
        text: `Chart: ${chartData.title}\nType: ${chartData.type}\nLabels: ${labelsStr}`,
        fontSize: 16,
        fill: '#1e293b',
      });
    }
    onClose();
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--ee-border)', background: 'var(--ee-surface-1)' }}>
        <div className="flex items-center gap-2 font-semibold text-[var(--ee-text-primary)]">
          <BarChart2 className="w-5 h-5 text-amber-400" />
          <span>AI Chart Builder Studio</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[var(--ee-surface-2)] rounded text-[var(--ee-text-secondary)] hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 text-xs text-[var(--ee-text-primary)]">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setChartMode('manual')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${chartMode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-[var(--ee-surface-2)] text-[var(--ee-text-secondary)]'}`}
          >
            Manual Builder
          </button>
          <button
            onClick={() => setChartMode('ai')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${chartMode === 'ai' ? 'bg-indigo-600 text-white' : 'bg-[var(--ee-surface-2)] text-[var(--ee-text-secondary)]'}`}
          >
            AI Generator
          </button>
        </div>

        {chartMode === 'manual' ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--ee-text-secondary)] mb-1.5">Chart Type</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                  className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded-xl p-2.5 text-[var(--ee-text-primary)] focus:border-indigo-500"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="doughnut">Doughnut Chart</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--ee-text-secondary)] mb-1.5">Chart Title</label>
                <input
                  type="text"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                  className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded-xl p-2.5 text-[var(--ee-text-primary)] focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--ee-text-secondary)] mb-1.5">Labels (comma-separated)</label>
                <input
                  type="text"
                  value={chartLabels}
                  onChange={(e) => setChartLabels(e.target.value)}
                  placeholder="e.g. Jan, Feb, Mar"
                  className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded-xl p-2.5 text-[var(--ee-text-primary)] focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--ee-text-secondary)] mb-1.5">Values (comma-separated)</label>
                <input
                  type="text"
                  value={chartDataValues}
                  onChange={(e) => setChartDataValues(e.target.value)}
                  placeholder="e.g. 10, 20, 30"
                  className="w-full bg-[var(--ee-surface-2)] border border-[var(--ee-border)] rounded-xl p-2.5 text-[var(--ee-text-primary)] focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-medium text-[var(--ee-text-secondary)] mb-1.5">AI Prompt (Describe the chart data)</label>
              <textarea
                value={chartPrompt}
                onChange={(e) => setChartPrompt(e.target.value)}
                placeholder="Describe the data you want to visualize..."
                className="w-full h-32 border rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                style={{ background: 'var(--ee-surface-0)', color: 'var(--ee-text-primary)', borderColor: 'var(--ee-border)' }}
              />
            </div>
            {chartError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
                {chartError}
              </div>
            )}
            <button
              onClick={handleGenerateChart}
              disabled={isChartGenerating || !apiKey}
              className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 font-medium text-white shadow flex items-center justify-center gap-2"
            >
              {isChartGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Data...</> : <span>Generate Chart Data</span>}
            </button>
            {chartOutput && (
              <div className="p-3 rounded-xl border border-[var(--ee-border)] bg-[var(--ee-surface-2)] text-[10px] font-mono text-[var(--ee-text-secondary)] overflow-x-auto">
                <pre>{chartOutput}</pre>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[var(--ee-surface-2)] hover:bg-[var(--ee-surface-3)] font-medium text-[var(--ee-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleInsertChart}
            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-medium text-white transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Insert Chart</span>
          </button>
        </div>
      </div>
    </>
  );
};
