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
    id: 'normal_operation',
    name: 'Normal Operation',
    badge: 'Nominal Baseline',
    description: 'Daytime solar PV generation balancing commercial load with battery in stable floating state (48 kW PV / 52 kW Load).',
    demand_kw: 52.0,
    solar_kw: 48.0,
    battery_soc_pct: 72.0,
    voltage_dev_v: 0.4,
    frequency_dev_hz: 0.012,
    expectedCondition: 'Normal',
    rootCause: 'All telemetry variables well within IEEE 1547 / EN 50160 compliance limits.',
  },
  {
    id: 'demand_surge',
    name: 'Demand Surge',
    badge: 'Heavy Load Transient',
    description: 'Sudden industrial manufacturing activation creating severe power deficit and instantaneous voltage dip.',
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
    name: 'Solar Generation Drop',
    badge: 'Generation Deficit',
    description: 'Rapid 85% generation drop during midday peak due to abrupt cloud ramp or inverter trip without spinning reserve.',
    demand_kw: 72.0,
    solar_kw: 5.5,
    battery_soc_pct: 46.0,
    voltage_dev_v: -6.2,
    frequency_dev_hz: -0.24,
    expectedCondition: 'Abnormal',
    rootCause: 'Generation loss causes rapid RoCoF (Rate of Change of Frequency) and bus voltage drop.',
  },
  {
    id: 'low_battery_charge',
    name: 'Low Battery Charge',
    badge: 'Storage Depletion',
    description: 'Battery state of charge falls into deep discharge threshold (<15% SoC) under moderate evening load.',
    demand_kw: 78.0,
    solar_kw: 12.0,
    battery_soc_pct: 11.5,
    voltage_dev_v: -5.4,
    frequency_dev_hz: -0.18,
    expectedCondition: 'Abnormal',
    rootCause: 'BESS BMS initiates emergency protection cutoff due to cell under-voltage.',
  },
  {
    id: 'voltage_deviation',
    name: 'Voltage Deviation',
    badge: 'Power Quality Anomaly',
    description: 'Capacitor bank switching error or tap-changer malfunction inducing severe phase voltage deviation (-11.8V).',
    demand_kw: 58.0,
    solar_kw: 40.0,
    battery_soc_pct: 62.0,
    voltage_dev_v: -11.8,
    frequency_dev_hz: -0.04,
    expectedCondition: 'Abnormal',
    rootCause: 'Voltage regulation breach (> ±6.0V) threatening sensitive inverter-connected equipment.',
  },
  {
    id: 'frequency_deviation',
    name: 'Frequency Deviation',
    badge: 'Grid Stability Breach',
    description: 'Sub-synchronous resonance or islanding governor lag causing grid frequency drift to 49.58 Hz (-0.42 Hz droop).',
    demand_kw: 65.0,
    solar_kw: 35.0,
    battery_soc_pct: 55.0,
    voltage_dev_v: -1.2,
    frequency_dev_hz: -0.42,
    expectedCondition: 'Abnormal',
    rootCause: 'Frequency droop exceeds ±0.20 Hz threshold, risking trip of anti-islanding relays.',
  },
  {
    id: 'cascading_failure',
    name: 'Cascading Overload',
    badge: 'Multi-Modal Emergency',
    description: 'Triple simultaneous failure: depleted battery reserve, sudden PV trip, and elevated industrial peak demand.',
    demand_kw: 145.0,
    solar_kw: 3.0,
    battery_soc_pct: 14.0,
    voltage_dev_v: -13.8,
    frequency_dev_hz: -0.58,
    expectedCondition: 'Abnormal',
    rootCause: 'Under-frequency load shedding (UFLS) trigger threshold breached; impending microgrid blackout.',
  },
];

export interface EngineeringDiagnosis {
  voltageStatus: 'nominal' | 'warning' | 'critical';
  frequencyStatus: 'nominal' | 'warning' | 'critical';
  powerBalanceKw: number; // generation + battery discharge - demand
  isEngineeringAbnormal: boolean;
  warnings: string[];
}

export interface StressTestScenario {
  id: string;
  name: string;
  code: string;
  category: 'Compound Generation & Load' | 'Storage & Feeder Sag' | 'Multi-Sensor Resonance' | 'Extreme Swell & Transient';
  description: string;
  disturbances: string[];
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
  expectedClass: 'ABNORMAL';
  resilienceChallenge: string;
}

export const STRESS_TEST_SCENARIOS: StressTestScenario[] = [
  {
    id: 'stress_compound_alpha',
    name: 'Compound Alpha: Solar Trip + Industrial Inrush',
    code: 'STRESS-01',
    category: 'Compound Generation & Load',
    description: 'Simultaneous 88% solar PV generation loss and instantaneous 142 kW industrial motor in-rush load surge.',
    disturbances: ['Solar PV Generation Drop (-88%)', 'Industrial In-Rush (+90 kW)', 'Frequency Droop (-0.38 Hz)'],
    demand_kw: 142.0,
    solar_kw: 4.2,
    battery_soc_pct: 42.0,
    voltage_dev_v: -8.4,
    frequency_dev_hz: -0.38,
    expectedClass: 'ABNORMAL',
    resilienceChallenge: 'Tests model sensitivity to simultaneous generation-demand divergence where classical linear boundaries often underestimate cross-feature correlation.',
  },
  {
    id: 'stress_compound_beta',
    name: 'Compound Beta: Depleted Storage + Evening Peak',
    code: 'STRESS-02',
    category: 'Storage & Feeder Sag',
    description: 'BESS battery pack enters emergency under-voltage cutoff (11% SoC) during evening peak demand with zero PV support.',
    disturbances: ['BESS Depletion (11% SoC)', 'Zero Solar Irradiance', 'Feeder Voltage Sag (-9.2 V)'],
    demand_kw: 110.0,
    solar_kw: 0.0,
    battery_soc_pct: 11.0,
    voltage_dev_v: -9.2,
    frequency_dev_hz: -0.28,
    expectedClass: 'ABNORMAL',
    resilienceChallenge: 'Tests detection of unserved load conditions and voltage collapse without relying solely on large frequency transients.',
  },
  {
    id: 'stress_compound_gamma',
    name: 'Compound Gamma: Triple-Sensor Multi-Deviation',
    code: 'STRESS-03',
    category: 'Multi-Sensor Resonance',
    description: 'Non-linear harmonic resonance causing concurrent voltage sag (-7.8V), frequency droop (-0.34Hz), and solar inverter derating.',
    disturbances: ['Voltage Sag (-7.8 V)', 'Frequency Droop (-0.34 Hz)', 'PV Inverter Thermal Throttle (18 kW)'],
    demand_kw: 85.0,
    solar_kw: 18.0,
    battery_soc_pct: 29.0,
    voltage_dev_v: -7.8,
    frequency_dev_hz: -0.34,
    expectedClass: 'ABNORMAL',
    resilienceChallenge: 'ZZFeatureMap quantum kernel specifically excels here by encoding pairwise feature angles (V * f interaction) in Hilbert space.',
  },
  {
    id: 'stress_compound_delta',
    name: 'Compound Delta: Sub-cycle Swell & Over-Frequency',
    code: 'STRESS-04',
    category: 'Extreme Swell & Transient',
    description: 'Capacitor bank over-compensation coupled with sudden load rejection inducing +9.5V voltage swell and +0.32Hz over-frequency.',
    disturbances: ['Voltage Swell (+9.5 V)', 'Over-Frequency (+0.32 Hz)', 'Sudden Load Loss (22 kW)'],
    demand_kw: 22.0,
    solar_kw: 65.0,
    battery_soc_pct: 88.0,
    voltage_dev_v: 9.5,
    frequency_dev_hz: 0.32,
    expectedClass: 'ABNORMAL',
    resilienceChallenge: 'Evaluates bidirectional threshold symmetry — verifying models do not only alert on negative deficits but also over-voltage swells.',
  },
];

export interface DecisionSupportAdvice {
  urgencyLevel: 'CRITICAL_EMERGENCY' | 'ELEVATED_ALERT' | 'NOMINAL_ADVISORY';
  badgeColor: string;
  headline: string;
  governingStandard: string;
  disclaimer: string;
  recommendedDiagnostics: string[];
  immediateChecklist: { step: string; priority: 'Immediate' | 'Secondary' | 'Preventive'; rationale: string }[];
  operatorHypothesis: string;
}

export function evaluateDecisionSupport(values: {
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
}): DecisionSupportAdvice {
  const disclaimer = 'ADVISORY ONLY — Decision support guidance provides structured engineering diagnostic steps and does NOT issue commands to physical switchgear or guarantee fault clearing.';
  const absV = Math.abs(values.voltage_dev_v);
  const absF = Math.abs(values.frequency_dev_hz);

  // Critical conditions
  if (absV > 6.0 || absF > 0.20 || values.battery_soc_pct < 15.0) {
    return {
      urgencyLevel: 'CRITICAL_EMERGENCY',
      badgeColor: 'rose',
      headline: 'Immediate Physical Boundary Breach — Anti-Islanding / Trip Hazard',
      governingStandard: 'IEEE 1547.4 Clause 5.2 (Unintentional Islanding) & EN 50160 Class 1',
      disclaimer,
      operatorHypothesis: absF > 0.20
        ? 'Severe frequency droop indicates major power imbalance or lost spinning reserve.'
        : absV > 6.0
        ? 'Voltage excursion exceeds statutory ±6V distribution band; check feeder tap-changer and inverter VAR dispatch.'
        : 'Battery SoC below 15% cutoff threshold; imminent BMS emergency disconnect.',
      recommendedDiagnostics: [
        'Verify point-of-common-coupling (PCC) circuit breaker status and relay trip logs.',
        'Inspect BESS battery management system (BMS) cell voltage symmetry and thermal telemetry.',
        'Confirm solar PV inverter Phase-Locked Loop (PLL) synchronization state.',
      ],
      immediateChecklist: [
        {
          step: '1. Inspect Frequency & RoCoF Relays',
          priority: 'Immediate',
          rationale: `Measured frequency deviation is ${values.frequency_dev_hz > 0 ? '+' : ''}${values.frequency_dev_hz.toFixed(3)} Hz (threshold ±0.20 Hz).`,
        },
        {
          step: '2. Check Inverter Voltage Regulation Mode (Volt-VAR)',
          priority: 'Immediate',
          rationale: `Bus voltage deviation is ${values.voltage_dev_v > 0 ? '+' : ''}${values.voltage_dev_v.toFixed(1)} V (standard ±6.0 V).`,
        },
        {
          step: '3. Verify Critical Load Shedding Priority List',
          priority: 'Secondary',
          rationale: `Total demand is ${values.demand_kw.toFixed(1)} kW vs solar supply ${values.solar_kw.toFixed(1)} kW.`,
        },
      ],
    };
  }

  // Elevated Warning
  if (absV > 3.0 || absF > 0.05 || values.battery_soc_pct < 25.0) {
    return {
      urgencyLevel: 'ELEVATED_ALERT',
      badgeColor: 'amber',
      headline: 'Operating Envelope Marginal — Elevated Drift Detected',
      governingStandard: 'IEEE 1547 Normal Operating Performance Category B',
      disclaimer,
      operatorHypothesis: 'Telemetry is within absolute trip limits but drifting toward trip margins. Requires monitoring and preventive dispatch adjustment.',
      recommendedDiagnostics: [
        'Monitor battery cycle degradation and state-of-health (SoH).',
        'Check local transformer loading and feeder reactive power consumption.',
        'Inspect short-term cloud cover forecast for impending generation drop.',
      ],
      immediateChecklist: [
        {
          step: '1. Pre-charge BESS Storage Reserve',
          priority: 'Immediate',
          rationale: `Battery SoC is currently ${values.battery_soc_pct.toFixed(0)}%; maintain buffer above 25%.`,
        },
        {
          step: '2. Log Feeder Impedance Step',
          priority: 'Secondary',
          rationale: `Voltage deviation at ${values.voltage_dev_v.toFixed(1)} V indicates line loading increase.`,
        },
        {
          step: '3. Calibrate Inverter Droop Response Curve',
          priority: 'Preventive',
          rationale: 'Ensure governor response responds smoothly to minor frequency excursions.',
        },
      ],
    };
  }

  // Nominal Equilibrium
  return {
    urgencyLevel: 'NOMINAL_ADVISORY',
    badgeColor: 'emerald',
    headline: 'Nominal Physical Equilibrium — Grid Variables Balanced',
    governingStandard: 'IEEE 1547.4 Normal State & EN 50160 Compliant',
    disclaimer,
    operatorHypothesis: 'All telemetry channels are operating comfortably within physical tolerance bands with stable power flow.',
    recommendedDiagnostics: [
      'Routine telemetry polling and sensor calibration check.',
      'Log baseline feature vectors for model drift observatory tracking.',
    ],
    immediateChecklist: [
      {
        step: '1. Maintain Baseline Telemetry Logging',
        priority: 'Preventive',
        rationale: 'Steady-state operation serves as the nominal baseline for QSVC kernel evaluation.',
      },
      {
        step: '2. Validate Energy Management System (EMS) Scheduling',
        priority: 'Preventive',
        rationale: 'Ensure economic dispatch balances solar capture and battery longevity.',
      },
    ],
  };
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
