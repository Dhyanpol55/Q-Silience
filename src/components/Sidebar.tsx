import React from 'react';

interface SidebarProps {
  activeSection: string;
  onSelectSection?: (id: string) => void;
  className?: string;
}

export default function Sidebar({ activeSection, onSelectSection, className }: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', number: '01', icon: '📊' },
    { id: 'scenario-lab', label: 'Scenario Lab', number: '02', icon: '🔬' },
    { id: 'investigation', label: 'Investigation', number: '03', icon: '🔍' },
    { id: 'live-stream', label: 'Live Stream', number: '04', icon: '📡' },
    { id: 'quantum-circuit', label: 'Quantum Circuit', number: '05', icon: '⚛️' },
    { id: 'benchmark', label: 'Benchmark', number: '06', icon: '📈' },
    { id: 'reports', label: 'Report & Git', number: '07', icon: '📁' },
  ];

  const isItemActive = (itemId: string) => {
    if (activeSection === itemId) return true;
    if (itemId === 'scenario-lab' && activeSection === 'scenario_lab') return true;
    if (itemId === 'live-stream' && activeSection === 'live_stream') return true;
    if (itemId === 'quantum-circuit' && (activeSection === 'quantum_lab' || activeSection === 'quantum-circuit')) return true;
    if (itemId === 'reports' && (activeSection === 'report' || activeSection === 'reports')) return true;
    return false;
  };

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (onSelectSection) {
      e.preventDefault();
      onSelectSection(id);
    } else {
      const target =
        document.getElementById(id) ||
        document.getElementById(`section-${id.replace(/-/g, '_')}`);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <aside
      style={{ width: '220px' }}
      className={`h-screen border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/95 dark:bg-[#070b14]/95 backdrop-blur-md flex flex-col justify-between p-5 fixed left-0 top-0 z-50 text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
        className || ''
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-extrabold tracking-wider text-cyan-600 dark:text-cyan-400 text-sm">Q-RESILIENCE AI</h1>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">VTU Qiskit Fall Fest 2026</p>
          </div>
          <span className="text-[10px] font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
            v1.4.0
          </span>
        </div>

        {/* Navigation Links */}
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Core Modules
        </div>
        <nav className="flex flex-col gap-1.5" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const isActive = isItemActive(item.id);
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleItemClick(e, item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm shadow-cyan-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'
                  }`}
                >
                  {item.number}
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Status */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span>Local Engine</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">IEEE 1547.4 & EN 50160</p>
      </div>
    </aside>
  );
}
