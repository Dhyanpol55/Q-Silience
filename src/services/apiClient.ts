import { SensorInput, ModelPrediction } from '../types/microgrid';

export interface BackendHealth {
  status: 'healthy' | 'unhealthy' | 'offline' | 'checking';
  service?: string;
  qiskitAvailable?: boolean;
  qiskitVersion?: string;
  modelsReady?: boolean;
  datasetSamples?: number;
  latencyMs?: number;
  error?: string;
}

export interface BackendDualPrediction {
  inputs: {
    demand_kw: number;
    solar_kw: number;
    battery_soc_pct: number;
    voltage_dev_v: number;
    frequency_dev_hz: number;
  };
  classical_svc: {
    model_name: string;
    prediction: 'NORMAL' | 'ABNORMAL';
    label: number;
    probability_abnormal?: number;
    inference_time_ms: number;
  };
  quantum_qsvc?: {
    model_name: string;
    prediction: 'NORMAL' | 'ABNORMAL';
    label: number;
    probability_abnormal?: number;
    inference_time_ms: number;
  };
  heuristic_diagnosis: {
    is_physically_abnormal: boolean;
    voltage_status: 'nominal' | 'warning' | 'critical';
    frequency_status: 'nominal' | 'warning' | 'critical';
  };
}

export interface BackendCircuitInfo {
  num_qubits: number;
  depth: number;
  total_gates: number;
  gate_counts: Record<string, number>;
  ascii_diagram?: string;
}

const DEFAULT_BACKEND_URL = 'https://q-resilience-api.onrender.com';
const STORAGE_KEY = 'q_resilience_backend_url';

export function getStoredBackendUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BACKEND_URL;
  } catch {
    return DEFAULT_BACKEND_URL;
  }
}

export function setStoredBackendUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Checks FastAPI backend health and ping latency
 */
export async function pingBackend(baseUrl: string = getStoredBackendUrl()): Promise<BackendHealth> {
  const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
  const t0 = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${cleanUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) {
      return {
        status: 'unhealthy',
        latencyMs,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      status: 'healthy',
      service: data.service || 'Q-RESILIENCE AI FastAPI Backend',
      qiskitAvailable: data.qiskit_available ?? true,
      qiskitVersion: data.qiskit_version || '1.3.0',
      modelsReady: data.models_ready ?? true,
      datasetSamples: data.dataset_samples ?? 100,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - t0);
    return {
      status: 'offline',
      latencyMs,
      error: err.name === 'AbortError' ? 'Connection timed out (6s)' : err.message || 'Connection refused',
    };
  }
}

/**
 * Executes live prediction via remote FastAPI backend
 */
export async function predictWithBackend(
  inputs: {
    demand_kw: number;
    solar_kw: number;
    battery_soc_pct: number;
    voltage_dev_v: number;
    frequency_dev_hz: number;
  },
  baseUrl: string = getStoredBackendUrl()
): Promise<BackendDualPrediction> {
  const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const res = await fetch(`${cleanUrl}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(inputs),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error (${res.status}): ${text}`);
  }

  return await res.json();
}

/**
 * Fetches compiled Qiskit circuit diagram and metrics from backend
 */
export async function fetchBackendCircuit(
  baseUrl: string = getStoredBackendUrl()
): Promise<BackendCircuitInfo> {
  const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
  const res = await fetch(`${cleanUrl}/api/circuit`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Circuit endpoint failed: HTTP ${res.status}`);
  }

  return await res.json();
}
