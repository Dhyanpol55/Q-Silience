import { LowDataBenchmarkPoint, ModelMetrics, ModelPrediction } from '../types/microgrid';
import { SVCTrainedModel, predictBatch, trainClassicalSVC, trainQuantumQSVC } from './svmSolver';
import { computeQuantumKernelMatrix } from './quantumEngine';

/**
 * Calculates classification evaluation metrics from actual predictions and ground truth labels.
 * Label 1 = Abnormal (Positive class)
 * Label 0 = Normal (Negative class)
 */
export function calculateMetrics(
  predictions: ModelPrediction[],
  actualLabels: number[], // 1 or -1, or 1 or 0
  trainTimeMs: number,
  inferenceTimeMs: number
): ModelMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i].label; // 1 or 0
    const actual = actualLabels[i] === 1 ? 1 : 0;

    if (pred === 1 && actual === 1) tp++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 0) tn++;
    else if (pred === 0 && actual === 1) fn++;
  }

  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    accuracy: Number(accuracy.toFixed(4)),
    precision: Number(precision.toFixed(4)),
    recall: Number(recall.toFixed(4)),
    f1Score: Number(f1Score.toFixed(4)),
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    trainTimeMs,
    inferenceTimeMs,
  };
}

/**
 * Runs the low-data experiment:
 * Evaluates both Classical SVC and Quantum QSVC at 25%, 50%, 75%, and 100% of the training dataset
 * while testing on the exact same separate held-out test split.
 */
export function runLowDataExperiment(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  numQubits: number = 4,
  reps: number = 2
): LowDataBenchmarkPoint[] {
  const fractions = [0.25, 0.5, 0.75, 1.0];
  const results: LowDataBenchmarkPoint[] = [];

  for (const frac of fractions) {
    const count = Math.max(8, Math.round(X_train.length * frac));
    const subX = X_train.slice(0, count);
    const subY = y_train.slice(0, count);

    // 1. Train Classical SVC on subset
    const classicalModel = trainClassicalSVC(subX, subY, 1.0, 0.5);
    const classicalPreds = predictBatch(classicalModel, X_test);
    const cMetrics = calculateMetrics(
      classicalPreds.predictions,
      y_test,
      classicalModel.trainTimeMs,
      classicalPreds.inferenceTimeMs
    );

    // 2. Train Quantum QSVC on subset
    const subK = computeQuantumKernelMatrix(subX, subX, numQubits, reps);
    const quantumModel = trainQuantumQSVC(subX, subY, subK, numQubits, reps, 1.0);
    const quantumPreds = predictBatch(quantumModel, X_test);
    const qMetrics = calculateMetrics(
      quantumPreds.predictions,
      y_test,
      quantumModel.trainTimeMs,
      quantumPreds.inferenceTimeMs
    );

    results.push({
      trainFraction: frac,
      sampleCount: count,
      classicalF1: cMetrics.f1Score,
      classicalAccuracy: cMetrics.accuracy,
      quantumF1: qMetrics.f1Score,
      quantumAccuracy: qMetrics.accuracy,
    });
  }

  return results;
}
