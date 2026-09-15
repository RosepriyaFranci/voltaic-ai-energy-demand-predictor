import numpy as np
import pandas as pd
from typing import Tuple, List

FEATURE_COLUMNS = [
    'hour_sin', 'hour_cos',
    'day_sin', 'day_cos',
    'is_weekend',
    'month_sin', 'month_cos',
    'temperature_c', 'cooling_degree_days',
    'humidity_pct',
    'lag_1', 'lag_2', 'lag_24', 'lag_168',
    'rolling_mean_6', 'rolling_mean_24', 'rolling_std_24'
]

def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
    hour = df['timestamp'].dt.hour
    day = df['timestamp'].dt.dayofweek
    month = df['timestamp'].dt.month
    
    df['hour_sin'] = np.sin(2 * np.pi * hour / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * hour / 24.0)
    df['day_sin'] = np.sin(2 * np.pi * day / 7.0)
    df['day_cos'] = np.cos(2 * np.pi * day / 7.0)
    df['month_sin'] = np.sin(2 * np.pi * (month - 1) / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * (month - 1) / 12.0)
    df['is_weekend'] = (day >= 5).astype(int)
    
    if 'temperature_c' in df.columns:
        df['cooling_degree_days'] = np.maximum(0.0, df['temperature_c'] - 21.0)
    else:
        df['temperature_c'] = 22.0
        df['cooling_degree_days'] = 1.0
        
    if 'humidity_pct' not in df.columns:
        df['humidity_pct'] = 50.0
        
    return df

def build_training_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build full features including lags and rolling windows for model training."""
    df = add_temporal_features(df)
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Lag features
    df['lag_1'] = df['demand_kw'].shift(1)
    df['lag_2'] = df['demand_kw'].shift(2)
    df['lag_24'] = df['demand_kw'].shift(24)
    df['lag_168'] = df['demand_kw'].shift(168)
    
    # Rolling statistics
    df['rolling_mean_6'] = df['demand_kw'].shift(1).rolling(window=6, min_periods=1).mean()
    df['rolling_mean_24'] = df['demand_kw'].shift(1).rolling(window=24, min_periods=1).mean()
    df['rolling_std_24'] = df['demand_kw'].shift(1).rolling(window=24, min_periods=1).std().fillna(0)
    
    # Drop rows with NaN from lags (at least 168 rows)
    clean_df = df.dropna(subset=FEATURE_COLUMNS + ['demand_kw']).reset_index(drop=True)
    return clean_df
