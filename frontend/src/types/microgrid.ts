export interface MicrogridSample {
  id: string;
  timestamp: string;
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
  is_abnormal: 0 | 1; // 0 = Normal, 1 = Abnormal
  scenario_type:
    | 'normal'
    | 'normal_operation'
    | 'demand_spike'
    | 'demand_surge'
    | 'solar_drop'
    | 'low_battery_charge'
    | 'voltage_sag'
    | 'voltage_deviation'
    | 'frequency_instability'
    | 'frequency_deviation'
    | 'cascading_failure'
    | 'custom'
    | string;
  scenario_reason?: string;
}

export interface SensorInput {
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
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

export interface NISQNoiseConfig {
  enabled: boolean;
  depolarizingErrorRate: number; // e.g. 0.015 (1.5%)
  readoutErrorRate: number;      // e.g. 0.02 (2.0%)
  t1RelaxationUs: number;        // e.g. 50 microseconds
  t2DephasingUs: number;         // e.g. 70 microseconds
  twoQubitGateErrorRate: number; // e.g. 0.01 (1.0% CNOT error)
}

export interface QuantumFeatureAttribution {
  featureKey: FeatureKey;
  name: string;
  score: number;             // Permutation sensitivity score
  percentage: number;        // Normalized contribution %
  direction: 'anomaly_driver' | 'stabilizer';
  sensorValue: number;
  nominalBand: string;
  description: string;
}

export interface HyperparameterSweepPoint {
  id: string;
  reps: number;
  entanglement: 'linear' | 'full';
  cParam: number;
  classicalF1: number;
  classicalAccuracy: number;
  quantumF1: number;
  quantumAccuracy: number;
  quantumTrainTimeMs: number;
  circuitDepth: number;
  totalGates: number;
}

