import { SensorInput, ModelPrediction } from '../types/microgrid';

export interface BackendHealth {
  status: 'healthy' | 'unhealthy' | 'offline' | 'checking';
  service?: string;
  qiskitAvailable?: boolean;
  qiskitVersion?: string;
  qiskitError?: string;
  qmlAvailable?: boolean;
  qmlVersion?: string;
  qmlError?: string;
  qmlRuntimeError?: string;
  quantumModelStatus?: 'genuine_qsvc' | 'exact_statevector_fallback' | string;
  quantumKernelType?: string;
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

export interface BackendScenarioPreset {
  id: string;
  name: string;
  description: string;
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
  expected_anomaly: boolean;
}

export interface BackendBenchmarkMetric {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  confusion_matrix: number[][];
  train_time_ms: number;
  inference_time_ms: number;
}

export interface BackendBenchmarkResponse {
  timestamp: string;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  classical_svc: BackendBenchmarkMetric;
  quantum_qsvc?: BackendBenchmarkMetric;
  quantum_model_type?: string;
  quantum_model_status?: 'genuine_qsvc' | 'exact_statevector_fallback' | string;
  qml_available?: boolean;
  qml_error?: string;
  qml_runtime_error?: string;
  low_data_experiment: {
    fraction?: number;
    train_fraction?: number;
    sample_count: number;
    classical_f1: number;
    quantum_f1: number;
    classical_accuracy: number;
    quantum_accuracy: number;
  }[];
}

const STORAGE_KEY = 'q_resilience_backend_url';
export const DEFAULT_REMOTE_BACKEND_URL = 'https://q-silience.onrender.com';

/**
 * Returns the normalized API base URL (strips trailing slashes)
 * Precedence:
 * 1. User-configured override in localStorage
 * 2. VITE_API_BASE_URL environment variable
 * 3. Default Render deployment URL (https://q-silience.onrender.com)
 */
export function getStoredBackendUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null && stored !== undefined && stored.trim() !== '') {
      return stored.trim().replace(/\/+$/, '');
    }
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      return envUrl.trim().replace(/\/+$/, '');
    }
    // Default to the live Render backend service
    return DEFAULT_REMOTE_BACKEND_URL;
  } catch {
    return DEFAULT_REMOTE_BACKEND_URL;
  }
}

export function setStoredBackendUrl(url: string): void {
  try {
    const clean = url.trim().replace(/\/+$/, '');
    if (clean) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Internal helper for resilient network calls with abort timeouts
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 8000,
  baseUrl: string = getStoredBackendUrl()
): Promise<Response> {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${cleanBase}${cleanEndpoint}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(targetUrl, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
}

/**
 * Checks FastAPI backend health and ping latency (GET /health)
 */
export async function pingBackend(baseUrl: string = getStoredBackendUrl()): Promise<BackendHealth> {
  const t0 = performance.now();
  try {
    let res = await apiFetch('/health', { method: 'GET', headers: { Accept: 'application/json' } }, 5000, baseUrl);

    if (!res.ok && res.status === 404) {
      res = await apiFetch('/api/health', { method: 'GET', headers: { Accept: 'application/json' } }, 5000, baseUrl);
    }

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
      service: data.service || 'Q-RESILIENCE AI Backend',
      qiskitAvailable: data.qiskit_available ?? true,
      qiskitVersion: data.qiskit_version || '1.3.0',
      qiskitError: data.qiskit_error,
      qmlAvailable: data.qml_available ?? false,
      qmlVersion: data.qml_version,
      qmlError: data.qml_error,
      qmlRuntimeError: data.qml_runtime_error,
      quantumModelStatus: data.quantum_model_status || (data.qml_available ? 'genuine_qsvc' : 'exact_statevector_fallback'),
      quantumKernelType: data.quantum_model_type || data.quantum_kernel_type || 'Exact Statevector Fidelity Kernel + Scikit-Learn SVC',
      modelsReady: data.models_ready ?? true,
      datasetSamples: data.dataset_samples ?? 60,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - t0);
    return {
      status: 'offline',
      latencyMs,
      error: err.message || 'Backend unreachable',
    };
  }
}

/**
 * Fetches standard microgrid scenario disturbance presets (GET /api/scenarios)
 */
export async function fetchBackendScenarios(baseUrl: string = getStoredBackendUrl()): Promise<BackendScenarioPreset[]> {
  const res = await apiFetch('/api/scenarios', { method: 'GET', headers: { Accept: 'application/json' } }, 6000, baseUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch scenarios (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.scenarios || data.presets || [];
}

/**
 * Fetches current dataset samples from the backend (GET /api/dataset)
 */
export async function fetchBackendDataset(limit: number = 100, baseUrl: string = getStoredBackendUrl()): Promise<any[]> {
  const res = await apiFetch(`/api/dataset?limit=${limit}`, { method: 'GET', headers: { Accept: 'application/json' } }, 8000, baseUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.samples || [];
}

/**
 * Generates synthetic telemetry and triggers backend model retraining (POST /api/dataset/generate)
 */
export async function generateBackendDataset(
  params: { sample_count?: number; random_seed?: number; abnormal_ratio?: number } = {},
  baseUrl: string = getStoredBackendUrl()
): Promise<{ message: string; sample_count: number; seed: number; benchmark?: BackendBenchmarkResponse }> {
  const res = await apiFetch(
    '/api/dataset/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(params),
    },
    12000,
    baseUrl
  );
  if (!res.ok) {
    throw new Error(`Failed to generate dataset on backend (HTTP ${res.status})`);
  }
  return await res.json();
}

/**
 * Executes dual classical SVC and quantum QSVC inference via remote FastAPI backend (POST /api/predict)
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
  const res = await apiFetch(
    '/api/predict',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(inputs),
    },
    8000,
    baseUrl
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend prediction failed (${res.status}): ${text}`);
  }

  return await res.json();
}

/**
 * Fetches empirical benchmark results from backend (GET /api/benchmark)
 */
export async function fetchBackendBenchmark(baseUrl: string = getStoredBackendUrl()): Promise<BackendBenchmarkResponse> {
  const res = await apiFetch('/api/benchmark', { method: 'GET', headers: { Accept: 'application/json' } }, 10000, baseUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch benchmark from backend (HTTP ${res.status})`);
  }
  return await res.json();
}

/**
 * Triggers model evaluation and returns benchmark report (POST /api/evaluate)
 */
export async function evaluateBackend(baseUrl: string = getStoredBackendUrl()): Promise<BackendBenchmarkResponse> {
  const res = await apiFetch('/api/evaluate', { method: 'POST', headers: { Accept: 'application/json' } }, 15000, baseUrl);
  if (!res.ok) {
    throw new Error(`Failed to evaluate backend models (HTTP ${res.status})`);
  }
  return await res.json();
}

/**
 * Fetches compiled Qiskit circuit diagram and metrics from backend (GET /api/circuit)
 */
export async function fetchBackendCircuit(baseUrl: string = getStoredBackendUrl()): Promise<BackendCircuitInfo> {
  const res = await apiFetch('/api/circuit', { method: 'GET', headers: { Accept: 'application/json' } }, 8000, baseUrl);
  if (!res.ok) {
    throw new Error(`Circuit endpoint failed: HTTP ${res.status}`);
  }
  return await res.json();
}
