import React, { useState, useEffect, useRef } from 'react';
import { MicrogridSample, FeatureKey, ScalerModel } from '../types/microgrid';
import { SVCTrainedModel, predictSample } from '../services/svmSolver';
import { transformSample } from '../services/preprocessing';
import { evaluatePhysicalLimits } from '../services/scenarioEngine';
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

      // Reset one-time injection
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
    : 'bg-white border-slate-200 shadow-xs';
  const innerCardClass = isDark
    ? 'bg-slate-950 border-slate-800/80'
    : 'bg-slate-50 border-slate-200';
  const headingClass = isDark ? 'text-white' : 'text-slate-900';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-slate-600';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${isRunning ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingClass}`}>
              Live Microgrid Simulation Stream
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
              SIMULATED TELEMETRY
            </span>
          </div>
          <p className={`mt-1 text-xs sm:text-sm ${textMutedClass}`}>
            Continuous stream of smart grid sensor telemetry evaluated in real-time by both Classical SVC and Quantum QSVC.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <button
            onClick={() => {
              setStreamHistory([]);
              setCurrentTick(1);
            }}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              isDark ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Reset Stream"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center text-xs font-mono">
            <span className={`mr-1.5 ${textMutedClass}`}>Tick:</span>
            {[
              { label: 'Fast (1s)', val: 1000 },
              { label: 'Norm (1.5s)', val: 1500 },
              { label: 'Slow (3s)', val: 3000 },
            ].map((sp) => (
              <button
                key={sp.val}
                onClick={() => setStreamSpeedMs(sp.val)}
                className={`px-2 py-1 text-[11px] rounded first:rounded-r-none last:rounded-l-none border border-slate-700 cursor-pointer ${
                  streamSpeedMs === sp.val
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : isDark
                    ? 'bg-slate-900 text-slate-400'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fault Injection Toolbar */}
      <div className={`p-4 rounded-xl border transition-colors ${cardClass}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold ${headingClass} flex items-center gap-1.5`}>
            <Sliders className="w-4 h-4 text-cyan-500" />
            <span>INJECT OPERATIONAL TRANSIENT ON NEXT TICK:</span>
          </span>
          <span className={`text-[10px] font-mono ${textMutedClass}`}>Test real-time model reaction</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'demand_spike', label: '⚡ Heavy Load Spike (+80 kW)', color: 'text-amber-500' },
            { id: 'solar_drop', label: '☁ Sudden Solar PV Drop (-85%)', color: 'text-amber-500' },
            { id: 'voltage_sag', label: '🔻 Feeder Voltage Sag (-11V)', color: 'text-rose-500' },
            { id: 'cascading', label: '🚨 Cascading Multi-Fault', color: 'text-rose-500' },
          ].map((inj) => (
            <button
              key={inj.id}
              onClick={() => setAnomalyInjection(inj.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                anomalyInjection === inj.id
                  ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                  : isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {inj.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`p-3.5 rounded-xl border transition-colors ${cardClass}`}>
          <div className={`text-[10px] font-mono ${textMutedClass}`}>LIVE DEMAND</div>
          <div className="text-xl font-bold font-mono text-cyan-500 mt-0.5">{latest.demand_kw} kW</div>
          <div className={`text-[10px] ${textMutedClass}`}>Factory load</div>
        </div>

        <div className={`p-3.5 rounded-xl border transition-colors ${cardClass}`}>
          <div className={`text-[10px] font-mono ${textMutedClass}`}>LIVE SOLAR PV</div>
          <div className="text-xl font-bold font-mono text-amber-500 mt-0.5">{latest.solar_kw} kW</div>
          <div className={`text-[10px] ${textMutedClass}`}>Array generation</div>
        </div>

        <div className={`p-3.5 rounded-xl border transition-colors ${cardClass}`}>
          <div className={`text-[10px] font-mono ${textMutedClass}`}>BATTERY SOC</div>
          <div className="text-xl font-bold font-mono text-emerald-500 mt-0.5">{latest.battery_soc_pct}%</div>
          <div className={`text-[10px] ${textMutedClass}`}>BESS capacity</div>
        </div>

        <div className={`p-3.5 rounded-xl border transition-colors ${cardClass}`}>
          <div className={`text-[10px] font-mono ${textMutedClass}`}>VOLTAGE DEVIATION</div>
          <div
            className={`text-xl font-bold font-mono mt-0.5 ${
              Math.abs(latest.voltage_dev_v) > 6 ? 'text-rose-500' : 'text-cyan-500'
            }`}
          >
            {latest.voltage_dev_v > 0 ? `+${latest.voltage_dev_v}` : latest.voltage_dev_v} V
          </div>
          <div className={`text-[10px] ${textMutedClass}`}>Nominal ±3V (IEEE 1547)</div>
        </div>

        <div className={`p-3.5 rounded-xl border transition-colors ${cardClass}`}>
          <div className={`text-[10px] font-mono ${textMutedClass}`}>FREQUENCY DEVIATION</div>
          <div
            className={`text-xl font-bold font-mono mt-0.5 ${
              Math.abs(latest.frequency_dev_hz) > 0.2 ? 'text-rose-500' : 'text-violet-500'
            }`}
          >
            {latest.frequency_dev_hz > 0 ? `+${latest.frequency_dev_hz}` : latest.frequency_dev_hz} Hz
          </div>
          <div className={`text-[10px] ${textMutedClass}`}>Nominal ±0.05 Hz</div>
        </div>
      </div>

      {/* Real-Time Detection Badges */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${cardClass}`}>
        <div className="flex items-center gap-4">
          <div>
            <span className={`text-xs font-mono block ${textMutedClass}`}>CLASSICAL SVC PREDICTION</span>
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

          <div className="h-8 w-px bg-slate-700/60" />

          <div>
            <span className={`text-xs font-mono block ${textMutedClass}`}>QUANTUM QSVC PREDICTION</span>
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

        <div className={`text-xs font-sans italic text-right ${textMutedClass} max-w-sm`}>
          Trigger: &quot;{latest.rootCause}&quot;
        </div>
      </div>

      {/* Live Recharts Streaming Chart: Voltage & Frequency Deviations */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-sm font-semibold flex items-center gap-2 ${headingClass}`}>
              <Activity className="w-4 h-4 text-cyan-500" />
              <span>Real-Time Rolling Telemetry (Last 25 Ticks)</span>
            </h2>
            <p className={`text-xs ${textMutedClass}`}>
              Tracking Voltage Deviation (V) and Frequency Deviation (Hz) against IEEE 1547 stability boundaries
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-500">Tick #{currentTick}</span>
        </div>

        <div className={`h-72 w-full p-2 rounded-lg border transition-colors ${innerCardClass}`}>
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
                      className={`p-3 border rounded-lg text-xs font-mono shadow-xl ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="font-bold mb-1 flex justify-between">
                        <span>Time: {label}</span>
                        <span className={pt.isAnomaly ? 'text-rose-500 font-bold' : 'text-emerald-500'}>
                          {pt.isAnomaly ? 'ANOMALY' : 'NORMAL'}
                        </span>
                      </div>
                      <div>Voltage Dev: <span className="font-bold text-cyan-400">{pt.voltage_dev_v} V</span></div>
                      <div>Freq Dev: <span className="font-bold text-violet-400">{pt.frequency_dev_hz} Hz</span></div>
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

      {/* Real-time Alert Log */}
      <div className={`p-5 rounded-xl border space-y-3 transition-colors ${cardClass}`}>
        <h3 className={`text-sm font-semibold flex items-center gap-2 ${headingClass}`}>
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Real-Time Anomaly Event Stream (Last Triggered Incidents)</span>
        </h3>

        {recentAlerts.length > 0 ? (
          <div className="space-y-2">
            {recentAlerts.map((al) => (
              <div
                key={al.id}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono transition-colors ${innerCardClass}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-500">{al.id}</span>
                  <span className={textMutedClass}>[{al.time}]</span>
                  <span className={`font-sans ${headingClass}`}>{al.reason}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                    SVC: {al.cPred}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-violet-950 text-violet-300 border border-violet-800">
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
