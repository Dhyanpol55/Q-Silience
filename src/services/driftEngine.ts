import { MicrogridSample, FeatureKey } from '../types/microgrid';

export interface DriftScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  physicalMechanism: string;
}

export const DRIFT_SCENARIOS: DriftScenario[] = [
  {
    id: 'winter_solar_attenuation',
    name: 'Winter Seasonal Solar Attenuation',
    badge: 'Seasonal Irradiance Drift',
    description: 'Cloud cover and low solar zenith angle reduce daytime PV peak by ~50%, while resistive heating increases continuous load demand.',
    physicalMechanism: 'Solar irradiance contracted; demand shifted upward; battery cycling deeper.',
  },
  {
    id: 'feeder_impedance_aging',
    name: 'Distribution Feeder Aging & Impedance Drift',
    badge: 'Infrastructure Degradation',
    description: 'Long-term terminal oxidation and cable aging increase line impedance (R + jX), exacerbating line drop and voltage volatility.',
    physicalMechanism: 'Mean bus voltage shifted down (-3.2 V); higher voltage variance; slight frequency jitter.',
  },
  {
    id: 'industrial_inrush_heatwave',
    name: 'Heatwave & Industrial Motor In-rush',
    badge: 'Heavy Load Shift',
    description: 'Elevated ambient temperatures reduce battery round-trip efficiency while heavy industrial inductive motors operate continuously.',
    physicalMechanism: 'Demand baseline elevated (+32 kW); BESS SoC depleted; negative voltage droop.',
  },
];

export interface FeatureDriftMetric {
  featureKey: FeatureKey;
  label: string;
  unit: string;
  ksStatistic: number; // Kolmogorov-Smirnov D statistic ∈ [0, 1]
  ksSeverity: 'Negligible' | 'Moderate Drift' | 'Severe Drift';
  psi: number; // Population Stability Index
  psiSeverity: 'Stable' | 'Moderate Shift' | 'Significant Shift';
  originalMean: number;
  shiftedMean: number;
  originalStd: number;
  shiftedStd: number;
  meanDeltaPct: number;
}

/**
 * Computes the exact Two-Sample Kolmogorov-Smirnov (KS) distance:
 * D = sup_x |F1(x) - F2(x)|
 */
export function computeKSDistance(sample1: number[], sample2: number[]): {
  dStat: number;
  severity: 'Negligible' | 'Moderate Drift' | 'Severe Drift';
} {
  if (sample1.length === 0 || sample2.length === 0) {
    return { dStat: 0, severity: 'Negligible' };
  }

  const s1 = [...sample1].sort((a, b) => a - b);
  const s2 = [...sample2].sort((a, b) => a - b);
  const n1 = s1.length;
  const n2 = s2.length;

  let i1 = 0;
  let i2 = 0;
  let dMax = 0;

  while (i1 < n1 && i2 < n2) {
    const v1 = s1[i1];
    const v2 = s2[i2];
    const currentVal = Math.min(v1, v2);

    while (i1 < n1 && s1[i1] <= currentVal) i1++;
    while (i2 < n2 && s2[i2] <= currentVal) i2++;

    const cdf1 = i1 / n1;
    const cdf2 = i2 / n2;
    const diff = Math.abs(cdf1 - cdf2);
    if (diff > dMax) dMax = diff;
  }

  const dStat = Number(dMax.toFixed(3));
  let severity: 'Negligible' | 'Moderate Drift' | 'Severe Drift' = 'Negligible';
  if (dStat >= 0.28) severity = 'Severe Drift';
  else if (dStat >= 0.14) severity = 'Moderate Drift';

  return { dStat, severity };
}

/**
 * Computes Population Stability Index (PSI):
 * PSI = sum_b (Actual_b - Expected_b) * ln(Actual_b / Expected_b)
 */
export function computePSI(
  original: number[],
  shifted: number[],
  binsCount = 8
): {
  psi: number;
  severity: 'Stable' | 'Moderate Shift' | 'Significant Shift';
} {
  if (original.length === 0 || shifted.length === 0) {
    return { psi: 0, severity: 'Stable' };
  }

  const allVals = [...original, ...shifted];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const span = maxVal - minVal || 1;
  const binWidth = span / binsCount;

  const getBinIndex = (v: number) => {
    const idx = Math.floor((v - minVal) / binWidth);
    return Math.min(binsCount - 1, Math.max(0, idx));
  };

  const origCounts = new Array(binsCount).fill(0);
  const shiftCounts = new Array(binsCount).fill(0);

  for (const v of original) origCounts[getBinIndex(v)]++;
  for (const v of shifted) shiftCounts[getBinIndex(v)]++;

  const eps = 1e-4;
  let totalPsi = 0;

  for (let b = 0; b < binsCount; b++) {
    const p = Math.max(eps, origCounts[b] / original.length);
    const q = Math.max(eps, shiftCounts[b] / shifted.length);
    totalPsi += (q - p) * Math.log(q / p);
  }

  const psi = Math.max(0, Number(totalPsi.toFixed(3)));
  let severity: 'Stable' | 'Moderate Shift' | 'Significant Shift' = 'Stable';
  if (psi >= 0.25) severity = 'Significant Shift';
  else if (psi >= 0.10) severity = 'Moderate Shift';

  return { psi, severity };
}

/**
 * Generates a physically shifted dataset reflecting specific distribution drifts
 */
export function generateShiftedDataset(
  samples: MicrogridSample[],
  scenarioId: string
): MicrogridSample[] {
  return samples.map((sample, idx) => {
    let dDemand = 0;
    let dSolar = 0;
    let dSoc = 0;
    let dVolt = 0;
    let dFreq = 0;

    // Pseudo-random deterministic noise based on sample id
    const pseudo = Math.sin(idx * 7919 + 42) * 0.5;

    switch (scenarioId) {
      case 'winter_solar_attenuation':
        // Solar drops 52%, demand increases +18 kW, battery drains
        dSolar = -sample.solar_kw * 0.52 + pseudo * 2.0;
        dDemand = 18.0 + pseudo * 5.0;
        dSoc = -12.0 + pseudo * 3.0;
        dVolt = -1.8 + pseudo * 0.5;
        dFreq = -0.06 + pseudo * 0.02;
        break;

      case 'feeder_impedance_aging':
        // Line impedance causes voltage sag (-3.4V) and jitter
        dVolt = -3.4 + pseudo * 2.5;
        dFreq = -0.08 + pseudo * 0.05;
        dDemand = 4.0 + pseudo * 3.0;
        dSolar = pseudo * 2.0;
        dSoc = -4.0 + pseudo * 2.0;
        break;

      case 'industrial_inrush_heatwave':
        // Heavy load surge, high SOC depletion, severe voltage and frequency sag
        dDemand = 32.0 + pseudo * 8.0;
        dSolar = -4.0 + pseudo * 3.0;
        dSoc = -22.0 + pseudo * 4.0;
        dVolt = -4.6 + pseudo * 1.5;
        dFreq = -0.15 + pseudo * 0.04;
        break;

      default:
        break;
    }

    const demand_kw = Math.max(10, sample.demand_kw + dDemand);
    const solar_kw = Math.max(0, sample.solar_kw + dSolar);
    const battery_soc_pct = Math.min(100, Math.max(5, sample.battery_soc_pct + dSoc));
    const voltage_dev_v = sample.voltage_dev_v + dVolt;
    const frequency_dev_hz = sample.frequency_dev_hz + dFreq;

    // Determine if physical thresholds are breached
    const isAbnormal =
      Math.abs(voltage_dev_v) > 6.0 ||
      Math.abs(frequency_dev_hz) > 0.20 ||
      battery_soc_pct < 15.0 ||
      demand_kw > 115.0;

    return {
      ...sample,
      id: `SHIFT-${sample.id}`,
      demand_kw: Number(demand_kw.toFixed(2)),
      solar_kw: Number(solar_kw.toFixed(2)),
      battery_soc_pct: Number(battery_soc_pct.toFixed(1)),
      voltage_dev_v: Number(voltage_dev_v.toFixed(2)),
      frequency_dev_hz: Number(frequency_dev_hz.toFixed(3)),
      is_abnormal: isAbnormal ? 1 : 0,
      scenario_reason: `Drift Simulation [${scenarioId}]: ${isAbnormal ? 'Boundary Excursion' : 'Shifted Operating Envelope'}`,
    };
  });
}

/**
 * Analyzes feature drift across all 4 core telemetry variables
 */
export function analyzeAllFeatureDrift(
  originalSamples: MicrogridSample[],
  shiftedSamples: MicrogridSample[]
): FeatureDriftMetric[] {
  const features: { key: FeatureKey; label: string; unit: string }[] = [
    { key: 'demand_kw', label: 'Active Demand', unit: 'kW' },
    { key: 'solar_kw', label: 'Solar Generation', unit: 'kW' },
    { key: 'voltage_dev_v', label: 'Voltage Deviation', unit: 'V' },
    { key: 'frequency_dev_hz', label: 'Frequency Deviation', unit: 'Hz' },
  ];

  return features.map(({ key, label, unit }) => {
    const origVals = originalSamples.map((s) => s[key]);
    const shiftVals = shiftedSamples.map((s) => s[key]);

    const origMean = origVals.reduce((a, b) => a + b, 0) / (origVals.length || 1);
    const shiftMean = shiftVals.reduce((a, b) => a + b, 0) / (shiftVals.length || 1);

    const origVar = origVals.reduce((a, b) => a + Math.pow(b - origMean, 2), 0) / (origVals.length || 1);
    const shiftVar = shiftVals.reduce((a, b) => a + Math.pow(b - shiftMean, 2), 0) / (shiftVals.length || 1);

    const origStd = Math.sqrt(origVar);
    const shiftStd = Math.sqrt(shiftVar);

    const meanDeltaPct = origMean !== 0 ? ((shiftMean - origMean) / Math.abs(origMean)) * 100 : 0;

    const { dStat, severity: ksSeverity } = computeKSDistance(origVals, shiftVals);
    const { psi, severity: psiSeverity } = computePSI(origVals, shiftVals, 8);

    return {
      featureKey: key,
      label,
      unit,
      ksStatistic: dStat,
      ksSeverity,
      psi,
      psiSeverity,
      originalMean: Number(origMean.toFixed(2)),
      shiftedMean: Number(shiftMean.toFixed(2)),
      originalStd: Number(origStd.toFixed(2)),
      shiftedStd: Number(shiftStd.toFixed(2)),
      meanDeltaPct: Number(meanDeltaPct.toFixed(1)),
    };
  });
}

/**
 * Computes comparative histogram bins for side-by-side distribution chart
 */
export function computeDistributionHistogram(
  originalSamples: MicrogridSample[],
  shiftedSamples: MicrogridSample[],
  featureKey: FeatureKey,
  binsCount = 7
): { binLabel: string; original: number; shifted: number }[] {
  const origVals = originalSamples.map((s) => s[featureKey]);
  const shiftVals = shiftedSamples.map((s) => s[featureKey]);

  const allVals = [...origVals, ...shiftVals];
  if (allVals.length === 0) return [];

  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const span = maxVal - minVal || 1;
  const binWidth = span / binsCount;

  const bins: { binLabel: string; original: number; shifted: number }[] = [];

  for (let b = 0; b < binsCount; b++) {
    const low = minVal + b * binWidth;
    const high = low + binWidth;
    const label = `${low.toFixed(1)} - ${high.toFixed(1)}`;

    const origCount = origVals.filter((v) => (b === binsCount - 1 ? v >= low && v <= high : v >= low && v < high)).length;
    const shiftCount = shiftVals.filter((v) => (b === binsCount - 1 ? v >= low && v <= high : v >= low && v < high)).length;

    // Normalize to percentage
    const origPct = Number(((origCount / (origVals.length || 1)) * 100).toFixed(1));
    const shiftPct = Number(((shiftCount / (shiftVals.length || 1)) * 100).toFixed(1));

    bins.push({
      binLabel: label,
      original: origPct,
      shifted: shiftPct,
    });
  }

  return bins;
}
