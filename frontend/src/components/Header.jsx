import React from 'react';
import { Zap, HelpCircle, Upload, Download } from 'lucide-react';

export default function Header({
  profiles,
  selectedProfile,
  onSelectProfile,
  horizon,
  onSelectHorizon,
  onOpenUpload,
  onOpenDiagnostics,
  onExportReport
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        
        {/* Left: Clean Brand & Title (Never wraps awkwardly) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-base font-bold text-white tracking-tight whitespace-nowrap">
              Voltaic<span className="text-emerald-400">AI</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm font-medium text-slate-300 whitespace-nowrap">
              Energy Demand Predictor
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 whitespace-nowrap">
              SDG 7
            </span>
          </div>
        </div>

        {/* Right: Controls aligned neatly in one cohesive row */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-3 text-xs justify-start lg:justify-end">
          
          {/* Facility Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 shrink-0">
            <span className="text-slate-400 text-[11px]">Facility:</span>
            <select
              value={selectedProfile}
              onChange={(e) => onSelectProfile(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clean Horizon Tabs */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg p-1 shrink-0">
            {[
              { label: '24h', val: 24 },
              { label: '48h', val: 48 },
              { label: '7 Days', val: 168 }
            ].map((h) => (
              <button
                key={h.val}
                onClick={() => onSelectHorizon(h.val)}
                className={`px-2.5 py-1 rounded font-medium transition-all whitespace-nowrap ${
                  horizon === h.val
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              title="Learn how the model calculates predictions"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>How it Works</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              title="Upload custom electricity CSV"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Upload CSV</span>
            </button>

            <button
              onClick={onExportReport}
              className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              title="Download report summary"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
