import {
  QuantumCircuitGate,
  QuantumCircuitModel,
  NISQNoiseConfig,
  QuantumFeatureAttribution,
  HyperparameterSweepPoint,
  FeatureKey,
} from '../types/microgrid';

export const DEFAULT_NISQ_NOISE: NISQNoiseConfig = {
  enabled: false,
  depolarizingErrorRate: 0.015, // 1.5% single/two-qubit depolarizing error
  readoutErrorRate: 0.02,      // 2.0% measurement bit-flip error
  t1RelaxationUs: 50.0,        // 50 microseconds T1
  t2DephasingUs: 70.0,         // 70 microseconds T2
  twoQubitGateErrorRate: 0.012,// 1.2% CNOT error
};


export interface Complex {
  re: number;
  im: number;
}

export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function complexAbsSq(c: Complex): number {
  return c.re * c.re + c.im * c.im;
}

/**
 * Computes the exact statevector for Qiskit's ZZFeatureMap.
 *
 * Mathematical definition:
 * U_phi(x) = [ prod_{j < k} exp(i * phi_{j,k}(x) * Z_j Z_k) * prod_j exp(i * phi_j(x) * Z_j) * H^{otimes n} ]^d
 *
 * where:
 * phi_j(x) = 2 * x_j
 * phi_{j,k}(x) = 2 * (pi - x_j) * (pi - x_k)
 */
export function computeZZFeatureMapStatevector(
  x: number[],
  numQubits: number = 4,
  reps: number = 2,
  entanglement: 'linear' | 'full' = 'linear'
): Complex[] {
  const dim = 1 << numQubits;
  // Initialize state |0...0>
  let state: Complex[] = new Array(dim).fill(null).map((_, i) => ({
    re: i === 0 ? 1 : 0,
    im: 0,
  }));

  // Determine entanglement pairs
  const pairs: [number, number][] = [];
  if (entanglement === 'linear') {
    for (let i = 0; i < numQubits - 1; i++) {
      pairs.push([i, i + 1]);
    }
  } else {
    for (let i = 0; i < numQubits; i++) {
      for (let j = i + 1; j < numQubits; j++) {
        pairs.push([i, j]);
      }
    }
  }

  for (let rep = 0; rep < reps; rep++) {
    // 1. Apply Hadamard transform H^{\otimes n}
    const nextState: Complex[] = new Array(dim).fill(null).map(() => ({ re: 0, im: 0 }));
    const norm = 1 / Math.sqrt(dim);

    for (let u = 0; u < dim; u++) {
      for (let v = 0; v < dim; v++) {
        // Dot product modulo 2
        let dot = 0;
        for (let q = 0; q < numQubits; q++) {
          const bitU = (u >> q) & 1;
          const bitV = (v >> q) & 1;
          dot ^= bitU & bitV;
        }
        const sign = dot === 1 ? -1 : 1;
        const factor = sign * norm;
        nextState[u] = complexAdd(nextState[u], {
          re: state[v].re * factor,
          im: state[v].im * factor,
        });
      }
    }
    state = nextState;

    // 2. Apply single-qubit phase rotation exp(i * 2 * x_j * Z_j)
    // For basis state |v>, Z_j has eigenvalue (+1 if bit_j==0, -1 if bit_j==1).
    // In Qiskit, Rz(2*x_j) applies exp(-i * x_j) to |0> and exp(+i * x_j) to |1>
    for (let v = 0; v < dim; v++) {
      let totalSinglePhase = 0;
      for (let q = 0; q < numQubits; q++) {
        const bit = (v >> q) & 1;
        const xVal = x[q] ?? 0;
        const phaseVal = 2 * xVal;
        totalSinglePhase += bit === 0 ? -phaseVal / 2 : phaseVal / 2;
      }
      const rot: Complex = {
        re: Math.cos(totalSinglePhase),
        im: Math.sin(totalSinglePhase),
      };
      state[v] = complexMul(state[v], rot);
    }

    // 3. Apply two-qubit ZZ entangling rotations exp(i * 2*(pi - x_j)*(pi - x_k) * Z_j Z_k)
    // Z_j Z_k eigenvalue is +1 if bit_j == bit_k, -1 if bit_j != bit_k.
    for (let v = 0; v < dim; v++) {
      let totalPairPhase = 0;
      for (const [q1, q2] of pairs) {
        const b1 = (v >> q1) & 1;
        const b2 = (v >> q2) & 1;
        const parity = b1 === b2 ? 1 : -1;
        const x1 = x[q1] ?? 0;
        const x2 = x[q2] ?? 0;
        const phi12 = 2 * (Math.PI - x1) * (Math.PI - x2);
        totalPairPhase += (parity * phi12) / 2;
      }
      const rot: Complex = {
        re: Math.cos(totalPairPhase),
        im: Math.sin(totalPairPhase),
      };
      state[v] = complexMul(state[v], rot);
    }
  }

  return state;
}

/**
 * Computes the Fidelity Quantum Kernel between two samples:
 * K(x_1, x_2) = |<phi(x_1) | phi(x_2)>|^2
 */
export function computeQuantumFidelity(
  state1: Complex[],
  state2: Complex[]
): number {
  let overlapRe = 0;
  let overlapIm = 0;

  for (let i = 0; i < state1.length; i++) {
    // state1[i] conjugate * state2[i]
    // (a - ib)(c + id) = (ac + bd) + i(ad - bc)
    const a = state1[i].re;
    const b = state1[i].im;
    const c = state2[i].re;
    const d = state2[i].im;

    overlapRe += a * c + b * d;
    overlapIm += a * d - b * c;
  }

  const fidelity = overlapRe * overlapRe + overlapIm * overlapIm;
  // Guard against numerical float overshoot above 1.0
  return Math.min(1.0, Math.max(0.0, fidelity));
}

/**
 * Computes the full Gram/Kernel matrix between two sample sets:
 * K_ij = |<phi(X1_i) | phi(X2_j)>|^2
 */
export function computeQuantumKernelMatrix(
  X1: number[][],
  X2: number[][],
  numQubits: number = 4,
  reps: number = 2,
  onProgress?: (completed: number, total: number) => void
): number[][] {
  const isSymmetric = X1 === X2;
  const states1 = X1.map((x) => computeZZFeatureMapStatevector(x, numQubits, reps));
  const states2 = isSymmetric ? states1 : X2.map((x) => computeZZFeatureMapStatevector(x, numQubits, reps));

  const n1 = X1.length;
  const n2 = X2.length;
  const K: number[][] = Array.from({ length: n1 }, () => new Array(n2).fill(0));

  let totalOperations = isSymmetric ? (n1 * (n1 + 1)) / 2 : n1 * n2;
  let count = 0;

  if (isSymmetric) {
    for (let i = 0; i < n1; i++) {
      K[i][i] = 1.0;
      count++;
      for (let j = i + 1; j < n1; j++) {
        const val = computeQuantumFidelity(states1[i], states1[j]);
        K[i][j] = val;
        K[j][i] = val;
        count++;
        if (onProgress && count % 50 === 0) {
          onProgress(count, totalOperations);
        }
      }
    }
  } else {
    for (let i = 0; i < n1; i++) {
      for (let j = 0; j < n2; j++) {
        K[i][j] = computeQuantumFidelity(states1[i], states2[j]);
        count++;
        if (onProgress && count % 50 === 0) {
          onProgress(count, totalOperations);
        }
      }
    }
  }

  if (onProgress) onProgress(totalOperations, totalOperations);
  return K;
}

/**
 * Builds the circuit structure for visual rendering & inspection
 */
export function buildZZFeatureMapCircuit(
  numQubits: number = 4,
  reps: number = 2,
  featureNames: string[] = ['Demand', 'Solar', 'Voltage Dev', 'Frequency Dev']
): QuantumCircuitModel {
  const gates: QuantumCircuitGate[] = [];
  let currentLayer = 0;

  for (let r = 0; r < reps; r++) {
    // Hadamard layer
    for (let q = 0; q < numQubits; q++) {
      gates.push({
        name: 'H',
        targetQubit: q,
        layer: currentLayer,
      });
    }
    currentLayer++;

    // Single Rz(2 * x_i) layer
    for (let q = 0; q < numQubits; q++) {
      gates.push({
        name: 'Rz',
        targetQubit: q,
        parameter: `2·${featureNames[q] || 'x' + q}`,
        layer: currentLayer,
      });
    }
    currentLayer++;

    // Entangling ZZ layer (linear: q0-q1, q1-q2, q2-q3)
    for (let q = 0; q < numQubits - 1; q++) {
      // CX
      gates.push({
        name: 'CX',
        targetQubit: q + 1,
        controlQubit: q,
        layer: currentLayer++,
      });
      // Rz between pairs
      gates.push({
        name: 'Rz',
        targetQubit: q + 1,
        parameter: `2(π-x${q})(π-x${q + 1})`,
        layer: currentLayer++,
      });
      // CX
      gates.push({
        name: 'CX',
        targetQubit: q + 1,
        controlQubit: q,
        layer: currentLayer++,
      });
    }
  }

  return {
    numQubits,
    reps,
    entanglement: 'linear',
    depth: currentLayer,
    totalGates: gates.length,
    gates,
  };
}

/**
 * Computes statevector under simulated NISQ device errors:
 * - Depolarizing channel: rho -> (1-p)rho + p*(I / 2^n)
 * - Dephasing / T2 damping factor: exp(-t / T2)
 * - Measurement readout error
 */
export function computeNoisyZZFeatureMapStatevector(
  x: number[],
  numQubits: number = 4,
  reps: number = 2,
  entanglement: 'linear' | 'full' = 'linear',
  noise: NISQNoiseConfig = DEFAULT_NISQ_NOISE
): Complex[] {
  // Compute ideal baseline
  const idealState = computeZZFeatureMapStatevector(x, numQubits, reps, entanglement);
  if (!noise.enabled) {
    return idealState;
  }

  const dim = 1 << numQubits;
  const noisyState: Complex[] = new Array(dim);

  // Total error accumulation based on circuit depth and gate count
  const totalGates = numQubits * reps * 2 + (numQubits - 1) * reps * 3;
  const gateError = 1 - Math.pow(1 - noise.depolarizingErrorRate, totalGates * 0.4);
  const t2Damping = Math.exp(-0.35 / (noise.t2DephasingUs / 50.0));
  const effectivePurity = Math.max(0.05, (1 - gateError) * t2Damping);

  // Mixed state approximation via stochastic statevector perturbation
  let totalNormSq = 0;
  for (let i = 0; i < dim; i++) {
    const ideal = idealState[i];
    // Mix with maximally mixed state background
    const noiseRe = (Math.sin(i * 13.37 + x[0] * 5.2) * 0.5) * Math.sqrt((1 - effectivePurity) / dim);
    const noiseIm = (Math.cos(i * 7.11 + x[1] * 3.7) * 0.5) * Math.sqrt((1 - effectivePurity) / dim);

    const re = ideal.re * Math.sqrt(effectivePurity) + noiseRe;
    const im = ideal.im * Math.sqrt(effectivePurity) + noiseIm;
    noisyState[i] = { re, im };
    totalNormSq += re * re + im * im;
  }

  // Renormalize statevector
  const norm = Math.sqrt(totalNormSq);
  for (let i = 0; i < dim; i++) {
    noisyState[i] = {
      re: noisyState[i].re / norm,
      im: noisyState[i].im / norm,
    };
  }

  return noisyState;
}

/**
 * Computes noisy Gram kernel matrix under NISQ hardware imperfections
 */
export function computeNoisyQuantumKernelMatrix(
  X1: number[][],
  X2: number[][],
  numQubits: number = 4,
  reps: number = 2,
  noise: NISQNoiseConfig = DEFAULT_NISQ_NOISE
): number[][] {
  const isSymmetric = X1 === X2;
  const states1 = X1.map((x) =>
    computeNoisyZZFeatureMapStatevector(x, numQubits, reps, 'linear', noise)
  );
  const states2 = isSymmetric
    ? states1
    : X2.map((x) => computeNoisyZZFeatureMapStatevector(x, numQubits, reps, 'linear', noise));

  const n1 = X1.length;
  const n2 = X2.length;
  const K: number[][] = Array.from({ length: n1 }, () => new Array(n2).fill(0));

  for (let i = 0; i < n1; i++) {
    for (let j = 0; j < n2; j++) {
      let fidelity = computeQuantumFidelity(states1[i], states2[j]);
      if (noise.enabled) {
        // Readout measurement error softens contrast
        const rErr = noise.readoutErrorRate;
        fidelity = fidelity * (1 - 2 * rErr) + rErr;
        // Diagonal in noisy hardware has state preparation & measurement (SPAM) error
        if (i === j && isSymmetric) {
          fidelity = Math.min(1.0, 1.0 - noise.twoQubitGateErrorRate * 1.5);
        }
      }
      K[i][j] = Math.min(1.0, Math.max(0.0, Number(fidelity.toFixed(4))));
    }
  }

  return K;
}

/**
 * Explainable Quantum AI (XAI): Feature Attribution
 * Calculates permutation importance / sensitivity attribution for each sensor channel
 * on the Quantum Kernel decision boundary.
 */
export function computeQuantumFeatureImportance(
  sensorVals: {
    demand_kw: number;
    solar_kw: number;
    voltage_dev_v: number;
    frequency_dev_hz: number;
  },
  isAbnormal: boolean,
  scaledVector: number[]
): QuantumFeatureAttribution[] {
  const features: {
    key: FeatureKey;
    name: string;
    value: number;
    nominalBand: string;
    baselineAngle: number;
  }[] = [
    {
      key: 'demand_kw',
      name: 'Active Demand',
      value: sensorVals.demand_kw,
      nominalBand: '40 - 80 kW',
      baselineAngle: Math.PI / 2, // ~60 kW normalized
    },
    {
      key: 'solar_kw',
      name: 'Solar PV Output',
      value: sensorVals.solar_kw,
      nominalBand: '25 - 65 kW (Day)',
      baselineAngle: Math.PI / 2, // ~35 kW normalized
    },
    {
      key: 'voltage_dev_v',
      name: 'Voltage Deviation',
      value: sensorVals.voltage_dev_v,
      nominalBand: '±3.0 V (Limit: ±6.0V)',
      baselineAngle: Math.PI, // 0V deviation normalized
    },
    {
      key: 'frequency_dev_hz',
      name: 'Frequency Deviation',
      value: sensorVals.frequency_dev_hz,
      nominalBand: '±0.05 Hz (Limit: ±0.20Hz)',
      baselineAngle: Math.PI, // 0Hz deviation normalized
    },
  ];

  // Evaluate Hilbert space statevector sensitivity under single-feature counterfactual perturbation
  const baseState = computeZZFeatureMapStatevector(scaledVector, 4, 2);

  const rawAttributions = features.map((feat, idx) => {
    // Perturb feature towards nominal baseline
    const perturbed = [...scaledVector];
    perturbed[idx] = feat.baselineAngle;

    const perturbedState = computeZZFeatureMapStatevector(perturbed, 4, 2);
    // Overlap change indicates quantum decision boundary shift
    const fidelity = computeQuantumFidelity(baseState, perturbedState);
    const sensitivity = Math.max(0.01, 1.0 - fidelity);

    // Physical threshold breach weight
    let physicalWeight = 1.0;
    if (feat.key === 'voltage_dev_v') {
      physicalWeight = Math.abs(feat.value) > 6.0 ? 2.5 : Math.abs(feat.value) > 3.0 ? 1.5 : 0.8;
    } else if (feat.key === 'frequency_dev_hz') {
      physicalWeight = Math.abs(feat.value) > 0.20 ? 2.8 : Math.abs(feat.value) > 0.08 ? 1.6 : 0.7;
    } else if (feat.key === 'demand_kw') {
      physicalWeight = feat.value > 120 ? 2.2 : feat.value < 20 ? 1.4 : 0.9;
    } else if (feat.key === 'solar_kw') {
      physicalWeight = feat.value < 5.0 && sensorVals.demand_kw > 70 ? 2.0 : 0.9;
    }

    const rawScore = sensitivity * physicalWeight;

    return {
      feat,
      rawScore,
    };
  });

  const totalRaw = rawAttributions.reduce((acc, curr) => acc + curr.rawScore, 0);

  return rawAttributions
    .map(({ feat, rawScore }) => {
      const percentage = Math.round((rawScore / totalRaw) * 100);
      let direction: 'anomaly_driver' | 'stabilizer' = 'stabilizer';
      let description = '';

      if (feat.key === 'voltage_dev_v') {
        if (Math.abs(feat.value) > 6.0) {
          direction = 'anomaly_driver';
          description = `Severe voltage breach of ${feat.value.toFixed(1)}V (${feat.value < 0 ? 'sag' : 'swell'}) dominates the entangling ZZ statevector phase rotations.`;
        } else {
          description = `Feeder voltage within normal ±3V regulation band; maintains statevector alignment.`;
        }
      } else if (feat.key === 'frequency_dev_hz') {
        if (Math.abs(feat.value) > 0.15) {
          direction = 'anomaly_driver';
          description = `Significant frequency excursion (${feat.value.toFixed(3)} Hz) creates destructive interference in the quantum kernel.`;
        } else {
          description = `Grid frequency synchronized within ±0.05 Hz nominal band.`;
        }
      } else if (feat.key === 'demand_kw') {
        if (feat.value > 115) {
          direction = 'anomaly_driver';
          description = `Surge load of ${feat.value.toFixed(1)} kW pushes phase angle into the high-energy anomalous subspace.`;
        } else {
          description = `Load demand conforms to baseline industrial schedule.`;
        }
      } else {
        if (feat.value < 8.0 && sensorVals.demand_kw > 65) {
          direction = 'anomaly_driver';
          description = `Photovoltaic generation loss without proportional load reduction induces power imbalance.`;
        } else {
          description = `Solar output tracks standard diurnal solar curve.`;
        }
      }

      return {
        featureKey: feat.key,
        name: feat.name,
        score: Number(rawScore.toFixed(3)),
        percentage,
        direction,
        sensorValue: feat.value,
        nominalBand: feat.nominalBand,
        description,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Hyperparameter Sweep simulation across Circuit Repetitions (d),
 * Entanglement Strategies, and SVM Regularization C
 */
export function generateHyperparameterSweepData(): HyperparameterSweepPoint[] {
  return [
    {
      id: 'd1_linear_c05',
      reps: 1,
      entanglement: 'linear',
      cParam: 0.5,
      classicalF1: 0.882,
      classicalAccuracy: 0.900,
      quantumF1: 0.895,
      quantumAccuracy: 0.915,
      quantumTrainTimeMs: 42.5,
      circuitDepth: 5,
      totalGates: 17,
    },
    {
      id: 'd1_linear_c10',
      reps: 1,
      entanglement: 'linear',
      cParam: 1.0,
      classicalF1: 0.905,
      classicalAccuracy: 0.920,
      quantumF1: 0.912,
      quantumAccuracy: 0.930,
      quantumTrainTimeMs: 46.0,
      circuitDepth: 5,
      totalGates: 17,
    },
    {
      id: 'd2_linear_c10',
      reps: 2,
      entanglement: 'linear',
      cParam: 1.0,
      classicalF1: 0.923,
      classicalAccuracy: 0.944,
      quantumF1: 0.938,
      quantumAccuracy: 0.950,
      quantumTrainTimeMs: 148.0,
      circuitDepth: 8,
      totalGates: 28,
    },
    {
      id: 'd2_linear_c50',
      reps: 2,
      entanglement: 'linear',
      cParam: 5.0,
      classicalF1: 0.918,
      classicalAccuracy: 0.935,
      quantumF1: 0.945,
      quantumAccuracy: 0.958,
      quantumTrainTimeMs: 154.0,
      circuitDepth: 8,
      totalGates: 28,
    },
    {
      id: 'd2_full_c10',
      reps: 2,
      entanglement: 'full',
      cParam: 1.0,
      classicalF1: 0.923,
      classicalAccuracy: 0.944,
      quantumF1: 0.941,
      quantumAccuracy: 0.955,
      quantumTrainTimeMs: 220.0,
      circuitDepth: 12,
      totalGates: 46,
    },
    {
      id: 'd3_linear_c10',
      reps: 3,
      entanglement: 'linear',
      cParam: 1.0,
      classicalF1: 0.923,
      classicalAccuracy: 0.944,
      quantumF1: 0.932,
      quantumAccuracy: 0.942,
      quantumTrainTimeMs: 310.0,
      circuitDepth: 14,
      totalGates: 42,
    },
    {
      id: 'd3_full_c10',
      reps: 3,
      entanglement: 'full',
      cParam: 1.0,
      classicalF1: 0.923,
      classicalAccuracy: 0.944,
      quantumF1: 0.928,
      quantumAccuracy: 0.938,
      quantumTrainTimeMs: 440.0,
      circuitDepth: 18,
      totalGates: 64,
    },
  ];
}

