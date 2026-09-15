import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import PeakAlertBanner from './components/PeakAlertBanner';
import ForecastChart from './components/ForecastChart';
import WhatIfSimulator from './components/WhatIfSimulator';
import RecommendationCards from './components/RecommendationCards';
import ModelDiagnosticsDrawer from './components/ModelDiagnosticsDrawer';
import DataUploadModal from './components/DataUploadModal';
import { 
  fetchProfiles, 
  fetchForecast, 
  simulateScenario, 
  exportReport 
} from './services/api';
import { 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Leaf, 
  HeartHandshake 
} from 'lucide-react';

export default function App() {
  const [profiles, setProfiles] = useState([
    { id: 'campus', name: 'Smart Campus Microgrid' },
    { id: 'commercial', name: 'Commercial Tech Park' },
    { id: 'municipal', name: 'Municipal Substation' }
  ]);
  const [selectedProfile, setSelectedProfile] = useState('campus');
  const [horizon, setHorizon] = useState(24);
  const [percentileThreshold, setPercentileThreshold] = useState(85.0);

  // Core Data States
  const [forecastData, setForecastData] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [peakAnalysis, setPeakAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [featureImportances, setFeatureImportances] = useState([]);

  // Simulation States
  const [simulatorParams, setSimulatorParams] = useState({
    load_shift_pct: 0,
    battery_kwh: 0,
    solar_pv_kw: 0,
    temp_offset_c: 0
  });
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // UI / Modal States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Load profiles on mount
  useEffect(() => {
    async function initProfiles() {
      try {
        const data = await fetchProfiles();
        if (data && data.profiles) {
          setProfiles(data.profiles);
        }
      } catch (err) {
        console.warn("Could not fetch remote profiles, using default profiles:", err);
      }
    }
    initProfiles();
  }, []);

  // Fetch forecast when profile or horizon changes
  const loadForecast = useCallback(async (profileToLoad, horizonHours) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchForecast(profileToLoad, horizonHours, percentileThreshold);
      setForecastData(res.peak_analysis?.annotated_forecast || []);
      setRecentHistory(res.recent_history || []);
      setPeakAnalysis(res.peak_analysis || null);
      setRecommendations(res.recommendations || []);
      setModelMetrics(res.model_metrics || null);
      setFeatureImportances(res.feature_importances || []);

      // Reset simulator parameters to 0 on new forecast load
      const defaultSim = {
        load_shift_pct: 0,
        battery_kwh: 0,
        solar_pv_kw: 0,
        temp_offset_c: 0
      };
      setSimulatorParams(defaultSim);
      setSimulationResult(null);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch energy demand forecast');
    } finally {
      setIsLoading(false);
    }
  }, [percentileThreshold]);

  useEffect(() => {
    loadForecast(selectedProfile, horizon);
  }, [selectedProfile, horizon, loadForecast]);

  // Execute simulation when params change
  const runSimulation = useCallback(async (params) => {
    if (!peakAnalysis || !forecastData || forecastData.length === 0) return;

    // If all zero, clear simulation result
    if (
      params.load_shift_pct === 0 &&
      params.battery_kwh === 0 &&
      params.solar_pv_kw === 0 &&
      params.temp_offset_c === 0
    ) {
      setSimulationResult(null);
      return;
    }

    setIsSimulating(true);
    try {
      const payload = {
        profile: selectedProfile,
        horizon_hours: horizon,
        peak_threshold_kw: peakAnalysis.peak_threshold_kw,
        load_shift_pct: params.load_shift_pct,
        battery_kwh: params.battery_kwh,
        solar_pv_kw: params.solar_pv_kw,
        temp_offset_c: params.temp_offset_c,
        forecast_records: forecastData
      };
      const res = await simulateScenario(payload);
      setSimulationResult(res.results);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  }, [peakAnalysis, forecastData, selectedProfile, horizon]);

  const handleParamChange = (key, value) => {
    const updated = { ...simulatorParams, [key]: value };
    setSimulatorParams(updated);
    runSimulation(updated);
  };

  const handleResetSimulator = () => {
    const reset = {
      load_shift_pct: 0,
      battery_kwh: 0,
      solar_pv_kw: 0,
      temp_offset_c: 0
    };
    setSimulatorParams(reset);
    setSimulationResult(null);
  };

  const handleApplyPreset = (preset) => {
    let presetParams = { ...simulatorParams };
    if (preset === 'battery_shave') {
      presetParams = { load_shift_pct: 5, battery_kwh: 400, solar_pv_kw: 50, temp_offset_c: 0 };
    } else if (preset === 'load_shift') {
      presetParams = { load_shift_pct: 20, battery_kwh: 100, solar_pv_kw: 0, temp_offset_c: 1.0 };
    } else if (preset === 'solar_max') {
      presetParams = { load_shift_pct: 12, battery_kwh: 350, solar_pv_kw: 250, temp_offset_c: 1.5 };
    }
    setSimulatorParams(presetParams);
    runSimulation(presetParams);
  };

  const handleApplyRecommendationToSimulator = (rec) => {
    const p = rec.recommended_params || {};
    const updated = {
      load_shift_pct: p.load_shift_pct ?? simulatorParams.load_shift_pct,
      battery_kwh: p.battery_kwh ?? simulatorParams.battery_kwh,
      solar_pv_kw: simulatorParams.solar_pv_kw,
      temp_offset_c: p.temp_offset ?? simulatorParams.temp_offset_c
    };
    setSimulatorParams(updated);
    runSimulation(updated);

    // Smooth scroll to simulator
    const el = document.getElementById('what-if-simulator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportReport(selectedProfile, horizon);
      const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonStr);
      downloadAnchor.setAttribute("download", `energy_forecast_audit_${selectedProfile}_${horizon}h.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Failed to export report: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Header */}
      <Header
        profiles={profiles}
        selectedProfile={selectedProfile}
        onSelectProfile={setSelectedProfile}
        horizon={horizon}
        onSelectHorizon={setHorizon}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onExportReport={handleExport}
        isRefreshing={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadForecast(selectedProfile, horizon)}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
            <h3 className="text-sm font-medium text-slate-200">
              Loading electricity forecast...
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Analyzing recent usage and weather patterns
            </p>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && !error && (
          <>
            {/* 1. Real-time KPI Metric Cards */}
            <MetricCards
              peakAnalysis={peakAnalysis}
              modelMetrics={modelMetrics}
              forecastData={forecastData}
              horizon={horizon}
            />

            {/* 2. Peak Demand Alert Banner */}
            <PeakAlertBanner
              peakAnalysis={peakAnalysis}
              onScrollToSimulator={() => {
                const el = document.getElementById('what-if-simulator');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 3. Interactive Forecast & Confidence Chart */}
            <ForecastChart
              forecastData={forecastData}
              recentHistory={recentHistory}
              simulatedData={simulationResult?.simulated_records}
              peakThreshold={peakAnalysis?.peak_threshold_kw}
              criticalThreshold={peakAnalysis?.critical_threshold_kw}
              horizon={horizon}
            />

            {/* 4. Interactive What-If Scenario Simulator */}
            <WhatIfSimulator
              params={simulatorParams}
              onChangeParams={handleParamChange}
              onReset={handleResetSimulator}
              onApplyPreset={handleApplyPreset}
              simulationResult={simulationResult}
              isLoading={isSimulating}
            />

            {/* 5. Actionable Energy-Saving Recommendations */}
            <RecommendationCards
              recommendations={recommendations}
              onApplyToSimulator={handleApplyRecommendationToSimulator}
            />
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 px-4 sm:px-6 mt-12 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300">Energy Demand Predictor</span>
            <span>•</span>
            <span>Supporting SDG 7 (Affordable & Clean Energy)</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Helps reduce electricity costs and prevent peak grid blackouts
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <DataUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(profileName) => {
          setSelectedProfile(profileName);
          loadForecast(profileName, horizon);
        }}
      />

      <ModelDiagnosticsDrawer
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        metrics={modelMetrics}
        featureImportances={featureImportances}
        profile={selectedProfile}
      />

    </div>
  );
}
