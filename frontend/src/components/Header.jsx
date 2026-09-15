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
    <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Clean Brand & Plain Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5 fill-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Voltaic<span className="text-emerald-400">AI</span></span>
                <span className="text-slate-400 font-normal">| Energy Demand Predictor</span>
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hidden sm:inline-block">
                SDG 7 Clean Energy
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Short-term electricity forecasting, peak alerts, and practical saving tips
            </p>
          </div>
        </div>

        {/* Right: Simple Dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Location / Profile Selector */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200">
            <span className="text-slate-400 font-medium">Facility:</span>
            <select
              value={selectedProfile}
              onChange={(e) => onSelectProfile(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-lg p-1 text-xs">
            {[
              { label: 'Next 24 Hours', val: 24 },
              { label: 'Next 48 Hours', val: 48 },
              { label: '7 Days', val: 168 }
            ].map((h) => (
              <button
                key={h.val}
                onClick={() => onSelectHorizon(h.val)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  horizon === h.val
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* How Accuracy Works / Info */}
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Learn how the model calculates predictions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>How it Works</span>
          </button>

          {/* Upload */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Upload custom electricity CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>

          {/* Export */}
          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Download report summary"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

        </div>

      </div>
    </header>
  );
}
