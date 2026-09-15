import React from 'react';
import { Sliders, RotateCcw, Check, Sparkles } from 'lucide-react';

export default function WhatIfSimulator({
  params,
  onChangeParams,
  onReset,
  simulationResult
}) {
  const result = simulationResult || {};
  const peakReducedKw = result.peak_reduction_kw ?? 0;
  const costSaved = result.cost_saved_usd ?? 0;
  const carbonSaved = result.carbon_saved_kg ?? 0;

  const hasAdjustments = (
    params.load_shift_pct > 0 ||
    params.battery_kwh > 0 ||
    params.solar_pv_kw > 0 ||
    params.temp_offset_c > 0
  );

  return (
    <div id="what-if-simulator" className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 mb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Test Your Savings (Simulator)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Slide the controls to see how changing habits or using batteries will flatten your power curve.
          </p>
        </div>

        {hasAdjustments && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 transition-colors self-start sm:self-center"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset controls</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Sliders (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Slider 1: Shift equipment */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-white">Shift Heavy Power Use to Night</span>
              <span className="text-emerald-400 font-semibold">{params.load_shift_pct}% shifted</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={params.load_shift_pct}
              onChange={(e) => onChangeParams('load_shift_pct', Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Delaying water pumps, compute servers, or laundry to after 9:00 PM.
            </p>
          </div>

          {/* Slider 2: Battery Storage */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-white">Use Onsite Battery Power</span>
              <span className="text-emerald-400 font-semibold">{params.battery_kwh} kWh</span>
            </div>
            <input
              type="range"
              min="0"
              max="600"
              step="50"
              value={params.battery_kwh}
              onChange={(e) => onChangeParams('battery_kwh', Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supplying power from local batteries during the afternoon peak window.
            </p>
          </div>

          {/* Slider 3: Thermostat */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-white">Thermostat Eco Adjustment</span>
              <span className="text-emerald-400 font-semibold">
                {params.temp_offset_c > 0 ? `+${params.temp_offset_c}°C warmer` : 'Normal'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2.0"
              step="0.5"
              value={params.temp_offset_c}
              onChange={(e) => onChangeParams('temp_offset_c', Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Raising the AC setpoint slightly during peak afternoon hours.
            </p>
          </div>

        </div>

        {/* Live Result Box (5 columns) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 text-center">
          <div className="text-xs text-slate-400 mb-1">
            {hasAdjustments ? 'Your Estimated Savings' : 'Adjust sliders to preview savings'}
          </div>

          <div className="text-3xl font-bold text-white tracking-tight my-2">
            ${Math.round(costSaved).toLocaleString()}
            <span className="text-xs font-normal text-slate-400 block mt-0.5">
              avoided peak electricity charges
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <div className="p-2 rounded bg-slate-900">
              <span className="text-slate-400 block text-[11px]">Peak Lowered</span>
              <span className="font-semibold text-emerald-400">-{peakReducedKw.toFixed(0)} kW</span>
            </div>
            <div className="p-2 rounded bg-slate-900">
              <span className="text-slate-400 block text-[11px]">CO₂ Prevented</span>
              <span className="font-semibold text-emerald-400">{Math.round(carbonSaved)} kg</span>
            </div>
          </div>

          {hasAdjustments && (
            <p className="text-[11px] text-emerald-400 mt-3 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Blue line on the chart above shows your updated curve</span>
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
