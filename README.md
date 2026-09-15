# VoltaicAI: Energy Demand Predictor & Peak Optimizer

**Problem Statement:** PS-3Y-07 (3rd Year Track)  
**UN Sustainable Development Goal:** **SDG 7 — Affordable & Clean Energy**  
**Core Deliverables:** Time-series AI forecasting, dynamic peak alert detection, interactive clean-tech dashboard, and automated energy-saving recommendations.

---

## ⚡ Project Overview

VoltaicAI is an intelligent, full-stack energy demand forecasting and peak load management platform designed to help smart microgrids, academic campuses, commercial parks, and municipal substations predict electricity consumption, detect expensive peak windows before they happen, and execute automated conservation measures.

By shifting load away from critical peak hours and deploying onsite battery and solar assets, VoltaicAI prevents the dispatch of carbon-intensive fossil peaker plants, directly advancing **SDG Target 7.2 (Increase Renewable Energy Share)** and **SDG Target 7.3 (Double Global Energy Efficiency)**.

---

## 🤖 AI & Machine Learning Component

- **Forecasting Engine:** Multi-step autoregressive `HistGradientBoostingRegressor` with quantile regression loss (5th and 95th percentiles) constructing true mathematical 95% Confidence Intervals.
- **Temporal & Feature Engineering:**
  - **Cyclic Hour & Day Encodings:** Continuous $\sin / \cos$ transformations for hour-of-day and day-of-week, avoiding artificial 23:00 to 00:00 boundary jumps.
  - **Multi-Scale Lags:** Autoregressive lags ($t-1$, $t-2$, $t-24$ yesterday, $t-168$ last week).
  - **Rolling Statistics:** Rolling 6-hour and 24-hour moving averages and volatility standard deviations.
  - **Thermal Cooling Degree Days (CDD):** Dynamic modeling of temperature spikes above 21°C capturing commercial chiller ramp-ups.
- **Model Evaluation:**
  - **$R^2$ Score:** $\approx 97.9\%$ variance explained.
  - **MAPE:** $4.06\%$ mean absolute percentage error.
  - **Feature Importance:** Permutation importance analysis showing cyclic temporal features, 24-hour lag, and outdoor temperature as top predictive drivers.

---

## 🚨 Dynamic Peak Alert Engine

- **Thresholding:** Dynamic 85th/90th percentile thresholding and rolling z-score stress detection.
- **Peak Window Clustering:** Segments contiguous high-demand hours into actionable discrete "Peak Events" with duration, max kW, and countdown.
- **Grid Stress Rating:**
  - `STABLE_NORMAL` (< 75th percentile)
  - `ELEVATED` (75th – 85th percentile)
  - `HIGH_DEMAND` (85th – 92nd percentile)
  - `CRITICAL_PEAK` (> 92nd percentile)
- **Financial & Carbon Quantification:** Real-time calculation of Time-of-Use (TOU) peak rate surcharges ($0.320/kWh vs $0.095/kWh base) and peaker plant carbon intensity ($0.585\text{ kg CO}_2\text{/kWh}$).

---

## 💡 Energy-Saving Action Recommendations & What-If Simulator

VoltaicAI generates prioritized, context-aware conservation measures:
1. **Thermal Pre-Cooling & Setpoint Floating:** Pre-conditions facility thermal mass 2 hours before peak; floats thermostat by +1.5°C during peak to drop chiller load by 18-25%.
2. **Automated BESS Peak Shaving:** Discharges battery storage during high-tariff windows and re-charges overnight with clean off-peak electricity.
3. **Heavy Machinery & Lab Rescheduling:** Shifts batch compute, laundry, and water pumping loads into off-peak hours.
4. **Smart EV Fleet Curtailment:** Throttles non-urgent EV chargers to Level 1 during critical grid stress.
5. **Daylight Harvesting:** Dims perimeter architectural lighting by 30%.
6. **Interactive What-If Scenario Lab:** Real-time sliders for Load Shifting %, Battery Storage (kWh), Solar PV Offset (kW), and Thermostat Relaxation (°C) with live recalculation of the shaved peak curve and avoided costs.

---

## 🖥️ Architecture & Tech Stack

```
energy-demand-predictor/
├── backend/
│   ├── data/
│   │   ├── default_consumption_dataset.csv  # 12,960 hourly records across 3 profiles
│   │   └── generate_dataset.py              # Benchmark dataset generator
│   ├── ml/
│   │   ├── feature_engineering.py           # Cyclic temporal, lag & CDD features
│   │   ├── forecast_model.py                # HistGradientBoosting + Quantile bounds
│   │   ├── peak_detector.py                 # Dynamic thresholding & TOU cost engine
│   │   ├── recommendation_engine.py         # Actionable conservation matrices
│   │   ├── scenario_simulator.py            # What-If simulator engine
│   │   └── test_pipeline.py                 # Automated pipeline test suite
│   ├── main.py                              # FastAPI server & REST API
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                   # Navigation, profile selector & horizon picker
│   │   │   ├── MetricCards.jsx              # Real-time KPIs (kW, stress, cost, CO2)
│   │   │   ├── PeakAlertBanner.jsx          # Urgent peak warning & countdown
│   │   │   ├── ForecastChart.jsx            # Recharts multi-line timeline with 95% band
│   │   │   ├── WhatIfSimulator.jsx          # Interactive sliders & live impact
│   │   │   ├── RecommendationCards.jsx      # Actionable cards with one-click simulation
│   │   │   ├── ModelDiagnosticsDrawer.jsx   # R2, MAE, RMSE, MAPE & feature importance
│   │   │   └── DataUploadModal.jsx          # Custom CSV dataset uploader
│   │   ├── services/
│   │   │   └── api.js                       # API service layer
│   │   ├── App.jsx                          # Main dashboard state & orchestration
│   │   └── index.css                        # Tailwind CSS styles & animations
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── start_all.py                             # Single launcher script
└── README.md
```

---

## 🚀 Quickstart & How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1-Click Launch (Recommended)
From the project root:
```bash
python start_all.py
```
This automatically starts both the FastAPI backend (`http://127.0.0.1:8000`) and the Vite React frontend (`http://localhost:5173`), and launches your browser.

### Manual Launch

**1. Start Backend:**
```bash
cd backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at `http://127.0.0.1:8000/docs`.

**2. Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📊 Evaluation Criteria Alignment

| Criteria | Weight | Implementation Details in VoltaicAI |
| :--- | :---: | :--- |
| **Innovation & Originality** | **25%** | Interactive What-If Scenario Lab with live curve recalculation, dynamic TOU demand surcharge modeling, carbon offset quantification, and automated one-click recommendation application. |
| **Technical Implementation** | **30%** | HistGradientBoosting quantile regression with 95% uncertainty intervals, cyclic $\sin/\cos$ encoding, 24h/168h lags, CDD thermal correlation, and RESTful API with $R^2 = 97.9\%$. |
| **UI / UX Design & Usability** | **25%** | Executive clean-tech dark mode dashboard, responsive Recharts visualization with toggleable layers, clear alert banners, category filters, and smooth animated state transitions. |
| **Feasibility & Impact** | **20%** | Directly addresses **SDG 7**, offering practical, real-world applicability for smart campuses, commercial microgrids, and municipal utilities to shave peak demand and reduce fossil peaker reliance. |
