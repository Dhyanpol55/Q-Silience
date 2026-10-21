import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MicrogridSample, ModelMetrics, LowDataBenchmarkPoint, BenchmarkReport } from './types/microgrid';
import { generateSyntheticMicrogridData } from './services/dataGenerator';
import { preparePreprocessedDataset, DatasetSplit } from './services/preprocessing';
import { computeQuantumKernelMatrix } from './services/quantumEngine';
import { trainClassicalSVC, trainQuantumQSVC, predictBatch, SVCTrainedModel } from './services/svmSolver';
import { calculateMetrics, runLowDataExperiment } from './services/evaluation';
import { Header, PageId } from './components/Header';
import { OverviewPage } from './components/OverviewPage';
import { LiveSimulationPage } from './components/LiveSimulationPage';
import { ScenarioLabPage } from './components/ScenarioLabPage';
import { QuantumLabPage } from './components/QuantumLabPage';
import { BenchmarkPage } from './components/BenchmarkPage';
import { ReportPage } from './components/ReportPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [sampleCount] = useState<number>(100);
  const [samples, setSamples] = useState<MicrogridSample[]>([]);

  // Theme State: defaults to 'light' (clean white background on load/reload)
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Training & Evaluation states
  const [isTraining, setIsTraining] = useState<boolean>(true);
  const [classicalModel, setClassicalModel] = useState<SVCTrainedModel | null>(null);
  const [quantumModel, setQuantumModel] = useState<SVCTrainedModel | null>(null);
  const [classicalMetrics, setClassicalMetrics] = useState<ModelMetrics | null>(null);
  const [quantumMetrics, setQuantumMetrics] = useState<ModelMetrics | null>(null);
  const [kernelMatrix, setKernelMatrix] = useState<number[][] | null>(null);
  const [lowDataPoints, setLowDataPoints] = useState<LowDataBenchmarkPoint[]>([]);
  const [datasetSplit, setDatasetSplit] = useState<DatasetSplit | null>(null);

  // Train and evaluate models
  const trainAndBenchmark = useCallback((rawSamples: MicrogridSample[], seed: number) => {
    setIsTraining(true);

    setTimeout(() => {
      try {
        // 1. Prepare stratified split with scaler fit strictly on train
        const split = preparePreprocessedDataset(
          rawSamples,
          ['demand_kw', 'solar_kw', 'voltage_dev_v', 'frequency_dev_hz'],
          0.25,
          seed
        );
        setDatasetSplit(split);

        // 2. Train Classical SVC baseline
        const cModel = trainClassicalSVC(split.X_train, split.y_train, 1.0, 0.5);
        const cBatch = predictBatch(cModel, split.X_test);
        const cMetrics = calculateMetrics(
          cBatch.predictions,
          split.y_test,
          cModel.trainTimeMs,
          cBatch.inferenceTimeMs
        );
        setClassicalModel(cModel);
        setClassicalMetrics(cMetrics);

        // 3. Compute Quantum Fidelity Kernel Matrix
        const numQubits = 4;
        const reps = 2;
        const tK0 = performance.now();
        const K_train = computeQuantumKernelMatrix(split.X_train, split.X_train, numQubits, reps);
        const tK1 = performance.now();
        const kComputeTimeMs = Math.round(tK1 - tK0);
        setKernelMatrix(K_train);

        // 4. Train Quantum QSVC
        const qModel = trainQuantumQSVC(
          split.X_train,
          split.y_train,
          K_train,
          numQubits,
          reps,
          1.0,
          kComputeTimeMs
        );
        const qBatch = predictBatch(qModel, split.X_test);
        const qMetrics = calculateMetrics(
          qBatch.predictions,
          split.y_test,
          qModel.trainTimeMs,
          qBatch.inferenceTimeMs
        );
        setQuantumModel(qModel);
        setQuantumMetrics(qMetrics);

        // 5. Run Low-Data Experiment
        const lowData = runLowDataExperiment(
          split.X_train,
          split.y_train,
          split.X_test,
          split.y_test,
          numQubits,
          reps
        );
        setLowDataPoints(lowData);
      } catch (err) {
        console.error('Error in model training:', err);
      } finally {
        setIsTraining(false);
      }
    }, 50);
  }, []);

  // Initialize dataset on mount
  useEffect(() => {
    const initialSamples = generateSyntheticMicrogridData(sampleCount, randomSeed);
    setSamples(initialSamples);
    trainAndBenchmark(initialSamples, randomSeed);
  }, []);

  // Reset with new seed
  const handleResetData = () => {
    const newSeed = Math.floor(Math.random() * 10000);
    setRandomSeed(newSeed);
    const newSamples = generateSyntheticMicrogridData(sampleCount, newSeed);
    setSamples(newSamples);
    trainAndBenchmark(newSamples, newSeed);
  };

  // Upload custom dataset
  const handleUploadCustomData = (newSamples: MicrogridSample[]) => {
    setSamples(newSamples);
    trainAndBenchmark(newSamples, randomSeed);
  };

  // Re-run benchmark
  const handleRerunBenchmark = () => {
    trainAndBenchmark(samples, randomSeed);
  };

  // Build report object
  const report: BenchmarkReport | null = useMemo(() => {
    if (!classicalMetrics || !quantumMetrics || !datasetSplit) return null;
    return {
      timestamp: new Date().toISOString(),
      datasetSize: samples.length,
      trainSize: datasetSplit.X_train.length,
      testSize: datasetSplit.X_test.length,
      selectedFeatures: datasetSplit.featureKeys,
      randomSeed,
      classicalMetrics,
      quantumMetrics,
      lowDataPoints,
      quantumCircuit: {
        numQubits: 4,
        depth: 6,
        reps: 2,
        kernelType: 'FidelityQuantumKernel (ZZFeatureMap)',
      },
    };
  }, [classicalMetrics, quantumMetrics, datasetSplit, samples.length, randomSeed, lowDataPoints]);

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Header
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        datasetCount={samples.length}
        isTraining={isTraining}
        onResetData={handleResetData}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {currentPage === 'overview' && (
          <OverviewPage
            samples={samples}
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            classicalMetrics={classicalMetrics}
            quantumMetrics={quantumMetrics}
            onNavigateToScenarioLab={() => setCurrentPage('scenario_lab')}
            onNavigateToQuantumLab={() => setCurrentPage('quantum_lab')}
            theme={theme}
          />
        )}

        {currentPage === 'live_stream' && (
          <LiveSimulationPage
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            scaler={datasetSplit?.scaler || null}
            theme={theme}
          />
        )}

        {currentPage === 'scenario_lab' && (
          <ScenarioLabPage
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            scaler={datasetSplit?.scaler || null}
            theme={theme}
          />
        )}

        {currentPage === 'quantum_lab' && (
          <QuantumLabPage kernelMatrix={kernelMatrix} theme={theme} />
        )}

        {currentPage === 'benchmark' && (
          <BenchmarkPage
            classicalMetrics={classicalMetrics}
            quantumMetrics={quantumMetrics}
            lowDataPoints={lowDataPoints}
            onRerunBenchmark={handleRerunBenchmark}
            isBenchmarking={isTraining}
            theme={theme}
          />
        )}

        {currentPage === 'report' && (
          <ReportPage
            report={report}
            samples={samples}
            onUploadCustomData={handleUploadCustomData}
            randomSeed={randomSeed}
            theme={theme}
          />
        )}
      </main>

      {/* Global Footer */}
      <footer
        className={`border-t py-4 text-center text-xs font-mono transition-colors ${
          isDark ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Q-RESILIENCE AI · VTU Qiskit Fall Fest 2026</span>
            <span aria-hidden="true" className="mx-2 text-slate-400 dark:text-slate-700">|</span>
            <span>Quantum + AI & ML Track</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Powered by Qiskit Quantum Feature Maps & Scikit-learn Baselines
          </div>
        </div>
      </footer>
    </div>
  );
}
