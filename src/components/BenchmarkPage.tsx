import React from 'react';
import { ModelMetrics, LowDataBenchmarkPoint } from '../types/microgrid';
import {
  BarChart3,
  Scale,
  Info,
  TrendingUp,
  Cpu,
  Atom,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Trophy,
  Timer,
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
  BarChart,
  Bar,
} from 'recharts';

interface BenchmarkPageProps {
  classicalMetrics: ModelMetrics | null;
  quantumMetrics: ModelMetrics | null;
  lowDataPoints: LowDataBenchmarkPoint[];
  onRerunBenchmark: () => void;
  isBenchmarking: boolean;
  theme: 'dark' | 'light';
}

export const BenchmarkPage: React.FC<BenchmarkPageProps> = ({
  classicalMetrics,
  quantumMetrics,
  lowDataPoints,
  onRerunBenchmark,
  isBenchmarking,
  theme,
}) => {
  const isDark = theme === 'dark';

  // Recharts data for Low-Data Scaling LineChart
  const lowDataChartData = lowDataPoints.map((pt) => ({
    name: `${pt.trainFraction * 100}% (${pt.sampleCount} samples)`,
    fractionPct: pt.trainFraction * 100,
    classicalF1: Number((pt.classicalF1 * 100).toFixed(1)),
    quantumF1: Number((pt.quantumF1 * 100).toFixed(1)),
    classicalAcc: Number((pt.classicalAccuracy * 100).toFixed(1)),
    quantumAcc: Number((pt.quantumAccuracy * 100).toFixed(1)),
  }));

  // Recharts data for Metrics Head-to-Head BarChart
  const metricsBarData = [
    {
      metric: 'Accuracy',
      Classical: classicalMetrics ? Number((classicalMetrics.accuracy * 100).toFixed(1)) : 0,
      Quantum: quantumMetrics ? Number((quantumMetrics.accuracy * 100).toFixed(1)) : 0,
    },
    {
      metric: 'Precision',
      Classical: classicalMetrics ? Number((classicalMetrics.precision * 100).toFixed(1)) : 0,
      Quantum: quantumMetrics ? Number((quantumMetrics.precision * 100).toFixed(1)) : 0,
    },
    {
      metric: 'Recall',
      Classical: classicalMetrics ? Number((classicalMetrics.recall * 100).toFixed(1)) : 0,
      Quantum: quantumMetrics ? Number((quantumMetrics.recall * 100).toFixed(1)) : 0,
    },
    {
      metric: 'F1-Score',
      Classical: classicalMetrics ? Number((classicalMetrics.f1Score * 100).toFixed(1)) : 0,
      Quantum: quantumMetrics ? Number((quantumMetrics.f1Score * 100).toFixed(1)) : 0,
    },
  ];

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
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 ${headingClass}`}>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-2xs">
              <Scale className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <span>Fair Classical vs Quantum Model Benchmark</span>
          </h1>
          <p className={`mt-1 text-xs sm:text-sm ${textMutedClass}`}>
            Rigorous evaluation on identical stratified 75/25 splits with train-fitted scalers and zero data leakage.
          </p>
        </div>

        <button
          onClick={onRerunBenchmark}
          disabled={isBenchmarking}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 stroke-[2.2] ${isBenchmarking ? 'animate-spin' : ''}`} />
          <span>{isBenchmarking ? 'Running Benchmark...' : 'Re-run Evaluation'}</span>
        </button>
      </div>

      {/* Head-to-Head Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Classical SVC Card */}
        <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                <Cpu className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Classical Baseline</span>
                <h2 className={`text-base font-bold ${headingClass}`}>Support Vector Classifier (SVC)</h2>
              </div>
            </div>
            <span className={`text-xs font-mono ${textMutedClass}`}>Kernel: RBF</span>
          </div>

          {classicalMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className={`p-2.5 rounded-lg border ${innerCardClass}`}>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>ACCURACY</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${headingClass}`}>
                    {(classicalMetrics.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${innerCardClass}`}>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>F1-SCORE</div>
                  <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                    {classicalMetrics.f1Score.toFixed(3)}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${innerCardClass}`}>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>PRECISION</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${headingClass}`}>
                    {classicalMetrics.precision.toFixed(3)}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${innerCardClass}`}>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>RECALL</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${headingClass}`}>
                    {classicalMetrics.recall.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div>
                <div className={`text-xs font-medium mb-2 ${headingClass}`}>Confusion Matrix (Held-out Test Split)</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs text-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-lg">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">TRUE NEGATIVES (Normal)</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{classicalMetrics.trueNegatives}</div>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/40 rounded-lg">
                    <div className="text-[10px] text-rose-700 dark:text-rose-400">FALSE POSITIVES (False Alarm)</div>
                    <div className="text-xl font-bold text-rose-600 dark:text-rose-300 mt-1">{classicalMetrics.falsePositives}</div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/40 rounded-lg">
                    <div className="text-[10px] text-amber-700 dark:text-amber-400">FALSE NEGATIVES (Missed)</div>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-300 mt-1">{classicalMetrics.falseNegatives}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-lg">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">TRUE POSITIVES (Detected)</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{classicalMetrics.truePositives}</div>
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div className={`flex items-center justify-between pt-2 border-t text-xs font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <span>Training Latency: {classicalMetrics.trainTimeMs} ms</span>
                <span>Inference Latency: {classicalMetrics.inferenceTimeMs} ms</span>
              </div>
            </div>
          ) : (
            <div className={`py-12 text-center text-xs ${textMutedClass}`}>Evaluating Classical Model...</div>
          )}
        </div>

        {/* Quantum QSVC Card */}
        <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-2xs">
                <Atom className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Quantum Classifier</span>
                <h2 className={`text-base font-bold ${headingClass}`}>Quantum SVC (QSVC)</h2>
              </div>
            </div>
            <span className={`text-xs font-mono ${textMutedClass}`}>Kernel: ZZFeatureMap</span>
          </div>

          {quantumMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className={`p-2.5 rounded-lg border ${innerCardClass}`}>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>ACCURACY</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${headingClass}`}>
                    {(quantumMetrics.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${innerCardClass}`}>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>F1-SCORE</div>
                  <div className="text-lg font-bold text-violet-600 dark:text-violet-400 font-mono mt-0.5">
                    {quantumMetrics.f1Score.toFixed(3)}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${innerCardClass}`}>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>PRECISION</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${headingClass}`}>
                    {quantumMetrics.precision.toFixed(3)}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${innerCardClass}`}>
                  <div className={`text-[10px] font-mono ${textMutedClass}`}>RECALL</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${headingClass}`}>
                    {quantumMetrics.recall.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Confusion Matrix */}
              <div>
                <div className={`text-xs font-medium mb-2 ${headingClass}`}>Confusion Matrix (Held-out Test Split)</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs text-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-lg">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">TRUE NEGATIVES (Normal)</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{quantumMetrics.trueNegatives}</div>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/40 rounded-lg">
                    <div className="text-[10px] text-rose-700 dark:text-rose-400">FALSE POSITIVES (False Alarm)</div>
                    <div className="text-xl font-bold text-rose-600 dark:text-rose-300 mt-1">{quantumMetrics.falsePositives}</div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/40 rounded-lg">
                    <div className="text-[10px] text-amber-700 dark:text-amber-400">FALSE NEGATIVES (Missed)</div>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-300 mt-1">{quantumMetrics.falseNegatives}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-lg">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">TRUE POSITIVES (Detected)</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{quantumMetrics.truePositives}</div>
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div className={`flex items-center justify-between pt-2 border-t text-xs font-mono ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <span>Training Latency: {quantumMetrics.trainTimeMs} ms</span>
                <span>Inference Latency: {quantumMetrics.inferenceTimeMs} ms</span>
              </div>
            </div>
          ) : (
            <div className={`py-12 text-center text-xs ${textMutedClass}`}>Evaluating Quantum Model...</div>
          )}
        </div>
      </div>

      {/* Recharts BarChart: Head-to-Head Metric Comparison */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-sm font-semibold flex items-center gap-2 ${headingClass}`}>
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              <span>Comparative Performance Metrics (Recharts BarChart)</span>
            </h2>
            <p className={`text-xs ${textMutedClass}`}>
              Direct comparison of Classical SVC vs Quantum QSVC across Accuracy, Precision, Recall, and F1 (%)
            </p>
          </div>
          <span className={`text-xs font-mono ${textMutedClass}`}>Higher is Better</span>
        </div>

        <div className={`h-64 w-full p-2 rounded-lg border transition-colors ${innerCardClass}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metricsBarData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="metric" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null;
                  return (
                    <div
                      className={`p-3 border rounded-lg text-xs font-mono shadow-xl ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="font-bold mb-1">{label}</div>
                      {payload.map((entry, idx) => (
                        <div key={idx} style={{ color: entry.color }}>
                          {entry.name}: <span className="font-bold">{entry.value}%</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Classical" fill="#0284c7" radius={[4, 4, 0, 0]} name="Classical SVC (RBF)" />
              <Bar dataKey="Quantum" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Quantum QSVC (ZZFeatureMap)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recharts LineChart: Low-Data Scaling Curves */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
        <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h2 className={`text-sm font-semibold flex items-center gap-2 ${headingClass}`}>
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <span>Sample Efficiency: Low-Data Scaling Curves (Recharts LineChart)</span>
            </h2>
            <p className={`text-xs ${textMutedClass}`}>
              F1-score trajectories as training data scales from 25% (sparse) to 100% on fixed held-out test split
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">Sample Generalization</span>
        </div>

        <div className={`h-72 w-full p-2 rounded-lg border transition-colors ${innerCardClass}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lowDataChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[50, 100]} unit="%" />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null;
                  return (
                    <div
                      className={`p-3 border rounded-lg text-xs font-mono shadow-xl ${
                        isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="font-bold mb-1">Subset: {label}</div>
                      {payload.map((entry, idx) => (
                        <div key={idx} style={{ color: entry.color }}>
                          {entry.name}: <span className="font-bold">{entry.value}%</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="classicalF1"
                name="Classical SVC F1 (%)"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="quantumF1"
                name="Quantum QSVC F1 (%)"
                stroke="#a855f7"
                strokeWidth={3}
                strokeDasharray="4 4"
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                <th className="pb-2">Train Split</th>
                <th className="pb-2">Training Samples</th>
                <th className="pb-2 text-cyan-600 dark:text-cyan-400">Classical F1</th>
                <th className="pb-2 text-cyan-600 dark:text-cyan-400">Classical Accuracy</th>
                <th className="pb-2 text-violet-600 dark:text-violet-400">Quantum F1</th>
                <th className="pb-2 text-violet-600 dark:text-violet-400">Quantum Accuracy</th>
                <th className={`pb-2 ${headingClass}`}>Observation</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {lowDataPoints.map((pt) => {
                const isQuantumAhead = pt.quantumF1 > pt.classicalF1;
                const isClose = Math.abs(pt.quantumF1 - pt.classicalF1) < 0.05;

                return (
                  <tr key={pt.trainFraction} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100/60'}>
                    <td className={`py-2.5 font-bold ${headingClass}`}>{pt.trainFraction * 100}%</td>
                    <td className={`py-2.5 ${textMutedClass}`}>{pt.sampleCount} samples</td>
                    <td className="py-2.5 font-semibold text-cyan-600 dark:text-cyan-300">{pt.classicalF1.toFixed(3)}</td>
                    <td className={`py-2.5 ${textMutedClass}`}>{(pt.classicalAccuracy * 100).toFixed(1)}%</td>
                    <td className="py-2.5 font-semibold text-violet-600 dark:text-violet-300">{pt.quantumF1.toFixed(3)}</td>
                    <td className={`py-2.5 ${textMutedClass}`}>{(pt.quantumAccuracy * 100).toFixed(1)}%</td>
                    <td className="py-2.5 text-[11px] font-sans">
                      {isQuantumAhead ? (
                        <span className="text-violet-600 dark:text-violet-300">Quantum kernel demonstrates higher separation in low-data regime</span>
                      ) : isClose ? (
                        <span className={textMutedClass}>Comparable performance between RBF and ZZFeatureMap</span>
                      ) : (
                        <span className="text-cyan-600 dark:text-cyan-400">Classical RBF converges with higher sample efficiency</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Honest Scientific Analysis & Limitations */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
        <h2 className={`text-sm font-semibold flex items-center gap-2 ${headingClass}`}>
          <Info className="w-4 h-4 text-cyan-500" />
          <span>Honest Scientific Analysis & Computational Scaling</span>
        </h2>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed ${textMutedClass}`}>
          <div className={`p-3 rounded-lg border space-y-1.5 ${innerCardClass}`}>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400 block">1. Computational Complexity</span>
            <p>
              Evaluating the quantum kernel matrix scales as <strong className={headingClass}>O(N²)</strong> statevector inner products. For real-time microgrid protection relays operating at 50/60 Hz cycles, classical RBF inference is significantly faster without specialized quantum hardware.
            </p>
          </div>

          <div className={`p-3 rounded-lg border space-y-1.5 ${innerCardClass}`}>
            <span className="font-semibold text-violet-600 dark:text-violet-400 block">2. Simulator vs NISQ Reality</span>
            <p>
              This experiment executes on noiseless statevector simulation. On actual superconducting quantum hardware (e.g. IBM Quantum Heron / Eagle), gate infidelities, CNOT errors, and finite shot sampling will introduce variance into kernel entries.
            </p>
          </div>

          <div className={`p-3 rounded-lg border space-y-1.5 ${innerCardClass}`}>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">3. When Quantum Adds Value</span>
            <p>
              Quantum feature mapping is most promising when non-linear physical feature dependencies cannot be efficiently represented by classical kernels. In low-data regimes, entangling phases can structure the margin when labeled fault events are sparse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
