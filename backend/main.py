import os
import io
import pandas as pd
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.ml.forecast_model import EnergyForecastModel
from backend.ml.peak_detector import PeakDetector
from backend.ml.recommendation_engine import RecommendationEngine
from backend.ml.scenario_simulator import ScenarioSimulator

app = FastAPI(
    title="Energy Demand Predictor API",
    description="Short-Term Time-Series Energy Forecasting, Peak Alert Engine, and Conservation Recommendation API (SDG 7)",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "default_consumption_dataset.csv")

# Global Cache for trained models and DataFrames
MODELS: Dict[str, EnergyForecastModel] = {}
DATASETS: Dict[str, pd.DataFrame] = {}

def get_profile_data(profile: str) -> pd.DataFrame:
    if profile in DATASETS:
        return DATASETS[profile]
        
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=500, detail="Default dataset file not found. Please generate it first.")
        
    full_df = pd.read_csv(DATA_PATH)
    profile_df = full_df[full_df['profile'] == profile].copy()
    if profile_df.empty:
        raise HTTPException(status_code=404, detail=f"Profile '{profile}' not found in dataset.")
        
    DATASETS[profile] = profile_df
    return profile_df

def get_or_train_model(profile: str) -> EnergyForecastModel:
    if profile in MODELS and MODELS[profile].is_trained:
        return MODELS[profile]
        
    df = get_profile_data(profile)
    model = EnergyForecastModel(profile_name=profile)
    model.train(df, test_hours=168)
    MODELS[profile] = model
    return model

# Pydantic Request Models
class ForecastRequest(BaseModel):
    profile: str = Field(default="campus", description="Profile name: campus, commercial, municipal, or custom")
    horizon_hours: int = Field(default=24, ge=12, le=168, description="Prediction horizon in hours (12 to 168)")
    percentile_threshold: float = Field(default=85.0, ge=60.0, le=98.0, description="Dynamic peak percentile threshold")

class SimulateRequest(BaseModel):
    profile: str = "campus"
    horizon_hours: int = 24
    peak_threshold_kw: float
    load_shift_pct: float = Field(default=0.0, ge=0.0, le=50.0)
    battery_kwh: float = Field(default=0.0, ge=0.0, le=2000.0)
    solar_pv_kw: float = Field(default=0.0, ge=0.0, le=1000.0)
    temp_offset_c: float = Field(default=0.0, ge=-3.0, le=4.0)
    forecast_records: Optional[List[Dict[str, Any]]] = None

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PS-3Y-07 Energy Demand Predictor",
        "sdg": "SDG 7 — Affordable & Clean Energy",
        "cached_models": list(MODELS.keys())
    }

@app.get("/api/profiles")
def list_profiles():
    return {
        "profiles": [
            {
                "id": "campus",
                "name": "Smart Campus Microgrid",
                "category": "University & Labs",
                "description": "Diurnal academic activity, constant lab computing loads, daytime HVAC peaks, low weekend base.",
                "typical_peak_kw": 680
            },
            {
                "id": "commercial",
                "name": "Commercial Tech Park",
                "category": "Office Towers & Data",
                "description": "Sharp 08:00–18:00 corporate ramp, high chiller cooling dependency, drastic weekend curtailment.",
                "typical_peak_kw": 820
            },
            {
                "id": "municipal",
                "name": "Municipal Substation",
                "category": "Grid Distribution",
                "description": "Dual morning (07:00-09:00) and evening (18:00-22:00) residential and retail aggregate demand curves.",
                "typical_peak_kw": 1150
            }
        ]
    }

@app.get("/api/historical")
def get_historical(profile: str = "campus", limit_hours: int = 168):
    df = get_profile_data(profile)
    recent = df.tail(limit_hours).copy()
    
    records = []
    for _, row in recent.iterrows():
        records.append({
            'timestamp': str(row['timestamp']),
            'demand_kw': round(float(row['demand_kw']), 2),
            'temperature_c': round(float(row.get('temperature_c', 22.0)), 1),
            'humidity_pct': round(float(row.get('humidity_pct', 50.0)), 1),
            'is_weekend': int(row.get('is_weekend', 0))
        })
        
    demands = [r['demand_kw'] for r in records]
    stats = {
        'count': len(records),
        'min_kw': round(float(min(demands)), 2) if demands else 0,
        'max_kw': round(float(max(demands)), 2) if demands else 0,
        'mean_kw': round(float(sum(demands)/len(demands)), 2) if demands else 0,
        'total_energy_mwh': round(float(sum(demands))/1000.0, 2) if demands else 0
    }
    
    return {
        'profile': profile,
        'limit_hours': limit_hours,
        'stats': stats,
        'data': records
    }

@app.post("/api/forecast")
def generate_forecast(req: ForecastRequest):
    model = get_or_train_model(req.profile)
    df = get_profile_data(req.profile)
    
    # Run time-series prediction
    forecast_points = model.predict_horizon(horizon_hours=req.horizon_hours)
    
    # Peak detection & impact quantification
    detector = PeakDetector(percentile_threshold=req.percentile_threshold)
    peak_analysis = detector.analyze(
        forecast_records=forecast_points,
        historical_demands=df['demand_kw'].tolist()
    )
    
    # Recommendation engine
    rec_engine = RecommendationEngine()
    recommendations = rec_engine.generate_recommendations(
        peak_analysis=peak_analysis,
        profile_name=req.profile
    )
    
    # Recent 48h historical context for chart transition
    recent_history = df.tail(48).copy()
    history_records = [
        {
            'timestamp': str(r['timestamp']),
            'demand_kw': round(float(r['demand_kw']), 2),
            'is_actual': True
        }
        for _, r in recent_history.iterrows()
    ]
    
    return {
        'profile': req.profile,
        'horizon_hours': req.horizon_hours,
        'model_metrics': model.metrics,
        'feature_importances': model.feature_importances[:8],
        'peak_analysis': peak_analysis,
        'recommendations': recommendations,
        'recent_history': history_records
    }

@app.post("/api/simulate")
def run_simulation(req: SimulateRequest):
    records = req.forecast_records
    if not records:
        # Generate on the fly if not provided
        model = get_or_train_model(req.profile)
        df = get_profile_data(req.profile)
        forecast_points = model.predict_horizon(horizon_hours=req.horizon_hours)
        detector = PeakDetector(percentile_threshold=85.0)
        peak_analysis = detector.analyze(forecast_points, df['demand_kw'].tolist())
        records = peak_analysis['annotated_forecast']
        peak_threshold = peak_analysis['peak_threshold_kw']
    else:
        peak_threshold = req.peak_threshold_kw
        
    simulator = ScenarioSimulator()
    sim_result = simulator.simulate(
        forecast_records=records,
        peak_threshold_kw=peak_threshold,
        load_shift_pct=req.load_shift_pct,
        battery_kwh=req.battery_kwh,
        solar_pv_kw=req.solar_pv_kw,
        temp_offset_c=req.temp_offset_c
    )
    
    return {
        'profile': req.profile,
        'simulation_params': {
            'load_shift_pct': req.load_shift_pct,
            'battery_kwh': req.battery_kwh,
            'solar_pv_kw': req.solar_pv_kw,
            'temp_offset_c': req.temp_offset_c
        },
        'results': sim_result
    }

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
        
    # Validate required columns
    required = ['timestamp', 'demand_kw']
    for col in required:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"CSV missing mandatory column: '{col}'. Required: timestamp, demand_kw")
            
    if len(df) < 168:
        raise HTTPException(status_code=400, detail=f"CSV must contain at least 168 hours (7 days) of data. Found {len(df)} rows.")
        
    custom_profile_name = "custom_upload"
    df['profile'] = custom_profile_name
    DATASETS[custom_profile_name] = df
    
    # Train custom model
    try:
        model = EnergyForecastModel(profile_name=custom_profile_name)
        metrics = model.train(df, test_hours=min(72, int(len(df) * 0.15)))
        MODELS[custom_profile_name] = model
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to train model on uploaded CSV: {str(e)}")
        
    return {
        'status': 'success',
        'profile': custom_profile_name,
        'rows_ingested': len(df),
        'metrics': metrics,
        'columns': list(df.columns)
    }

@app.get("/api/export")
def export_audit_summary(profile: str = "campus", horizon_hours: int = 24):
    model = get_or_train_model(profile)
    df = get_profile_data(profile)
    forecast_points = model.predict_horizon(horizon_hours=horizon_hours)
    detector = PeakDetector(percentile_threshold=85.0)
    peak_analysis = detector.analyze(forecast_points, df['demand_kw'].tolist())
    rec_engine = RecommendationEngine()
    recommendations = rec_engine.generate_recommendations(peak_analysis, profile)
    
    return {
        'title': f"Energy Demand Forecast & Conservation Audit — {profile.upper()}",
        'sdg_alignment': "SDG 7 — Affordable & Clean Energy",
        'generated_at': pd.Timestamp.now().isoformat(),
        'horizon_hours': horizon_hours,
        'metrics': model.metrics,
        'peak_analysis': {
            'peak_threshold_kw': peak_analysis['peak_threshold_kw'],
            'highest_peak_kw': peak_analysis['highest_peak_kw'],
            'highest_peak_time': peak_analysis['highest_peak_time'],
            'total_peak_hours': peak_analysis['total_peak_hours'],
            'total_projected_cost_usd': peak_analysis['total_projected_cost_usd'],
            'total_projected_carbon_kg': peak_analysis['total_projected_carbon_kg'],
            'overall_status': peak_analysis['overall_status'],
            'peak_windows': peak_analysis['peak_windows']
        },
        'recommendations': recommendations
    }
