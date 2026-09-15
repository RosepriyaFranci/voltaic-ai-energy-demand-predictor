import os
import pandas as pd
from backend.ml.forecast_model import EnergyForecastModel
from backend.ml.peak_detector import PeakDetector
from backend.ml.recommendation_engine import RecommendationEngine
from backend.ml.scenario_simulator import ScenarioSimulator

def test():
    csv_path = "C:/Users/rosep/.gemini/antigravity/scratch/energy-demand-predictor/backend/data/default_consumption_dataset.csv"
    assert os.path.exists(csv_path), "Dataset does not exist"
    
    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} rows.")
    
    campus_df = df[df['profile'] == 'campus']
    print(f"Campus profile has {len(campus_df)} rows.")
    
    # 1. Test Forecast Model
    model = EnergyForecastModel(profile_name="campus")
    metrics = model.train(campus_df, test_hours=168)
    print(f"Trained model. Metrics: {metrics}")
    assert metrics['r2'] > 0.8, f"R2 is too low: {metrics['r2']}"
    
    # 2. Test Predict Horizon (48 hours)
    preds = model.predict_horizon(horizon_hours=48)
    print(f"Generated {len(preds)} forecast points. First point: {preds[0]}")
    assert len(preds) == 48
    assert preds[0]['predicted_kw'] > 0
    assert preds[0]['upper_bound_kw'] >= preds[0]['predicted_kw']
    assert preds[0]['lower_bound_kw'] <= preds[0]['predicted_kw']
    
    # 3. Test Peak Detector
    detector = PeakDetector(percentile_threshold=85.0)
    analysis = detector.analyze(preds, historical_demands=campus_df['demand_kw'].tolist())
    print(f"Peak Analysis: Threshold={analysis['peak_threshold_kw']} kW, Max Peak={analysis['highest_peak_kw']} kW, Peak Windows={analysis['peak_windows_count']}")
    
    # 4. Test Recommendation Engine
    rec_engine = RecommendationEngine()
    recs = rec_engine.generate_recommendations(analysis, profile_name="campus")
    print(f"Generated {len(recs)} recommendations.")
    assert len(recs) >= 4
    for r in recs:
        print(f" - [{r['priority']}] {r['title']} -> Save ${r['cost_saved_usd']}, {r['co2_saved_kg']} kg CO2")
        
    # 5. Test Scenario Simulator
    sim = ScenarioSimulator()
    sim_result = sim.simulate(
        forecast_records=analysis['annotated_forecast'],
        peak_threshold_kw=analysis['peak_threshold_kw'],
        load_shift_pct=15.0,
        battery_kwh=300.0,
        solar_pv_kw=100.0,
        temp_offset_c=1.5
    )
    print(f"Simulation result: Peak reduced by {sim_result['peak_reduction_kw']} kW ({sim_result['peak_reduction_pct']}%), Saved ${sim_result['cost_saved_usd']}")
    assert sim_result['peak_reduction_kw'] > 0
    print("ALL ML PIPELINE TESTS PASSED!")

if __name__ == "__main__":
    test()
