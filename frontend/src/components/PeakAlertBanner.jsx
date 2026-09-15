import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PeakAlertBanner({ peakAnalysis, onScrollToSimulator }) {
  if (!peakAnalysis) return null;

  const peakWindows = peakAnalysis.peak_windows || [];
  const hasPeaks = peakWindows.length > 0;
  const threshold = Math.round(peakAnalysis.peak_threshold_kw || 0);

  if (!hasPeaks) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-emerald-900/40 flex items-center gap-3 text-slate-300">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="text-xs sm:text-sm">
          <span className="font-semibold text-white">All clear: </span>
          Electricity demand is predicted to stay within normal levels (below {threshold} kW) for this period.
        </div>
      </div>
    );
  }

  // Format the primary peak window cleanly
  const primaryPeak = peakWindows[0];
  const startRaw = primaryPeak.start_time.split(' ')[1]?.slice(0, 5) || '16:00';
  const endRaw = primaryPeak.end_time.split(' ')[1]?.slice(0, 5) || '20:00';
  
  const formatTime = (timeStr) => {
    const [h, m] = timeStr.split(':');
    const hourNum = parseInt(h, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const cleanHour = hourNum % 12 || 12;
    return `${cleanHour}:${m} ${ampm}`;
  };

  const peakWindowLabel = `${formatTime(startRaw)} to ${formatTime(endRaw)}`;

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white">
              Peak Electricity Hours: Today from {peakWindowLabel}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Power demand is expected to reach up to <span className="font-semibold text-amber-300">{Math.round(primaryPeak.max_kw)} kW</span>. 
              Electricity rates are up to 3x higher during this window. Shifting power use can save up to <span className="font-semibold text-white">${primaryPeak.estimated_surcharge_usd}</span> on your bill.
            </p>
          </div>
        </div>

        <button
          onClick={onScrollToSimulator}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shrink-0 self-start sm:self-center"
        >
          <span>Try Ways to Save</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
}
