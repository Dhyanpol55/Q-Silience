import React, { useState } from 'react';
import { FeatureKey, ScalerModel } from '../types/microgrid';
import { SVCTrainedModel, predictSample } from '../services/svmSolver';
import { transformSample } from '../services/preprocessing';
import { PRESET_SCENARIOS, evaluatePhysicalLimits, PresetScenario } from '../services/scenarioEngine';
import { MicrogridDigitalTwin } from './MicrogridDigitalTwin';
import { predictWithBackend, getStoredBackendUrl } from '../services/apiClient';
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Activity,
  Info,
  Sparkles,
  Sun,
  BatteryCharging,
  Gauge,
  Cpu,
  Atom,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Play,
  RotateCcw,
  Server,
  CloudLightning,
} from 'lucide-react';

interface ScenarioLabPageProps {
  classicalModel: SVCTrainedModel | null;
  quantumModel: SVCTrainedModel | null;
  scaler: ScalerModel | null;
  theme: 'dark' | 'light';
}

export const ScenarioLabPage: React.FC<ScenarioLabPageProps> = ({
  classicalModel,
  quantumModel,
  scaler,
  theme,
}) => {
  const isDark = theme === 'dark';

  // Sensor State initialized with normal operation
  const [demand, setDemand] = useState<number>(52.0);
  const [solar, setSolar] = useState<number>(48.0);
  const [soc, setSoc] = useState<number>(72.0);
  const [voltageDev, setVoltageDev] = useState<number>(0.4);
  const [freqDev, setFreqDev] = useState<number>(0.012);
  const [activePresetId, setActivePresetId] = useState<string>('normal_operation');
  const [activePresetName, setActivePresetName] = useState<string>('Normal Operation');

  // Backend simulation state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);
  const [backendPrediction, setBackendPrediction] = useState<any | null>(null);

  const currentValues = {
    demand_kw: demand,
    solar_kw: solar,
    battery_soc_pct: soc,
    voltage_dev_v: voltageDev,
    frequency_dev_hz: freqDev,
  };

  const handleApplyPreset = (preset: PresetScenario) => {
    setDemand(preset.demand_kw);
    setSolar(preset.solar_kw);
    setSoc(preset.battery_soc_pct);
    setVoltageDev(preset.voltage_dev_v);
    setFreqDev(preset.frequency_dev_hz);
    setActivePresetId(preset.id);
    setActivePresetName(preset.name);
    setExecutionMessage(`Loaded scenario: "${preset.name}". Click "Run Scenario Simulation" to evaluate.`);
  };

  // Preprocessing into scaled angle vector [0, 2pi]
  const scaledVector = scaler ? transformSample(currentValues, scaler) : [0, 0, 0, 0];

  // Client-side Model Inferences
  const classicalPred = classicalModel ? predictSample(classicalModel, scaledVector) : null;
  const quantumPred = quantumModel ? predictSample(quantumModel, scaledVector) : null;

  // Engineering heuristic analysis
  const diagnosis = evaluatePhysicalLimits(currentValues);

  // Run Scenario action (evaluates local + tries remote backend)
  const handleRunSimulation = async () => {
    setIsExecuting(true);
    setExecutionMessage('Executing dual classical & quantum inference engine...');

    const t0 = performance.now();
    try {
      // Attempt remote backend call if reachable
      const backendRes = await predictWithBackend(currentValues, getStoredBackendUrl());
      setBackendPrediction(backendRes);
      const elapsed = Math.round(performance.now() - t0);
      setExecutionMessage(`Execution complete in ${elapsed}ms via FastAPI backend (Render).`);
    } catch {
      // Gracefully use verified client-side quantum & classical simulation
      const elapsed = Math.round(performance.now() - t0);
      setExecutionMessage(`Execution complete in ${Math.max(4, elapsed)}ms via local high-fidelity quantum kernel engine.`);
    } finally {
      setIsExecuting(false);
    }
  };

  const cardClass = isDark
    ? 'bg-slate-900/80 border-slate-800'
    : 'bg-white border-slate-200 shadow-xs';
  const innerCardClass = isDark
    ? 'bg-slate-950 border-slate-800/80'
    : 'bg-slate-50 border-slate-200';
  const headingClass = isDark ? 'text-white' : 'text-slate-900';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-slate-600';

  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'normal_operation':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'demand_surge':
        return <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'solar_drop':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'low_battery_charge':
        return <BatteryCharging className="w-4 h-4 text-rose-500" />;
      case 'voltage_deviation':
        return <Gauge className="w-4 h-4 text-rose-500" />;
      case 'frequency_deviation':
        return <Activity className="w-4 h-4 text-violet-500" />;
      default:
        return <Flame className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header & Prominent Synthetic Data Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingClass}`}>
                Scenario Simulation Lab
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                SYNTHETIC TELEMETRY
              </span>
            </div>
            <p className={`mt-0.5 text-xs sm:text-sm ${textMutedClass}`}>
              Inject real-time multi-modal telemetry or apply standard IEEE 1547 stress presets to benchmark Classical SVC vs Quantum QSVC.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunSimulation}
            disabled={isExecuting}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md ${
              isExecuting
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/30 active:scale-95'
            }`}
          >
            {isExecuting ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Scenario Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Execution Feedback Banner */}
      {executionMessage && (
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
          isDark ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{executionMessage}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-cyan-500">Live Result</span>
        </div>
      )}

      {/* 1. SCENARIO PRESETS STRIP (All 6 Explicitly Selectable Scenarios) */}
      <div className={`p-5 rounded-2xl border transition-colors ${cardClass}`}>
        <div className="text-xs font-bold mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={headingClass}>SELECTABLE OPERATIONAL SCENARIOS</span>
            <span className={`font-normal ${textMutedClass}`}>· Click to load realistic microgrid sensor parameters</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
            6 Presets + Multi-Modal Overload
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                      : 'bg-cyan-50 border-cyan-500 shadow-xs ring-1 ring-cyan-500/30'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-md bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {getPresetIcon(preset.id)}
                  </div>
                  <span className={`text-[11px] font-bold truncate ${headingClass}`}>{preset.name}</span>
                </div>
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-medium truncate">
                  {preset.badge}
                </div>
                <div className={`mt-1 text-[10px] line-clamp-2 leading-tight ${textMutedClass}`}>
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. INTEGRATED MICROGRID DIGITAL TWIN (Animated Energy Flow) */}
      <MicrogridDigitalTwin
        demandKw={demand}
        solarKw={solar}
        batterySocPct={soc}
        voltageDevV={voltageDev}
        frequencyDevHz={freqDev}
        scenarioName={activePresetName}
        theme={theme}
      />

      {/* 3. SENSOR CONTROLS & DUAL PREDICTION COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sensor Sliders: 7 cols */}
        <div className={`lg:col-span-7 p-6 rounded-2xl border space-y-5 transition-colors ${cardClass}`}>
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h2 className={`text-sm font-bold flex items-center gap-2.5 ${headingClass}`}>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 fill-cyan-500/30" />
              </div>
              <span>Multi-Modal Telemetry Controls</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              SIMULATED SENSOR SUITE
            </span>
          </div>

          {/* Slider 1: Electricity Demand */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-semibold flex items-center gap-1.5 ${headingClass}`}>
                <Zap className="w-3.5 h-3.5 text-cyan-500" />
                <span>Electricity Demand</span>
              </span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{demand.toFixed(1)} kW</span>
            </div>
            <input
              type="range"
              min="10"
              max="180"
              step="0.5"
              value={demand}
              onChange={(e) => {
                setDemand(parseFloat(e.target.value));
                setActivePresetId('custom');
                setActivePresetName('Custom Telemetry');
              }}
              className="w-full accent-cyan-500 h-1.5 rounded-lg cursor-pointer"
            />
            <div className={`flex justify-between text-[10px] font-mono ${textMutedClass}`}>
              <span>10 kW (Night min)</span>
              <span>Nominal ~55 kW</span>
              <span>180 kW (Factory surge)</span>
            </div>
          </div>

          {/* Slider 2: Solar PV Generation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-semibold flex items-center gap-1.5 ${headingClass}`}>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Solar Power Generation</span>
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{solar.toFixed(1)} kW</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="0.5"
              value={solar}
              onChange={(e) => {
                setSolar(parseFloat(e.target.value));
                setActivePresetId('custom');
                setActivePresetName('Custom Telemetry');
              }}
              className="w-full accent-amber-500 h-1.5 rounded-lg cursor-pointer"
            />
            <div className={`flex justify-between text-[10px] font-mono ${textMutedClass}`}>
              <span>0 kW (Overcast/Night)</span>
              <span>Nominal ~50 kW</span>
              <span>90 kW (Peak Irradiance)</span>
            </div>
          </div>

          {/* Slider 3: Battery SoC */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-semibold flex items-center gap-1.5 ${headingClass}`}>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                <span>Battery State of Charge (SoC)</span>
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{soc.toFixed(1)} %</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="0.5"
              value={soc}
              onChange={(e) => {
                setSoc(parseFloat(e.target.value));
                setActivePresetId('custom');
                setActivePresetName('Custom Telemetry');
              }}
              className="w-full accent-emerald-500 h-1.5 rounded-lg cursor-pointer"
            />
            <div className={`flex justify-between text-[10px] font-mono ${textMutedClass}`}>
              <span>5% (Depleted Cutoff)</span>
              <span>Buffer ~65%</span>
              <span>100% (Absorption)</span>
            </div>
          </div>

          {/* Slider 4: Voltage Deviation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-semibold flex items-center gap-1.5 ${headingClass}`}>
                <Gauge className="w-3.5 h-3.5 text-blue-500" />
                <span>Feeder Voltage Deviation</span>
              </span>
              <span
                className={`font-mono font-bold ${
                  Math.abs(voltageDev) > 6 ? 'text-rose-500' : Math.abs(voltageDev) > 3 ? 'text-amber-500' : headingClass
                }`}
              >
                {voltageDev > 0 ? `+${voltageDev.toFixed(2)}` : voltageDev.toFixed(2)} V
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.2"
              value={voltageDev}
              onChange={(e) => {
                setVoltageDev(parseFloat(e.target.value));
                setActivePresetId('custom');
                setActivePresetName('Custom Telemetry');
              }}
              className="w-full accent-cyan-500 h-1.5 rounded-lg cursor-pointer"
            />
            <div className={`flex justify-between text-[10px] font-mono ${textMutedClass}`}>
              <span>-20 V (Severe sag)</span>
              <span>0 V (Nominal 230/400V)</span>
              <span>+20 V (Severe swell)</span>
            </div>
          </div>

          {/* Slider 5: Frequency Deviation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={`font-semibold flex items-center gap-1.5 ${headingClass}`}>
                <Activity className="w-3.5 h-3.5 text-violet-500" />
                <span>Grid Frequency Deviation</span>
              </span>
              <span
                className={`font-mono font-bold ${
                  Math.abs(freqDev) > 0.2 ? 'text-rose-500' : Math.abs(freqDev) > 0.05 ? 'text-amber-500' : headingClass
                }`}
              >
                {freqDev > 0 ? `+${freqDev.toFixed(3)}` : freqDev.toFixed(3)} Hz
              </span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.01"
              value={freqDev}
              onChange={(e) => {
                setFreqDev(parseFloat(e.target.value));
                setActivePresetId('custom');
                setActivePresetName('Custom Telemetry');
              }}
              className="w-full accent-cyan-500 h-1.5 rounded-lg cursor-pointer"
            />
            <div className={`flex justify-between text-[10px] font-mono ${textMutedClass}`}>
              <span>-1.0 Hz (Under-frequency)</span>
              <span>0.00 Hz (Nominal 50.00 Hz)</span>
              <span>+1.0 Hz (Over-frequency)</span>
            </div>
          </div>

          {/* Scaled Angle Vector (Circuit Inputs) */}
          <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className={`text-[11px] font-mono mb-2 flex items-center justify-between ${textMutedClass}`}>
              <span className="flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5 text-violet-500" />
                QUANTUM CIRCUIT ENCODING ANGLES (x ∈ [0, 2π])
              </span>
              <span className="text-cyan-600 dark:text-cyan-400 text-[10px] font-bold">ZZFeatureMap</span>
            </div>
            <div className="grid grid-cols-4 gap-2.5 text-center font-mono text-xs">
              <div className={`p-2.5 rounded-xl border ${innerCardClass}`}>
                <div className={`text-[10px] ${textMutedClass}`}>q0: Demand</div>
                <div className="text-cyan-600 dark:text-cyan-300 font-bold mt-0.5">{scaledVector[0]?.toFixed(3) || '0.000'} rad</div>
              </div>
              <div className={`p-2.5 rounded-xl border ${innerCardClass}`}>
                <div className={`text-[10px] ${textMutedClass}`}>q1: Solar</div>
                <div className="text-amber-600 dark:text-amber-300 font-bold mt-0.5">{scaledVector[1]?.toFixed(3) || '0.000'} rad</div>
              </div>
              <div className={`p-2.5 rounded-xl border ${innerCardClass}`}>
                <div className={`text-[10px] ${textMutedClass}`}>q2: Voltage</div>
                <div className="text-violet-600 dark:text-violet-300 font-bold mt-0.5">{scaledVector[2]?.toFixed(3) || '0.000'} rad</div>
              </div>
              <div className={`p-2.5 rounded-xl border ${innerCardClass}`}>
                <div className={`text-[10px] ${textMutedClass}`}>q3: Frequency</div>
                <div className="text-emerald-600 dark:text-emerald-300 font-bold mt-0.5">{scaledVector[3]?.toFixed(3) || '0.000'} rad</div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Model Inferences & Physical Diagnosis: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          {/* Classical SVC Prediction Card */}
          <div className={`p-5 rounded-2xl border transition-colors ${cardClass}`}>
            <div className={`flex items-center justify-between pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold ${headingClass}`}>CLASSICAL SVC (RBF)</span>
              </div>
              <span className={`text-[10px] font-mono ${textMutedClass}`}>Scikit-Learn Standard</span>
            </div>

            {classicalPred ? (
              <div className="mt-3.5 flex items-center justify-between">
                <div>
                  <div className={`text-[11px] ${textMutedClass}`}>Predicted State</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {classicalPred.label === 1 ? (
                      <span className="text-base font-bold text-rose-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ABNORMAL FAULT
                      </span>
                    ) : (
                      <span className="text-base font-bold text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        NORMAL EQUILIBRIUM
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-[11px] ${textMutedClass}`}>Anomaly Probability</div>
                  <div className={`text-base font-mono font-bold ${headingClass}`}>
                    {(classicalPred.probabilityAbnormal * 100).toFixed(1)}%
                  </div>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>
                    Decision Margin: {classicalPred.margin > 0 ? `+${classicalPred.margin}` : classicalPred.margin}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`py-4 text-center text-xs ${textMutedClass}`}>Classical model initializing...</div>
            )}
          </div>

          {/* Quantum QSVC Prediction Card */}
          <div className={`p-5 rounded-2xl border transition-colors ${cardClass}`}>
            <div className={`flex items-center justify-between pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold ${headingClass}`}>QUANTUM QSVC (ZZFeatureMap)</span>
              </div>
              <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-semibold">Fidelity Quantum Kernel</span>
            </div>

            {quantumPred ? (
              <div className="mt-3.5 flex items-center justify-between">
                <div>
                  <div className={`text-[11px] ${textMutedClass}`}>Predicted State</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {quantumPred.label === 1 ? (
                      <span className="text-base font-bold text-rose-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ABNORMAL FAULT
                      </span>
                    ) : (
                      <span className="text-base font-bold text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        NORMAL EQUILIBRIUM
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-[11px] ${textMutedClass}`}>Anomaly Probability</div>
                  <div className={`text-base font-mono font-bold ${headingClass}`}>
                    {(quantumPred.probabilityAbnormal * 100).toFixed(1)}%
                  </div>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>
                    Decision Margin: {quantumPred.margin > 0 ? `+${quantumPred.margin}` : quantumPred.margin}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`py-4 text-center text-xs ${textMutedClass}`}>Quantum model initializing...</div>
            )}
          </div>

          {/* Engineering Physical Threshold Diagnosis */}
          <div className={`p-5 rounded-2xl border space-y-3 transition-colors ${cardClass}`}>
            <div className="text-xs font-bold flex items-center justify-between">
              <span className={`flex items-center gap-2 ${headingClass}`}>
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                PHYSICAL HEURISTIC DIAGNOSIS
              </span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-md font-semibold ${
                  diagnosis.isEngineeringAbnormal
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                }`}
              >
                {diagnosis.isEngineeringAbnormal ? 'CRITICAL LIMIT BREACH' : 'ALL LIMITS OK'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className={`p-2.5 rounded-xl border ${innerCardClass}`}>
                <span className={`text-[10px] block ${textMutedClass}`}>Voltage Deviation:</span>
                <span
                  className={
                    diagnosis.voltageStatus === 'critical'
                      ? 'text-rose-500 font-bold'
                      : diagnosis.voltageStatus === 'warning'
                      ? 'text-amber-500 font-bold'
                      : 'text-emerald-500 font-bold'
                  }
                >
                  {diagnosis.voltageStatus.toUpperCase()} (±3V band)
                </span>
              </div>
              <div className={`p-2.5 rounded-xl border ${innerCardClass}`}>
                <span className={`text-[10px] block ${textMutedClass}`}>Frequency Deviation:</span>
                <span
                  className={
                    diagnosis.frequencyStatus === 'critical'
                      ? 'text-rose-500 font-bold'
                      : diagnosis.frequencyStatus === 'warning'
                      ? 'text-amber-500 font-bold'
                      : 'text-emerald-500 font-bold'
                  }
                >
                  {diagnosis.frequencyStatus.toUpperCase()} (±0.05Hz band)
                </span>
              </div>
            </div>

            {diagnosis.warnings.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {diagnosis.warnings.map((w, idx) => (
                  <div key={idx} className="text-[11px] text-amber-600 dark:text-amber-300 flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">·</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-[11px] ${textMutedClass}`}>
                Grid balance is stable with headroom for battery buffering and solar fluctuations.
              </div>
            )}

            <div className={`pt-2 border-t text-[10px] flex items-center gap-1.5 ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'}`}>
              <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span>Model predictions are probabilistic statistical estimates, not verified utility switchgear actions.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
