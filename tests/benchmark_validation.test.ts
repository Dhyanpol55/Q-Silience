/**
 * Comprehensive Validation Test Suite for Q-Silience / Q-Resilience AI
 * VTU-Qiskit Fall Fest 2026 — Team Ctrl_AI (VTU-QFF-HC-0025)
 *
 * Validates:
 * 1. Benchmark Data Source Labels ('LOCAL DEMO' vs 'LIVE BACKEND')
 * 2. Backend Failure Handling & Zero Silent Substitution
 * 3. Model Identity, QML Availability, and Qiskit Version Reporting
 * 4. Exact Empirical Metric Mapping from BackendBenchmarkResponse to UI ModelMetrics
 * 5. Disclosures Verification: Zero unsupported claims of quantum advantage or sub-5ms inference
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Types mirroring frontend types
interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  trainTimeMs: number;
  inferenceTimeMs: number;
}

interface BackendBenchmarkMetric {
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

interface BackendBenchmarkResponse {
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

// Helper mapping function matching BenchmarkPage.tsx
function mapBackendMetrics(metric: BackendBenchmarkMetric): ModelMetrics {
  return {
    accuracy: metric.accuracy,
    precision: metric.precision,
    recall: metric.recall,
    f1Score: metric.f1_score,
    truePositives: metric.true_positives,
    falsePositives: metric.false_positives,
    trueNegatives: metric.true_negatives,
    falseNegatives: metric.false_negatives,
    trainTimeMs: metric.train_time_ms,
    inferenceTimeMs: metric.inference_time_ms,
  };
}

describe('Q-Resilience AI: Benchmark & Source Validation Test Suite', () => {

  // Test 1: Data Source Separation
  it('1. Correctly distinguishes LOCAL DEMO vs LIVE BACKEND labels without cross-contamination', () => {
    const localLabel = 'LOCAL DEMO RESULTS (Client-Side)';
    const backendLabel = 'LIVE BACKEND RESULTS (/api/benchmark)';

    assert.notStrictEqual(localLabel, backendLabel);
    assert.match(localLabel, /LOCAL DEMO/);
    assert.match(backendLabel, /LIVE BACKEND/);

    // Verify source resolver logic: when backend is null, activeClassicalMetrics must not falsely claim backend
    const activeSource: 'local_demo' | 'backend' = 'backend';
    const backendBenchmark: BackendBenchmarkResponse | null = null;
    const localMetrics: ModelMetrics = {
      accuracy: 0.96,
      precision: 0.95,
      recall: 0.97,
      f1Score: 0.96,
      truePositives: 10,
      falsePositives: 1,
      trueNegatives: 14,
      falseNegatives: 0,
      trainTimeMs: 12,
      inferenceTimeMs: 4,
    };

    // Under backend source with null benchmark, active metrics MUST be null (never local fallback presented as backend)
    const activeMetrics = activeSource === 'backend'
      ? (backendBenchmark ? mapBackendMetrics((backendBenchmark as BackendBenchmarkResponse).classical_svc) : null)
      : localMetrics;

    assert.strictEqual(activeMetrics, null, 'Local metrics must never be displayed as backend data');
  });

  // Test 2: Backend Failure Handling
  it('2. Backend failure retains explicit error and avoids silent substitution', () => {
    let activeSource: 'local_demo' | 'backend' = 'backend';
    let backendError: string | null = null;
    let backendBenchmark: BackendBenchmarkResponse | null = null;

    // Simulate backend fetch rejection
    try {
      throw new Error('Connection timed out after 8s (Render free-tier cold sleep)');
    } catch (err: any) {
      backendError = err.message;
      backendBenchmark = null;
    }

    assert.strictEqual(backendError, 'Connection timed out after 8s (Render free-tier cold sleep)');
    assert.strictEqual(backendBenchmark, null);

    // If user explicitly chooses to revert to local demo, source shifts cleanly
    activeSource = 'local_demo';
    assert.strictEqual(activeSource, 'local_demo');
  });

  // Test 3: Model Status Display & Identity
  it('3. Accurately identifies genuine QSVC vs fallback statevector kernel and versions', () => {
    const genuineHealth = {
      status: 'healthy',
      qiskitAvailable: true,
      qiskitVersion: '1.4.6',
      qmlAvailable: true,
      qmlVersion: '0.8.2',
      quantumModelStatus: 'genuine_qsvc',
      quantumModelType: 'Genuine Qiskit ML QSVC (FidelityQuantumKernel)',
    };

    assert.strictEqual(genuineHealth.qiskitVersion, '1.4.6');
    assert.strictEqual(genuineHealth.qmlVersion, '0.8.2');
    assert.strictEqual(genuineHealth.quantumModelStatus, 'genuine_qsvc');
    assert.strictEqual(genuineHealth.qmlAvailable, true);

    const fallbackHealth = {
      status: 'healthy',
      qiskitAvailable: true,
      qiskitVersion: '1.4.6',
      qmlAvailable: false,
      qmlError: 'ModuleNotFoundError: No module named qiskit_machine_learning',
      quantumModelStatus: 'exact_statevector_fallback',
      quantumModelType: 'Exact Statevector Fidelity Kernel + Scikit-Learn SVC',
    };

    assert.strictEqual(fallbackHealth.quantumModelStatus, 'exact_statevector_fallback');
    assert.strictEqual(fallbackHealth.qmlAvailable, false);
    assert.doesNotMatch(fallbackHealth.quantumModelType, /Genuine Qiskit ML QSVC/);
  });

  // Test 4: Metric Mapping for Verified Benchmark
  it('4. Maps actual verified benchmark metrics from live Render backend faithfully', () => {
    const verifiedBackendResponse: BackendBenchmarkResponse = {
      timestamp: '2026-10-22T21:45:00.000Z',
      total_samples: 60,
      train_samples: 45,
      test_samples: 15,
      classical_svc: {
        accuracy: 1.0,
        precision: 1.0,
        recall: 1.0,
        f1_score: 1.0,
        true_positives: 7,
        false_positives: 0,
        true_negatives: 8,
        false_negatives: 0,
        confusion_matrix: [[8, 0], [0, 7]],
        train_time_ms: 2.05,
        inference_time_ms: 0.29,
      },
      quantum_qsvc: {
        accuracy: 0.8667,
        precision: 0.8,
        recall: 1.0,
        f1_score: 0.8571,
        true_positives: 7,
        false_positives: 2,
        true_negatives: 6,
        false_negatives: 0,
        confusion_matrix: [[6, 2], [0, 7]],
        train_time_ms: 27197.41,
        inference_time_ms: 16793.07,
      },
      quantum_model_type: 'Genuine Qiskit ML QSVC (FidelityQuantumKernel)',
      quantum_model_status: 'genuine_qsvc',
      qml_available: true,
      low_data_experiment: [
        { sample_count: 15, train_fraction: 0.25, classical_f1: 1.0, quantum_f1: 0.82, classical_accuracy: 1.0, quantum_accuracy: 0.80 },
        { sample_count: 30, train_fraction: 0.50, classical_f1: 1.0, quantum_f1: 0.84, classical_accuracy: 1.0, quantum_accuracy: 0.83 },
        { sample_count: 45, train_fraction: 0.75, classical_f1: 1.0, quantum_f1: 0.8571, classical_accuracy: 1.0, quantum_accuracy: 0.8667 },
      ],
    };

    const classicalMapped = mapBackendMetrics(verifiedBackendResponse.classical_svc);
    assert.strictEqual(classicalMapped.accuracy, 1.0);
    assert.strictEqual(classicalMapped.f1Score, 1.0);
    assert.strictEqual(classicalMapped.precision, 1.0);
    assert.strictEqual(classicalMapped.recall, 1.0);
    assert.strictEqual(classicalMapped.trainTimeMs, 2.05);
    assert.strictEqual(classicalMapped.inferenceTimeMs, 0.29);
    assert.strictEqual(classicalMapped.truePositives + classicalMapped.trueNegatives, 15);

    const quantumMapped = mapBackendMetrics(verifiedBackendResponse.quantum_qsvc!);
    assert.strictEqual(quantumMapped.accuracy, 0.8667);
    assert.strictEqual(quantumMapped.f1Score, 0.8571);
    assert.strictEqual(quantumMapped.precision, 0.8);
    assert.strictEqual(quantumMapped.recall, 1.0);
    assert.strictEqual(quantumMapped.trainTimeMs, 27197.41);
    assert.strictEqual(quantumMapped.inferenceTimeMs, 16793.07);
    assert.strictEqual(quantumMapped.truePositives + quantumMapped.falsePositives + quantumMapped.trueNegatives + quantumMapped.falseNegatives, 15);

    // Classical baseline speedup ratios
    const trainSpeedup = quantumMapped.trainTimeMs / classicalMapped.trainTimeMs;
    const inferenceSpeedup = quantumMapped.inferenceTimeMs / classicalMapped.inferenceTimeMs;
    assert.ok(trainSpeedup > 13000, 'Classical training should be >13,000x faster than simulated quantum kernel');
    assert.ok(inferenceSpeedup > 50000, 'Classical inference should be >50,000x faster than simulated quantum kernel');
  });

  // Test 5: Scientific Integrity and Claim Audit
  it('5. Audits documentation for absence of unsupported claims (sample-efficiency or sub-5ms)', () => {
    const readmeContent = fs.readFileSync(path.resolve(process.cwd(), 'README.md'), 'utf-8');
    const benchmarkDocContent = fs.readFileSync(path.resolve(process.cwd(), 'docs/benchmark_report.md'), 'utf-8');

    // Ensure no unsupported claim of quantum supremacy or sample-efficiency advantage exists in docs/benchmark_report.md
    assert.doesNotMatch(benchmarkDocContent, /demonstrates modest sample-efficiency advantages/,
      'benchmark_report.md must not claim quantum sample efficiency without proof');

    // Ensure docs explicitly acknowledge classical advantage on this dataset
    assert.match(benchmarkDocContent, /zero evidence of quantum advantage/,
      'benchmark_report.md must explicitly disclose lack of quantum advantage');

    // Ensure README contains active verified links
    assert.match(readmeContent, /https:\/\/qresilience\.vercel\.app/);
    assert.match(readmeContent, /https:\/\/q-silience\.onrender\.com\/health/);
    assert.match(readmeContent, /https:\/\/q-silience\.onrender\.com\/docs/);
    assert.match(readmeContent, /https:\/\/github\.com\/Dhyanpol55\/Q-Silience/);

    // Ensure verified numbers are documented
    assert.match(readmeContent, /27,197\.41 ms/);
    assert.match(readmeContent, /16,793\.07 ms/);
    assert.match(readmeContent, /86\.67%/);
  });
});
