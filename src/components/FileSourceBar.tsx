import { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Layers,
  Database,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { FileMetadataState, MarketDatasetSummary } from '../types/equity';

interface FileSourceBarProps {
  metadata: FileMetadataState;
  summary: MarketDatasetSummary | null;
  onSelectLocalFile: (file: File) => void;
  onReloadBenchmark: () => void;
}

export const FileSourceBar = ({
  metadata,
  summary,
  onSelectLocalFile,
  onReloadBenchmark,
}: FileSourceBarProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text'))) {
      onSelectLocalFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectLocalFile(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* File Data Source Banner */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white border rounded-2xl p-4 shadow-xs transition ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
            : 'border-slate-200/80'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {metadata.fileName}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    metadata.sourceType === 'local_upload'
                      ? 'bg-emerald-100/70 text-emerald-800 border border-emerald-200'
                      : 'bg-indigo-100/70 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {metadata.sourceType === 'local_upload' ? 'User Uploaded CSV' : 'Indian Equities Benchmark'}
                </span>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Currency: ₹ INR
                </span>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                <span className="font-medium text-slate-700">
                  {metadata.rowCount} Rows Parsed
                </span>
                {summary && (
                  <>
                    <span>&bull;</span>
                    <span className="text-blue-700 font-semibold">
                      {summary.totalStocks} Stocks
                    </span>
                    <span>&bull;</span>
                    <span className="text-purple-700 font-semibold">
                      {summary.totalSectors} Sectors
                    </span>
                    <span>&bull;</span>
                    <span className="text-amber-700 font-semibold">
                      {summary.totalIndustries} Industries
                    </span>
                  </>
                )}
                {metadata.loadedAt && (
                  <>
                    <span>&bull;</span>
                    <span className="text-slate-400">Loaded {metadata.loadedAt}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload / Drop CSV
            </button>

            {metadata.sourceType === 'local_upload' && (
              <button
                onClick={onReloadBenchmark}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Reset to Benchmark
              </button>
            )}
          </div>
        </div>

        {/* Data Fidelity Policy Note */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Strict Data Fidelity:</strong> No synthetic assumptions or guesses. Displays only metrics and records present in your CSV.
            </span>
          </div>
          <div className="text-slate-400">
            No BUY / SELL recommendations &bull; Pure sector &amp; industry exploration
          </div>
        </div>
      </div>
    </div>
  );
};
