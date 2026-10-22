import React, { useState, useEffect, useRef } from 'react';
import { ScalerModel } from '../types/microgrid';
import { SVCTrainedModel, predictSample } from '../services/svmSolver';
import { transformSample } from '../services/preprocessing';
import { MicrogridDigitalTwin } from './MicrogridDigitalTwin';
import {
  Play,
  Pause,
  RotateCcw,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
  Cpu,
  ShieldAlert,
  Sliders,
  Sun,
  BatteryCharging,
  Gauge,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface LiveSimulationPageProps {
  classicalModel: SVCTrainedModel | null;
  quantumModel: SVCTrainedModel | null;
  scaler: ScalerModel | null;
  theme: 'dark' | 'light';
}

interface LiveStreamPoint {
  tick: number;
  timeStr: string;
  demand_kw: number;
  solar_kw: number;
  battery_soc_pct: number;
  voltage_dev_v: number;
  frequency_dev_hz: number;
  classicalPred: 'NORMAL' | 'ABNORMAL';
  quantumPred: 'NORMAL' | 'ABNORMAL';
  isAnomaly: boolean;
  rootCause: string;
}

export const LiveSimulationPage: React.FC<LiveSimulationPageProps> = ({
  classicalModel,
  quantumModel,
  scaler,
  theme,
}) => {
  const isDark = theme === 'dark';

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [streamSpeedMs, setStreamSpeedMs] = useState<number>(1500);
  const [streamHistory, setStreamHistory] = useState<LiveStreamPoint[]>([]);
  const [currentTick, setCurrentTick] = useState<number>(1);
  const [anomalyInjection, setAnomalyInjection] = useState<string>('none');
  const [recentAlerts, setRecentAlerts] = useState<
    { id: string; time: string; reason: string; cPred: string; qPred: string }[]
  >([]);

  const tickRef = useRef<number>(1);
  tickRef.current = currentTick;

  // Generate next telemetry tick
  const generateNextTelemetry = (tick: number, injection: string): LiveStreamPoint => {
    const hour = (tick % 24);
    const minute = ((tick * 15) % 60).toString().padStart(2, '0');
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;

    const solarBase = hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) * 60 : 0;

    let demand = 50 + Math.sin(tick / 5) * 15 + (Math.random() - 0.5) * 8;
    let solar = Math.max(0, solarBase + (Math.random() - 0.5) * 5);
    let soc = Math.min(95, Math.max(25, 70 - (hour / 24) * 20 + (solar > demand ? 10 : -8)));
    let voltDev = (Math.random() - 0.5) * 2.2;
    let freqDev = (Math.random() - 0.5) * 0.04;
    let rootCause = 'Nominal grid equilibrium.';

    // Fault injection logic
    if (injection === 'demand_spike' || (injection === 'none' && tick % 11 === 0)) {
      demand = 138.5;
      voltDev = -8.6;
      freqDev = -0.34;
      rootCause = 'Industrial manufacturing load surge exceeding BESS inverter ramping rate.';
    } else if (injection === 'solar_drop' || (injection === 'none' && tick % 17 === 0)) {
      solar = 3.5;
      voltDev = -5.8;
      freqDev = -0.22;
      rootCause = 'Solar PV inverter trip without primary spinning reserve.';
    } else if (injection === 'voltage_sag') {
      voltDev = -11.4;
      rootCause = 'Feeder impedance step fault causing voltage regulation breach (> ±6V).';
    } else if (injection === 'cascading') {
      demand = 145.0;
      solar = 2.0;
      soc = 12.0;
      voltDev = -13.5;
      freqDev = -0.56;
      rootCause = 'Combined PV trip, depleted BESS, and peak industrial demand.';
    }

    const sensorVals = {
      demand_kw: Number(demand.toFixed(1)),
      solar_kw: Number(solar.toFixed(1)),
      battery_soc_pct: Number(soc.toFixed(1)),
      voltage_dev_v: Number(voltDev.toFixed(2)),
      frequency_dev_hz: Number(freqDev.toFixed(3)),
    };

    // Transform and predict
    let cLabel: 'NORMAL' | 'ABNORMAL' = 'NORMAL';
    let qLabel: 'NORMAL' | 'ABNORMAL' = 'NORMAL';

    if (scaler && classicalModel) {
      const vec = transformSample(sensorVals, scaler);
      const cRes = predictSample(classicalModel, vec);
      cLabel = cRes.label === 1 ? 'ABNORMAL' : 'NORMAL';

      if (quantumModel) {
        const qRes = predictSample(quantumModel, vec);
        qLabel = qRes.label === 1 ? 'ABNORMAL' : 'NORMAL';
      } else {
        qLabel = cLabel;
      }
    }

    const isAnomaly = cLabel === 'ABNORMAL' || qLabel === 'ABNORMAL';

    return {
      tick,
      timeStr,
      ...sensorVals,
      classicalPred: cLabel,
      quantumPred: qLabel,
      isAnomaly,
      rootCause,
    };
  };

  // Streaming effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const nextPt = generateNextTelemetry(tickRef.current, anomalyInjection);
      setCurrentTick((t) => t + 1);

      setStreamHistory((prev) => {
        const updated = [...prev, nextPt];
        return updated.slice(-25); // keep last 25 readings
      });

      if (nextPt.isAnomaly) {
        setRecentAlerts((prev) => [
          {
            id: `EVT-${nextPt.tick}`,
            time: nextPt.timeStr,
            reason: nextPt.rootCause,
            cPred: nextPt.classicalPred,
            qPred: nextPt.quantumPred,
          },
          ...prev.slice(0, 5),
        ]);
      }

      if (anomalyInjection !== 'none') {
        setAnomalyInjection('none');
      }
    }, streamSpeedMs);

    return () => clearInterval(interval);
  }, [isRunning, streamSpeedMs, anomalyInjection, classicalModel, quantumModel, scaler]);

  // Initial seed
  useEffect(() => {
    const initHistory: LiveStreamPoint[] = [];
    for (let i = 1; i <= 10; i++) {
      initHistory.push(generateNextTelemetry(i, 'none'));
    }
    setStreamHistory(initHistory);
    setCurrentTick(11);
  }, []);

  const latest = streamHistory[streamHistory.length - 1] || {
    demand_kw: 52,
    solar_kw: 48,
    battery_soc_pct: 72,
    voltage_dev_v: 0.2,
    frequency_dev_hz: 0.01,
    classicalPred: 'NORMAL',
    quantumPred: 'NORMAL',
    isAnomaly: false,
    rootCause: 'Normal operational equilibrium',
  };

  const cardClass = isDark
    ? 'bg-slate-900/80 border-slate-800'
    : 'bg-white border-slate-300 shadow-xs';
  const innerCardClass = isDark
    ? 'bg-slate-950 border-slate-800/80'
    : 'bg-slate-50 border-slate-300';
  const headingClass = isDark ? 'text-white' : 'text-slate-950 font-extrabold';
  const textMutedClass = isDark ? 'text-slate-300' : 'text-slate-800 font-medium';
  const gridStroke = isDark ? '#1e293b' : '#cbd5e1';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-xs">
              <Radio className={`w-5 h-5 ${isRunning ? 'animate-pulse' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingClass}`}>
                  Live Microgrid Simulation Stream
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                  SYNTHETIC TELEMETRY
                </span>
              </div>
              <p className={`mt-0.5 text-xs sm:text-sm ${textMutedClass}`}>
                Continuous stream of synthetic microgrid sensor telemetry (IEEE 1547.4 physics model) evaluated in real-time by Classical SVC and Quantum QSVC.
              </p>
            </div>
          </div>
        </div>

        {/* Live Controls with Enhanced Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
            <span>{isRunning ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <button
            onClick={() => {
              setStreamHistory([]);
              setCurrentTick(1);
            }}
            className={`p-2 rounded-xl border transition-colors cursor-pointer shadow-xs ${
              isDark
                ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 bg-slate-900'
                : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white'
            }`}
            title="Reset Stream"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center text-xs font-mono">
            <span className={`mr-2 ${textMutedClass}`}>Tick:</span>
            {[
              { label: 'Fast (1s)', val: 1000 },
              { label: 'Norm (1.5s)', val: 1500 },
              { label: 'Slow (3s)', val: 3000 },
            ].map((sp) => (
              <button
                key={sp.val}
                onClick={() => setStreamSpeedMs(sp.val)}
                className={`px-2.5 py-1 text-[11px] rounded first:rounded-r-none last:rounded-l-none border cursor-pointer ${
                  streamSpeedMs === sp.val
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-xs'
                    : isDark
                    ? 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fault Injection Toolbar with Enhanced Icons */}
      <div className={`p-4 rounded-2xl border transition-colors ${cardClass}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold ${headingClass} flex items-center gap-2`}>
            <span className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Sliders className="w-3.5 h-3.5" />
            </span>
            <span>INJECT OPERATIONAL TRANSIENT ON NEXT TICK:</span>
          </span>
          <span className={`text-[10px] font-mono ${textMutedClass}`}>Test real-time model reaction</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: 'demand_spike', label: 'Heavy Load Spike (+80 kW)', icon: <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> },
            { id: 'solar_drop', label: 'Sudden Solar PV Drop (-85%)', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
            { id: 'voltage_sag', label: 'Feeder Voltage Sag (-11V)', icon: <Gauge className="w-3.5 h-3.5 text-rose-500" /> },
            { id: 'cascading', label: 'Cascading Multi-Fault', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> },
          ].map((inj) => (
            <button
              key={inj.id}
              onClick={() => setAnomalyInjection(inj.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                anomalyInjection === inj.id
                  ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold shadow-xs'
                  : isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {inj.icon}
              <span>{inj.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live KPI Strip with Enhanced Icon Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Demand */}
        <div className={`p-4 rounded-xl border transition-all ${cardClass}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className={`text-[10px] font-mono font-medium ${textMutedClass}`}>LIVE DEMAND</div>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 fill-cyan-500/30 text-cyan-500" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">{latest.demand_kw} kW</div>
          <div className={`text-[10px] mt-0.5 ${textMutedClass}`}>Factory load</div>
        </div>

        {/* Solar */}
        <div className={`p-4 rounded-xl border transition-all ${cardClass}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className={`text-[10px] font-mono font-medium ${textMutedClass}`}>LIVE SOLAR PV</div>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{latest.solar_kw} kW</div>
          <div className={`text-[10px] mt-0.5 ${textMutedClass}`}>Array generation</div>
        </div>

        {/* Battery */}
        <div className={`p-4 rounded-xl border transition-all ${cardClass}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className={`text-[10px] font-mono font-medium ${textMutedClass}`}>BATTERY SOC</div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{latest.battery_soc_pct}%</div>
          <div className={`text-[10px] mt-0.5 ${textMutedClass}`}>BESS capacity</div>
        </div>

        {/* Voltage Dev */}
        <div className={`p-4 rounded-xl border transition-all ${cardClass}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className={`text-[10px] font-mono font-medium ${textMutedClass}`}>VOLTAGE DEVIATION</div>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              Math.abs(latest.voltage_dev_v) > 6 ? 'text-rose-500' : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {latest.voltage_dev_v > 0 ? `+${latest.voltage_dev_v}` : latest.voltage_dev_v} V
          </div>
          <div className={`text-[10px] mt-0.5 ${textMutedClass}`}>Nominal ±3V (IEEE 1547)</div>
        </div>

        {/* Freq Dev */}
        <div className={`p-4 rounded-xl border transition-all ${cardClass}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className={`text-[10px] font-mono font-medium ${textMutedClass}`}>FREQUENCY DEVIATION</div>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-500 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-violet-500" />
            </div>
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              Math.abs(latest.frequency_dev_hz) > 0.2 ? 'text-rose-500' : 'text-violet-600 dark:text-violet-400'
            }`}
          >
            {latest.frequency_dev_hz > 0 ? `+${latest.frequency_dev_hz}` : latest.frequency_dev_hz} Hz
          </div>
          <div className={`text-[10px] mt-0.5 ${textMutedClass}`}>Nominal ±0.05 Hz</div>
        </div>
      </div>

      {/* Real-Time Detection Badges */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${cardClass}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[11px] font-mono block ${textMutedClass}`}>CLASSICAL SVC</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {latest.classicalPred === 'ABNORMAL' ? (
                  <span className="text-sm font-bold text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    ANOMALY DETECTED
                  </span>
                ) : (
                  <span className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    NORMAL OPERATION
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-300 dark:bg-slate-700/60" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[11px] font-mono block ${textMutedClass}`}>QUANTUM QSVC</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {latest.quantumPred === 'ABNORMAL' ? (
                  <span className="text-sm font-bold text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    ANOMALY DETECTED
                  </span>
                ) : (
                  <span className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    NORMAL OPERATION
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`text-xs font-sans italic text-right ${textMutedClass} max-w-sm`}>
          Trigger: &quot;{latest.rootCause}&quot;
        </div>
      </div>

      {/* Dynamic Microgrid Digital Twin Synchronized with Live Telemetry */}
      <MicrogridDigitalTwin
        demandKw={latest.demand_kw}
        solarKw={latest.solar_kw}
        batterySocPct={latest.battery_soc_pct}
        voltageDevV={latest.voltage_dev_v}
        frequencyDevHz={latest.frequency_dev_hz}
        scenarioName={latest.isAnomaly ? latest.rootCause : 'Live Telemetry Stream'}
        theme={theme}
      />

      {/* Live Recharts Streaming Chart: Voltage & Frequency Deviations */}
      <div className={`p-5 rounded-2xl border space-y-4 transition-colors ${cardClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${headingClass}`}>Real-Time Rolling Telemetry (Last 25 Ticks)</h2>
              <p className={`text-xs ${textMutedClass}`}>
                Tracking Voltage Deviation (V) and Frequency Deviation (Hz) against IEEE 1547 stability boundaries
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800">
            Tick #{currentTick}
          </span>
        </div>

        <div className={`h-72 w-full p-2 rounded-xl border transition-colors ${innerCardClass}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={streamHistory} margin={{ top: 15, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="timeStr" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="volt" stroke="#38bdf8" fontSize={11} domain={[-16, 16]} unit=" V" />
              <YAxis yAxisId="freq" orientation="right" stroke="#a855f7" fontSize={11} domain={[-0.8, 0.8]} unit=" Hz" />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null;
                  const pt = payload[0].payload as LiveStreamPoint;
                  return (
                    <div
                      className={`p-3 border rounded-xl text-xs font-mono shadow-xl ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="font-bold mb-1 flex justify-between">
                        <span>Time: {label}</span>
                        <span className={pt.isAnomaly ? 'text-rose-500 font-bold' : 'text-emerald-500'}>
                          {pt.isAnomaly ? 'ANOMALY' : 'NORMAL'}
                        </span>
                      </div>
                      <div>Voltage Dev: <span className="font-bold text-cyan-500">{pt.voltage_dev_v} V</span></div>
                      <div>Freq Dev: <span className="font-bold text-violet-500">{pt.frequency_dev_hz} Hz</span></div>
                      <div>Classical SVC: <span className="font-bold">{pt.classicalPred}</span></div>
                      <div>Quantum QSVC: <span className="font-bold">{pt.quantumPred}</span></div>
                      <div className="mt-1 text-[10px] text-slate-500 font-sans italic">{pt.rootCause}</div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <ReferenceLine yAxisId="volt" y={6} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '+6V Limit', fill: '#f43f5e', fontSize: 10 }} />
              <ReferenceLine yAxisId="volt" y={-6} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '-6V Limit', fill: '#f43f5e', fontSize: 10 }} />
              <Line
                yAxisId="volt"
                type="monotone"
                dataKey="voltage_dev_v"
                name="Voltage Deviation (V)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
              <Line
                yAxisId="freq"
                type="monotone"
                dataKey="frequency_dev_hz"
                name="Frequency Deviation (Hz)"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Alert Log with Enhanced Icons */}
      <div className={`p-5 rounded-2xl border space-y-3 transition-colors ${cardClass}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h3 className={`text-sm font-bold ${headingClass}`}>
            Real-Time Anomaly Event Stream (Last Triggered Incidents)
          </h3>
        </div>

        {recentAlerts.length > 0 ? (
          <div className="space-y-2">
            {recentAlerts.map((al) => (
              <div
                key={al.id}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono transition-colors ${innerCardClass}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-500">{al.id}</span>
                  <span className={textMutedClass}>[{al.time}]</span>
                  <span className={`font-sans font-medium ${headingClass}`}>{al.reason}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                    SVC: {al.cPred}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] bg-violet-950 text-violet-300 border border-violet-800 font-semibold">
                    QSVC: {al.qPred}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-xs py-4 text-center ${textMutedClass}`}>
            No anomalies recorded in the current live buffer. Grid is operating within nominal IEEE 1547 tolerances.
          </div>
        )}
      </div>
    </div>
  );
};
