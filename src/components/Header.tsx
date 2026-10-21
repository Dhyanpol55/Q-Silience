import React from 'react';
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
} from 'lucide-react';

export type PageId = 'overview' | 'live_stream' | 'scenario_lab' | 'quantum_lab' | 'benchmark' | 'report';

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
                ? 'bg-cyan-500 text-slate-950 shadow-xs shadow-cyan-500/50'
                : 'bg-cyan-600 text-white shadow-xs shadow-cyan-600/30'
              : isDark
              ? 'bg-slate-800/80 text-cyan-400 border border-slate-700/60 group-hover:bg-slate-700/80'
              : 'bg-cyan-50 text-cyan-700 border border-cyan-200/60 group-hover:bg-cyan-100'
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
    <header
      className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors ${
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
                  v1.2.0
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
            className={`flex items-center space-x-1 p-1 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`group flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer ${
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

          {/* Status Bar & Theme Switcher */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            {/* Theme Toggle (Light / White vs Dark) */}
            <button
              onClick={onToggleTheme}
              title={isDark ? 'Switch to Pure White Background' : 'Switch to Dark Mode'}
              className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                  isDark
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                    : 'bg-amber-50 text-amber-600 border border-amber-200/80'
                }`}
              >
                {isDark ? <Sun className="w-3.5 h-3.5 stroke-[2.2]" /> : <Moon className="w-3.5 h-3.5 stroke-[2.2]" />}
              </span>
              <span className="hidden sm:inline font-sans font-medium text-[11px]">
                {isDark ? 'White Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Model status indicator */}
            <div className="hidden lg:flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isTraining ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {isTraining ? 'Evaluating...' : 'Models Ready'}
              </span>
            </div>

            <button
              onClick={onResetData}
              title="Reset dataset with new random seed"
              className={`group p-2 rounded-xl border transition-colors cursor-pointer shadow-2xs ${
                isDark
                  ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 bg-slate-900'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.2] group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
