import React from 'react';
import { Cpu, Zap, Activity, BarChart3, FileText, RefreshCw, Sun, Moon, Radio } from 'lucide-react';

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

  const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    {
      id: 'live_stream',
      label: 'Live Stream',
      icon: (
        <span className="relative flex items-center">
          <Radio className="w-4 h-4 text-rose-500" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
        </span>
      ),
    },
    { id: 'scenario_lab', label: 'Scenario Lab', icon: <Zap className="w-4 h-4" /> },
    { id: 'quantum_lab', label: 'Quantum Circuit', icon: <Cpu className="w-4 h-4" /> },
    { id: 'benchmark', label: 'Benchmark', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'report', label: 'Report & API', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header
      className={`border-b sticky top-0 z-50 backdrop-blur-md transition-colors ${
        isDark
          ? 'border-slate-800 bg-slate-950/85'
          : 'border-slate-200 bg-white/90 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Hackathon Identity */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shadow-xs transition-colors ${
                isDark
                  ? 'bg-cyan-950 border-cyan-800/60 text-cyan-400'
                  : 'bg-cyan-50 border-cyan-300 text-cyan-600'
              }`}
            >
              <Zap className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-base tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Q-RESILIENCE AI
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">v1.0.0</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>VTU Qiskit Fall Fest 2026</span>
                <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-medium">Quantum + AI/ML</span>
              </div>
            </div>
          </div>

          {/* Navigation Segmented Control */}
          <nav
            className={`flex items-center space-x-1 p-1 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
          >
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                        : 'bg-white text-cyan-700 font-semibold shadow-xs border border-slate-200/80'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {item.icon}
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
              title={isDark ? 'Switch to White / Light Background' : 'Switch to Dark Background'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">White Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Status indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isTraining ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                {isTraining ? 'Evaluating...' : 'Models Ready'}
              </span>
            </div>

            <button
              onClick={onResetData}
              title="Reset dataset with new random seed"
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
