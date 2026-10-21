import React, { useState } from 'react';
import { buildZZFeatureMapCircuit, computeZZFeatureMapStatevector } from '../services/quantumEngine';
import { Cpu, Layers, Atom, Sparkles } from 'lucide-react';

interface QuantumLabPageProps {
  kernelMatrix: number[][] | null;
  theme: 'dark' | 'light';
}

export const QuantumLabPage: React.FC<QuantumLabPageProps> = ({ kernelMatrix, theme }) => {
  const isDark = theme === 'dark';
  const [reps, setReps] = useState<number>(2);
  const [selectedGate, setSelectedGate] = useState<any | null>(null);
  const [testAngles] = useState<number[]>([1.57, 0.85, 3.14, 2.2]);

  const numQubits = 4;
  const featureNames = ['q0: Demand', 'q1: Solar PV', 'q2: Voltage Dev', 'q3: Freq Dev'];
  const circuit = buildZZFeatureMapCircuit(numQubits, reps, featureNames);

  // Compute live statevector amplitudes for the test angles
  const statevector = computeZZFeatureMapStatevector(testAngles, numQubits, reps);

  const cardClass = isDark
    ? 'bg-slate-900/80 border-slate-800'
    : 'bg-white border-slate-200 shadow-xs';
  const innerCardClass = isDark
    ? 'bg-slate-950 border-slate-800/80'
    : 'bg-slate-50 border-slate-200';
  const headingClass = isDark ? 'text-white' : 'text-slate-900';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title & Quantum Mechanics Summary */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-2xs">
              <Atom className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingClass}`}>
                <span>Quantum Circuit & Kernel Architecture</span>
              </h1>
              <p className={`mt-0.5 text-xs sm:text-sm ${textMutedClass}`}>
                Interactive inspection of Qiskit&apos;s <strong>ZZFeatureMap</strong>, Hilbert space statevector mapping, and Fidelity Quantum Kernel.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono ${textMutedClass}`}>Repetitions (d):</span>
            <div className={`flex rounded-xl p-0.5 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {[1, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => setReps(r)}
                  className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg cursor-pointer transition-all ${
                    reps === r
                      ? 'bg-violet-600 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  d = {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Circuit Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Encoded Qubits */}
        <div className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs font-mono ${textMutedClass}`}>ENCODED QUBITS</div>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-2xs">
              <Atom className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${headingClass}`}>{numQubits} Qubits</div>
          <div className={`mt-1 text-xs ${textMutedClass}`}>Hilbert Dimension: 2⁴ = 16</div>
        </div>

        {/* Circuit Depth */}
        <div className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs font-mono ${textMutedClass}`}>CIRCUIT DEPTH</div>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-2xs">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 font-mono">{circuit.depth} Layers</div>
          <div className={`mt-1 text-xs ${textMutedClass}`}>{reps} Entangling Cycles</div>
        </div>

        {/* Total Quantum Gates */}
        <div className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs font-mono ${textMutedClass}`}>TOTAL QUANTUM GATES</div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
              <Cpu className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">{circuit.totalGates} Gates</div>
          <div className={`mt-1 text-xs ${textMutedClass}`}>Hadamard + Rz + CNOT</div>
        </div>

        {/* Quantum Kernel */}
        <div className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`text-xs font-mono ${textMutedClass}`}>QUANTUM KERNEL</div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">Fidelity</div>
          <div className={`mt-1 text-xs ${textMutedClass}`}>K_ij = |⟨φ(x_i)|φ(x_j)⟩|²</div>
        </div>
      </div>

      {/* Interactive Circuit Diagram Wire View */}
      <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
        <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h2 className={`text-sm font-semibold flex items-center gap-2 ${headingClass}`}>
              <Layers className="w-4 h-4 text-violet-500" />
              <span>Parameterized ZZFeatureMap Circuit Diagram</span>
            </h2>
            <p className={`text-xs ${textMutedClass}`}>
              Hover or click gates to inspect exact parameterized unitaries and physical encoding logic
            </p>
          </div>
          <div className={`text-xs font-mono ${textMutedClass}`}>Linear Entanglement Topology</div>
        </div>

        {/* Circuit Canvas / Wire Diagram */}
        <div className="overflow-x-auto pb-4 pt-2">
          <div className={`min-w-[780px] p-6 rounded-lg border font-mono text-xs ${innerCardClass}`}>
            {featureNames.map((name, qIdx) => {
              return (
                <div key={qIdx} className="flex items-center h-16 relative">
                  {/* Qubit label */}
                  <div className={`w-32 shrink-0 font-bold text-xs ${headingClass}`}>
                    {name}
                  </div>

                  {/* Qubit wire line */}
                  <div className="relative flex-1 flex items-center h-full">
                    <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 z-0 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />

                    {/* Gates positioned along wire */}
                    <div className="relative z-10 flex items-center space-x-3 pl-4">
                      {/* Repetition 1 */}
                      <button
                        onClick={() =>
                          setSelectedGate({
                            type: 'H',
                            qubit: qIdx,
                            desc: 'Hadamard Gate: Creates maximal equal superposition state 1/√2(|0⟩ + |1⟩).',
                            matrix: '1/√2 [[1, 1], [1, -1]]',
                          })
                        }
                        className="w-8 h-8 rounded bg-cyan-900 border border-cyan-500 text-cyan-200 font-bold flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        H
                      </button>

                      <button
                        onClick={() =>
                          setSelectedGate({
                            type: 'Rz',
                            qubit: qIdx,
                            param: `2·x_${qIdx}`,
                            desc: `Single-qubit phase rotation encoding ${name}.`,
                            matrix: `[[e^(-i·x_${qIdx}), 0], [0, e^(i·x_${qIdx})]]`,
                          })
                        }
                        className="w-16 h-8 rounded bg-violet-900 border border-violet-500 text-violet-200 text-[10px] font-bold flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        Rz(2·x{qIdx})
                      </button>

                      {/* Entangling block */}
                      {qIdx < numQubits - 1 && (
                        <div className={`flex items-center space-x-1 p-1 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'}`}>
                          <button
                            onClick={() =>
                              setSelectedGate({
                                type: 'CX (CNOT)',
                                qubit: qIdx,
                                target: qIdx + 1,
                                desc: `Controlled-NOT gate between qubit ${qIdx} and qubit ${qIdx + 1}.`,
                                matrix: '4x4 Controlled-X Unitary',
                              })
                            }
                            className="w-7 h-7 rounded bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          >
                            CX
                          </button>
                          <span className={`text-[9px] px-1 font-mono ${textMutedClass}`}>
                            ZZ(x{qIdx},x{qIdx + 1})
                          </span>
                          <button
                            onClick={() =>
                              setSelectedGate({
                                type: 'CX (CNOT)',
                                qubit: qIdx,
                                target: qIdx + 1,
                                desc: `Controlled-NOT un-entanglement closing the ZZ interaction term.`,
                                matrix: '4x4 Controlled-X Unitary',
                              })
                            }
                            className="w-7 h-7 rounded bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          >
                            CX
                          </button>
                        </div>
                      )}

                      {/* Barrier */}
                      <div className={`h-10 w-1 mx-2 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

                      {/* Repetition 2 if reps == 2 */}
                      {reps === 2 && (
                        <>
                          <button
                            onClick={() =>
                              setSelectedGate({
                                type: 'H (Layer 2)',
                                qubit: qIdx,
                                desc: 'Second Hadamard transformation interleaving ZZ phase interactions.',
                                matrix: '1/√2 [[1, 1], [1, -1]]',
                              })
                            }
                            className="w-8 h-8 rounded bg-cyan-900 border border-cyan-500 text-cyan-200 font-bold flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                          >
                            H
                          </button>

                          <button
                            onClick={() =>
                              setSelectedGate({
                                type: 'Rz (Layer 2)',
                                qubit: qIdx,
                                param: `2·x_${qIdx}`,
                                desc: `Second layer phase rotation.`,
                                matrix: `[[e^(-i·x_${qIdx}), 0], [0, e^(i·x_${qIdx})]]`,
                              })
                            }
                            className="w-16 h-8 rounded bg-violet-900 border border-violet-500 text-violet-200 text-[10px] font-bold flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                          >
                            Rz(2·x{qIdx})
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Gate Inspection Panel */}
        {selectedGate && (
          <div className={`p-3.5 rounded-lg border text-xs font-mono flex items-start justify-between ${innerCardClass}`}>
            <div>
              <span className="font-bold text-violet-600 dark:text-violet-300 text-sm">{selectedGate.type}</span>
              <p className={`mt-1 font-sans ${textMutedClass}`}>{selectedGate.desc}</p>
              <div className="mt-2 text-cyan-600 dark:text-cyan-400">
                Operator Matrix: <span className={headingClass}>{selectedGate.matrix}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedGate(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Live Statevector & Quantum Kernel Matrix Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hilbert Space Statevector Inspector */}
        <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div>
              <h3 className={`text-sm font-semibold ${headingClass}`}>Hilbert Space Statevector Amplitudes</h3>
              <p className={`text-xs ${textMutedClass}`}>
                Complex statevector |φ(x)⟩ across all 16 computational basis states |0000⟩ to |1111⟩
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">dim = 16</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {statevector.map((c, idx) => {
              const bin = idx.toString(2).padStart(4, '0');
              const prob = c.re * c.re + c.im * c.im;

              return (
                <div key={idx} className={`p-2 rounded border ${innerCardClass}`}>
                  <div className={`text-[10px] ${textMutedClass}`}>|{bin}⟩</div>
                  <div className={`font-semibold mt-0.5 ${headingClass}`}>{(prob * 100).toFixed(1)}%</div>
                  <div className={`text-[9px] truncate ${textMutedClass}`}>
                    {c.re.toFixed(2)} + {c.im.toFixed(2)}i
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`text-[11px] leading-snug ${textMutedClass}`}>
            Sum of probability amplitudes equals 1.000 (unitary norm preservation).
          </div>
        </div>

        {/* Quantum Kernel Matrix Heatmap */}
        <div className={`p-5 rounded-xl border space-y-4 transition-colors ${cardClass}`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div>
              <h3 className={`text-sm font-semibold ${headingClass}`}>Quantum Fidelity Kernel Matrix (Gram Matrix)</h3>
              <p className={`text-xs ${textMutedClass}`}>
                Pairwise state fidelities K_ij = |⟨φ(x_i)|φ(x_j)⟩|² for training observations
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">K_ij ∈ [0, 1]</span>
          </div>

          {kernelMatrix && kernelMatrix.length > 0 ? (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border flex flex-col items-center ${innerCardClass}`}>
                <div className="grid grid-cols-12 gap-0.5">
                  {kernelMatrix.slice(0, 12).map((row, i) =>
                    row.slice(0, 12).map((val, j) => {
                      const intensity = Math.max(0, Math.min(1, val));
                      const bg = isDark
                        ? `rgba(56, 189, 248, ${0.1 + intensity * 0.9})`
                        : `rgba(2, 132, 199, ${0.15 + intensity * 0.85})`;

                      return (
                        <div
                          key={`${i}-${j}`}
                          title={`K(${i}, ${j}) = ${val.toFixed(3)}`}
                          style={{ backgroundColor: bg }}
                          className="w-5 h-5 rounded-xs flex items-center justify-center text-[7px] font-mono text-slate-950 font-bold select-none cursor-default"
                        >
                          {i === j ? '1' : ''}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className={`mt-3 flex items-center justify-between w-full text-[10px] font-mono ${textMutedClass}`}>
                  <span>Sample 1</span>
                  <span>12 × 12 Sub-Gram Matrix View</span>
                  <span>Sample 12</span>
                </div>
              </div>

              <div className={`p-3 rounded border text-xs ${innerCardClass}`}>
                <strong className={headingClass}>Mathematical Property: </strong>
                <span className={textMutedClass}>
                  All diagonal entries K_ii = 1.0 (self-fidelity). Symmetrical and positive semi-definite, guaranteeing optimal quadratic dual convergence for QSVC.
                </span>
              </div>
            </div>
          ) : (
            <div className={`py-12 text-center text-xs font-mono ${textMutedClass}`}>
              Kernel matrix computing...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
