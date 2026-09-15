import numpy as np
from typing import List, Dict, Any

class ScenarioSimulator:
    def simulate(
        self,
        forecast_records: List[Dict[str, Any]],
        peak_threshold_kw: float,
        load_shift_pct: float = 0.0,       # 0 - 30%
        battery_kwh: float = 0.0,          # 0 - 1000 kWh
        solar_pv_kw: float = 0.0,          # 0 - 500 kW
        temp_offset_c: float = 0.0         # -2.0 to +3.0 °C (positive = warmer thermostat, less AC)
    ) -> Dict[str, Any]:
        if not forecast_records:
            return {}
            
        simulated_records = []
        
        total_orig_cost = 0.0
        total_new_cost = 0.0
        total_orig_carbon = 0.0
        total_new_carbon = 0.0
        
        orig_peaks = [r['predicted_kw'] for r in forecast_records]
        orig_max_kw = max(orig_peaks)
        
        # Track available battery energy across forecast window
        battery_remaining = float(battery_kwh)
        battery_max_discharge_rate = battery_kwh / 3.5 if battery_kwh > 0 else 0.0
        
        # Accumulated shifted energy to redistribute into off-peak valley
        shifted_energy_kwh = 0.0
        
        # First pass: calculate peak reductions and harvest shifted load
        intermediate_demands = []
        for r in forecast_records:
            orig_kw = r['predicted_kw']
            hour = r.get('hour', 12)
            is_peak = r.get('is_peak', False)
            
            sim_kw = orig_kw
            
            # 1. Temperature Setpoint Effect: ~5.5% change in HVAC demand per °C
            if temp_offset_c != 0:
                hvac_portion = max(0.0, orig_kw - 180.0) * 0.55
                temp_factor = 1.0 - (temp_offset_c * 0.055)
                sim_kw -= hvac_portion * (1.0 - temp_factor)
                
            # 2. Solar PV generation profile (bell curve centered at 13:00)
            if solar_pv_kw > 0 and 6 <= hour <= 19:
                solar_intensity = max(0.0, np.sin(np.pi * (hour - 6) / 13.0)) ** 1.5
                solar_output = solar_pv_kw * solar_intensity
                sim_kw -= solar_output
                
            # 3. Peak Load Shifting (if in peak window)
            if is_peak and load_shift_pct > 0:
                excess = max(0.0, orig_kw - peak_threshold_kw * 0.85)
                curtailed = excess * (load_shift_pct / 100.0)
                sim_kw -= curtailed
                shifted_energy_kwh += curtailed
                
            # 4. Battery Storage Discharge during high peak
            if sim_kw > peak_threshold_kw and battery_remaining > 0:
                needed = sim_kw - peak_threshold_kw
                discharge = min(needed, battery_max_discharge_rate, battery_remaining)
                sim_kw -= discharge
                battery_remaining -= discharge
                
            sim_kw = max(25.0, sim_kw)
            intermediate_demands.append(sim_kw)
            
        # Re-distribute shifted load into off-peak night hours (00:00 - 05:00)
        off_peak_indices = [i for i, r in enumerate(forecast_records) if r.get('hour', 12) <= 5 or r.get('hour', 12) >= 23]
        if off_peak_indices and shifted_energy_kwh > 0:
            add_per_hour = (shifted_energy_kwh * 1.05) / len(off_peak_indices) # 5% roundtrip efficiency penalty
            for idx in off_peak_indices:
                intermediate_demands[idx] += add_per_hour
                
        # Second pass: Compute costs and metrics
        for idx, r in enumerate(forecast_records):
            orig_kw = r['predicted_kw']
            sim_kw = round(float(intermediate_demands[idx]), 2)
            
            # Rate determination for original vs simulated
            orig_rate = 0.320 if orig_kw >= peak_threshold_kw else (0.155 if orig_kw >= peak_threshold_kw * 0.85 else 0.095)
            orig_carb = 0.585 if orig_kw >= peak_threshold_kw else (0.410 if orig_kw >= peak_threshold_kw * 0.85 else 0.280)
            
            new_rate = 0.320 if sim_kw >= peak_threshold_kw else (0.155 if sim_kw >= peak_threshold_kw * 0.85 else 0.095)
            new_carb = 0.585 if sim_kw >= peak_threshold_kw else (0.410 if sim_kw >= peak_threshold_kw * 0.85 else 0.280)
            
            total_orig_cost += orig_kw * orig_rate
            total_new_cost += sim_kw * new_rate
            
            total_orig_carbon += orig_kw * orig_carb
            total_new_carbon += sim_kw * new_carb
            
            sim_rec = dict(r)
            sim_rec['simulated_kw'] = sim_kw
            sim_rec['kw_reduction'] = round(orig_kw - sim_kw, 2)
            sim_rec['is_shaved_peak'] = bool(orig_kw >= peak_threshold_kw and sim_kw < peak_threshold_kw)
            simulated_records.append(sim_rec)
            
        new_max_kw = max(r['simulated_kw'] for r in simulated_records)
        peak_reduction_kw = max(0.0, orig_max_kw - new_max_kw)
        peak_reduction_pct = (peak_reduction_kw / orig_max_kw * 100.0) if orig_max_kw > 0 else 0.0
        
        cost_saved = max(0.0, total_orig_cost - total_new_cost)
        carbon_saved = max(0.0, total_orig_carbon - total_new_carbon)
        
        return {
            'original_peak_kw': round(orig_max_kw, 2),
            'simulated_peak_kw': round(new_max_kw, 2),
            'peak_reduction_kw': round(peak_reduction_kw, 2),
            'peak_reduction_pct': round(peak_reduction_pct, 1),
            'cost_saved_usd': round(cost_saved, 2),
            'carbon_saved_kg': round(carbon_saved, 1),
            'total_simulated_cost_usd': round(total_new_cost, 2),
            'total_simulated_carbon_kg': round(total_new_carbon, 2),
            'simulated_records': simulated_records
        }
