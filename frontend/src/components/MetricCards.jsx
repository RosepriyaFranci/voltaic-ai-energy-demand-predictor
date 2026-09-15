import React from 'react';
import { 
  TrendingUp, 
  Activity, 
  DollarSign, 
  ShieldCheck,
  AlertTriangle,
  Clock
} from 'lucide-react';

export default function MetricCards({ 
  peakAnalysis, 
  forecastData,
  horizon
}) {
  if (!peakAnalysis || !forecastData || forecastData.length === 0) {
    return null;
  }

  const currentKw = forecastData[0]?.predicted_kw || 0;
  const currentTemp = forecastData[0]?.temperature_c ?? 22;
  const peakKw = peakAnalysis.highest_peak_kw || 0;
  
  // Format peak time cleanly
  let peakTimeStr = '5:00 PM';
  if (peakAnalysis.highest_peak_time) {
    const parts = peakAnalysis.highest_peak_time.split(' ');
    if (parts[1]) {
      const [h, m] = parts[1].split(':');
      const hourNum = parseInt(h, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const cleanHour = hourNum % 12 || 12;
      peakTimeStr = `${cleanHour}:${m} ${ampm}`;
    }
  }

  const totalCost = Math.round(peakAnalysis.total_projected_cost_usd || 0);
  const totalCarbon = Math.round(peakAnalysis.total_projected_carbon_kg || 0);
  const isHighDemand = peakAnalysis.overall_status === 'CRITICAL_PEAK' || peakAnalysis.overall_status === 'HIGH_DEMAND';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Expected Peak Usage */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-400">Expected Peak Usage</span>
          <TrendingUp className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {peakKw.toLocaleString()}
          </span>
          <span className="text-sm font-medium text-slate-400">kW</span>
        </div>
        <p className="text-xs text-amber-400/90 mt-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Expected around {peakTimeStr}</span>
        </p>
      </div>

      {/* 2. Current Usage */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-400">Current Power Draw</span>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {currentKw.toLocaleString()}
          </span>
          <span className="text-sm font-medium text-slate-400">kW</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Outdoor temperature: {currentTemp}°C
        </p>
      </div>

      {/* 3. Estimated Cost */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-400">Estimated Cost ({horizon}h)</span>
          <DollarSign className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            ${totalCost.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">est. bill</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          ~{totalCarbon.toLocaleString()} kg CO₂ footprint
        </p>
      </div>

      {/* 4. Grid Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium text-slate-400">Grid Status</span>
          {isHighDemand ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isHighDemand ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {isHighDemand ? 'Peak Alert' : 'Normal'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {isHighDemand 
            ? 'Higher rates apply during peak hours' 
            : 'Electricity demand is within normal levels'}
        </p>
      </div>

    </div>
  );
}
