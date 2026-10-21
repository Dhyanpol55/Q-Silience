export interface MicrogridSample {
  id: string;
  timestamp: string;
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
  is_abnormal: 0 | 1; // 0 = Normal, 1 = Abnormal
  scenario_type: 'normal' | 'demand_spike' | 'solar_drop' | 'voltage_sag' | 'frequency_instability' | 'cascading_failure' | 'custom';
  scenario_reason?: string;
}

export type FeatureKey = 'demand_kw' | 'solar_kw' | 'battery_soc_pct' | 'voltage_dev_v' | 'frequency_dev_hz';

export interface PreprocessingConfig {
  selectedFeatures: FeatureKey[];
  scalerType: 'minmax' | 'standard';
  testSize: number; // e.g. 0.25
  randomSeed: number;
}

export interface ScalerModel {
  type: 'minmax' | 'standard';
  featureKeys: FeatureKey[];
  means?: number[];
  stds?: number[];
  mins?: number[];
  maxs?: number[];
}

export interface QuantumCircuitGate {
  name: 'H' | 'Rz' | 'CX';
  targetQubit: number;
  controlQubit?: number;
  parameter?: string;
  layer: number;
}

export interface QuantumCircuitModel {
  numQubits: number;
  reps: number;
  entanglement: 'linear' | 'full';
  depth: number;
  totalGates: number;
  gates: QuantumCircuitGate[];
}

export interface ModelMetrics {
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

export interface ModelPrediction {
  label: 0 | 1;
  probabilityAbnormal: number;
  margin: number;
  modelType: 'classical_svc' | 'quantum_qsvc';
}

export interface LowDataBenchmarkPoint {
  trainFraction: number;
  sampleCount: number;
  classicalF1: number;
  classicalAccuracy: number;
  quantumF1: number;
  quantumAccuracy: number;
}

export interface BenchmarkReport {
  timestamp: string;
  datasetSize: number;
  trainSize: number;
  testSize: number;
  selectedFeatures: FeatureKey[];
  randomSeed: number;
  classicalMetrics: ModelMetrics;
  quantumMetrics: ModelMetrics;
  lowDataPoints: LowDataBenchmarkPoint[];
  quantumCircuit: {
    numQubits: number;
    depth: number;
    reps: number;
    kernelType: string;
  };
}
