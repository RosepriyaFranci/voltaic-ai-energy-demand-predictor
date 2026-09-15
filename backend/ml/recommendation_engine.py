from typing import List, Dict, Any

class RecommendationEngine:
    def generate_recommendations(self, peak_analysis: Dict[str, Any], profile_name: str = "campus") -> List[Dict[str, Any]]:
        peak_windows = peak_analysis.get('peak_windows', [])
        highest_peak_kw = peak_analysis.get('highest_peak_kw', 500.0)
        peak_threshold = peak_analysis.get('peak_threshold_kw', 400.0)
        excess_peak_kw = max(20.0, highest_peak_kw - peak_threshold)
        
        recs = []
        
        # Determine primary peak window timing
        if peak_windows:
            primary_window = max(peak_windows, key=lambda w: w['max_kw'])
            start_time_str = primary_window['start_time'].split(' ')[-1][:5]
            end_time_str = primary_window['end_time'].split(' ')[-1][:5]
            window_label = f"{start_time_str} - {end_time_str}"
            duration = primary_window['hours_duration']
        else:
            window_label = "16:00 - 20:00"
            duration = 4
            
        # Recommendation 1: HVAC Thermal Pre-cooling & Setpoint Adjustment
        hvac_kwh_saved = round(excess_peak_kw * 0.45 * duration, 1)
        hvac_usd_saved = round(hvac_kwh_saved * 0.22 + excess_peak_kw * 0.4 * 6.5, 2)
        hvac_co2_saved = round(hvac_kwh_saved * 0.52, 1)
        
        recs.append({
            'id': 'rec_hvac_precool',
            'action_code': 'hvac_precool',
            'title': 'Thermal Pre-Cooling & Peak Setpoint Floating',
            'category': 'HVAC & Climate Control',
            'priority': 'CRITICAL' if excess_peak_kw > 100 else 'HIGH',
            'time_window': f"Pre-cool: 2h prior | Float setpoint (+2°C) during {window_label}",
            'description': f"Pre-condition facility thermal mass 2 hours before the expected peak at {window_label}. During peak hours, float thermostat setpoint by +1.5°C to shed chiller compressor cycling without compromising occupant comfort.",
            'kwh_saved': hvac_kwh_saved,
            'cost_saved_usd': hvac_usd_saved,
            'co2_saved_kg': hvac_co2_saved,
            'difficulty': 'Automated via Smart BMS',
            'sdg_impact': 'Directly curtails fossil-peaker plant generation during extreme thermal stress.',
            'recommended_params': {
                'load_shift_pct': 18,
                'temp_offset': 1.5
            }
        })
        
        # Recommendation 2: Battery Energy Storage System (BESS) Peak Shaving
        bess_discharge_kw = round(min(excess_peak_kw * 0.7, 250.0), 1)
        bess_kwh = round(bess_discharge_kw * duration, 1)
        bess_usd = round(bess_kwh * (0.320 - 0.095) + bess_discharge_kw * 8.0, 2)
        bess_co2 = round(bess_kwh * (0.585 - 0.280), 1)
        
        recs.append({
            'id': 'rec_bess_shave',
            'action_code': 'bess_dispatch',
            'title': 'Automated BESS Peak Shaving & Arbitrage Dispatch',
            'category': 'Energy Storage & Microgrid',
            'priority': 'HIGH',
            'time_window': f"Discharge: {window_label} | Recharge: 01:00 - 05:00",
            'description': f"Program onsite battery storage to discharge at {bess_discharge_kw} kW continuously across the {window_label} critical window. Re-charge overnight using low-cost clean base power.",
            'kwh_saved': bess_kwh,
            'cost_saved_usd': bess_usd,
            'co2_saved_kg': bess_co2,
            'difficulty': 'Fully Automated Microgrid Inverter',
            'sdg_impact': 'Improves renewable utilization efficiency and local grid resilience.',
            'recommended_params': {
                'battery_kwh': min(500, int(bess_kwh * 1.2))
            }
        })
        
        # Recommendation 3: Industrial / Lab / Campus Load Rescheduling
        if profile_name in ['campus', 'commercial']:
            equip_type = "high-performance computing clusters and water treatment pumps" if profile_name == 'campus' else "server maintenance cycles, escalators, and water booster pumps"
        else:
            equip_type = "municipal wastewater aeration and municipal pumping stations"
            
        shift_kwh = round(excess_peak_kw * 0.35 * duration, 1)
        # Shifted kWh rate differential ($0.32 - $0.095 = $0.225) + peak capacity demand charge reduction
        shift_usd = round(shift_kwh * 0.225 + (excess_peak_kw * 0.35) * 5.5, 2)
        shift_co2 = round(shift_kwh * 0.44, 1)
        
        recs.append({
            'id': 'rec_load_reschedule',
            'action_code': 'load_shift',
            'title': 'Non-Critical Heavy Equipment Rescheduling',
            'category': 'Industrial & Operational',
            'priority': 'HIGH',
            'time_window': f"Hold during {window_label} | Reschedule to 22:00 - 06:00",
            'description': f"Shift {equip_type} out of the {window_label} timeframe into the super off-peak nighttime window.",
            'kwh_saved': shift_kwh,
            'cost_saved_usd': shift_usd,
            'co2_saved_kg': shift_co2,
            'difficulty': 'Semi-Automated Schedule Policy',
            'sdg_impact': 'Reduces expensive transmission peak capacity constraints.',
            'recommended_params': {
                'load_shift_pct': 14
            }
        })
        
        # Recommendation 4: EV Fleet Charging Smart Throttling
        ev_kwh = round(excess_peak_kw * 0.18 * duration, 1)
        ev_usd = round(ev_kwh * 0.19, 2)
        ev_co2 = round(ev_kwh * 0.48, 1)
        
        recs.append({
            'id': 'rec_ev_curtail',
            'action_code': 'ev_throttle',
            'title': 'Dynamic EV Smart Charging Curtailment',
            'category': 'E-Mobility & Fleet',
            'priority': 'MEDIUM',
            'time_window': f"Throttle chargers to Level 1 during {window_label}",
            'description': f"Signal connected Level 2 EV charging stations to throttle charging speeds by 60% during {window_label}, offering drivers off-peak charging credits.",
            'kwh_saved': ev_kwh,
            'cost_saved_usd': ev_usd,
            'co2_saved_kg': ev_co2,
            'difficulty': 'OCPP Smart EVSE Protocol',
            'sdg_impact': 'Prevents uncoordinated localized grid transformer overloading.',
            'recommended_params': {
                'load_shift_pct': 8
            }
        })
        
        # Recommendation 5: Smart Daylight Harvesting & Architectural Lighting Setback
        light_kwh = round(excess_peak_kw * 0.12 * duration, 1)
        light_usd = round(light_kwh * 0.20, 2)
        light_co2 = round(light_kwh * 0.50, 1)
        
        recs.append({
            'id': 'rec_lighting_curtail',
            'action_code': 'lighting_dim',
            'title': 'Daylight Harvesting & Lighting Setback',
            'category': 'Smart Lighting & Building Controls',
            'priority': 'MEDIUM',
            'time_window': f"Activate 30% dimming during {window_label}",
            'description': "Dim perimeter perimeter luminaires to utilize natural daylight and decrease non-essential architectural accent illumination.",
            'kwh_saved': light_kwh,
            'cost_saved_usd': light_usd,
            'co2_saved_kg': light_co2,
            'difficulty': 'DALI / Zigbee Lighting Controls',
            'sdg_impact': 'Immediate low-friction demand reduction.',
            'recommended_params': {
                'load_shift_pct': 5
            }
        })
        
        return recs
