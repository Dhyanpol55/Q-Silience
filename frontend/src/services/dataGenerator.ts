import { MicrogridSample } from '../types/microgrid';

// Seeded pseudo-random number generator (Mulberry32)
function createRng(seed: number) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for normal distribution
function normalRandom(rng: () => number, mean: number, std: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

/**
 * Generate synthetic microgrid dataset with deterministic seed.
 * Total sample size typically 80-240 for interactive quantum simulation.
 */
export function generateSyntheticMicrogridData(
  sampleCount: number = 120,
  seed: number = 42,
  abnormalRatio: number = 0.35
): MicrogridSample[] {
  const rng = createRng(seed);
  const samples: MicrogridSample[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const isAbnormal = rng() < abnormalRatio ? 1 : 0;
    const hour = Math.floor((i % 24));
    const timestamp = `2026-10-21T${hour.toString().padStart(2, '0')}:${Math.floor(rng() * 60).toString().padStart(2, '0')}:00Z`;

    let demand_kw = 0;
    let solar_kw = 0;
    let battery_soc_pct = 0;
    let voltage_dev_v = 0;
    let frequency_dev_hz = 0;
    let scenario_type: MicrogridSample['scenario_type'] = 'normal';
    let scenario_reason = 'Nominal grid equilibrium. Supply balanced with load.';

    // Base solar diurnal profile (bell curve centered at noon)
    const solarBase = hour >= 6 && hour <= 18
      ? Math.sin(((hour - 6) / 12) * Math.PI) * 65
      : 0;

    if (isAbnormal === 0) {
      // Normal operating condition
      demand_kw = Math.max(15, normalRandom(rng, 55, 12));
      solar_kw = Math.max(0, normalRandom(rng, solarBase, 4));
      battery_soc_pct = Math.min(95, Math.max(30, normalRandom(rng, 65, 12)));
      voltage_dev_v = normalRandom(rng, 0.2, 1.2); // Within ±3V
      frequency_dev_hz = normalRandom(rng, 0.01, 0.025); // Within ±0.06 Hz
      scenario_type = 'normal';
    } else {
      // Abnormal scenarios
      const scenarioRoll = rng();
      if (scenarioRoll < 0.25) {
        // Sudden Demand Spike
        scenario_type = 'demand_spike';
        demand_kw = Math.max(105, normalRandom(rng, 130, 15));
        solar_kw = Math.max(0, normalRandom(rng, solarBase * 0.9, 5));
        battery_soc_pct = Math.max(18, normalRandom(rng, 42, 10));
        voltage_dev_v = normalRandom(rng, -7.5, 2.0); // Severe voltage sag
        frequency_dev_hz = normalRandom(rng, -0.32, 0.08); // Grid inertia dip
        scenario_reason = 'Industrial load surge exceeding instantaneous battery discharge rate.';
      } else if (scenarioRoll < 0.50) {
        // Solar Generation Drop
        scenario_type = 'solar_drop';
        demand_kw = Math.max(45, normalRandom(rng, 70, 10));
        solar_kw = Math.max(0, normalRandom(rng, Math.max(0, solarBase * 0.15), 2)); // 85% drop
        battery_soc_pct = Math.max(25, normalRandom(rng, 50, 10));
        voltage_dev_v = normalRandom(rng, -5.2, 1.8);
        frequency_dev_hz = normalRandom(rng, -0.22, 0.06);
        scenario_reason = 'Solar PV inverter trip during peak generation without spinning reserve.';
      } else if (scenarioRoll < 0.75) {
        // Voltage Sag / Swell Anomaly
        scenario_type = 'voltage_sag';
        demand_kw = Math.max(30, normalRandom(rng, 60, 12));
        solar_kw = Math.max(0, normalRandom(rng, solarBase, 5));
        battery_soc_pct = Math.max(30, normalRandom(rng, 60, 10));
        // Large voltage displacement (e.g. transformer tap changer stuck or lightning surge)
        voltage_dev_v = rng() > 0.5 ? normalRandom(rng, 9.5, 2.5) : normalRandom(rng, -10.5, 2.5);
        frequency_dev_hz = normalRandom(rng, 0.03, 0.09);
        scenario_reason = 'Feeder impedance fluctuation causing voltage regulation violation (> ±6V).';
      } else {
        // Cascading Overload Failure
        scenario_type = 'cascading_failure';
        demand_kw = Math.max(115, normalRandom(rng, 145, 12));
        solar_kw = Math.max(0, normalRandom(rng, solarBase * 0.2, 3));
        battery_soc_pct = Math.max(10, normalRandom(rng, 18, 4)); // Depleted battery
        voltage_dev_v = normalRandom(rng, -12.0, 2.5); // Severe collapse
        frequency_dev_hz = normalRandom(rng, -0.55, 0.12); // Underfrequency islanding risk
        scenario_reason = 'Cascading event: PV trip coupled with depleted BESS and peak load.';
      }
    }

    samples.push({
      id: `SAMPLE-${(i + 1).toString().padStart(4, '0')}`,
      timestamp,
      demand_kw: Number(demand_kw.toFixed(2)),
      solar_kw: Number(solar_kw.toFixed(2)),
      battery_soc_pct: Number(battery_soc_pct.toFixed(1)),
      voltage_dev_v: Number(voltage_dev_v.toFixed(2)),
      frequency_dev_hz: Number(frequency_dev_hz.toFixed(3)),
      is_abnormal: isAbnormal as 0 | 1,
      scenario_type,
      scenario_reason,
    });
  }

  return samples;
}

/**
 * Validates and parses uploaded CSV text.
 */
export function parseAndValidateCSV(csvText: string): {
  success: boolean;
  samples?: MicrogridSample[];
  error?: string;
  summary?: { total: number; normal: number; abnormal: number };
} {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 5) {
    return { success: false, error: 'CSV file must have a header and at least 4 data rows.' };
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const requiredCols = ['demand_kw', 'solar_kw', 'battery_soc_pct', 'voltage_dev_v', 'frequency_dev_hz', 'is_abnormal'];

  const missing = requiredCols.filter((col) => !header.includes(col));
  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required column(s): ${missing.join(', ')}. Expected: ${requiredCols.join(', ')}`,
    };
  }

  const colIdx: Record<string, number> = {};
  header.forEach((h, idx) => {
    colIdx[h] = idx;
  });

  const parsedSamples: MicrogridSample[] = [];
  let normalCount = 0;
  let abnormalCount = 0;

  for (let r = 1; r < lines.length; r++) {
    const row = lines[r].split(',').map((v) => v.trim());
    if (row.length < header.length) continue;

    const demand_kw = parseFloat(row[colIdx['demand_kw']]);
    const solar_kw = parseFloat(row[colIdx['solar_kw']]);
    const battery_soc_pct = parseFloat(row[colIdx['battery_soc_pct']]);
    const voltage_dev_v = parseFloat(row[colIdx['voltage_dev_v']]);
    const frequency_dev_hz = parseFloat(row[colIdx['frequency_dev_hz']]);
    const is_abnormal_raw = parseInt(row[colIdx['is_abnormal']], 10);

    if (
      isNaN(demand_kw) ||
      isNaN(solar_kw) ||
      isNaN(battery_soc_pct) ||
      isNaN(voltage_dev_v) ||
      isNaN(frequency_dev_hz) ||
      (is_abnormal_raw !== 0 && is_abnormal_raw !== 1)
    ) {
      return {
        success: false,
        error: `Row ${r + 1} contains invalid numeric data or label (is_abnormal must be 0 or 1).`,
      };
    }

    const is_abnormal = is_abnormal_raw as 0 | 1;
    if (is_abnormal === 1) abnormalCount++;
    else normalCount++;

    parsedSamples.push({
      id: `UPLOAD-${r.toString().padStart(4, '0')}`,
      timestamp: `2026-10-21T${(r % 24).toString().padStart(2, '0')}:00:00Z`,
      demand_kw,
      solar_kw,
      battery_soc_pct,
      voltage_dev_v,
      frequency_dev_hz,
      is_abnormal,
      scenario_type: is_abnormal === 1 ? 'custom' : 'normal',
      scenario_reason: is_abnormal === 1 ? 'External abnormal label' : 'External normal label',
    });
  }

  if (parsedSamples.length < 10) {
    return { success: false, error: 'Dataset too small: at least 10 valid samples are required.' };
  }

  if (normalCount === 0 || abnormalCount === 0) {
    return { success: false, error: 'Dataset must contain both Normal (0) and Abnormal (1) classes.' };
  }

  return {
    success: true,
    samples: parsedSamples,
    summary: { total: parsedSamples.length, normal: normalCount, abnormal: abnormalCount },
  };
}

/**
 * Converts microgrid samples to standard CSV string
 */
export function samplesToCSV(samples: MicrogridSample[]): string {
  const headers = [
    'sample_id',
    'timestamp',
    'demand_kw',
    'solar_kw',
    'battery_soc_pct',
    'voltage_dev_v',
    'frequency_dev_hz',
    'is_abnormal',
    'scenario_type',
    'scenario_reason',
  ];

  const rows = samples.map((s) =>
    [
      s.id,
      s.timestamp,
      s.demand_kw,
      s.solar_kw,
      s.battery_soc_pct,
      s.voltage_dev_v,
      s.frequency_dev_hz,
      s.is_abnormal,
      s.scenario_type,
      `"${s.scenario_reason?.replace(/"/g, '""') || ''}"`,
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
