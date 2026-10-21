import React from 'react';
import { MicrogridSample, ModelMetrics } from '../types/microgrid';
import { SVCTrainedModel } from '../services/svmSolver';
import { Zap, Info, ArrowUpRight, TrendingUp } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

interface OverviewPageProps {
  samples: MicrogridSample[];
  classicalModel: SVCTrainedModel | null;
  quantumModel: SVCTrainedModel | null;
  classicalMetrics: ModelMetrics | null;
  quantumMetrics: ModelMetrics | null;
  onNavigateToScenarioLab: () => void;
  onNavigateToQuantumLab: () => void;
  theme: 'dark' | 'light';
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  samples,
  classicalModel,
  quantumModel,
  classicalMetrics,
  quantumMetrics,
  onNavigateToScenarioLab,
  onNavigateToQuantumLab,
  theme,
}) => {
  const isDark = theme === 'dark';

  const normalSamples = samples.filter((s) => s.is_abnormal === 0);
  const abnormalSamples = samples.filter((s) => s.is_abnormal === 1);
  const abnormalPct = ((abnormalSamples.length / samples.length) * 100).toFixed(1);

  // Group by scenario type
  const scenarioCounts: Record<string, number> = {};
  samples.forEach((s) => {
    scenarioCounts[s.scenario_type] = (scenarioCounts[s.scenario_type] || 0) + 1;
  });

  // Prepare 24-hour time-series profile for Recharts AreaChart
  const timeSeriesData = samples.slice(0, 24).map((s, idx) => ({
    hour: `${(idx % 24).toString().padStart(2, '0')}:00`,
    demand: s.demand_kw,
    solar: s.solar_kw,
    battery: s.battery_soc_pct,
    voltageDev: s.voltage_dev_v,
    isAbnormal: s.is_abnormal === 1,
  }));

  // Scatter plot data for Recharts
  const scatterNormal = normalSamples.map((s) => ({
    x: s.frequency_dev_hz,
    y: s.voltage_dev_v,
    id: s.id,
    demand: s.demand_kw,
    solar: s.solar_kw,
    status: 'NORMAL',
    reason: s.scenario_reason,
  }));

  const scatterAbnormal = abnormalSamples.map((s) => ({
    x: s.frequency_dev_hz,
    y: s.voltage_dev_v,
    id: s.id,
    demand: s.demand_kw,
    solar: s.solar_kw,
    status: 'ABNORMAL',
    reason: s.scenario_reason,
  }));

  // Theme-adaptive classes
  const cardClass = isDark
    ? 'bg-slate-900/80 border-slate-800'
    : 'bg-white border-slate-200 shadow-xs';
  const innerCardClass = isDark
    ? 'bg-slate-950 border-slate-800/80'
    : 'bg-slate-50 border-slate-200';
  const headingClass = isDark ? 'text-white' : 'text-slate-900';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-slate-600';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Section */}
      <div
        className={`p-6 sm:p-8 rounded-xl border relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border-slate-800 shadow-xl'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 border-slate-700 shadow-md text-white'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="text-xs font-mono text-cyan-400 mb-2 flex items-center gap-2">
            <span>RESEARCH INITIATIVE</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>VTU QISKIT FALL FEST 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Quantum-Enhanced Microgrid Anomaly Detection
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Investigating whether quantum feature mapping in a Hilbert state space (via parameterized <strong className="text-cyan-300 font-semibold">Qiskit ZZFeatureMap</strong>) can effectively classify anomalous operating conditions in multi-modal renewable microgrids compared to classical Support Vector Classifiers.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToScenarioLab}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Scenario Lab</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToQuantumLab}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <span>Inspect ZZFeatureMap Circuit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dataset & Architecture Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border transition-colors ${cardClass}`}>
          <div className={`text-xs font-mono ${textMutedClass}`}>TOTAL DATASET</div>
          <div className={`mt-1 text-2xl font-bold font-mono ${headingClass}`}>{samples.length}</div>
          <div className={`mt-1 text-xs ${textMutedClass}`}>
            {normalSamples.length} Normal · {abnormalSamples.length} Abnormal ({abnormalPct}%)
          </div>
        </div>

        <div className={`p-4 rounded-lg border transition-colors ${cardClass}`}>
          <div className={`text-xs font-mono ${textMutedClass}`}>TRAIN / TEST SPLIT</div>
          <div className="mt-1 text-2xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">75% / 25%</div>
          <div className={`mt-1 text-xs ${textMutedClass}`}>Stratified · Scaler fit on Train only</div>
        </div>

        <div className={`p-4 rounded-lg border transition-colors ${cardClass}`}>
          <div className={`text-xs font-mono ${textMutedClass}`}>CLASSICAL SVC</div>
          <div className={`mt-1 text-2xl font-bold font-mono ${headingClass}`}>
            {classicalMetrics ? `${(classicalMetrics.accuracy * 100).toFixed(1)}%` : 'Ready'}
          </div>
          <div className={`mt-1 text-xs ${textMutedClass}`}>
            RBF Kernel · C=1.0 · {classicalModel?.svCount || 0} SVs
          </div>
        </div>

        <div className={`p-4 rounded-lg border transition-colors ${cardClass}`}>
          <div className={`text-xs font-mono ${textMutedClass}`}>QUANTUM QSVC</div>
          <div className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400 font-mono">
            {quantumMetrics ? `${(quantumMetrics.accuracy * 100).toFixed(1)}%` : 'Ready'}
          </div>
          <div className={`mt-1 text-xs ${textMutedClass}`}>
            ZZFeatureMap · 4 Qubits · d=2 Reps
          </div>
        </div>
      </div>

      {/* Recharts Scatter Visualizer: Voltage vs Frequency Space */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-5 rounded-xl border transition-colors ${cardClass}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-sm font-semibold ${headingClass}`}>Recharts Telemetry Distribution Space</h2>
              <p className={`text-xs ${textMutedClass}`}>
                Voltage Deviation (V) vs Frequency Deviation (Hz) plotted with Recharts ScatterChart
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className={`flex items-center gap-1.5 ${headingClass}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Normal ({normalSamples.length})</span>
              </div>
              <div className={`flex items-center gap-1.5 ${headingClass}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Abnormal ({abnormalSamples.length})</span>
              </div>
            </div>
          </div>

          <div className={`h-72 w-full p-2 rounded-lg border transition-colors ${innerCardClass}`}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Frequency Dev"
                  unit=" Hz"
                  stroke="#64748b"
                  fontSize={11}
                  domain={[-0.8, 0.8]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Voltage Dev"
                  unit=" V"
                  stroke="#64748b"
                  fontSize={11}
                  domain={[-16, 16]}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div
                        className={`p-3 border rounded-lg text-xs font-mono shadow-xl ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="font-bold mb-1 flex items-center justify-between">
                          <span>{d.id}</span>
                          <span className={d.status === 'ABNORMAL' ? 'text-rose-500' : 'text-emerald-500'}>
                            {d.status}
                          </span>
                        </div>
                        <div>Δ Freq: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{d.x?.toFixed(3)} Hz</span></div>
                        <div>Δ Volt: <span className="text-amber-600 dark:text-amber-400 font-bold">{d.y?.toFixed(2)} V</span></div>
                        <div>Demand: <span className="font-bold">{d.demand} kW</span></div>
                        <div>Solar: <span className="font-bold">{d.solar} kW</span></div>
                        <div className="mt-1 text-[10px] text-slate-500 font-sans italic">{d.reason}</div>
                      </div>
                    );
                  }}
                />
                <Scatter name="Normal" data={scatterNormal} fill="#10b981" fillOpacity={0.8} />
                <Scatter name="Abnormal" data={scatterAbnormal} fill="#f43f5e" fillOpacity={0.85} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Configured Grid Scenarios */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between transition-colors ${cardClass}`}>
          <div>
            <h2 className={`text-sm font-semibold mb-1 ${headingClass}`}>Configured Grid Scenarios</h2>
            <p className={`text-xs mb-4 ${textMutedClass}`}>
              Transparent, deterministic rules generating normal and faulted conditions
            </p>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg border transition-colors ${innerCardClass}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Normal Equilibrium</span>
                  <span className="font-mono text-slate-500">{scenarioCounts['normal'] || 0} samples</span>
                </div>
                <p className={`mt-1 text-[11px] leading-snug ${textMutedClass}`}>
                  Balanced generation and load within IEEE 1547 nominal envelope (±3V, ±0.05Hz).
                </p>
              </div>

              <div className={`p-3 rounded-lg border transition-colors ${innerCardClass}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-amber-600 dark:text-amber-400">Industrial Demand Spike</span>
                  <span className="font-mono text-slate-500">{scenarioCounts['demand_spike'] || 0} samples</span>
                </div>
                <p className={`mt-1 text-[11px] leading-snug ${textMutedClass}`}>
                  Load surge exceeding BESS inverter ramping rate causing voltage sag (-8V).
                </p>
              </div>

              <div className={`p-3 rounded-lg border transition-colors ${innerCardClass}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-amber-600 dark:text-amber-400">Solar PV Inverter Trip</span>
                  <span className="font-mono text-slate-500">{scenarioCounts['solar_drop'] || 0} samples</span>
                </div>
                <p className={`mt-1 text-[11px] leading-snug ${textMutedClass}`}>
                  Sudden 85% generation drop during midday peak causing frequency droop (-0.24Hz).
                </p>
              </div>

              <div className={`p-3 rounded-lg border transition-colors ${innerCardClass}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-rose-600 dark:text-rose-400">Cascading Overload</span>
                  <span className="font-mono text-slate-500">
                    {(scenarioCounts['cascading_failure'] || 0) + (scenarioCounts['voltage_sag'] || 0)} samples
                  </span>
                </div>
                <p className={`mt-1 text-[11px] leading-snug ${textMutedClass}`}>
                  Compounded faults: low battery (&lt;15%) coupled with solar drop and peak load.
                </p>
              </div>
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t text-[11px] flex items-center gap-1.5 ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>Deterministic seed ensures 100% reproducible experiments.</span>
          </div>
        </div>
      </div>

      {/* Recharts AreaChart: 24-Hour Telemetry Profiles */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-sm font-semibold flex items-center gap-2 ${headingClass}`}>
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              <span>Multi-Modal Diurnal Power & Storage Trends (Recharts AreaChart)</span>
            </h2>
            <p className={`text-xs ${textMutedClass}`}>
              Interactive 24-hour cycle showing Solar PV (kW), Demand (kW), and Battery SoC (%)
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">Time-Series Telemetry</span>
        </div>

        <div className={`h-64 w-full p-2 rounded-lg border transition-colors ${innerCardClass}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit=" kW" />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null;
                  return (
                    <div
                      className={`p-3 border rounded-lg text-xs font-mono shadow-xl ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="font-bold mb-1">Time: {label}</div>
                      {payload.map((entry, idx) => (
                        <div key={idx} style={{ color: entry.color }}>
                          {entry.name}: <span className="font-bold">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="solar" name="Solar PV (kW)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSolar)" />
              <Area type="monotone" dataKey="demand" name="Demand (kW)" stroke="#06b6d4" fillOpacity={1} fill="url(#colorDemand)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Integrity Disclaimer */}
      <div
        className={`p-4 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
          isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}
      >
        <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
        <div>
          <span className={`font-semibold ${headingClass}`}>Scientific & Technical Rigor Note: </span>
          This experimental benchmark operates on reproducible simulated microgrid telemetry calibrated against IEEE 1547 and EN 50160 power quality standards. Quantum feature mapping is evaluated via local noiseless statevector simulation. Simulated dataset performance does not establish production grid reliability guarantees, and no unverified quantum speedup is claimed.
        </div>
      </div>
    </div>
  );
};
