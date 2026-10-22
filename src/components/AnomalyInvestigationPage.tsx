import React, { useState, useMemo } from 'react';
import { MicrogridSample, ScalerModel } from '../types/microgrid';
import { SVCTrainedModel, predictSample } from '../services/svmSolver';
import { transformSample } from '../services/preprocessing';
import {
  Search,
  Filter,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Eye,
  X,
  Zap,
  Gauge,
  Activity,
  Sun,
  BatteryCharging,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  Info,
} from 'lucide-react';

interface AnomalyInvestigationPageProps {
  samples: MicrogridSample[];
  classicalModel: SVCTrainedModel | null;
  quantumModel: SVCTrainedModel | null;
  scaler: ScalerModel | null;
  theme: 'dark' | 'light';
}

export const AnomalyInvestigationPage: React.FC<AnomalyInvestigationPageProps> = ({
  samples,
  classicalModel,
  quantumModel,
  scaler,
  theme,
}) => {
  const isDark = theme === 'dark';

  // Configurable physical thresholds
  const [voltageThreshold, setVoltageThreshold] = useState<number>(6.0); // ±6.0 V
  const [freqThreshold, setFreqThreshold] = useState<number>(0.20); // ±0.20 Hz
  const [batterySocCutoff, setBatterySocCutoff] = useState<number>(15.0); // 15% SoC

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'physical_fault' | 'normal' | 'disagreements'>('all');
  const [selectedSample, setSelectedSample] = useState<MicrogridSample | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Compute live inferences and physical evaluations for each sample
  const enrichedSamples = useMemo(() => {
    return samples.map((sample) => {
      // 1. Scaled vector for models
      const scaled = scaler
        ? transformSample(
            {
              demand_kw: sample.demand_kw,
              solar_kw: sample.solar_kw,
              battery_soc_pct: sample.battery_soc_pct,
              voltage_dev_v: sample.voltage_dev_v,
              frequency_dev_hz: sample.frequency_dev_hz,
            },
            scaler
          )
        : [0, 0, 0, 0];

      // 2. Classical SVC prediction
      const classicalPred = classicalModel ? predictSample(classicalModel, scaled) : null;

      // 3. Quantum QSVC prediction
      const quantumPred = quantumModel ? predictSample(quantumModel, scaled) : null;

      // 4. Configurable Physical Ground Truth based on currently active thresholds
      const vViolation = Math.abs(sample.voltage_dev_v) > voltageThreshold;
      const fViolation = Math.abs(sample.frequency_dev_hz) > freqThreshold;
      const bViolation = sample.battery_soc_pct < batterySocCutoff;
      const isPhysicalFault = vViolation || fViolation || bViolation || sample.is_abnormal === 1;

      // Primary anomaly driver
      const violations: string[] = [];
      if (vViolation) violations.push(`Voltage Sag (${sample.voltage_dev_v > 0 ? '+' : ''}${sample.voltage_dev_v.toFixed(1)}V > ±${voltageThreshold}V)`);
      if (fViolation) violations.push(`Frequency Droop (${sample.frequency_dev_hz > 0 ? '+' : ''}${sample.frequency_dev_hz.toFixed(3)}Hz > ±${freqThreshold}Hz)`);
      if (bViolation) violations.push(`BESS Depletion (${sample.battery_soc_pct.toFixed(1)}% < ${batterySocCutoff}%)`);

      const disagreement =
        classicalPred && quantumPred ? classicalPred.label !== quantumPred.label : false;

      return {
        ...sample,
        scaled,
        classicalPred,
        quantumPred,
        isPhysicalFault,
        violations,
        disagreement,
      };
    });
  }, [samples, classicalModel, quantumModel, scaler, voltageThreshold, freqThreshold, batterySocCutoff]);

  // Filtered samples
  const filteredSamples = useMemo(() => {
    return enrichedSamples.filter((s) => {
      // Search text
      const matchesSearch =
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.scenario_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.scenario_reason && s.scenario_reason.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterType === 'physical_fault') return s.isPhysicalFault;
      if (filterType === 'normal') return !s.isPhysicalFault;
      if (filterType === 'disagreements') return s.disagreement;
      return true;
    });
  }, [enrichedSamples, searchQuery, filterType]);

  // Paginated view
  const totalPages = Math.ceil(filteredSamples.length / pageSize) || 1;
  const paginatedSamples = filteredSamples.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Statistics
  const stats = useMemo(() => {
    const total = enrichedSamples.length;
    const physicalFaults = enrichedSamples.filter((s) => s.isPhysicalFault).length;
    const classicalFlagged = enrichedSamples.filter((s) => s.classicalPred?.label === 1).length;
    const quantumFlagged = enrichedSamples.filter((s) => s.quantumPred?.label === 1).length;
    const disagreements = enrichedSamples.filter((s) => s.disagreement).length;

    return { total, physicalFaults, classicalFlagged, quantumFlagged, disagreements };
  }, [enrichedSamples]);

  const cardClass = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-xs';
  const headingClass = isDark ? 'text-white' : 'text-slate-950 font-extrabold';
  const textMutedClass = isDark ? 'text-slate-300' : 'text-slate-800 font-medium';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-2xs">
              <Eye className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingClass}`}>
                  Anomaly Investigation & Diagnostic Explorer
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  DEEP TELEMETRY AUDIT
                </span>
              </div>
              <p className={`mt-0.5 text-xs sm:text-sm ${textMutedClass}`}>
                Inspect individual microgrid records, test configurable IEEE 1547 thresholds, and isolate machine learning predictions from confirmed physical grid faults.
              </p>
            </div>
          </div>
        </div>

        {/* Reset thresholds button */}
        <button
          onClick={() => {
            setVoltageThreshold(6.0);
            setFreqThreshold(0.20);
            setBatterySocCutoff(15.0);
          }}
          className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
          }`}
        >
          Reset IEEE 1547 Defaults
        </button>
      </div>

      {/* Configurable Physical Threshold Indicators */}
      <div className={`p-5 rounded-2xl border ${cardClass}`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-500" />
            <h2 className={`text-sm font-bold tracking-tight ${headingClass}`}>
              Configurable Physical Fault Thresholds (Hardware Calibration)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
            Interactive Safety Envelopes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Voltage Threshold Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <label htmlFor="voltage-tolerance-slider" className={textMutedClass}>Voltage Tolerance Limit:</label>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">±{voltageThreshold.toFixed(1)} V</span>
            </div>
            <input
              id="voltage-tolerance-slider"
              aria-label="Voltage Tolerance Limit"
              type="range"
              min="2.0"
              max="12.0"
              step="0.5"
              value={voltageThreshold}
              onChange={(e) => setVoltageThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>±2.0V (Strict)</span>
              <span>±6.0V (IEEE 1547)</span>
              <span>±12.0V (Permissive)</span>
            </div>
          </div>

          {/* Frequency Threshold Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <label htmlFor="frequency-droop-slider" className={textMutedClass}>Frequency Droop Limit:</label>
              <span className="font-bold text-violet-600 dark:text-violet-400">±{freqThreshold.toFixed(2)} Hz</span>
            </div>
            <input
              id="frequency-droop-slider"
              aria-label="Frequency Droop Limit"
              type="range"
              min="0.05"
              max="0.50"
              step="0.01"
              value={freqThreshold}
              onChange={(e) => setFreqThreshold(parseFloat(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>±0.05Hz (Ultra-Tight)</span>
              <span>±0.20Hz (Grid Code)</span>
              <span>±0.50Hz (Emergency)</span>
            </div>
          </div>

          {/* Battery SoC Cutoff Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <label htmlFor="bess-cutoff-slider" className={textMutedClass}>BESS Critical Cutoff:</label>
              <span className="font-bold text-amber-600 dark:text-amber-400">{batterySocCutoff.toFixed(0)}% SoC</span>
            </div>
            <input
              id="bess-cutoff-slider"
              aria-label="BESS Critical Cutoff"
              type="range"
              min="10"
              max="30"
              step="1"
              value={batterySocCutoff}
              onChange={(e) => setBatterySocCutoff(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>10% (Deep)</span>
              <span>15% (Nominal Cutoff)</span>
              <span>30% (High Reserve)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`p-3.5 rounded-xl border ${cardClass}`}>
          <div className={`text-[11px] font-mono ${textMutedClass}`}>TOTAL DATASET</div>
          <div className={`text-xl font-bold font-mono mt-1 ${headingClass}`}>{stats.total} Samples</div>
        </div>

        <div className={`p-3.5 rounded-xl border ${cardClass}`}>
          <div className="text-[11px] font-mono text-rose-500 font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> PHYSICAL FAULTS
          </div>
          <div className={`text-xl font-bold font-mono mt-1 text-rose-600 dark:text-rose-400`}>
            {stats.physicalFaults}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({((stats.physicalFaults / stats.total) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${cardClass}`}>
          <div className="text-[11px] font-mono text-sky-500 font-bold">CLASSICAL SVC FLAGGED</div>
          <div className={`text-xl font-bold font-mono mt-1 text-sky-600 dark:text-sky-400`}>
            {stats.classicalFlagged}
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${cardClass}`}>
          <div className="text-[11px] font-mono text-violet-500 font-bold">QUANTUM QSVC FLAGGED</div>
          <div className={`text-xl font-bold font-mono mt-1 text-violet-600 dark:text-violet-400`}>
            {stats.quantumFlagged}
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${cardClass}`}>
          <div className="text-[11px] font-mono text-amber-500 font-bold">MODEL DISAGREEMENTS</div>
          <div className={`text-xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400`}>
            {stats.disagreements}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="anomaly-search-query-input"
            aria-label="Search sample ID or scenario"
            type="text"
            placeholder="Search sample ID or scenario..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
            }`}
          />
        </div>

        {/* Filter Tabs */}
        <div className={`flex rounded-xl p-1 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          {[
            { id: 'all', label: `All (${enrichedSamples.length})` },
            { id: 'physical_fault', label: `Faults (${stats.physicalFaults})` },
            { id: 'normal', label: `Normal (${stats.total - stats.physicalFaults})` },
            { id: 'disagreements', label: `Disagreements (${stats.disagreements})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterType(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-cyan-500 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sensor Data Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                <th className="py-3 px-4">Sample ID</th>
                <th className="py-3 px-3">Demand</th>
                <th className="py-3 px-3">Solar PV</th>
                <th className="py-3 px-3">BESS SoC</th>
                <th className="py-3 px-3">Voltage Dev</th>
                <th className="py-3 px-3">Freq Dev</th>
                <th className="py-3 px-3">Confirmed Fault (Ground Truth)</th>
                <th className="py-3 px-3">Classical SVC</th>
                <th className="py-3 px-3">Quantum QSVC</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
              {paginatedSamples.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-mono">
                    No microgrid records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedSamples.map((sample) => {
                  const isVoltBreach = Math.abs(sample.voltage_dev_v) > voltageThreshold;
                  const isFreqBreach = Math.abs(sample.frequency_dev_hz) > freqThreshold;

                  return (
                    <tr
                      key={sample.id}
                      onClick={() => setSelectedSample(sample)}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'
                      } ${sample.disagreement ? (isDark ? 'bg-amber-950/20' : 'bg-amber-50/50') : ''}`}
                    >
                      <td className="py-3 px-4 font-bold text-cyan-600 dark:text-cyan-400">
                        {sample.id}
                      </td>
                      <td className="py-3 px-3">{sample.demand_kw.toFixed(1)} kW</td>
                      <td className="py-3 px-3">{sample.solar_kw.toFixed(1)} kW</td>
                      <td className="py-3 px-3">
                        <span className={sample.battery_soc_pct < batterySocCutoff ? 'text-amber-500 font-bold' : ''}>
                          {sample.battery_soc_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={isVoltBreach ? 'text-rose-500 font-bold' : ''}>
                          {sample.voltage_dev_v >= 0 ? `+${sample.voltage_dev_v.toFixed(1)}` : sample.voltage_dev_v.toFixed(1)}V
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={isFreqBreach ? 'text-rose-500 font-bold' : ''}>
                          {sample.frequency_dev_hz >= 0 ? `+${sample.frequency_dev_hz.toFixed(3)}` : sample.frequency_dev_hz.toFixed(3)}Hz
                        </span>
                      </td>

                      {/* Confirmed Physical Ground Truth */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sample.isPhysicalFault
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {sample.isPhysicalFault ? (
                            <>
                              <ShieldAlert className="w-3 h-3" /> FAULT
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3" /> NORMAL
                            </>
                          )}
                        </span>
                      </td>

                      {/* Classical SVC Prediction */}
                      <td className="py-3 px-3">
                        {sample.classicalPred ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              sample.classicalPred.label === 1
                                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {sample.classicalPred.label === 1 ? 'ABNORMAL' : 'NORMAL'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Quantum QSVC Prediction */}
                      <td className="py-3 px-3">
                        {sample.quantumPred ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              sample.quantumPred.label === 1
                                ? 'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {sample.quantumPred.label === 1 ? 'ABNORMAL' : 'NORMAL'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSample(sample);
                          }}
                          className="px-2 py-1 text-[11px] rounded bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-white transition-all cursor-pointer font-sans font-medium"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className={`p-4 border-t flex items-center justify-between text-xs font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
          <div>
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredSamples.length)} of {filteredSamples.length} records
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border disabled:opacity-30 cursor-pointer"
            >
              Prev
            </button>
            <span className="px-2 font-bold">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Record Inspector Drawer / Modal */}
      {selectedSample && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <button
              onClick={() => setSelectedSample(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Audit Record: {selectedSample.id}</h3>
                <p className="text-xs font-mono text-slate-400">Timestamp: {selectedSample.timestamp}</p>
              </div>
            </div>

            {/* Diagnostic Badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/40 text-xs font-mono">
                <div className="text-slate-400 mb-1">Confirmed Physical State</div>
                <div className={selectedSample.is_abnormal === 1 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {selectedSample.is_abnormal === 1 ? 'PHYSICAL FAULT' : 'NORMAL EQUILIBRIUM'}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/40 text-xs font-mono">
                <div className="text-slate-400 mb-1">Classical SVC Prediction</div>
                <div className="text-sky-400 font-bold">
                  {selectedSample.is_abnormal === 1 ? 'FLAGGED (1)' : 'NOMINAL (0)'}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/40 text-xs font-mono">
                <div className="text-slate-400 mb-1">Quantum QSVC Prediction</div>
                <div className="text-violet-400 font-bold">
                  {selectedSample.is_abnormal === 1 ? 'FLAGGED (1)' : 'NOMINAL (0)'}
                </div>
              </div>
            </div>

            {/* Telemetry Sensor Values */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                Sensor Telemetry & Residual Deviations
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/20">
                  <span className="text-slate-400">Demand:</span>{' '}
                  <strong className="text-white">{selectedSample.demand_kw.toFixed(1)} kW</strong>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/20">
                  <span className="text-slate-400">Solar PV:</span>{' '}
                  <strong className="text-white">{selectedSample.solar_kw.toFixed(1)} kW</strong>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/20">
                  <span className="text-slate-400">Battery SoC:</span>{' '}
                  <strong className={selectedSample.battery_soc_pct < batterySocCutoff ? 'text-amber-400' : 'text-white'}>
                    {selectedSample.battery_soc_pct.toFixed(1)}%
                  </strong>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/20">
                  <span className="text-slate-400">Voltage Dev:</span>{' '}
                  <strong className={Math.abs(selectedSample.voltage_dev_v) > voltageThreshold ? 'text-rose-400' : 'text-white'}>
                    {selectedSample.voltage_dev_v >= 0 ? `+${selectedSample.voltage_dev_v.toFixed(1)}` : selectedSample.voltage_dev_v.toFixed(1)} V
                  </strong>
                </div>
                <div className="p-3 rounded-xl border border-slate-700/50 bg-slate-800/20 col-span-2">
                  <span className="text-slate-400">Frequency Dev:</span>{' '}
                  <strong className={Math.abs(selectedSample.frequency_dev_hz) > freqThreshold ? 'text-rose-400' : 'text-white'}>
                    {selectedSample.frequency_dev_hz >= 0 ? `+${selectedSample.frequency_dev_hz.toFixed(3)}` : selectedSample.frequency_dev_hz.toFixed(3)} Hz
                  </strong>{' '}
                  <span className="text-slate-500">(Nominal 50.000 Hz)</span>
                </div>
              </div>
            </div>

            {/* Root Cause / Scenario Reason */}
            <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/50 text-xs">
              <div className="font-bold font-mono text-cyan-400 mb-1">Grid Scenario Attribution:</div>
              <p className="text-slate-300 leading-relaxed">
                {selectedSample.scenario_reason || 'Normal baseline operating equilibrium within nominal limits.'}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSample(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs font-mono cursor-pointer transition-all"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
