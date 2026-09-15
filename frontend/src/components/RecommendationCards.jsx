import React from 'react';
import { 
  Lightbulb, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Leaf 
} from 'lucide-react';

export default function RecommendationCards({ 
  recommendations, 
  onApplyToSimulator 
}) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Friendly plain-language translations for recommendations
  const humanDescriptions = {
    rec_hvac_precool: {
      title: "Pre-Cool Before Peak Hours",
      tip: "Lower AC slightly 2 hours before peak, then raise the thermostat by 1.5°C between 4 PM and 8 PM. The building stays comfortable while cutting expensive cooling load."
    },
    rec_bess_shave: {
      title: "Use Battery Storage During Peak",
      tip: "Discharge onsite battery power during peak hours instead of buying expensive grid power, then recharge overnight when electricity is cheapest."
    },
    rec_load_reschedule: {
      title: "Shift Heavy Equipment to Night",
      tip: "Postpone heavy water pumps, laboratory compute, or laundry cycles until after 9:00 PM when rates return to normal."
    },
    rec_ev_curtail: {
      title: "Schedule EV Charging for Late Evening",
      tip: "Encourage EV owners or fleet vehicles to charge after 9:00 PM, avoiding peak electric rates."
    },
    rec_lighting_curtail: {
      title: "Use Natural Daylight & Dim Lights",
      tip: "Dim decorative hallway and perimeter lights by 30% during peak afternoon hours to take advantage of natural daylight."
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 mb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Ways You Can Save Energy Today
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Practical actions to lower electricity costs and reduce grid strain during peak hours.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.slice(0, 3).map((rec) => {
          const friendly = humanDescriptions[rec.id] || {
            title: rec.title,
            tip: rec.description
          };

          return (
            <div
              key={rec.id}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    rec.cost_saved_usd >= 100 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                      : rec.cost_saved_usd >= 40 
                      ? 'bg-teal-950 text-teal-300 border-teal-700' 
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {rec.cost_saved_usd >= 100 ? 'Top Saver' : rec.cost_saved_usd >= 40 ? 'High Savings' : 'Quick Win'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {rec.kwh_saved} kWh avoided
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1.5">
                  {friendly.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {friendly.tip}
                </p>
              </div>

              {/* Bottom stats and button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    Save ~${Number(rec.cost_saved_usd).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Cuts {rec.co2_saved_kg} kg CO₂
                  </div>
                </div>

                <button
                  onClick={() => onApplyToSimulator(rec)}
                  className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition-colors"
                >
                  <span>Test this</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
