import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import timedelta
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from .feature_engineering import FEATURE_COLUMNS, build_training_features, add_temporal_features

class EnergyForecastModel:
    def __init__(self, profile_name: str = "campus"):
        self.profile_name = profile_name
        self.model_mean = HistGradientBoostingRegressor(
            loss='squared_error',
            max_iter=150,
            max_depth=7,
            learning_rate=0.08,
            random_state=42
        )
        self.model_lower = HistGradientBoostingRegressor(
            loss='quantile',
            quantile=0.05,
            max_iter=100,
            max_depth=5,
            learning_rate=0.08,
            random_state=42
        )
        self.model_upper = HistGradientBoostingRegressor(
            loss='quantile',
            quantile=0.95,
            max_iter=100,
            max_depth=5,
            learning_rate=0.08,
            random_state=42
        )
        self.metrics: Dict[str, float] = {}
        self.feature_importances: List[Dict[str, Any]] = []
        self.is_trained = False
        self.history_df: Optional[pd.DataFrame] = None

    def train(self, df: pd.DataFrame, test_hours: int = 168) -> Dict[str, float]:
        """Trains models with train/test split on chronological data."""
        processed = build_training_features(df)
        self.history_df = df.copy().sort_values('timestamp').reset_index(drop=True)
        
        if len(processed) <= test_hours + 50:
            test_hours = max(24, int(len(processed) * 0.15))
            
        train_df = processed.iloc[:-test_hours]
        test_df = processed.iloc[-test_hours:]
        
        X_train = train_df[FEATURE_COLUMNS]
        y_train = train_df['demand_kw']
        
        X_test = test_df[FEATURE_COLUMNS]
        y_test = test_df['demand_kw']
        
        # Fit main and quantile models
        self.model_mean.fit(X_train, y_train)
        self.model_lower.fit(X_train, y_train)
        self.model_upper.fit(X_train, y_train)
        
        # Evaluate on test set
        y_pred = self.model_mean.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(root_mean_squared_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))
        mape = float(np.mean(np.abs((y_test - y_pred) / np.maximum(y_test, 1.0))) * 100)
        
        self.metrics = {
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'r2': round(max(0.0, r2), 3),
            'mape': round(mape, 2),
            'test_sample_count': len(test_df)
        }
        
        # Calculate feature importances using simple variance proxy or feature ablation
        self._calculate_feature_importances(X_test, y_test)
        self.is_trained = True
        return self.metrics

    def _calculate_feature_importances(self, X_test: pd.DataFrame, y_test: pd.Series):
        """Estimate feature importance using permutation error delta."""
        base_mae = mean_absolute_error(y_test, self.model_mean.predict(X_test))
        importances = []
        for col in FEATURE_COLUMNS:
            X_perm = X_test.copy()
            X_perm[col] = np.random.permutation(X_perm[col].values)
            perm_mae = mean_absolute_error(y_test, self.model_mean.predict(X_perm))
            importance = max(0.0, perm_mae - base_mae)
            importances.append({'feature': col, 'score': round(float(importance), 3)})
            
        total = sum(item['score'] for item in importances) or 1.0
        for item in importances:
            item['importance_pct'] = round((item['score'] / total) * 100, 1)
            
        importances.sort(key=lambda x: x['importance_pct'], reverse=True)
        self.feature_importances = importances

    def predict_horizon(self, horizon_hours: int = 24) -> List[Dict[str, Any]]:
        """Multi-step autoregressive roll-forward forecast."""
        if not self.is_trained or self.history_df is None:
            raise ValueError("Model is not trained yet.")
            
        # Working buffer with at least last 200 hours of history
        buffer = self.history_df.tail(240).copy().reset_index(drop=True)
        last_time = pd.to_datetime(buffer['timestamp'].iloc[-1])
        last_temp = buffer['temperature_c'].iloc[-1] if 'temperature_c' in buffer.columns else 24.0
        
        forecast_results = []
        
        for step in range(1, horizon_hours + 1):
            next_time = last_time + timedelta(hours=step)
            hour = next_time.hour
            day_of_week = next_time.weekday()
            
            # Forecasted temperature based on diurnal cycle with mild trend
            diurnal = 5.5 * np.sin(2 * np.pi * (hour - 9) / 24)
            sim_temp = round(22.0 + diurnal + np.random.normal(0, 0.4), 1)
            humidity = round(52.0 - (sim_temp - 20) * 0.9, 1)
            
            # Extract lags from the rolling buffer
            lag_1 = float(buffer['demand_kw'].iloc[-1])
            lag_2 = float(buffer['demand_kw'].iloc[-2]) if len(buffer) >= 2 else lag_1
            lag_24 = float(buffer['demand_kw'].iloc[-24]) if len(buffer) >= 24 else lag_1
            lag_168 = float(buffer['demand_kw'].iloc[-168]) if len(buffer) >= 168 else lag_24
            
            rolling_6 = float(buffer['demand_kw'].tail(6).mean())
            rolling_24 = float(buffer['demand_kw'].tail(24).mean())
            rolling_std_24 = float(buffer['demand_kw'].tail(24).std()) if len(buffer) >= 24 else 10.0
            
            row_dict = {
                'hour_sin': np.sin(2 * np.pi * hour / 24.0),
                'hour_cos': np.cos(2 * np.pi * hour / 24.0),
                'day_sin': np.sin(2 * np.pi * day_of_week / 7.0),
                'day_cos': np.cos(2 * np.pi * day_of_week / 7.0),
                'is_weekend': 1 if day_of_week >= 5 else 0,
                'month_sin': np.sin(2 * np.pi * (next_time.month - 1) / 12.0),
                'month_cos': np.cos(2 * np.pi * (next_time.month - 1) / 12.0),
                'temperature_c': sim_temp,
                'cooling_degree_days': max(0.0, sim_temp - 21.0),
                'humidity_pct': humidity,
                'lag_1': lag_1,
                'lag_2': lag_2,
                'lag_24': lag_24,
                'lag_168': lag_168,
                'rolling_mean_6': rolling_6,
                'rolling_mean_24': rolling_24,
                'rolling_std_24': rolling_std_24
            }
            
            feat_df = pd.DataFrame([row_dict])[FEATURE_COLUMNS]
            
            pred_demand = float(self.model_mean.predict(feat_df)[0])
            lower_bound = float(self.model_lower.predict(feat_df)[0])
            upper_bound = float(self.model_upper.predict(feat_df)[0])
            
            # Post-processing constraints
            pred_demand = max(30.0, pred_demand)
            lower_bound = max(20.0, min(pred_demand * 0.98, lower_bound))
            upper_bound = max(pred_demand * 1.02, upper_bound)
            
            record = {
                'timestamp': next_time.strftime('%Y-%m-%d %H:%M:%S'),
                'predicted_kw': round(float(pred_demand), 2),
                'lower_bound_kw': round(float(lower_bound), 2),
                'upper_bound_kw': round(float(upper_bound), 2),
                'temperature_c': round(float(sim_temp), 1),
                'humidity_pct': round(float(humidity), 1),
                'hour': int(hour),
                'day_of_week': int(day_of_week),
                'is_weekend': int(1 if day_of_week >= 5 else 0)
            }
            forecast_results.append(record)
            
            # Append predicted demand to buffer for subsequent recursive lags
            new_buffer_row = pd.DataFrame([{
                'timestamp': next_time.strftime('%Y-%m-%d %H:%M:%S'),
                'demand_kw': pred_demand,
                'temperature_c': sim_temp,
                'humidity_pct': humidity,
                'is_weekend': 1 if day_of_week >= 5 else 0
            }])
            buffer = pd.concat([buffer, new_buffer_row], ignore_index=True)
            
        return forecast_results
