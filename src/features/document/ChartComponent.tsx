import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { BarChart2, PieChart, TrendingUp, Circle, Edit3, Trash2, Check, Plus, X } from 'lucide-react';

export const ChartComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, deleteNode }) => {
  const rawChartData = node.attrs.chartData;
  let chartData: {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    title: string;
    labels: string[];
    datasets: Array<{ label: string; data: number[]; color?: string }>;
  } = {
    type: 'bar',
    title: 'Chart Title',
    labels: ['Item A', 'Item B', 'Item C', 'Item D'],
    datasets: [{ label: 'Dataset 1', data: [35, 60, 45, 80], color: '#6366f1' }],
  };

  if (typeof rawChartData === 'string' && rawChartData) {
    try {
      chartData = JSON.parse(rawChartData);
    } catch {
      // fallback to default
    }
  } else if (typeof rawChartData === 'object' && rawChartData !== null) {
    chartData = rawChartData;
  }

  const [isEditingData, setIsEditingData] = useState(false);
  const [editTitle, setEditTitle] = useState(chartData.title || 'AI Chart');
  const [editLabels, setEditLabels] = useState((chartData.labels || []).join(', '));
  const [editValues, setEditValues] = useState(
    (chartData.datasets?.[0]?.data || []).join(', ')
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6'];

  const saveEditedData = () => {
    const labels = editLabels.split(',').map((s) => s.trim()).filter(Boolean);
    const data = editValues.split(',').map((v) => parseFloat(v.trim()) || 0);
    const updated = {
      ...chartData,
      title: editTitle,
      labels: labels.length > 0 ? labels : ['A', 'B', 'C'],
      datasets: [
        {
          label: chartData.datasets?.[0]?.label || 'Series 1',
          data: data.length > 0 ? data : [10, 20, 30],
          color: chartData.datasets?.[0]?.color || '#6366f1',
        },
      ],
    };
    updateAttributes({ chartData: updated });
    setIsEditingData(false);
  };

  const setType = (type: 'bar' | 'line' | 'pie' | 'doughnut') => {
    updateAttributes({ chartData: { ...chartData, type } });
  };

  const labels = chartData.labels || [];
  const dataset = chartData.datasets?.[0] || { label: 'Series 1', data: [] };
  const dataPoints = dataset.data || [];
  const maxValue = Math.max(1, ...dataPoints);

  // SVG dimensions
  const svgWidth = 560;
  const svgHeight = 260;
  const chartAreaX = 50;
  const chartAreaY = 20;
  const chartAreaWidth = svgWidth - 80;
  const chartAreaHeight = svgHeight - 60;

  return (
    <NodeViewWrapper className="my-6 block relative transition-all select-none">
      <div
        className={`bg-slate-900 border ${
          selected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800'
        } rounded-2xl p-5 shadow-2xl overflow-hidden`}
      >
        {/* Header / Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              📊 {chartData.title || 'Data Chart'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-mono uppercase">
              {chartData.type}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Type selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5">
              <button
                onClick={() => setType('bar')}
                className={`p-1.5 rounded-lg transition-all ${
                  chartData.type === 'bar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Bar Chart"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setType('line')}
                className={`p-1.5 rounded-lg transition-all ${
                  chartData.type === 'line' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Line Chart"
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setType('pie')}
                className={`p-1.5 rounded-lg transition-all ${
                  chartData.type === 'pie' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Pie Chart"
              >
                <PieChart className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setType('doughnut')}
                className={`p-1.5 rounded-lg transition-all ${
                  chartData.type === 'doughnut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Doughnut Chart"
              >
                <Circle className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => {
                setEditTitle(chartData.title || '');
                setEditLabels((chartData.labels || []).join(', '));
                setEditValues((chartData.datasets?.[0]?.data || []).join(', '));
                setIsEditingData(!isEditingData);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isEditingData
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingData ? 'Editing...' : 'Edit Data'}</span>
            </button>

            {deleteNode && (
              <button
                onClick={deleteNode}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 transition-colors"
                title="Delete Chart"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* In-Place Data Editor Panel */}
        {isEditingData && (
          <div className="mb-5 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-in fade-in duration-150">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <span>Quick Data Editor</span>
              <button onClick={() => setIsEditingData(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Chart Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Labels (comma separated)</label>
                <input
                  type="text"
                  value={editLabels}
                  onChange={(e) => setEditLabels(e.target.value)}
                  placeholder="e.g. Jan, Feb, Mar"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Values (comma separated numbers)</label>
                <input
                  type="text"
                  value={editValues}
                  onChange={(e) => setEditValues(e.target.value)}
                  placeholder="e.g. 40, 65, 80"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditingData(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedData}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Update Chart</span>
              </button>
            </div>
          </div>
        )}

        {/* SVG Chart Visualization */}
        <div className="w-full overflow-x-auto flex justify-center py-2">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[620px] h-auto overflow-visible">
            {/* Grid & Axis for Bar/Line */}
            {(chartData.type === 'bar' || chartData.type === 'line') && (
              <g>
                {/* Y-axis horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = chartAreaY + chartAreaHeight - ratio * chartAreaHeight;
                  const val = Math.round(ratio * maxValue);
                  return (
                    <g key={i}>
                      <line
                        x1={chartAreaX}
                        y1={y}
                        x2={chartAreaX + chartAreaWidth}
                        y2={y}
                        stroke="#334155"
                        strokeDasharray={i > 0 ? '3 3' : undefined}
                        strokeWidth={i === 0 ? 1.5 : 0.7}
                      />
                      <text
                        x={chartAreaX - 8}
                        y={y + 4}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis line */}
                <line
                  x1={chartAreaX}
                  y1={chartAreaY + chartAreaHeight}
                  x2={chartAreaX + chartAreaWidth}
                  y2={chartAreaY + chartAreaHeight}
                  stroke="#475569"
                  strokeWidth="1.5"
                />

                {/* Bars */}
                {chartData.type === 'bar' &&
                  dataPoints.map((val, idx) => {
                    const barCount = Math.max(1, dataPoints.length);
                    const slotWidth = chartAreaWidth / barCount;
                    const barWidth = Math.min(48, slotWidth * 0.6);
                    const x = chartAreaX + idx * slotWidth + (slotWidth - barWidth) / 2;
                    const barH = (val / maxValue) * chartAreaHeight;
                    const y = chartAreaY + chartAreaHeight - barH;
                    const color = colors[idx % colors.length];
                    const isHovered = hoveredIndex === idx;

                    return (
                      <g key={idx}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barH}
                          rx={6}
                          fill={color}
                          opacity={hoveredIndex !== null && !isHovered ? 0.4 : 0.9}
                          className="transition-all duration-300 cursor-pointer hover:opacity-100"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                        {/* Value tooltip on top or hover */}
                        {(isHovered || dataPoints.length <= 8) && (
                          <text
                            x={x + barWidth / 2}
                            y={y - 6}
                            fill={isHovered ? '#ffffff' : '#cbd5e1'}
                            fontSize="10"
                            fontWeight={isHovered ? 'bold' : 'normal'}
                            textAnchor="middle"
                          >
                            {val}
                          </text>
                        )}
                        {/* Label on X-axis */}
                        <text
                          x={x + barWidth / 2}
                          y={chartAreaY + chartAreaHeight + 16}
                          fill="#94a3b8"
                          fontSize="11"
                          textAnchor="middle"
                        >
                          {(labels[idx] || `Item ${idx + 1}`).slice(0, 10)}
                        </text>
                      </g>
                    );
                  })}

                {/* Line */}
                {chartData.type === 'line' && (
                  <g>
                    {(() => {
                      const points = dataPoints.map((val, idx) => {
                        const slotWidth = chartAreaWidth / Math.max(1, dataPoints.length);
                        const x = chartAreaX + idx * slotWidth + slotWidth / 2;
                        const y = chartAreaY + chartAreaHeight - (val / maxValue) * chartAreaHeight;
                        return `${x},${y}`;
                      });
                      const polylinePoints = points.join(' ');
                      const areaPoints = `${points[0]?.split(',')[0] || chartAreaX},${
                        chartAreaY + chartAreaHeight
                      } ${polylinePoints} ${points[points.length - 1]?.split(',')[0] || chartAreaX},${
                        chartAreaY + chartAreaHeight
                      }`;

                      return (
                        <>
                          {/* Gradient area */}
                          <polygon points={areaPoints} fill="rgba(99, 102, 241, 0.15)" />
                          <polyline
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={polylinePoints}
                          />
                        </>
                      );
                    })()}

                    {/* Points & Labels */}
                    {dataPoints.map((val, idx) => {
                      const slotWidth = chartAreaWidth / Math.max(1, dataPoints.length);
                      const x = chartAreaX + idx * slotWidth + slotWidth / 2;
                      const y = chartAreaY + chartAreaHeight - (val / maxValue) * chartAreaHeight;
                      const isHovered = hoveredIndex === idx;

                      return (
                        <g key={idx}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 6 : 4}
                            fill="#6366f1"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />
                          {(isHovered || dataPoints.length <= 8) && (
                            <text
                              x={x}
                              y={y - 10}
                              fill={isHovered ? '#ffffff' : '#cbd5e1'}
                              fontSize="10"
                              fontWeight={isHovered ? 'bold' : 'normal'}
                              textAnchor="middle"
                            >
                              {val}
                            </text>
                          )}
                          <text
                            x={x}
                            y={chartAreaY + chartAreaHeight + 16}
                            fill="#94a3b8"
                            fontSize="11"
                            textAnchor="middle"
                          >
                            {(labels[idx] || `Item ${idx + 1}`).slice(0, 10)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            )}

            {/* Pie & Doughnut */}
            {(chartData.type === 'pie' || chartData.type === 'doughnut') && (
              <g transform={`translate(${svgWidth / 2 - 40}, ${svgHeight / 2})`}>
                {(() => {
                  const total = dataPoints.reduce((a, b) => a + (Math.max(0, b) || 0), 0) || 1;
                  let currentAngle = -Math.PI / 2;
                  const radius = 95;
                  const innerRadius = chartData.type === 'doughnut' ? 52 : 0;

                  return dataPoints.map((val, idx) => {
                    const sliceAngle = (val / total) * 2 * Math.PI;
                    const startAngle = currentAngle;
                    const endAngle = startAngle + sliceAngle;
                    currentAngle = endAngle;

                    const x1 = Math.cos(startAngle) * radius;
                    const y1 = Math.sin(startAngle) * radius;
                    const x2 = Math.cos(endAngle) * radius;
                    const y2 = Math.sin(endAngle) * radius;

                    const ix1 = Math.cos(endAngle) * innerRadius;
                    const iy1 = Math.sin(endAngle) * innerRadius;
                    const ix2 = Math.cos(startAngle) * innerRadius;
                    const iy2 = Math.sin(startAngle) * innerRadius;

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
                    let d = '';

                    if (chartData.type === 'pie') {
                      d = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                    } else {
                      d = `M ${ix2} ${iy2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`;
                    }

                    const midAngle = startAngle + sliceAngle / 2;
                    const labelRadius = innerRadius + (radius - innerRadius) / 2;
                    const lx = Math.cos(midAngle) * labelRadius;
                    const ly = Math.sin(midAngle) * labelRadius;
                    const percent = Math.round((val / total) * 100);
                    const color = colors[idx % colors.length];
                    const isHovered = hoveredIndex === idx;

                    return (
                      <g key={idx}>
                        <path
                          d={d}
                          fill={color}
                          opacity={hoveredIndex !== null && !isHovered ? 0.4 : 0.9}
                          className="transition-all duration-300 cursor-pointer hover:opacity-100"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        />
                        {percent > 6 && (
                          <text
                            x={lx}
                            y={ly}
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="pointer-events-none"
                          >
                            {percent}%
                          </text>
                        )}
                      </g>
                    );
                  });
                })()}

                {/* Doughnut center label */}
                {chartData.type === 'doughnut' && (
                  <text x={0} y={4} fill="#e2e8f0" fontSize="13" fontWeight="bold" textAnchor="middle">
                    Total: {dataPoints.reduce((a, b) => a + (Math.max(0, b) || 0), 0)}
                  </text>
                )}
              </g>
            )}

            {/* Legend for Pie/Doughnut */}
            {(chartData.type === 'pie' || chartData.type === 'doughnut') && (
              <g transform={`translate(${svgWidth - 140}, 30)`}>
                {dataPoints.map((val, idx) => (
                  <g key={idx} transform={`translate(0, ${idx * 22})`}>
                    <rect width="12" height="12" rx="3" fill={colors[idx % colors.length]} />
                    <text x="18" y="10" fill="#cbd5e1" fontSize="11">
                      {(labels[idx] || `Item ${idx + 1}`).slice(0, 14)} ({val})
                    </text>
                  </g>
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>
    </NodeViewWrapper>
  );
};
