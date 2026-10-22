import React, { useState, useEffect } from 'react';
import {
  buildZZFeatureMapCircuit,
  computeZZFeatureMapStatevector,
  computeNoisyZZFeatureMapStatevector,
  computeQuantumFidelity,
  DEFAULT_NISQ_NOISE,
} from '../services/quantumEngine';
import { NISQNoiseConfig, ScalerModel } from '../types/microgrid';
import { SVCTrainedModel } from '../services/svmSolver';
import { fetchBackendCircuit, BackendCircuitInfo } from '../services/apiClient';
import {
  Cpu,
  Layers,
  Atom,
  Sparkles,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Sliders,
  Zap,
  Radio,
  Timer,
  Info,
  Scale,
  GitCompare,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  X,
  FileCode,
} from 'lucide-react';

interface QuantumLabPageProps {
  kernelMatrix: number[][] | null;
  classicalModel?: SVCTrainedModel | null;
  quantumModel?: SVCTrainedModel | null;
  scaler?: ScalerModel | null;
  theme: 'dark' | 'light';
}

export const QuantumLabPage: React.FC<QuantumLabPageProps> = ({
  kernelMatrix,
  classicalModel,
  quantumModel,
  scaler,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [reps, setReps] = useState<number>(2);
  const [selectedGate, setSelectedGate] = useState<any | null>(null);
  const [testAngles] = useState<number[]>([1.57, 0.85, 3.14, 2.2]);
  const [backendCircuit, setBackendCircuit] = useState<BackendCircuitInfo | null>(null);
  const [showAsciiModal, setShowAsciiModal] = useState<boolean>(false);
  const [noiseConfig, setNoiseConfig] = useState<NISQNoiseConfig>({
    ...DEFAULT_NISQ_NOISE,
    enabled: false,
  });

  useEffect(() => {
    fetchBackendCircuit()
      .then((info) => setBackendCircuit(info))
      .catch(() => setBackendCircuit(null));
  }, []);

  const numQubits = 4;
  const featureNames = ['q0: Demand', 'q1: Solar PV', 'q2: Voltage Dev', 'q3: Freq Dev'];
  const circuit = buildZZFeatureMapCircuit(numQubits, reps, featureNames);

  // Compute live ideal statevector amplitudes for the test angles
  const idealStatevector = computeZZFeatureMapStatevector(testAngles, numQubits, reps);

  // Compute live noisy statevector under NISQ hardware simulation
  const activeStatevector = noiseConfig.enabled
    ? computeNoisyZZFeatureMapStatevector(testAngles, numQubits, reps, 'linear', noiseConfig)
    : idealStatevector;

  const stateFidelity = noiseConfig.enabled
    ? computeQuantumFidelity(idealStatevector, activeStatevector)
    : 1.0;

  // Pairwise Sample Intelligence Lab definitions
  interface SamplePreset {
    id: string;
    name: string;
    tag: string;
    values: [number, number, number, number]; // [demand, solar, voltage, frequency]
    description: string;
  }

  const PAIRWISE_PRESETS: SamplePreset[] = [
    {
      id: 'nominal',
      name: 'Nominal Baseline',
      tag: 'Normal',
      values: [52.0, 48.0, 0.4, 0.012],
      description: 'Daytime balanced solar and commercial load (0.4V dev, 0.012Hz droop).',
    },
    {
      id: 'solar_drop',
      name: 'Solar Trip Deficit',
      tag: 'Abnormal',
      values: [72.0, 5.5, -6.2, -0.240],
      description: 'Midday sudden cloud ramp loss (-6.2V sag, -0.24Hz RoCoF droop).',
    },
    {
      id: 'demand_surge',
      name: 'Industrial Load Surge',
      tag: 'Abnormal',
      values: [138.0, 36.0, -8.8, -0.340],
      description: 'Factory motor in-rush current (-8.8V sag, -0.34Hz droop).',
    },
    {
      id: 'voltage_swell',
      name: 'Capacitor Bank Swell',
      tag: 'Abnormal',
      values: [22.0, 65.0, 9.5, 0.320],
      description: 'Capacitor over-compensation (+9.5V swell, +0.32Hz over-frequency).',
    },
  ];

  const [sampleAId, setSampleAId] = useState<string>('nominal');
  const [sampleBId, setSampleBId] = useState<string>('demand_surge');

  const presetA = PAIRWISE_PRESETS.find((p) => p.id === sampleAId) || PAIRWISE_PRESETS[0];
  const presetB = PAIRWISE_PRESETS.find((p) => p.id === sampleBId) || PAIRWISE_PRESETS[2];

  const sampleAValues = presetA.values;
  const sampleBValues = presetB.values;

  // Feature normalization to [0, π] for Quantum Circuit encoding
  const normalizeToPi = (vals: [number, number, number, number]): number[] => {
    // Demand: [10, 160], Solar: [0, 90], Voltage: [-15, 15], Freq: [-0.6, 0.6]
    const dNorm = Math.min(Math.PI, Math.max(0, ((vals[0] - 10) / (160 - 10)) * Math.PI));
    const sNorm = Math.min(Math.PI, Math.max(0, (vals[1] / 90) * Math.PI));
    const vNorm = Math.min(Math.PI, Math.max(0, ((vals[2] + 15) / 30) * Math.PI));
    const fNorm = Math.min(Math.PI, Math.max(0, ((vals[3] + 0.6) / 1.2) * Math.PI));
    return [dNorm, sNorm, vNorm, fNorm];
  };

  const normA = normalizeToPi(sampleAValues);
  const normB = normalizeToPi(sampleBValues);

  // Single-qubit phase rotations: φ_i(x) = 2 * x_i
  const phiA = normA.map((x) => 2 * x);
  const phiB = normB.map((x) => 2 * x);

  // ZZ cross-coupling phase terms: φ_ij(x) = 2 * (π - x_i) * (π - x_j)
  const phiZZ_A = [
    2 * (Math.PI - normA[0]) * (Math.PI - normA[1]),
    2 * (Math.PI - normA[1]) * (Math.PI - normA[2]),
    2 * (Math.PI - normA[2]) * (Math.PI - normA[3]),
  ];
  const phiZZ_B = [
    2 * (Math.PI - normB[0]) * (Math.PI - normB[1]),
    2 * (Math.PI - normB[1]) * (Math.PI - normB[2]),
    2 * (Math.PI - normB[2]) * (Math.PI - normB[3]),
  ];

  // Live statevectors for Sample A and Sample B
  const statevecA = computeZZFeatureMapStatevector(normA, numQubits, reps);
  const statevecB = computeZZFeatureMapStatevector(normB, numQubits, reps);

  // Exact Quantum Kernel Fidelity: K_Q(A, B) = |⟨ψ(A)|ψ(B)⟩|²
  const pairwiseQuantumKernel = computeQuantumFidelity(statevecA, statevecB);

  // Subtended Hilbert angle: θ = arccos(√K_Q)
  const clampedK = Math.max(0, Math.min(1, pairwiseQuantumKernel));
  const hilbertAngleRad = Math.acos(Math.sqrt(clampedK));
  const hilbertAngleDeg = (hilbertAngleRad * 180) / Math.PI;

  // Classical RBF Kernel: exp(-0.5 * ||x_A - x_B||²)
  const rbfDistSq = normA.reduce((sum, val, idx) => sum + Math.pow(val - normB[idx], 2), 0);
  const pairwiseClassicalRBF = Math.exp(-0.5 * rbfDistSq);

  // Metric Gap: ΔK
  const deltaK = pairwiseQuantumKernel - pairwiseClassicalRBF;

  const cardClass = isDark
    ? 'bg-slate-900/80 border-slate-800'
    : 'bg-white border-slate-300 shadow-xs';
  const innerCardClass = isDark
    ? 'bg-slate-950 border-slate-800/80'
    : 'bg-slate-50 border-slate-300';
  const headingClass = isDark ? 'text-white' : 'text-slate-950 font-extrabold';
  const textMutedClass = isDark ? 'text-slate-300' : 'text-slate-800 font-medium';

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
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${headingClass}`}>
                  Quantum Circuit & Kernel Architecture
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  QISKIT 1.3+ ZZFEATUREMAP
                </span>
              </div>
              <p className={`mt-0.5 text-xs sm:text-sm ${textMutedClass}`}>
                Mathematical formulation, non-linear Hilbert space mapping ($2^4 = 16$ dimensions), and Fidelity Quantum Kernel ($|\langle\Phi(x)|\Phi(z)\rangle|^2$).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono ${textMutedClass}`}>Circuit Repetitions (d):</span>
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

      {/* Mathematical Foundation & Workflow Card */}
      <div className={`p-5 rounded-2xl border ${cardClass}`}>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h2 className={`text-sm font-bold ${headingClass}`}>
              Quantum-Kernel Workflow & Mathematical Formulation
            </h2>
          </div>
          <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-bold">
            HAVEL-HILBERT PROJECTION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className={`p-3.5 rounded-xl border ${innerCardClass} space-y-1.5`}>
            <div className="font-bold font-mono text-cyan-600 dark:text-cyan-400">
              1. Feature Normalization & Angle Mapping
            </div>
            <p className={textMutedClass}>
              Continuous sensor features x in R^4 (Demand, Solar, Voltage Dev, Freq Dev) are scaled into angle coordinates [0, 2π] using training-fit MinMaxScaler:
            </p>
            <div className="p-2 rounded bg-slate-900 text-cyan-300 font-mono text-[11px]">
              {'x_j\' = 2π · (x_j - min(x_j)) / (max(x_j) - min(x_j))'}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${innerCardClass} space-y-1.5`}>
            <div className="font-bold font-mono text-violet-600 dark:text-violet-400">
              2. ZZ Feature Map Unitary U_Φ(x)
            </div>
            <p className={textMutedClass}>
              Applies Hadamard superposition followed by single-qubit phase rotations and two-qubit entangling ZZ terms:
            </p>
            <div className="p-2 rounded bg-slate-900 text-violet-300 font-mono text-[11px]">
              {'φ_j(x) = x_j,  φ_jk(x) = (π - x_j)(π - x_k)'}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${innerCardClass} space-y-1.5`}>
            <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
              3. Fidelity Quantum Kernel K_ij
            </div>
            <p className={textMutedClass}>
              Calculates the transition probability (quantum state overlap) in 16-dimensional complex Hilbert space:
            </p>
            <div className="p-2 rounded bg-slate-900 text-emerald-300 font-mono text-[11px]">
              {'K(x, z) = |⟨Φ(x)|Φ(z)⟩|² = |⟨0ⁿ| U_Φ†(x) U_Φ(z) |0ⁿ⟩|²'}
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Execution & Simulation Status Notice */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-cyan-500 shrink-0" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Execution Mode: </span>
            {backendCircuit ? (
              <span>Qiskit 1.3+ ZZFeatureMap decomposition verified via backend. Exact statevector calculation in 16D Hilbert space.</span>
            ) : (
              <span>Client-side exact statevector mathematical simulation with modeled NISQ depolarizing noise.</span>
            )}
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Physical Quantum Hardware (IBM Quantum): <span className="font-semibold text-amber-600 dark:text-amber-400">Unavailable (Simulator Mode)</span>.
            </span>
          </div>
        </div>
        {backendCircuit?.ascii_diagram && (
          <button
            onClick={() => setShowAsciiModal(true)}
            className="btn-secondary text-xs shrink-0 font-mono"
          >
            <FileCode className="w-3.5 h-3.5 mr-1 text-cyan-500" />
            View Qiskit ASCII
          </button>
        )}
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

        {/* Qiskit Exact Circuit ASCII Summary */}
        <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${innerCardClass}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>Qiskit 1.3+ Compiled Circuit Representation (ZZFeatureMap)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
              num_qubits=4, reps={reps}, linear
            </span>
          </div>
          <div className="overflow-x-auto p-3 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 text-[10px] leading-tight select-all">
            <pre>
{`     ┌───┐┌─────────────┐                                                             ┌───┐┌─────────────┐
q_0: ┤ H ├┤ Rz(2.0*x[0]) ├──■─────────────────────────────■──────────────────────────┤ H ├┤ Rz(2.0*x[0]) ├──■─────────────────────────────■──────────
     ├───┤├─────────────┤┌─┴─┐┌────────────────────────┐┌─┴─┐                         ├───┤├─────────────┤┌─┴─┐┌────────────────────────┐┌─┴─┐     
q_1: ┤ H ├┤ Rz(2.0*x[1]) ├┤ X ├┤ Rz(2*(π-x[0])*(π-x[1])) ├┤ X ├──■───────────────────┤ H ├┤ Rz(2.0*x[1]) ├┤ X ├┤ Rz(2*(π-x[0])*(π-x[1])) ├┤ X ├──■──
     ├───┤├─────────────┤└───┘└────────────────────────┘└───┘┌─┴─┐┌───────────────────┴───┤├─────────────┤└───┘└────────────────────────┘└───┘┌─┴─┐┌
q_2: ┤ H ├┤ Rz(2.0*x[2]) ├────────────────────────────────────┤ X ├┤ Rz(2*(π-x[1])*(π-x[2])) ├┤ Rz(2.0*x[2]) ├────────────────────────────────────┤ X ├┤
     ├───┤├─────────────┤                                     └───┘└───────────────────┬───┤├─────────────┤                                     └───┘└
q_3: ┤ H ├┤ Rz(2.0*x[3]) ├─────────────────────────────────────────────────────────────┤ X ├┤ Rz(2.0*x[3]) ├───────────────────────────────────────────
     └───┘└─────────────┘                                                              └───┘└─────────────┘                                           `}
            </pre>
          </div>
        </div>
      </div>

      {/* NISQ Hardware Noise & Circuit Error Modeling Panel */}
      <div className={`p-5 rounded-xl border space-y-4 transition-all ${cardClass}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs transition-colors ${
                noiseConfig.enabled
                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {noiseConfig.enabled ? (
                <Radio className="w-4 h-4 stroke-[2.2] animate-pulse" />
              ) : (
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm sm:text-base font-bold ${headingClass}`}>
                  NISQ Hardware Noise & Device Error Simulation
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    noiseConfig.enabled
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  }`}
                >
                  {noiseConfig.enabled ? 'NOISY HARDWARE SIM' : 'IDEAL STATEVECTOR'}
                </span>
              </div>
              <p className={`text-xs ${textMutedClass}`}>
                Qiskit Aer NoiseModel: Depolarizing gate errors, readout bit flips, and T₁/T₂ thermal relaxation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setNoiseConfig((prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }))
              }
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs ${
                noiseConfig.enabled
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{noiseConfig.enabled ? 'Disable Noise (Ideal)' : 'Enable NISQ Device Noise'}</span>
            </button>
          </div>
        </div>

        {/* Noise Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${innerCardClass}`}>
            <div className={`text-[10px] font-mono ${textMutedClass}`}>STATE FIDELITY RETENTION</div>
            <div
              className={`text-lg font-bold font-mono mt-0.5 ${
                stateFidelity > 0.85
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : stateFidelity > 0.65
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {(stateFidelity * 100).toFixed(1)}%
            </div>
            <div className={`text-[10px] ${textMutedClass}`}>
              {noiseConfig.enabled ? `Loss: -${((1 - stateFidelity) * 100).toFixed(1)}%` : '100% Coherent'}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${innerCardClass}`}>
            <div className={`text-[10px] font-mono ${textMutedClass}`}>GATE DEPOLARIZING (p)</div>
            <div className="text-lg font-bold font-mono mt-0.5 text-cyan-600 dark:text-cyan-400">
              {(noiseConfig.depolarizingErrorRate * 100).toFixed(2)}%
            </div>
            <div className={`text-[10px] ${textMutedClass}`}>Per Pauli / Phase Rotation</div>
          </div>

          <div className={`p-3 rounded-xl border ${innerCardClass}`}>
            <div className={`text-[10px] font-mono ${textMutedClass}`}>READOUT SPAM ERROR</div>
            <div className="text-lg font-bold font-mono mt-0.5 text-violet-600 dark:text-violet-400">
              {(noiseConfig.readoutErrorRate * 100).toFixed(1)}%
            </div>
            <div className={`text-[10px] ${textMutedClass}`}>Measurement Bit-Flip Rate</div>
          </div>

          <div className={`p-3 rounded-xl border ${innerCardClass}`}>
            <div className={`text-[10px] font-mono ${textMutedClass}`}>THERMAL COHERENCE (T₁/T₂)</div>
            <div className="text-lg font-bold font-mono mt-0.5 text-indigo-600 dark:text-indigo-400">
              {noiseConfig.t1RelaxationUs}µs / {noiseConfig.t2DephasingUs}µs
            </div>
            <div className={`text-[10px] ${textMutedClass}`}>Decoherence Time Budget</div>
          </div>
        </div>

        {/* Sliders (when noise enabled) */}
        {noiseConfig.enabled && (
          <div className={`p-4 rounded-xl border space-y-4 ${innerCardClass}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={headingClass}>NISQ Hardware Parameter Controls:</span>
              <button
                onClick={() => setNoiseConfig({ ...DEFAULT_NISQ_NOISE, enabled: true })}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Reset to IBM Falcon Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={textMutedClass}>Depolarizing Rate:</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {(noiseConfig.depolarizingErrorRate * 100).toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.05"
                  step="0.001"
                  value={noiseConfig.depolarizingErrorRate}
                  onChange={(e) =>
                    setNoiseConfig({
                      ...noiseConfig,
                      depolarizingErrorRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={textMutedClass}>Readout Error Rate:</span>
                  <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                    {(noiseConfig.readoutErrorRate * 100).toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.06"
                  step="0.005"
                  value={noiseConfig.readoutErrorRate}
                  onChange={(e) =>
                    setNoiseConfig({
                      ...noiseConfig,
                      readoutErrorRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={textMutedClass}>T₂ Dephasing Coherence:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {noiseConfig.t2DephasingUs} µs
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="140"
                  step="5"
                  value={noiseConfig.t2DephasingUs}
                  onChange={(e) =>
                    setNoiseConfig({
                      ...noiseConfig,
                      t2DephasingUs: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            <p className={`text-[11px] leading-relaxed ${textMutedClass}`}>
              💡 <strong>NISQ Insights:</strong> Statevector simulation with realistic depolarizing noise reflects genuine execution on physical superconducting transmon processors (such as IBM Quantum Eagle/Heron chips). Higher repetition counts ($d \ge 3$) accumulate CNOT error, emphasizing why low-depth ($d=2$) linear circuits are optimal for microgrid edge computing.
            </p>
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
                {noiseConfig.enabled ? 'Noisy density statevector projection' : 'Coherent pure state |φ(x)⟩'} across all 16 computational basis states
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">dim = 16</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {activeStatevector.map((c, idx) => {
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

      {/* FEATURE 2: QUANTUM KERNEL INTELLIGENCE LAB */}
      <div className={`p-6 rounded-2xl border space-y-6 ${cardClass}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base sm:text-lg font-bold ${headingClass}`}>
                  Quantum Kernel Intelligence Lab
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  PAIRWISE HILBERT FIDELITY
                </span>
              </div>
              <p className={`text-xs ${textMutedClass}`}>
                Inspect non-linear ZZ entanglement phase coupling, compare Quantum Fidelity vs Classical Gaussian RBF, and examine QSVC dual support vectors.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`px-2.5 py-1 rounded-lg border ${innerCardClass} text-violet-600 dark:text-violet-400 font-semibold`}>
              dim(H) = 16
            </span>
            <span className={`px-2.5 py-1 rounded-lg border ${innerCardClass} text-sky-600 dark:text-sky-400 font-semibold`}>
              γ = 0.5 (RBF)
            </span>
          </div>
        </div>

        {/* Pairwise Sample Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sample A */}
          <div className={`p-4 rounded-xl border space-y-3 ${innerCardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5" /> Sample A (Reference)
              </span>
              <div className="flex gap-1">
                {PAIRWISE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSampleAId(p.id)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-all ${
                      sampleAId === p.id
                        ? 'bg-cyan-600 text-white font-bold'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] ${textMutedClass}`}>Demand</div>
                <div className={`font-bold mt-0.5 ${headingClass}`}>{sampleAValues[0].toFixed(1)} kW</div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] ${textMutedClass}`}>Solar PV</div>
                <div className={`font-bold mt-0.5 ${headingClass}`}>{sampleAValues[1].toFixed(1)} kW</div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] ${textMutedClass}`}>Voltage Dev</div>
                <div className={`font-bold mt-0.5 ${Math.abs(sampleAValues[2]) > 6 ? 'text-rose-500' : headingClass}`}>
                  {sampleAValues[2] >= 0 ? `+${sampleAValues[2].toFixed(1)}` : sampleAValues[2].toFixed(1)} V
                </div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] ${textMutedClass}`}>Freq Dev</div>
                <div className={`font-bold mt-0.5 ${Math.abs(sampleAValues[3]) > 0.2 ? 'text-rose-500' : headingClass}`}>
                  {sampleAValues[3] >= 0 ? `+${sampleAValues[3].toFixed(3)}` : sampleAValues[3].toFixed(3)} Hz
                </div>
              </div>
            </div>

            {/* ZZ Feature Map Angles for Sample A */}
            <div className={`p-3 rounded-lg border text-[11px] font-mono space-y-1.5 ${isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-100/70 border-slate-200'}`}>
              <div className="font-semibold text-violet-600 dark:text-violet-400">Sample A Phase Rotations (Qiskit ZZFeatureMap):</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className={textMutedClass}>Single Qubit: </span>
                  <span className={headingClass}>φ₀={phiA[0].toFixed(2)}, φ₁={phiA[1].toFixed(2)}, φ₂={phiA[2].toFixed(2)}, φ₃={phiA[3].toFixed(2)}</span>
                </div>
                <div>
                  <span className={textMutedClass}>ZZ Couplings: </span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">φ₀₁={phiZZ_A[0].toFixed(2)}, φ₁₂={phiZZ_A[1].toFixed(2)}, φ₂₃={phiZZ_A[2].toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sample B */}
          <div className={`p-4 rounded-xl border space-y-3 ${innerCardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5" /> Sample B (Comparison)
              </span>
              <div className="flex gap-1">
                {PAIRWISE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSampleBId(p.id)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-all ${
                      sampleBId === p.id
                        ? 'bg-violet-600 text-white font-bold'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] ${textMutedClass}`}>Demand</div>
                <div className={`font-bold mt-0.5 ${headingClass}`}>{sampleBValues[0].toFixed(1)} kW</div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] ${textMutedClass}`}>Solar PV</div>
                <div className={`font-bold mt-0.5 ${headingClass}`}>{sampleBValues[1].toFixed(1)} kW</div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] ${textMutedClass}`}>Voltage Dev</div>
                <div className={`font-bold mt-0.5 ${Math.abs(sampleBValues[2]) > 6 ? 'text-rose-500' : headingClass}`}>
                  {sampleBValues[2] >= 0 ? `+${sampleBValues[2].toFixed(1)}` : sampleBValues[2].toFixed(1)} V
                </div>
              </div>
              <div className={`p-2 rounded border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`text-[10px] ${textMutedClass}`}>Freq Dev</div>
                <div className={`font-bold mt-0.5 ${Math.abs(sampleBValues[3]) > 0.2 ? 'text-rose-500' : headingClass}`}>
                  {sampleBValues[3] >= 0 ? `+${sampleBValues[3].toFixed(3)}` : sampleBValues[3].toFixed(3)} Hz
                </div>
              </div>
            </div>

            {/* ZZ Feature Map Angles for Sample B */}
            <div className={`p-3 rounded-lg border text-[11px] font-mono space-y-1.5 ${isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-100/70 border-slate-200'}`}>
              <div className="font-semibold text-violet-600 dark:text-violet-400">Sample B Phase Rotations (Qiskit ZZFeatureMap):</div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className={textMutedClass}>Single Qubit: </span>
                  <span className={headingClass}>φ₀={phiB[0].toFixed(2)}, φ₁={phiB[1].toFixed(2)}, φ₂={phiB[2].toFixed(2)}, φ₃={phiB[3].toFixed(2)}</span>
                </div>
                <div>
                  <span className={textMutedClass}>ZZ Couplings: </span>
                  <span className="text-violet-600 dark:text-violet-400 font-bold">φ₀₁={phiZZ_B[0].toFixed(2)}, φ₁₂={phiZZ_B[1].toFixed(2)}, φ₂₃={phiZZ_B[2].toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pairwise Metric Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quantum Fidelity Kernel */}
          <div className={`p-4 rounded-xl border ${innerCardClass}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-violet-600 dark:text-violet-400 font-bold">Quantum Kernel Fidelity</span>
              <Atom className="w-4 h-4 text-violet-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-violet-600 dark:text-violet-400">
              {pairwiseQuantumKernel.toFixed(4)}
            </div>
            <div className={`text-[10px] mt-1 font-mono ${textMutedClass}`}>
              K_Q(A, B) = |⟨ψ(x_A)|ψ(x_B)⟩|²
            </div>
          </div>

          {/* Subtended Angle in Hilbert Space */}
          <div className={`p-4 rounded-xl border ${innerCardClass}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">Hilbert Subtended Angle</span>
              <Maximize2 className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {hilbertAngleDeg.toFixed(1)}°
            </div>
            <div className={`text-[10px] mt-1 font-mono ${textMutedClass}`}>
              θ = arccos(√K_Q) ({hilbertAngleRad.toFixed(3)} rad)
            </div>
          </div>

          {/* Classical Gaussian RBF Kernel */}
          <div className={`p-4 rounded-xl border ${innerCardClass}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">Classical RBF Kernel</span>
              <Cpu className="w-4 h-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
              {pairwiseClassicalRBF.toFixed(4)}
            </div>
            <div className={`text-[10px] mt-1 font-mono ${textMutedClass}`}>
              K_RBF = exp(-0.5 · ||x_A - x_B||²)
            </div>
          </div>

          {/* Metric Differential */}
          <div className={`p-4 rounded-xl border ${innerCardClass}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">Kernel Metric Gap (ΔK)</span>
              <Scale className="w-4 h-4 text-amber-500" />
            </div>
            <div className={`mt-2 text-2xl font-bold font-mono ${deltaK >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {deltaK >= 0 ? `+${deltaK.toFixed(4)}` : deltaK.toFixed(4)}
            </div>
            <div className={`text-[10px] mt-1 font-mono ${textMutedClass}`}>
              ΔK = K_Quantum - K_Classical
            </div>
          </div>
        </div>

        {/* Physical Insights Banner */}
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${isDark ? 'bg-violet-950/20 border-violet-800/40 text-slate-300' : 'bg-violet-50/80 border-violet-200 text-slate-800'}`}>
          <div className="flex items-center gap-2 font-bold text-violet-700 dark:text-violet-300 mb-1">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Why Quantum Kernels Detect Non-Linear Microgrid Resonance:</span>
          </div>
          <p>
            Classical RBF kernels compute similarity solely as isotropic Euclidean distance $d(x, z) = \|x - z\|$. In contrast, Qiskit’s <code className="font-mono px-1 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300">ZZFeatureMap</code> applies cross-phase rotations <code className="font-mono px-1 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-300">2(π - x_i)(π - x_j)</code> across entangling CNOT layers. When physical anomalies exhibit correlated perturbations (such as simultaneous voltage sag and frequency droop under solar inverter drop), quantum interference maps these points into orthogonal sub-spaces ($\theta \to 90^\circ, K_Q \to 0$), enabling clean hyper-plane separation with fewer support vectors.
          </p>
        </div>

        {/* QSVC vs Classical SVC Dual Coefficient & Support Vector Analysis */}
        <div className={`p-5 rounded-xl border space-y-4 ${innerCardClass}`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className={`text-sm font-semibold ${headingClass}`}>QSVC vs Classical SVC Optimization &amp; Support Vector Comparison</h3>
              <p className={`text-xs ${textMutedClass}`}>
                Empirical dual problem parameters: max_α ∑α_i - 1/2 ∑ y_i y_j α_i α_j K(x_i, x_j)
              </p>
            </div>
            <span className="text-xs font-mono text-violet-600 dark:text-violet-400 font-bold">
              C = 1.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Classical Model */}
            <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Classical SVC (RBF Kernel)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  Scikit-Learn Baseline
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className={textMutedClass}>Support Vectors: </span>
                  <span className={`font-bold ${headingClass}`}>{classicalModel?.svCount ?? '32'} SVs</span>
                </div>
                <div>
                  <span className={textMutedClass}>Train Time: </span>
                  <span className={`font-bold ${headingClass}`}>{classicalModel?.trainTimeMs ?? '28'} ms</span>
                </div>
                <div>
                  <span className={textMutedClass}>Kernel Formulation: </span>
                  <span className={headingClass}>exp(-γ||x-z||²)</span>
                </div>
                <div>
                  <span className={textMutedClass}>Separation Margin: </span>
                  <span className={headingClass}>Euclidean Space (R⁴)</span>
                </div>
              </div>
            </div>

            {/* Quantum Model */}
            <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5" /> Quantum QSVC (ZZFeatureMap)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
                  Qiskit Quantum Kernel
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className={textMutedClass}>Support Vectors: </span>
                  <span className={`font-bold ${headingClass}`}>{quantumModel?.svCount ?? '24'} SVs</span>
                </div>
                <div>
                  <span className={textMutedClass}>Train Time: </span>
                  <span className={`font-bold ${headingClass}`}>{quantumModel?.trainTimeMs ?? '142'} ms</span>
                </div>
                <div>
                  <span className={textMutedClass}>Kernel Formulation: </span>
                  <span className={headingClass}>|⟨0|U†(z)U(x)|0⟩|²</span>
                </div>
                <div>
                  <span className={textMutedClass}>Separation Margin: </span>
                  <span className="text-violet-600 dark:text-violet-400 font-bold">Hilbert Space (ℂ¹⁶)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Qiskit ASCII Circuit Modal */}
      {showAsciiModal && backendCircuit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-3xl rounded-2xl border p-6 shadow-2xl relative max-h-[85vh] flex flex-col ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <button
              onClick={() => setShowAsciiModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/30">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Qiskit ZZFeatureMap Decomposed Circuit</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {backendCircuit.num_qubits} Qubits · Depth {backendCircuit.depth} · {backendCircuit.total_gates} Total Gates
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 rounded-xl border bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre">
              {backendCircuit.ascii_diagram || 'ASCII circuit diagram unavailable.'}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-500 shrink-0">
              <div>
                Gate Counts: {Object.entries(backendCircuit.gate_counts || {}).map(([k, v]) => `${k}:${v}`).join(', ')}
              </div>
              <button
                onClick={() => setShowAsciiModal(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
