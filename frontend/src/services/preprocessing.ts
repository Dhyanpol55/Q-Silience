import { FeatureKey, MicrogridSample, ScalerModel } from '../types/microgrid';

export interface DatasetSplit {
  trainSamples: MicrogridSample[];
  testSamples: MicrogridSample[];
  X_train: number[][];
  y_train: number[];
  X_test: number[][];
  y_test: number[];
  scaler: ScalerModel;
  featureKeys: FeatureKey[];
}

/**
 * Stratified Train / Test split preserving class balance
 */
export function stratifiedTrainTestSplit(
  samples: MicrogridSample[],
  testRatio: number = 0.25,
  seed: number = 42
): { train: MicrogridSample[]; test: MicrogridSample[] } {
  // Deterministic shuffle
  let s = seed >>> 0;
  const rng = () => {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const normal = samples.filter((x) => x.is_abnormal === 0);
  const abnormal = samples.filter((x) => x.is_abnormal === 1);

  // Shuffle both classes independently
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const shufNormal = shuffle(normal);
  const shufAbnormal = shuffle(abnormal);

  const testNormalCount = Math.max(1, Math.round(shufNormal.length * testRatio));
  const testAbnormalCount = Math.max(1, Math.round(shufAbnormal.length * testRatio));

  const test = [...shufNormal.slice(0, testNormalCount), ...shufAbnormal.slice(0, testAbnormalCount)];
  const train = [...shufNormal.slice(testNormalCount), ...shufAbnormal.slice(testAbnormalCount)];

  return {
    train: shuffle(train),
    test: shuffle(test),
  };
}

/**
 * Fits a scaler (MinMax to [0, 2pi] or Standard) ONLY on training data
 */
export function fitScaler(
  samples: MicrogridSample[],
  featureKeys: FeatureKey[],
  scalerType: 'minmax' | 'standard' = 'minmax'
): ScalerModel {
  const n = samples.length;
  const numFeatures = featureKeys.length;

  if (scalerType === 'minmax') {
    const mins = new Array(numFeatures).fill(Infinity);
    const maxs = new Array(numFeatures).fill(-Infinity);

    for (const sample of samples) {
      featureKeys.forEach((key, idx) => {
        const val = sample[key];
        if (val < mins[idx]) mins[idx] = val;
        if (val > maxs[idx]) maxs[idx] = val;
      });
    }

    // Ensure non-zero range to avoid division by zero
    for (let i = 0; i < numFeatures; i++) {
      if (maxs[i] === mins[i]) {
        maxs[i] += 1.0;
      }
    }

    return {
      type: 'minmax',
      featureKeys,
      mins,
      maxs,
    };
  } else {
    // StandardScaler
    const means = new Array(numFeatures).fill(0);
    for (const sample of samples) {
      featureKeys.forEach((key, idx) => {
        means[idx] += sample[key];
      });
    }
    for (let i = 0; i < numFeatures; i++) {
      means[i] /= n;
    }

    const stds = new Array(numFeatures).fill(0);
    for (const sample of samples) {
      featureKeys.forEach((key, idx) => {
        stds[idx] += Math.pow(sample[key] - means[idx], 2);
      });
    }
    for (let i = 0; i < numFeatures; i++) {
      stds[i] = Math.sqrt(stds[i] / (n > 1 ? n - 1 : 1)) || 1.0;
    }

    return {
      type: 'standard',
      featureKeys,
      means,
      stds,
    };
  }
}

/**
 * Transforms raw sample values into scaled array using fitted scaler parameters.
 * When type is 'minmax', maps to target range [0.1, 2 * Math.PI - 0.1] to be perfectly suitable for ZZFeatureMap angle encoding.
 */
export function transformSample(
  sample: Partial<Record<FeatureKey, number>>,
  scaler: ScalerModel
): number[] {
  const { type, featureKeys, mins, maxs, means, stds } = scaler;

  return featureKeys.map((key, idx) => {
    const raw = sample[key] ?? 0;
    if (type === 'minmax' && mins && maxs) {
      const min = mins[idx];
      const max = maxs[idx];
      const normalized01 = Math.max(0, Math.min(1, (raw - min) / (max - min)));
      // Map to angle range [0, 2*pi]
      return normalized01 * 2 * Math.PI;
    } else if (type === 'standard' && means && stds) {
      const mean = means[idx];
      const std = stds[idx];
      return (raw - mean) / std;
    }
    return raw;
  });
}

/**
 * Prepares the complete dataset split with train-fitted scaler
 */
export function preparePreprocessedDataset(
  samples: MicrogridSample[],
  featureKeys: FeatureKey[] = ['demand_kw', 'solar_kw', 'voltage_dev_v', 'frequency_dev_hz'],
  testRatio: number = 0.25,
  seed: number = 42
): DatasetSplit {
  const { train, test } = stratifiedTrainTestSplit(samples, testRatio, seed);
  const scaler = fitScaler(train, featureKeys, 'minmax');

  const X_train = train.map((s) => transformSample(s, scaler));
  const y_train = train.map((s) => (s.is_abnormal === 1 ? 1 : -1)); // -1 and +1 for SVM dual formulation

  const X_test = test.map((s) => transformSample(s, scaler));
  const y_test = test.map((s) => (s.is_abnormal === 1 ? 1 : -1));

  return {
    trainSamples: train,
    testSamples: test,
    X_train,
    y_train,
    X_test,
    y_test,
    scaler,
    featureKeys,
  };
}
