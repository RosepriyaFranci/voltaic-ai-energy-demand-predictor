import numpy as np
from typing import List, Dict, Any

# Standard Time-Of-Use (TOU) and Carbon Coefficients
RATE_OFF_PEAK = 0.095     # $ / kWh
RATE_MID_PEAK = 0.155     # $ / kWh
RATE_CRITICAL_PEAK = 0.320 # $ / kWh
PEAK_DEMAND_CHARGE = 14.50 # $ / kW for monthly maximum peak

CARBON_OFF_PEAK = 0.280   # kg CO2 / kWh
CARBON_MID_PEAK = 0.410   # kg CO2 / kWh
CARBON_CRITICAL_PEAK = 0.585 # kg CO2 / kWh (Fossil peaker plants dispatched)

class PeakDetector:
    def __init__(self, percentile_threshold: float = 85.0):
        self.percentile_threshold = percentile_threshold

    def analyze(self, forecast_records: List[Dict[str, Any]], historical_demands: List[float] = None) -> Dict[str, Any]:
        if not forecast_records:
            return {}
            
        demands = [r['predicted_kw'] for r in forecast_records]
        
        # Calculate dynamic threshold based on combination of historical and forecast distribution
        all_demands = (historical_demands[-720:] if historical_demands else []) + demands
        if len(all_demands) < 10:
            all_demands = demands
            
        p_threshold = float(np.percentile(all_demands, self.percentile_threshold))
        p_critical = float(np.percentile(all_demands, 93.0))
        p_moderate = float(np.percentile(all_demands, 75.0))
        
        peak_windows = []
        current_window = None
        
        total_cost = 0.0
        total_carbon_kg = 0.0
        
        for idx, rec in enumerate(forecast_records):
            kw = rec['predicted_kw']
            hour = rec.get('hour', 12)
            is_weekend = rec.get('is_weekend', 0)
            
            # Determine stress level
            if kw >= p_critical:
                stress = "CRITICAL"
                rate = RATE_CRITICAL_PEAK
                carbon_rate = CARBON_CRITICAL_PEAK
            elif kw >= p_threshold:
                stress = "WARNING"
                rate = RATE_MID_PEAK * 1.3
                carbon_rate = CARBON_MID_PEAK * 1.2
            elif kw >= p_moderate:
                stress = "MODERATE"
                rate = RATE_MID_PEAK
                carbon_rate = CARBON_MID_PEAK
            else:
                stress = "NORMAL"
                rate = RATE_OFF_PEAK
                carbon_rate = CARBON_OFF_PEAK
                
            cost_this_hour = kw * rate
            carbon_this_hour = kw * carbon_rate
            
            total_cost += cost_this_hour
            total_carbon_kg += carbon_this_hour
            
            rec['stress_level'] = stress
            rec['cost_usd'] = round(cost_this_hour, 2)
            rec['carbon_kg'] = round(carbon_this_hour, 2)
            rec['is_peak'] = bool(kw >= p_threshold)
            
            # Peak window clustering
            if kw >= p_threshold:
                if current_window is None:
                    current_window = {
                        'start_time': rec['timestamp'],
                        'start_index': idx,
                        'end_time': rec['timestamp'],
                        'end_index': idx,
                        'hours_duration': 1,
                        'max_kw': kw,
                        'max_time': rec['timestamp'],
                        'severity': stress,
                        'total_excess_kwh': kw - p_threshold
                    }
                else:
                    current_window['end_time'] = rec['timestamp']
                    current_window['end_index'] = idx
                    current_window['hours_duration'] += 1
                    current_window['total_excess_kwh'] += (kw - p_threshold)
                    if kw > current_window['max_kw']:
                        current_window['max_kw'] = kw
                        current_window['max_time'] = rec['timestamp']
                    if stress == "CRITICAL":
                        current_window['severity'] = "CRITICAL"
            else:
                if current_window is not None:
                    current_window['max_kw'] = round(current_window['max_kw'], 2)
                    current_window['total_excess_kwh'] = round(current_window['total_excess_kwh'], 2)
                    current_window['estimated_surcharge_usd'] = round(current_window['total_excess_kwh'] * 0.18, 2)
                    peak_windows.append(current_window)
                    current_window = None
                    
        if current_window is not None:
            current_window['max_kw'] = round(current_window['max_kw'], 2)
            current_window['total_excess_kwh'] = round(current_window['total_excess_kwh'], 2)
            current_window['estimated_surcharge_usd'] = round(current_window['total_excess_kwh'] * 0.18, 2)
            peak_windows.append(current_window)
            
        max_demand_idx = int(np.argmax(demands))
        max_demand_val = round(float(demands[max_demand_idx]), 2)
        max_demand_time = forecast_records[max_demand_idx]['timestamp']
        
        # Overall current grid status based on first 3 forecasted hours
        near_term_max = max(demands[:min(3, len(demands))])
        if near_term_max >= p_critical:
            overall_status = "CRITICAL_PEAK"
        elif near_term_max >= p_threshold:
            overall_status = "HIGH_DEMAND"
        elif near_term_max >= p_moderate:
            overall_status = "ELEVATED"
        else:
            overall_status = "STABLE_NORMAL"
            
        return {
            'peak_threshold_kw': round(p_threshold, 2),
            'critical_threshold_kw': round(p_critical, 2),
            'highest_peak_kw': max_demand_val,
            'highest_peak_time': max_demand_time,
            'peak_windows_count': len(peak_windows),
            'peak_windows': peak_windows,
            'total_peak_hours': sum(w['hours_duration'] for w in peak_windows),
            'total_projected_cost_usd': round(total_cost, 2),
            'total_projected_carbon_kg': round(total_carbon_kg, 2),
            'overall_status': overall_status,
            'annotated_forecast': forecast_records
        }
