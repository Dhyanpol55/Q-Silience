import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  BarChart3,
  RefreshCw,
  Sun,
  Moon,
  Radio,
  Sparkles,
  Atom,
  Eye,
  X,
  Menu,
  Server,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  pingBackend,
  getStoredBackendUrl,
  setStoredBackendUrl,
  BackendHealth,
} from '../services/apiClient';

export type PageId = 'overview' | 'scenario_lab' | 'investigation' | 'live_stream' | 'quantum_lab' | 'benchmark';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({ status: 'checking' });
  const [backendModalOpen, setBackendModalOpen] = useState<boolean>(false);
  const [backendUrlInput, setBackendUrlInput] = useState<string>(getStoredBackendUrl());

  const checkConnectivity = async (testUrl?: string) => {
    setBackendHealth({ status: 'checking' });
    const health = await pingBackend(testUrl !== undefined ? testUrl : getStoredBackendUrl());
    setBackendHealth(health);
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  const handleSaveBackendUrl = async () => {
    setStoredBackendUrl(backendUrlInput);
    await checkConnectivity(backendUrlInput);
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
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-200 ${
          isDark
            ? 'bg-[#070a12]/90 border-slate-800/80 text-slate-100 shadow-sm shadow-black/20'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px] gap-4">
            {/* Branding / App Identifier */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-sm shadow-cyan-500/30">
                <Atom className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
                    Q-RESILIENCE AI
                  </h1>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                    QISKIT
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
                  <span>Quantum Microgrid Resilience</span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="text-cyan-900 dark:text-cyan-200 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 inline text-cyan-700 dark:text-cyan-300" />
                    Quantum + AI/ML
                  </span>
                </div>
              </div>
            </div>

            {/* Utility Controls Cluster */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Responsive Hamburger Toggle for viewports < lg */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden btn-secondary gap-1.5 px-2.5 h-9 text-slate-900 dark:text-slate-100 font-bold"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span className="text-xs font-bold">Sections</span>
              </button>

              <div className="hidden lg:block h-6 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

              <div className="flex items-center gap-2">
                {/* Backend Connectivity Status Badge */}
                <button
                  onClick={() => setBackendModalOpen(true)}
                  className={`h-9 flex items-center gap-2 px-3 rounded-xl border text-xs select-none transition-colors cursor-pointer ${
                    backendHealth.status === 'healthy'
                      ? isDark
                        ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/50'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold hover:bg-emerald-100'
                      : backendHealth.status === 'checking'
                      ? isDark
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                      : isDark
                      ? 'bg-amber-950/30 border-amber-800/40 text-amber-300 hover:bg-amber-900/40'
                      : 'bg-amber-50 border-amber-300 text-amber-950 font-semibold hover:bg-amber-100'
                  }`}
                  title="Backend API Status — Click to configure API endpoint"
                  aria-label="Backend API Status"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      backendHealth.status === 'healthy'
                        ? 'bg-emerald-500'
                        : backendHealth.status === 'checking'
                        ? 'bg-slate-400 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className="hidden sm:inline font-sans text-xs">
                    {backendHealth.status === 'healthy'
                      ? `FastAPI: ${backendHealth.latencyMs}ms`
                      : backendHealth.status === 'checking'
                      ? 'Checking API...'
                      : 'Local Demo Mode'}
                  </span>
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                </button>

                {/* Theme Toggle Button */}
                <button
                  onClick={onToggleTheme}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="btn-secondary"
                  aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  <span className={isDark ? 'text-amber-400' : 'text-slate-600'}>
                    {isDark ? <Sun className="w-4 h-4 stroke-[2]" /> : <Moon className="w-4 h-4 stroke-[2]" />}
                  </span>
                  <span className="hidden lg:inline font-sans text-xs font-medium">
                    {isDark ? 'Light' : 'Dark'}
                  </span>
                </button>

                {/* Reset Data Button */}
                <button
                  onClick={onResetData}
                  title="Reset dataset with new random seed"
                  className="btn-icon"
                  aria-label="Reset dataset with new random seed"
                >
                  <RefreshCw className="w-3.5 h-3.5 stroke-[2] hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Mobile & Laptop Navigation Drawer (< xl viewports) */}
          {mobileMenuOpen && (
            <div className="xl:hidden py-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectPage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                          : 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold'
                        : isDark
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.icon(isActive)}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Horizontal Scroll Navigation Strip on mobile (< md viewports) */}
          {!mobileMenuOpen && (
            <div className="flex md:hidden items-center gap-1.5 py-2 overflow-x-auto border-t border-slate-200 dark:border-slate-800 scrollbar-none">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPage(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg shrink-0 ${
                      isActive
                        ? isDark
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-cyan-600 text-white font-bold'
                        : isDark
                        ? 'text-slate-300 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.icon(isActive)}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Loading / Training Progress Line */}
        {isTraining && (
          <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500 animate-pulse" />
        )}
      </header>

      {/* Backend API Configuration & Status Modal */}
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
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/30">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">FastAPI Backend Status & Gateway</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Python Qiskit ML Service Integration</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className={`p-3.5 rounded-xl border space-y-2.5 font-mono ${isDark ? 'bg-slate-800/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">API Status:</span>
                  <span
                    className={`font-bold flex items-center gap-1.5 ${
                      backendHealth.status === 'healthy'
                        ? 'text-emerald-500'
                        : backendHealth.status === 'checking'
                        ? 'text-cyan-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {backendHealth.status === 'healthy' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE ({backendHealth.latencyMs}ms)
                      </>
                    ) : backendHealth.status === 'checking' ? (
                      'Pinging server...'
                    ) : (
                      'Offline (Local Demo Simulation Active)'
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Inference Engine:</span>
                  <span className="font-bold">
                    {backendHealth.status === 'healthy'
                      ? backendHealth.quantumModelStatus === 'genuine_qsvc'
                        ? 'Genuine Qiskit ML QSVC'
                        : 'Exact Statevector Fidelity Kernel + SVC'
                      : 'In-Browser Quantum Kernel Engine'}
                  </span>
                </div>

                {backendHealth.status === 'healthy' && backendHealth.quantumModelStatus === 'exact_statevector_fallback' && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200 dark:border-slate-700/60 font-sans">
                    QML Status: Exact Hilbert statevector fidelity kernel active {backendHealth.qmlError ? `(${backendHealth.qmlError})` : ''}. Pre-cached representations ensure sub-5ms latency.
                  </div>
                )}

                {backendHealth.status !== 'healthy' && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60 font-sans">
                    Notice: Backend not reachable ({backendHealth.error || 'Connection refused'}). Running in client-side local demo mode with verified Hilbert space statevector math.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Backend Base URL (Render / Local):</label>
                <input
                  type="text"
                  value={backendUrlInput}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  placeholder="e.g. http://localhost:8000 or your Render backend URL"
                  className={`w-full p-2.5 rounded-xl border font-mono text-xs ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                  }`}
                />
                <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">
                  Configures VITE_API_BASE_URL. Leave blank for relative proxy rewrites (/api and /health).
                </p>
              </div>

              <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${isDark ? 'border-slate-800 bg-slate-950/70 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-800'}`}>
                <div className="font-bold text-cyan-600 dark:text-cyan-400">Supported Endpoints:</div>
                <div>• <code className="font-mono">GET /health</code> — Qiskit &amp; backend readiness</div>
                <div>• <code className="font-mono">POST /api/predict</code> — Dual Classical SVC &amp; QSVC</div>
                <div>• <code className="font-mono">GET /api/scenarios</code> — IEEE standard grid presets</div>
                <div>• <code className="font-mono">GET /api/benchmark</code> — Stratified test evaluation</div>
                <div>• <code className="font-mono">GET /api/circuit</code> — Qiskit ZZFeatureMap circuit</div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => checkConnectivity(backendUrlInput)}
                className="btn-secondary text-xs font-mono"
              >
                Test Ping
              </button>

              <button
                onClick={handleSaveBackendUrl}
                className="btn-primary text-xs font-mono"
              >
                Save &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
