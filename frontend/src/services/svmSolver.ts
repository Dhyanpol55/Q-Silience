import { ModelPrediction } from '../types/microgrid';
import { computeZZFeatureMapStatevector, computeQuantumFidelity } from './quantumEngine';

export interface SVCTrainedModel {
  type: 'classical_svc' | 'quantum_qsvc';
  supportVectors: number[][];
  supportVectorAlphas: number[]; // alpha_i * y_i
  bias: number;
  C: number;
  gamma?: number; // for classical RBF
  numQubits?: number;
  reps?: number;
  trainTimeMs: number;
  plattA: number;
  plattB: number;
  svCount: number;
  // Pre-cached statevectors of support vectors for rapid quantum inference
  quantumSupportStates?: { re: number; im: number }[][];
}

/**
 * Computes Classical Radial Basis Function (RBF) Kernel:
 * K(x, z) = exp(-gamma * ||x - z||^2)
 */
export function computeRBFKernelMatrix(
  X1: number[][],
  X2: number[][],
  gamma: number = 0.5
): number[][] {
  const n1 = X1.length;
  const n2 = X2.length;
  const K: number[][] = Array.from({ length: n1 }, () => new Array(n2).fill(0));

  for (let i = 0; i < n1; i++) {
    for (let j = 0; j < n2; j++) {
      let distSq = 0;
      for (let d = 0; d < X1[i].length; d++) {
        const diff = X1[i][d] - X2[j][d];
        distSq += diff * diff;
      }
      K[i][j] = Math.exp(-gamma * distSq);
    }
  }
  return K;
}

/**
 * Sequential Minimal Optimization (SMO) algorithm to train dual SVM on any kernel matrix.
 */
export function trainDualSVM(
  K: number[][],
  y: number[], // labels in {-1, +1}
  C: number = 1.0,
  tol: number = 1e-3,
  maxPasses: number = 10
): { alphas: number[]; bias: number } {
  const n = y.length;
  const alphas = new Array(n).fill(0);
  let bias = 0;
  let passes = 0;

  // Helper to compute f(x_i) from current alphas and bias
  const computeF = (i: number): number => {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      if (alphas[j] > 1e-6) {
        sum += alphas[j] * y[j] * K[j][i];
      }
    }
    return sum + bias;
  };

  while (passes < maxPasses) {
    let numChangedAlphas = 0;

    for (let i = 0; i < n; i++) {
      const Ei = computeF(i) - y[i];

      // Check KKT conditions violation
      if (
        (y[i] * Ei < -tol && alphas[i] < C) ||
        (y[i] * Ei > tol && alphas[i] > 0)
      ) {
        // Select second index j != i at random
        let j = Math.floor(Math.random() * (n - 1));
        if (j >= i) j++;

        const Ej = computeF(j) - y[j];
        const alphaI_old = alphas[i];
        const alphaJ_old = alphas[j];

        // Compute L and H boundaries
        let L = 0;
        let H = C;
        if (y[i] !== y[j]) {
          L = Math.max(0, alphas[j] - alphas[i]);
          H = Math.min(C, C + alphas[j] - alphas[i]);
        } else {
          L = Math.max(0, alphas[i] + alphas[j] - C);
          H = Math.min(C, alphas[i] + alphas[j]);
        }

        if (Math.abs(L - H) < 1e-5) continue;

        // Eta = 2 * K[i][j] - K[i][i] - K[j][j]
        const eta = 2 * K[i][j] - K[i][i] - K[j][j];
        if (eta >= 0) continue; // semi-definite condition

        // Update alpha[j]
        let alphaJ_new = alphaJ_old - (y[j] * (Ei - Ej)) / eta;
        // Clip to [L, H]
        if (alphaJ_new > H) alphaJ_new = H;
        else if (alphaJ_new < L) alphaJ_new = L;

        if (Math.abs(alphaJ_new - alphaJ_old) < 1e-5) continue;

        // Update alpha[i]
        const alphaI_new = alphaI_old + y[i] * y[j] * (alphaJ_old - alphaJ_new);

        // Compute bias thresholds b1 and b2
        const b1 =
          bias -
          Ei -
          y[i] * (alphaI_new - alphaI_old) * K[i][i] -
          y[j] * (alphaJ_new - alphaJ_old) * K[i][j];

        const b2 =
          bias -
          Ej -
          y[i] * (alphaI_new - alphaI_old) * K[i][j] -
          y[j] * (alphaJ_new - alphaJ_old) * K[j][j];

        if (alphaI_new > 0 && alphaI_new < C) {
          bias = b1;
        } else if (alphaJ_new > 0 && alphaJ_new < C) {
          bias = b2;
        } else {
          bias = (b1 + b2) / 2;
        }

        alphas[i] = alphaI_new;
        alphas[j] = alphaJ_new;
        numChangedAlphas++;
      }
    }

    if (numChangedAlphas === 0) {
      passes++;
    } else {
      passes = 0;
    }
  }

  return { alphas, bias };
}

/**
 * Trains a Classical Support Vector Classifier (RBF kernel)
 */
export function trainClassicalSVC(
  X_train: number[][],
  y_train: number[], // -1 or +1
  C: number = 1.0,
  gamma: number = 0.5
): SVCTrainedModel {
  const t0 = performance.now();
  const K = computeRBFKernelMatrix(X_train, X_train, gamma);
  const { alphas, bias } = trainDualSVM(K, y_train, C);

  const supportVectors: number[][] = [];
  const supportVectorAlphas: number[] = [];

  for (let i = 0; i < alphas.length; i++) {
    if (alphas[i] > 1e-4) {
      supportVectors.push(X_train[i]);
      supportVectorAlphas.push(alphas[i] * y_train[i]);
    }
  }

  const t1 = performance.now();

  return {
    type: 'classical_svc',
    supportVectors,
    supportVectorAlphas,
    bias,
    C,
    gamma,
    trainTimeMs: Math.max(1, Math.round(t1 - t0)),
    plattA: 1.8,
    plattB: 0.0,
    svCount: supportVectors.length,
  };
}

/**
 * Trains a Quantum Support Vector Classifier (QSVC) using ZZFeatureMap Fidelity Kernel
 */
export function trainQuantumQSVC(
  X_train: number[][],
  y_train: number[],
  precomputedK: number[][],
  numQubits: number = 4,
  reps: number = 2,
  C: number = 1.0,
  precomputedTimeMs: number = 0
): SVCTrainedModel {
  const t0 = performance.now();
  const { alphas, bias } = trainDualSVM(precomputedK, y_train, C);

  const supportVectors: number[][] = [];
  const supportVectorAlphas: number[] = [];

  for (let i = 0; i < alphas.length; i++) {
    if (alphas[i] > 1e-4) {
      supportVectors.push(X_train[i]);
      supportVectorAlphas.push(alphas[i] * y_train[i]);
    }
  }

  // Pre-compute statevectors for support vectors for accelerated inference
  const quantumSupportStates = supportVectors.map((sv) =>
    computeZZFeatureMapStatevector(sv, numQubits, reps)
  );

  const t1 = performance.now();
  const totalTrainTime = Math.max(1, Math.round(precomputedTimeMs + (t1 - t0)));

  return {
    type: 'quantum_qsvc',
    supportVectors,
    supportVectorAlphas,
    bias,
    C,
    numQubits,
    reps,
    trainTimeMs: totalTrainTime,
    plattA: 1.6,
    plattB: 0.0,
    svCount: supportVectors.length,
    quantumSupportStates,
  };
}

/**
 * Predicts a single sample using the trained model
 */
export function predictSample(
  model: SVCTrainedModel,
  x: number[]
): ModelPrediction {
  const { type, supportVectors, supportVectorAlphas, bias, gamma, numQubits = 4, reps = 2, plattA, plattB } = model;

  let margin = bias;

  if (type === 'classical_svc') {
    const g = gamma ?? 0.5;
    for (let i = 0; i < supportVectors.length; i++) {
      const sv = supportVectors[i];
      let distSq = 0;
      for (let d = 0; d < sv.length; d++) {
        const diff = sv[d] - x[d];
        distSq += diff * diff;
      }
      const kVal = Math.exp(-g * distSq);
      margin += supportVectorAlphas[i] * kVal;
    }
  } else {
    // Quantum QSVC
    const testState = computeZZFeatureMapStatevector(x, numQubits, reps);
    const supportStates = model.quantumSupportStates || supportVectors.map((sv) => computeZZFeatureMapStatevector(sv, numQubits, reps));

    for (let i = 0; i < supportStates.length; i++) {
      const kVal = computeQuantumFidelity(supportStates[i], testState);
      margin += supportVectorAlphas[i] * kVal;
    }
  }

  // Sigmoid / Platt scaling for probability of abnormal class (+1)
  const prob = 1 / (1 + Math.exp(-(plattA * margin + plattB)));
  const label: 0 | 1 = margin >= 0 ? 1 : 0;

  return {
    label,
    probabilityAbnormal: Number(prob.toFixed(4)),
    margin: Number(margin.toFixed(4)),
    modelType: type,
  };
}

/**
 * Batch prediction on test set
 */
export function predictBatch(
  model: SVCTrainedModel,
  X: number[][]
): { predictions: ModelPrediction[]; inferenceTimeMs: number } {
  const t0 = performance.now();
  const predictions = X.map((x) => predictSample(model, x));
  const t1 = performance.now();
  return {
    predictions,
    inferenceTimeMs: Math.max(1, Math.round(t1 - t0)),
  };
}
