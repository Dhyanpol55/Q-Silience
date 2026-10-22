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
      className={`w-72 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 fixed left-0 top-0 z-50 text-slate-200 ${
        className || ''
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-bold tracking-wider text-sky-400 text-sm">Q-RESILIENCE AI</h1>
            <p className="text-xs text-slate-400">VTU Qiskit Fall Fest 2026</p>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">v1.4.0</span>
        </div>

        {/* Navigation Links */}
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Core Modules</div>
        <nav className="flex flex-col gap-1.5" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const isActive = isItemActive(item.id);
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleItemClick(e, item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-sky-700 text-sky-100' : 'bg-slate-800 text-slate-500'
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
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span>Local Engine</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="text-[10px] text-slate-600">IEEE 1547.4 & EN 50160 Compliant</p>
      </div>
    </aside>
  );
}
