const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchProfiles() {
  const res = await fetch(`${API_BASE}/profiles`);
  if (!res.ok) throw new Error('Failed to load profiles');
  return res.json();
}

export async function fetchHistorical(profile = 'campus', limitHours = 168) {
  const res = await fetch(`${API_BASE}/historical?profile=${encodeURIComponent(profile)}&limit_hours=${limitHours}`);
  if (!res.ok) throw new Error('Failed to fetch historical data');
  return res.json();
}

export async function fetchForecast(profile = 'campus', horizonHours = 24, percentileThreshold = 85.0) {
  const res = await fetch(`${API_BASE}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile,
      horizon_hours: Number(horizonHours),
      percentile_threshold: Number(percentileThreshold),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Forecast request failed' }));
    throw new Error(err.detail || 'Failed to generate forecast');
  }
  return res.json();
}

export async function simulateScenario(payload) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Simulation failed' }));
    throw new Error(err.detail || 'Simulation request failed');
  }
  return res.json();
}

export async function uploadCustomCSV(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'CSV upload failed');
  }
  return res.json();
}

export async function exportReport(profile = 'campus', horizonHours = 24) {
  const res = await fetch(`${API_BASE}/export?profile=${encodeURIComponent(profile)}&horizon_hours=${horizonHours}`);
  if (!res.ok) throw new Error('Export report failed');
  return res.json();
}
