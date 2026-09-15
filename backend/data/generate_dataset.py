import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_energy_dataset(output_path: str = "default_consumption_dataset.csv", days: int = 180):
    np.random.seed(42)
    start_date = datetime(2026, 3, 1, 0, 0, 0)
    total_hours = days * 24
    timestamps = [start_date + timedelta(hours=i) for i in range(total_hours)]
    
    records = []
    
    # Base temperature modeling (March to August transition, spring to summer)
    base_temps = []
    for i, ts in enumerate(timestamps):
        day_of_year = ts.timetuple().tm_yday
        hour = ts.hour
        # Seasonal warming curve
        seasonal_temp = 16.0 + 14.0 * (day_of_year - 60) / 180.0
        # Daily diurnal cycle (coldest at 5 AM, hottest at 15 PM)
        diurnal_temp = 6.0 * np.sin(2 * np.pi * (hour - 9) / 24)
        noise = np.random.normal(0, 1.5)
        base_temps.append(round(seasonal_temp + diurnal_temp + noise, 1))
        
    for profile in ['campus', 'commercial', 'municipal']:
        for i, ts in enumerate(timestamps):
            hour = ts.hour
            day_of_week = ts.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            temp = base_temps[i]
            
            # Cooling load factor: spikes when temp > 22°C
            cooling_factor = max(0.0, temp - 21.0) * 12.5
            
            if profile == 'campus':
                # Campus Microgrid: Base load 350 kW, daytime academic peaks (9am-5pm), labs run 24/7, reduced weekend
                base_load = 320.0
                academic_curve = 280.0 * np.exp(-((hour - 14) ** 2) / 18.0) if not is_weekend else 80.0 * np.exp(-((hour - 14) ** 2) / 24.0)
                evening_study = 140.0 * np.exp(-((hour - 20) ** 2) / 8.0)
                weekend_dampener = 0.65 if is_weekend else 1.0
                noise = np.random.normal(0, 15.0)
                demand = (base_load + academic_curve + evening_study + cooling_factor * 0.8) * weekend_dampener + noise

            elif profile == 'commercial':
                # Commercial Complex: Sharp 8am-6pm weekday spike, low night and weekend baseload
                base_load = 220.0
                office_hours = 550.0 * (1.0 / (1.0 + np.exp(-(hour - 7.5) * 1.5))) * (1.0 / (1.0 + np.exp((hour - 18.5) * 1.5)))
                weekend_dampener = 0.35 if is_weekend else 1.0
                noise = np.random.normal(0, 18.0)
                demand = (base_load + office_hours * weekend_dampener + cooling_factor * 1.2 * weekend_dampener) + noise

            else:  # municipal
                # Municipal Substation: Residential + retail dual peaks (7am-9am morning & 6pm-10pm evening peak)
                base_load = 500.0
                morning_peak = 310.0 * np.exp(-((hour - 8) ** 2) / 6.0)
                evening_peak = 480.0 * np.exp(-((hour - 20) ** 2) / 9.0)
                weekend_shift = 1.15 if is_weekend else 1.0  # More residential use on weekends
                noise = np.random.normal(0, 22.0)
                demand = (base_load + (morning_peak + evening_peak) * weekend_shift + cooling_factor * 1.0) + noise

            # Occasional anomaly spikes (simulating sudden heatwaves or equipment tests)
            if np.random.rand() < 0.005:
                demand *= 1.25

            humidity = max(20.0, min(95.0, 55.0 - (temp - 20) * 1.2 + np.random.normal(0, 5.0)))
            
            records.append({
                'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S'),
                'profile': profile,
                'demand_kw': round(max(50.0, demand), 2),
                'temperature_c': temp,
                'humidity_pct': round(humidity, 1),
                'is_weekend': is_weekend,
                'hour': hour,
                'day_of_week': day_of_week
            })
            
    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records across 3 profiles to {output_path}")

if __name__ == "__main__":
    generate_energy_dataset("C:/Users/rosep/.gemini/antigravity/scratch/energy-demand-predictor/backend/data/default_consumption_dataset.csv")
