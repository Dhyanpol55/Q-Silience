import React, { useState } from 'react';
import {
  Sun,
  BatteryCharging,
  Zap,
  Activity,
  Cpu,
  Factory,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MicrogridDigitalTwinProps {
  demandKw: number;
  solarKw: number;
  batterySocPct: number;
  voltageDevV: number;
  frequencyDevHz: number;
  scenarioName?: string;
  theme: 'dark' | 'light';
  compact?: boolean;
}

export const MicrogridDigitalTwin: React.FC<MicrogridDigitalTwinProps> = ({
  demandKw,
  solarKw,
  batterySocPct,
  voltageDevV,
  frequencyDevHz,
  scenarioName,
  theme,
  compact = false,
}) => {
  const isDark = theme === 'dark';

  // Selected node for deep inspection modal/drawer
  const [activeNode, setActiveNode] = useState<'solar' | 'battery' | 'bus' | 'load' | null>(null);

  // Power flow calculations
  // Net balance = Generation (Solar) + Storage Support - Demand
  const isSolarGenerating = solarKw > 1.0;
  const isCharging = solarKw > demandKw && batterySocPct < 95;
  const isDischarging = demandKw > solarKw && batterySocPct > 12;
  const netStorageKw = isCharging
    ? Math.min(45, (solarKw - demandKw) * 0.9)
    : isDischarging
    ? Math.min(65, (demandKw - solarKw))
    : 0;

  const powerDeficit = demandKw - (solarKw + (isDischarging ? netStorageKw : 0));
  const isDeficit = powerDeficit > 5.0;

  // Physical compliance checks
  const isVoltageFault = Math.abs(voltageDevV) > 6.0;
  const isFrequencyFault = Math.abs(frequencyDevHz) > 0.20;
  const isBatteryDepleted = batterySocPct < 15.0;
  const hasPhysicalAnomaly = isVoltageFault || isFrequencyFault || isBatteryDepleted || isDeficit;

  const baseVoltage = 230; // Nominal Vrms
  const actualVoltage = (baseVoltage + voltageDevV).toFixed(1);
  const baseFreq = 50.0;
  const actualFreq = (baseFreq + frequencyDevHz).toFixed(3);

  const cardBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xs';
  const innerCardBg = isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200';
  const headingText = isDark ? 'text-white' : 'text-slate-900 font-extrabold';
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-700 font-medium';

  return (
    <div className={`p-5 rounded-2xl border transition-all ${cardBg}`}>
      {/* Top Banner & Simulated Environment Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className={`text-sm sm:text-base font-bold tracking-tight ${headingText}`}>
              Microgrid Digital Twin
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              SIMULATED ENVIRONMENT
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${mutedText}`}>
            Physics-calibrated IEEE 1547 / EN 50160 renewable microgrid network synchronized with telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {scenarioName && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-100/90 dark:bg-cyan-950/90 border border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-200">
              Preset: <strong className="font-bold">{scenarioName}</strong>
            </span>
          )}
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              hasPhysicalAnomaly
                ? 'bg-rose-100/90 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {hasPhysicalAnomaly ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5" /> Physical Limit Breach
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" /> IEEE 1547 Compliant
              </>
            )}
          </span>
        </div>
      </div>

      {/* SVG Canvas Schematic with Animated Flow Lines */}
      <div className="mt-4 relative bg-slate-950 rounded-xl p-4 sm:p-6 overflow-hidden border border-slate-800/80">
        {/* Subtle grid pattern background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #06b6d4 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Dynamic Warning Banner overlay if critical */}
        {hasPhysicalAnomaly && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-200 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              <span>
                <strong>CRITICAL TELEMETRY:</strong>{' '}
                {isVoltageFault && `Voltage Sag/Swell (${voltageDevV > 0 ? '+' : ''}${voltageDevV}V) `}
                {isFrequencyFault && `Frequency Droop (${frequencyDevHz > 0 ? '+' : ''}${frequencyDevHz}Hz) `}
                {isBatteryDepleted && `BESS Undercharge (${batterySocPct}%) `}
                {isDeficit && `Unserved Load (${powerDeficit.toFixed(1)} kW deficit)`}
              </span>
            </div>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-rose-900 rounded font-bold">
              RELAY WARNING
            </span>
          </div>
        )}

        {/* Grid nodes layout: 4 key nodes connected to the central bus */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {/* Node 1: Solar Photovoltaics */}
          <div
            onClick={() => setActiveNode(activeNode === 'solar' ? null : 'solar')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeNode === 'solar'
                ? 'border-amber-400 ring-2 ring-amber-400/30 bg-slate-900'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" /> Solar PV
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isSolarGenerating
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isSolarGenerating ? 'ACTIVE' : 'IDLE / NIGHT'}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white">{solarKw.toFixed(1)} <span className="text-xs text-slate-300">kW</span></div>
            <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Array Irradiance:</span>
                <span className="text-slate-100">{Math.round((solarKw / 65) * 1000)} W/m²</span>
              </div>
              <div className="flex justify-between">
                <span>Inverter Efficiency:</span>
                <span className="text-slate-100">97.8%</span>
              </div>
            </div>
          </div>

          {/* Node 2: Battery Energy Storage System (BESS) */}
          <div
            onClick={() => setActiveNode(activeNode === 'battery' ? null : 'battery')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeNode === 'battery'
                ? 'border-cyan-400 ring-2 ring-cyan-400/30 bg-slate-900'
                : isBatteryDepleted
                ? 'border-rose-800 bg-rose-950/40 hover:border-rose-700'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5" /> BESS Storage
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isBatteryDepleted
                    ? 'bg-rose-900 text-rose-200 border border-rose-700 animate-pulse'
                    : isCharging
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}
              >
                {isBatteryDepleted ? 'DEPLETED' : isCharging ? 'CHARGING' : 'DISCHARGING'}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {batterySocPct.toFixed(1)} <span className="text-xs text-slate-300">% SoC</span>
            </div>
            {/* Battery bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isBatteryDepleted ? 'bg-rose-500' : batterySocPct > 50 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.max(3, Math.min(100, batterySocPct))}%` }}
              />
            </div>
            <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-400">
              <div className="flex justify-between">
                <span>Power Flow:</span>
                <span className={isCharging ? 'text-emerald-400' : 'text-cyan-400'}>
                  {isCharging ? `+${netStorageKw.toFixed(1)} kW` : `-${netStorageKw.toFixed(1)} kW`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cell Health:</span>
                <span className="text-slate-200">{batterySocPct > 15 ? 'Optimal' : 'Under-Voltage Cutoff'}</span>
              </div>
            </div>
          </div>

          {/* Node 3: Central Distribution Bus & Inverter Hub */}
          <div
            onClick={() => setActiveNode(activeNode === 'bus' ? null : 'bus')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeNode === 'bus'
                ? 'border-violet-400 ring-2 ring-violet-400/30 bg-slate-900'
                : isVoltageFault || isFrequencyFault
                ? 'border-rose-800 bg-rose-950/40 hover:border-rose-700'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-violet-300 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Distribution Bus
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isVoltageFault || isFrequencyFault
                    ? 'bg-rose-900 text-rose-200 border border-rose-700'
                    : 'bg-violet-950 text-violet-300 border border-violet-800'
                }`}
              >
                {actualVoltage}V / {actualFreq}Hz
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {voltageDevV >= 0 ? `+${voltageDevV.toFixed(1)}` : voltageDevV.toFixed(1)}{' '}
              <span className="text-xs text-slate-300">V dev</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Frequency Dev:</span>
                <span className={isFrequencyFault ? 'text-rose-400 font-bold' : 'text-slate-100'}>
                  {frequencyDevHz >= 0 ? `+${frequencyDevHz.toFixed(3)}` : frequencyDevHz.toFixed(3)} Hz
                </span>
              </div>
              <div className="flex justify-between">
                <span>Power Balance:</span>
                <span className={isDeficit ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {isDeficit ? `-${powerDeficit.toFixed(1)} kW Deficit` : 'Balanced'}
                </span>
              </div>
            </div>
          </div>

          {/* Node 4: Connected Loads */}
          <div
            onClick={() => setActiveNode(activeNode === 'load' ? null : 'load')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeNode === 'load'
                ? 'border-indigo-400 ring-2 ring-indigo-400/30 bg-slate-900'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-bold flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" /> Connected Loads
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-800">
                INDUSTRIAL / RES
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white">{demandKw.toFixed(1)} <span className="text-xs text-slate-300">kW</span></div>
            <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Critical Priority:</span>
                <span className="text-slate-100">{isDeficit ? 'Load Shedding Active' : '100% Served'}</span>
              </div>
              <div className="flex justify-between">
                <span>Power Factor (cos φ):</span>
                <span className="text-slate-100">0.96 lag</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Power Flow SVG Busbar Schematic */}
        <div className="relative py-3 my-2 hidden sm:block">
          <svg className="w-full h-8 overflow-visible" viewBox="0 0 800 32" preserveAspectRatio="none">
            <defs>
              <linearGradient id="solarBusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="bessBusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="loadBusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            
            {/* Base static bus tracks */}
            <path d="M 100 16 L 500 16" stroke="#1e293b" strokeWidth="3" />
            <path d="M 300 16 L 500 16" stroke="#1e293b" strokeWidth="3" />
            <path d="M 500 16 L 700 16" stroke="#1e293b" strokeWidth="3" />
            
            {/* Solar PV to Bus line */}
            {isSolarGenerating && (
              <path
                d="M 100 16 L 500 16"
                stroke="url(#solarBusGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 8"
                className="animate-flow-right"
              />
            )}
            
            {/* BESS to Bus bidirectional line */}
            <path
              d="M 300 16 L 500 16"
              stroke="url(#bessBusGrad)"
              strokeWidth="2.5"
              strokeDasharray="6 8"
              className={isCharging ? "animate-flow-left" : "animate-flow-right"}
            />

            {/* Bus to Industrial Load line */}
            <path
              d="M 500 16 L 700 16"
              stroke="url(#loadBusGrad)"
              strokeWidth="2.5"
              strokeDasharray="6 8"
              className="animate-flow-right"
            />
            
            {/* Bus junction hubs */}
            <circle cx="100" cy="16" r="4.5" fill="#f59e0b" />
            <circle cx="300" cy="16" r="4.5" fill="#06b6d4" />
            <circle cx="500" cy="16" r="6" fill="#8b5cf6" className="animate-pulse" />
            <circle cx="500" cy="16" r="10" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="700" cy="16" r="4.5" fill="#6366f1" />
          </svg>
        </div>

        {/* Animated Power Flow Telemetry Dispatch Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>
              Real-Time Dynamic Dispatch:{' '}
              <strong className="text-white font-bold">
                {isSolarGenerating ? `${solarKw.toFixed(1)} kW Solar` : '0 kW Solar'} +{' '}
                {isDischarging ? `${netStorageKw.toFixed(1)} kW BESS Discharge` : '0 kW BESS'} →{' '}
                {demandKw.toFixed(1)} kW Total Demand
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Solar Generation
            </span>
            <span className="flex items-center gap-1 text-slate-200">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> BESS Transfer
            </span>
            <span className="flex items-center gap-1 text-slate-200">
              <span className="w-2 h-2 rounded-full bg-indigo-400" /> Load Consumption
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
