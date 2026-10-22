import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  BarChart3,
  FileText,
  RefreshCw,
  Sun,
  Moon,
  Radio,
  Sparkles,
  Atom,
  Eye,
  Server,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { pingBackend, getStoredBackendUrl, setStoredBackendUrl, BackendHealth } from '../services/apiClient';

export type PageId = 'overview' | 'live_stream' | 'scenario_lab' | 'investigation' | 'quantum_lab' | 'benchmark' | 'report';

interface HeaderProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  datasetCount: number;
  isTraining: boolean;
  onResetData: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onSelectPage,
  datasetCount,
  isTraining,
  onResetData,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  // Backend connectivity tracking
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({ status: 'checking' });
  const [backendModalOpen, setBackendModalOpen] = useState<boolean>(false);
  const [customBackendUrl, setCustomBackendUrl] = useState<string>(getStoredBackendUrl());

  const checkConnectivity = async () => {
    setBackendHealth({ status: 'checking' });
    const health = await pingBackend();
    setBackendHealth(health);
  };

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveBackendUrl = () => {
    setStoredBackendUrl(customBackendUrl);
    checkConnectivity();
    setBackendModalOpen(false);
  };

  const navItems: { id: PageId; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (active) => (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            active
              ? isDark
                ? 'bg-cyan-500 text-slate-950 shadow-xs shadow-cyan-500/50'
                : 'bg-cyan-500 text-white shadow-xs shadow-cyan-500/30'
              : isDark
              ? 'bg-slate-800/80 text-cyan-400 border border-slate-700/60 group-hover:bg-slate-700/80 group-hover:text-cyan-300'
              : 'bg-cyan-50 text-cyan-700 border border-cyan-200/60 group-hover:bg-cyan-100 group-hover:text-cyan-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5 stroke-[2.2]" />
        </span>
      ),
    },
    {
      id: 'scenario_lab',
      label: 'Scenario Lab',
      icon: (active) => (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            active
              ? isDark
                ? 'bg-amber-500 text-slate-950 shadow-xs shadow-amber-500/50'
                : 'bg-amber-500 text-white shadow-xs shadow-amber-500/30'
              : isDark
              ? 'bg-slate-800/80 text-amber-400 border border-slate-700/60 group-hover:bg-slate-700/80'
              : 'bg-amber-50 text-amber-600 border border-amber-200/60 group-hover:bg-amber-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
        </span>
      ),
    },
    {
      id: 'investigation',
      label: 'Investigation',
      icon: (active) => (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            active
              ? isDark
                ? 'bg-cyan-500 text-slate-950 shadow-xs shadow-cyan-500/50'
                : 'bg-cyan-600 text-white shadow-xs shadow-cyan-600/30'
              : isDark
              ? 'bg-slate-800/80 text-cyan-400 border border-slate-700/60 group-hover:bg-slate-700/80'
              : 'bg-cyan-50 text-cyan-700 border border-cyan-200/60 group-hover:bg-cyan-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
        </span>
      ),
    },
    {
      id: 'live_stream',
      label: 'Live Stream',
      icon: (active) => (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center relative transition-all ${
            active
              ? isDark
                ? 'bg-rose-500 text-white shadow-xs shadow-rose-500/50'
                : 'bg-rose-500 text-white shadow-xs shadow-rose-500/30'
              : isDark
              ? 'bg-slate-800/80 text-rose-400 border border-slate-700/60 group-hover:bg-slate-700/80'
              : 'bg-rose-50 text-rose-600 border border-rose-200/60 group-hover:bg-rose-100'
          }`}
        >
          <Radio className="w-3.5 h-3.5 stroke-[2.2]" />
          <span className="absolute 0.5 top-1 right-1 w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full animate-ping" />
        </span>
      ),
    },
    {
      id: 'quantum_lab',
      label: 'Quantum Circuit',
      icon: (active) => (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            active
              ? isDark
                ? 'bg-violet-500 text-white shadow-xs shadow-violet-500/50'
                : 'bg-violet-600 text-white shadow-xs shadow-violet-500/30'
              : isDark
              ? 'bg-slate-800/80 text-violet-400 border border-slate-700/60 group-hover:bg-slate-700/80'
              : 'bg-violet-50 text-violet-600 border border-violet-200/60 group-hover:bg-violet-100'
          }`}
        >
          <Atom className="w-3.5 h-3.5 stroke-[2.2]" />
        </span>
      ),
    },
    {
      id: 'benchmark',
      label: 'Benchmark',
      icon: (active) => (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            active
              ? isDark
                ? 'bg-sky-500 text-slate-950 shadow-xs shadow-sky-500/50'
                : 'bg-sky-600 text-white shadow-xs shadow-sky-600/30'
              : isDark
              ? 'bg-slate-800/80 text-sky-400 border border-slate-700/60 group-hover:bg-slate-700/80'
              : 'bg-sky-50 text-sky-700 border border-sky-200/60 group-hover:bg-sky-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 stroke-[2.2]" />
        </span>
      ),
    },
    {
      id: 'report',
      label: 'Report & Git',
      icon: (active) => (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            active
              ? isDark
                ? 'bg-indigo-500 text-white shadow-xs shadow-indigo-500/50'
                : 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
              : isDark
              ? 'bg-slate-800/80 text-indigo-400 border border-slate-700/60 group-hover:bg-slate-700/80'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 group-hover:bg-indigo-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
        </span>
      ),
    },
  ];

  return (
    <>
      <header
        className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
          isDark
            ? 'border-slate-800/80 bg-slate-950/90 shadow-md'
            : 'border-slate-200/90 bg-white/95 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand Identity */}
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-md ${
                  isDark
                    ? 'bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 border-cyan-500/40 shadow-cyan-950/60 ring-1 ring-cyan-500/20'
                    : 'bg-gradient-to-br from-cyan-500 to-indigo-600 border-transparent shadow-cyan-500/25 text-white'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Atom className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-white'} stroke-[2.2]`} />
                  <Zap className="w-2.5 h-2.5 text-amber-300 absolute fill-amber-300 drop-shadow-xs" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-extrabold text-base tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Q-RESILIENCE AI
                  </span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold px-1.5 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800">
                    v1.3.0
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    VTU Qiskit Fall Fest 2026
                  </span>
                  <span aria-hidden="true" className={isDark ? 'text-slate-700' : 'text-slate-300'}>
                    ·
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 inline text-cyan-500" />
                    Quantum + AI/ML
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Segmented Control */}
            <nav
              className={`hidden md:flex items-center gap-1 p-1 rounded-xl border transition-colors overflow-x-auto ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPage(item.id)}
                    className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer shrink-0 ${
                      isActive
                        ? isDark
                          ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                          : 'bg-white text-cyan-800 font-semibold shadow-xs border border-slate-200/90'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {item.icon(isActive)}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Utility Action Controls: Perfectly vertically centered with unified 36px height & 12px text */}
            <div className="flex items-center gap-2.5 ml-4 shrink-0">
              {/* Backend Status Button (Unified h-9 height, >=12px text) */}
              <button
                onClick={() => setBackendModalOpen(true)}
                title="Inspect FastAPI Backend Status & Endpoints"
                className={`h-9 flex items-center gap-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  backendHealth.status === 'healthy'
                    ? isDark
                      ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Server className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline font-sans text-xs font-medium">
                  {backendHealth.status === 'healthy' ? (
                    <>FastAPI: {backendHealth.latencyMs}ms</>
                  ) : backendHealth.status === 'checking' ? (
                    <>Checking API...</>
                  ) : (
                    <>Local Quantum Engine</>
                  )}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    backendHealth.status === 'healthy'
                      ? 'bg-emerald-500'
                      : backendHealth.status === 'checking'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-cyan-500'
                  }`}
                />
              </button>

              {/* Theme Toggle Button (Unified h-9 height, >=12px text) */}
              <button
                onClick={onToggleTheme}
                title={isDark ? 'Switch to Pure White Background' : 'Switch to Dark Mode'}
                className={`h-9 flex items-center gap-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-2xs shrink-0 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={isDark ? 'text-amber-400' : 'text-slate-600'}>
                  {isDark ? <Sun className="w-4 h-4 stroke-[2]" /> : <Moon className="w-4 h-4 stroke-[2]" />}
                </span>
                <span className="hidden lg:inline font-sans text-xs font-medium">
                  {isDark ? 'Light' : 'Dark'}
                </span>
              </button>

              {/* Reset Data Button (Unified h-9 height, standardized icon button) */}
              <button
                onClick={onResetData}
                title="Reset dataset with new random seed"
                className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer shadow-2xs shrink-0 ${
                  isDark
                    ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 bg-slate-900'
                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 bg-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2] hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Strip */}
          <div className="flex md:hidden items-center space-x-1 py-2 overflow-x-auto border-t border-slate-200 dark:border-slate-800">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 ${
                    isActive
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-cyan-600 text-white font-bold'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Backend Diagnostics Modal */}
      {backendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <button
              onClick={() => setBackendModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">FastAPI & Quantum Backend Status</h3>
                <p className="text-xs font-mono text-slate-400">Render Production & Local Server Gateway</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Connection Status:</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      backendHealth.status === 'healthy'
                        ? 'text-emerald-400'
                        : backendHealth.status === 'checking'
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}
                  >
                    {backendHealth.status === 'healthy' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE ({backendHealth.latencyMs}ms)
                      </>
                    ) : backendHealth.status === 'checking' ? (
                      'Pinging server...'
                    ) : (
                      'Client-Side High-Fidelity Simulator Active'
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Inference Engine:</span>
                  <span className="font-bold text-white">
                    {backendHealth.status === 'healthy' ? 'Remote Python Qiskit 1.3+' : 'In-Browser JS/Wasm Quantum Kernel'}
                  </span>
                </div>

                {backendHealth.error && (
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                    Notice: Remote server response ({backendHealth.error}). Falling back seamlessly to local in-browser quantum engine with zero interruption.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">FastAPI Backend Endpoint URL:</label>
                <input
                  type="text"
                  value={customBackendUrl}
                  onChange={(e) => setCustomBackendUrl(e.target.value)}
                  placeholder="https://q-resilience-api.onrender.com or http://localhost:8000"
                  className={`w-full p-2.5 rounded-xl border font-mono text-xs ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Default: https://q-resilience-api.onrender.com or local FastAPI uvicorn instance.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/20 text-[11px] space-y-1">
                <div className="font-bold text-cyan-400">Supported Backend Endpoints:</div>
                <div>• <code className="text-slate-200">GET /health</code> — Qiskit & model readiness</div>
                <div>• <code className="text-slate-200">POST /api/predict</code> — Classical SVC & Quantum QSVC</div>
                <div>• <code className="text-slate-200">GET /api/benchmark</code> — Stratified benchmark metrics</div>
                <div>• <code className="text-slate-200">GET /api/circuit</code> — Qiskit ZZFeatureMap ASCII diagram</div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={checkConnectivity}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono hover:bg-slate-800 cursor-pointer"
              >
                Re-Test Ping
              </button>

              <button
                onClick={handleSaveBackendUrl}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs font-mono cursor-pointer"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
