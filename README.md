# ⚡ VoltaicAI – Energy Demand Predictor

VoltaicAI is an AI-powered web application designed to forecast short-term electricity demand and help users understand and manage peak energy consumption.

The system uses historical electricity consumption data to generate energy demand forecasts, identify peak-demand periods, simulate energy-saving actions, and provide recommendations for reducing energy usage and associated costs.

---

## 📌 Project Overview

Energy demand varies throughout the day and can increase significantly during peak hours. Predicting these changes can help organizations plan energy usage, reduce peak demand, and improve energy efficiency.

VoltaicAI addresses this problem through an interactive dashboard that combines:

- Energy demand forecasting
- Peak-demand detection
- Interactive What-If simulation
- Energy-saving recommendations
- Forecast visualization
- Sustainability insights

The application allows users to explore different energy-management strategies and observe their potential impact on electricity demand.

---

## 🎯 Objectives

The main objectives of VoltaicAI are:

- Predict short-term electricity demand using historical data.
- Identify periods of high or peak energy consumption.
- Visualize predicted energy demand through interactive charts.
- Simulate different energy-saving strategies.
- Estimate potential energy, cost, and carbon savings.
- Provide practical recommendations for reducing peak demand.
- Support more sustainable and efficient energy management.

---

## 🚀 Key Features

### 1. Energy Demand Forecasting

The system analyzes historical electricity consumption and generates short-term demand predictions.

The forecast can be viewed through an interactive dashboard, allowing users to understand expected energy consumption over upcoming hours.

### 2. Peak Demand Detection

VoltaicAI identifies periods where electricity demand exceeds a defined threshold.

The dashboard highlights peak-demand periods so that users can focus on reducing consumption when it matters most.

### 3. What-If Energy Simulator

The interactive simulator allows users to test different energy-saving actions.

Users can adjust parameters such as:

- Load shifting
- Battery usage
- Solar PV contribution
- Thermostat adjustments

The simulator displays the estimated effect of these changes on energy demand and potential savings.

### 4. Energy-Saving Recommendations

The system provides recommendations based on predicted demand and peak periods.

Examples include:

- Shifting heavy electricity usage to off-peak hours
- Using battery storage during peak periods
- Adjusting HVAC settings
- Reducing unnecessary electricity consumption

### 5. Interactive Dashboard

The dashboard provides a centralized view of:

- Energy demand forecasts
- Peak demand information
- Simulated demand
- Estimated savings
- Carbon reduction
- Energy-saving recommendations

---

## 🏗️ System Architecture

The project follows a frontend-backend architecture.

```text
             Historical Energy Data
                      │
                      ▼
              ┌───────────────┐
              │ Python Backend│
              │               │
              │ Forecasting   │
              │ Peak Analysis │
              │ Simulation    │
              └───────┬───────┘
                      │
                      │ REST API
                      ▼
              ┌───────────────┐
              │ React Frontend│
              │               │
              │ Dashboard     │
              │ Charts        │
              │ Simulator     │
              │ Recommendations│
              └───────────────┘
