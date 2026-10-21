import { FeatureKey } from '../types/microgrid';

export interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
  expectedCondition: 'Normal' | 'Abnormal';
  rootCause: string;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'normal_equilibrium',
    name: 'Normal Operating Conditions',
    badge: 'Nominal Baseline',
    description: 'Daytime solar PV generation covering moderate commercial load with battery in floating absorption state.',
    demand_kw: 52.0,
    solar_kw: 48.0,
    battery_soc_pct: 72.0,
    voltage_dev_v: 0.4,
    frequency_dev_hz: 0.012,
    expectedCondition: 'Normal',
    rootCause: 'All telemetry variables well within IEEE 1547 / EN 50160 compliance limits.',
  },
  {
    id: 'sudden_demand_spike',
    name: 'Sudden Industrial Demand Spike',
    badge: 'Heavy Load Transient',
    description: 'Sudden manufacturing load activation creating severe power deficit and instantaneous voltage dip.',
    demand_kw: 138.0,
    solar_kw: 36.0,
    battery_soc_pct: 38.0,
    voltage_dev_v: -8.8,
    frequency_dev_hz: -0.34,
    expectedCondition: 'Abnormal',
    rootCause: 'BESS inverter discharge current ceiling reached; severe voltage sag (-8.8V) and frequency droop.',
  },
  {
    id: 'solar_drop',
    name: 'Solar PV Cloud/Inverter Trip',
    badge: 'Generation Deficit',
    description: 'Rapid 85% generation drop during midday peak without primary frequency spinning reserves.',
    demand_kw: 72.0,
    solar_kw: 5.5,
    battery_soc_pct: 46.0,
    voltage_dev_v: -6.2,
    frequency_dev_hz: -0.24,
    expectedCondition: 'Abnormal',
    rootCause: 'Generation loss causes rapid RoCoF (Rate of Change of Frequency) and bus voltage drop.',
  },
  {
    id: 'voltage_sag',
    name: 'Feeder Voltage Sag / Swell',
    badge: 'Power Quality Anomaly',
    description: 'Capacitor bank switching error or distribution line tap-changer failure causing severe voltage deviation.',
    demand_kw: 56.0,
    solar_kw: 42.0,
    battery_soc_pct: 64.0,
    voltage_dev_v: -11.6,
    frequency_dev_hz: -0.05,
    expectedCondition: 'Abnormal',
    rootCause: 'Voltage regulation breach (> ±6.0V) threatening sensitive inverter-connected appliances.',
  },
  {
    id: 'cascading_failure',
    name: 'Combined Cascading Overload',
    badge: 'Multi-Modal Emergency',
    description: 'Triple failure: low battery reserve, abrupt PV trip, and elevated evening peak demand.',
    demand_kw: 145.0,
    solar_kw: 3.0,
    battery_soc_pct: 14.0,
    voltage_dev_v: -13.8,
    frequency_dev_hz: -0.58,
    expectedCondition: 'Abnormal',
    rootCause: 'Under-frequency load shedding (UFLS) trigger threshold breached; impending island blackout.',
  },
];

export interface EngineeringDiagnosis {
  voltageStatus: 'nominal' | 'warning' | 'critical';
  frequencyStatus: 'nominal' | 'warning' | 'critical';
  powerBalanceKw: number; // generation + battery discharge - demand
  isEngineeringAbnormal: boolean;
  warnings: string[];
}

export function evaluatePhysicalLimits(values: {
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
}): EngineeringDiagnosis {
  const warnings: string[] = [];

  // Voltage criteria (Nominal: |dev| <= 3V, Warning: 3V < |dev| <= 6V, Critical: > 6V)
  let voltageStatus: 'nominal' | 'warning' | 'critical' = 'nominal';
  const absV = Math.abs(values.voltage_dev_v);
  if (absV > 6.0) {
    voltageStatus = 'critical';
    warnings.push(`Voltage deviation (${values.voltage_dev_v.toFixed(1)}V) violates IEEE 1547 ±6V threshold.`);
  } else if (absV > 3.0) {
    voltageStatus = 'warning';
    warnings.push(`Voltage deviation (${values.voltage_dev_v.toFixed(1)}V) is outside nominal ±3V band.`);
  }

  // Frequency criteria (Nominal: |dev| <= 0.05Hz, Warning: 0.05 < |dev| <= 0.20Hz, Critical: > 0.20Hz)
  let frequencyStatus: 'nominal' | 'warning' | 'critical' = 'nominal';
  const absF = Math.abs(values.frequency_dev_hz);
  if (absF > 0.2) {
    frequencyStatus = 'critical';
    warnings.push(`Frequency deviation (${values.frequency_dev_hz.toFixed(3)}Hz) breaches stability limit (±0.20Hz).`);
  } else if (absF > 0.05) {
    frequencyStatus = 'warning';
    warnings.push(`Frequency deviation (${values.frequency_dev_hz.toFixed(3)}Hz) exceeds normal operating envelope.`);
  }

  // Battery & Power Balance estimate (Assuming 50 kW max discharge when SoC > 20%)
  const maxDischargeKw = values.battery_soc_pct > 20 ? Math.min(50, (values.battery_soc_pct - 20) * 1.5) : 0;
  const netSupply = values.solar_kw + maxDischargeKw;
  const powerBalanceKw = Number((netSupply - values.demand_kw).toFixed(1));

  if (powerBalanceKw < -30) {
    warnings.push(`Severe microgrid power deficit of ${Math.abs(powerBalanceKw)} kW.`);
  }

  const isEngineeringAbnormal =
    voltageStatus === 'critical' ||
    frequencyStatus === 'critical' ||
    powerBalanceKw < -40 ||
    values.battery_soc_pct < 15;

  return {
    voltageStatus,
    frequencyStatus,
    powerBalanceKw,
    isEngineeringAbnormal,
    warnings,
  };
}
