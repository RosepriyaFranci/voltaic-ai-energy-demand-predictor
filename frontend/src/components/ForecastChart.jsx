import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export default function ForecastChart({
  forecastData,
  recentHistory,
  simulatedData,
  peakThreshold,
  horizon
}) {
  // Format data cleanly for everyday users
  const chartData = useMemo(() => {
    if (!forecastData) return [];

    return forecastData.map((f, idx) => {
      const parts = f.timestamp.split(' ');
      const timePart = parts[1]?.slice(0, 5) || '12:00';
      const [h, m] = timePart.split(':');
      const hourNum = parseInt(h, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const cleanHour = hourNum % 12 || 12;
      const simpleTime = `${cleanHour} ${ampm}`;

      const simMatch = simulatedData ? simulatedData[idx] : null;

      return {
        timestamp: f.timestamp,
        displayTime: simpleTime,
        fullTime: `${parts[0]} at ${cleanHour}:${m} ${ampm}`,
        demand_kw: f.predicted_kw,
        lower_bound_kw: f.lower_bound_kw,
        upper_bound_kw: f.upper_bound_kw,
        simulated_kw: simMatch ? simMatch.simulated_kw : null,
        temperature_c: f.temperature_c,
        is_peak: f.is_peak,
        stress_level: f.stress_level
      };
    });
  }, [forecastData, simulatedData]);

  const hasSimulated = Boolean(simulatedData && simulatedData.length > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0]?.payload;
    if (!item) return null;

    const isPeak = item.demand_kw >= (peakThreshold || 650);

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-lg min-w-[180px]">
        <div className="font-semibold text-white mb-1.5 pb-1 border-b border-slate-800">
          {item.fullTime}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Expected Power:</span>
            <span className="font-semibold text-emerald-400">{item.demand_kw} kW</span>
          </div>

          {item.simulated_kw !== null && item.simulated_kw !== undefined && (
            <div className="flex justify-between text-cyan-300">
              <span>With Savings:</span>
              <span className="font-semibold">{item.simulated_kw} kW</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-400">Rate Window:</span>
            <span className={isPeak ? 'text-amber-400 font-medium' : 'text-slate-300'}>
              {isPeak ? 'Peak Rate' : 'Standard Rate'}
            </span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Outdoor Temp:</span>
            <span>{item.temperature_c}°C</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 mb-6">
      
      {/* Title & Simple Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white">
            Upcoming Electricity Demand
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly predicted power usage. Peaks above the dashed amber line represent the most expensive hours.
          </p>
        </div>

        {/* Clean Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" />
            <span>Expected Usage</span>
          </div>

          {peakThreshold && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400 inline-block" />
              <span>Peak Alert Level ({Math.round(peakThreshold)} kW)</span>
            </div>
          )}

          {hasSimulated && (
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block" />
              <span>With Your Adjustments</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[300px] sm:h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />

            <XAxis
              dataKey="displayTime"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={Math.max(1, Math.floor(chartData.length / 10))}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val} kW`}
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Threshold Line */}
            {peakThreshold && (
              <ReferenceLine
                y={peakThreshold}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}

            {/* Subtle light shaded area under the curve */}
            <Area
              type="monotone"
              dataKey="demand_kw"
              stroke="transparent"
              fill="#10b981"
              fillOpacity={0.08}
            />

            {/* Primary Expected Demand Line */}
            <Line
              type="monotone"
              dataKey="demand_kw"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#34d399' }}
            />

            {/* Simulated Shaved Demand Line */}
            {hasSimulated && (
              <Line
                type="monotone"
                dataKey="simulated_kw"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#38bdf8' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
