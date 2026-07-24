import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { ExportEngine } from '../../core/engine/ExportEngine';

interface PdfExportDialogProps {
  onClose: () => void;
}

type QualityTier = 'original' | 'high' | 'standard' | 'compressed';

const TIERS = [
  {
    id: 'original',
    title: 'Original Quality',
    description: 'Lossless / Print-Ready (~300 DPI)',
    scale: 3.0,
    quality: 1.0,
    size: 'Large file size'
  },
  {
    id: 'high',
    title: 'High Quality',
    description: 'Recommended for general use (~200 DPI)',
    scale: 2.0,
    quality: 0.90,
    size: 'Medium file size'
  },
  {
    id: 'standard',
    title: 'Standard Quality',
    description: 'Web & Email optimized (~150 DPI)',
    scale: 1.5,
    quality: 0.75,
    size: 'Small file size'
  },
  {
    id: 'compressed',
    title: 'Compressed Quality',
    description: 'Fast Sharing (< 1MB) (~96 DPI)',
    scale: 1.0,
    quality: 0.60,
    size: 'Smallest file size'
  }
];

export const PdfExportDialog: React.FC<PdfExportDialogProps> = ({ onClose }) => {
  const [selectedTier, setSelectedTier] = useState<QualityTier>('high');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const tier = TIERS.find(t => t.id === selectedTier) || TIERS[1];
    
    // In a real implementation, we would pass tier.scale and tier.quality
    // to the ExportEngine or PdfService. For now, we simulate the hookup.
    // ExportEngine.exportToPDF(element, filename, { scale: tier.scale, quality: tier.quality });
    
    const el = document.getElementById('document-page-container') || document.querySelector('.prose')?.parentElement || document.body;
    
    try {
      // Simulate export process
      await ExportEngine.exportToPDF(el as HTMLElement, `export-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
    }
    
    setIsExporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-[500px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="h-14 border-b border-slate-700 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-pink-400" />
            Export to PDF
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-slate-400 mb-2">
            Select the PDF export quality. Higher quality results in larger file sizes.
          </p>

          <div className="flex flex-col gap-3">
            {TIERS.map((tier) => (
              <div 
                key={tier.id}
                onClick={() => setSelectedTier(tier.id as QualityTier)}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-4 ${
                  selectedTier === tier.id 
                    ? 'bg-indigo-600/10 border-indigo-500' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <div className="mt-0.5">
                  {selectedTier === tier.id ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-medium ${selectedTier === tier.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {tier.title}
                    </span>
                    <span className="text-xs text-slate-500">{tier.size}</span>
                  </div>
                  <p className="text-sm text-slate-400">{tier.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 border-t border-slate-700 bg-slate-950/50 flex items-center justify-end gap-3 px-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <span className="animate-pulse">Exporting...</span>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate PDF
              </>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};
