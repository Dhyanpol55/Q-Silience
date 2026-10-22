import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { AnomalyInvestigationPage } from './components/AnomalyInvestigationPage';
import { QuantumLabPage } from './components/QuantumLabPage';
import { BenchmarkPage } from './components/BenchmarkPage';
import { ReportPage } from './components/ReportPage';
import { ChevronUp, ChevronDown, ArrowUp, Sparkles, Layers } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [sampleCount] = useState<number>(100);
  const [samples, setSamples] = useState<MicrogridSample[]>([]);

  // Theme State: defaults to 'light'
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

  // Ordered list of tabs for scroll-spy and sequential navigation
  const tabSequence: { id: PageId; label: string; number: string; subtitle: string }[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview', number: '01', subtitle: 'Executive Dashboard & Real-Time Telemetry' },
      { id: 'scenario_lab', label: 'Scenario Lab', number: '02', subtitle: 'Microgrid Physics Compliance & Fault Injector' },
      { id: 'investigation', label: 'Investigation', number: '03', subtitle: 'Historical Telemetry Space & Deep Anomaly Forensics' },
      { id: 'live_stream', label: 'Live Stream', number: '04', subtitle: 'Real-Time Streaming Telemetry & Continuous Dual ML' },
      { id: 'quantum_lab', label: 'Quantum Circuit', number: '05', subtitle: 'Qiskit ZZFeatureMap & Statevector Kernel Inspection' },
      { id: 'benchmark', label: 'Benchmark', number: '06', subtitle: 'Rigorous Classical vs Quantum Evaluation & Low-Data Regimes' },
      { id: 'report', label: 'Report & Git', number: '07', subtitle: 'VTU Hackathon Audit Checklist, Branch Guide & CSV Export' },
    ],
    []
  );

  const isManualScrolling = useRef<boolean>(false);

  // Smooth scroll to target tab section
  const handleSelectPage = useCallback((pageId: PageId) => {
    setCurrentPage(pageId);
    isManualScrolling.current = true;
    const el = document.getElementById(`section-${pageId}`);
    if (el) {
      const headerOffset = 76;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    setTimeout(() => {
      isManualScrolling.current = false;
    }, 850);
  }, []);

  // Real-time scroll spy: updates active tab as user scrolls through sections
  useEffect(() => {
    const handleScroll = () => {
      if (isManualScrolling.current) return;

      const headerOffset = 180;
      const scrollY = window.scrollY;

      for (let i = tabSequence.length - 1; i >= 0; i--) {
        const item = tabSequence[i];
        const el = document.getElementById(`section-${item.id}`);
        if (el) {
          const top = el.offsetTop - headerOffset;
          if (scrollY >= top - 20) {
            setCurrentPage((prev) => (prev !== item.id ? item.id : prev));
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tabSequence]);

  // Entrance scroll animation observer for each tab section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    const sections = document.querySelectorAll('.tab-section');
    sections.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, [samples.length]);

  // Next / Previous tab navigation helpers
  const currentIndex = tabSequence.findIndex((t) => t.id === currentPage);
  const handleNextTab = () => {
    const nextIdx = (currentIndex + 1) % tabSequence.length;
    handleSelectPage(tabSequence[nextIdx].id);
  };
  const handlePrevTab = () => {
    const prevIdx = (currentIndex - 1 + tabSequence.length) % tabSequence.length;
    handleSelectPage(tabSequence[prevIdx].id);
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
        isDark ? 'bg-[#090d16] text-slate-100' : 'bg-white text-slate-900'
      }`}
    >
      <Header
        currentPage={currentPage}
        onSelectPage={handleSelectPage}
        datasetCount={samples.length}
        isTraining={isTraining}
        onResetData={handleResetData}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* CONTINUOUS SCROLL CONTAINER: All Tabs rendered with Scroll Animation & Scroll-Spy Sync */}
      <main className="flex-1 space-y-20 pb-28">
        {/* TAB 01: OVERVIEW */}
        <section
          id="section-overview"
          data-tab="overview"
          className={`tab-section ${currentPage === 'overview' ? 'section-active' : ''}`}
        >
          <OverviewPage
            samples={samples}
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            classicalMetrics={classicalMetrics}
            quantumMetrics={quantumMetrics}
            scaler={datasetSplit?.scaler || null}
            onNavigateToScenarioLab={() => handleSelectPage('scenario_lab')}
            onNavigateToQuantumLab={() => handleSelectPage('quantum_lab')}
            theme={theme}
          />
        </section>

        {/* TAB 02: SCENARIO LAB */}
        <section
          id="section-scenario_lab"
          data-tab="scenario_lab"
          className={`tab-section ${currentPage === 'scenario_lab' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="section-badge px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  TAB 02 // SCENARIO LAB
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                  Microgrid Physics Compliance &amp; Fault Injector
                </span>
              </div>
              <button
                onClick={() => handleSelectPage('overview')}
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" /> Back to Top
              </button>
            </div>
          </div>
          <ScenarioLabPage
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            scaler={datasetSplit?.scaler || null}
            theme={theme}
          />
        </section>

        {/* TAB 03: INVESTIGATION */}
        <section
          id="section-investigation"
          data-tab="investigation"
          className={`tab-section ${currentPage === 'investigation' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="section-badge px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                  TAB 03 // INVESTIGATION
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                  Historical Telemetry Space &amp; Multi-Fault Forensic Inspection
                </span>
              </div>
              <button
                onClick={() => handleSelectPage('overview')}
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" /> Back to Top
              </button>
            </div>
          </div>
          <AnomalyInvestigationPage
            samples={samples}
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            scaler={datasetSplit?.scaler || null}
            theme={theme}
          />
        </section>

        {/* TAB 04: LIVE STREAM */}
        <section
          id="section-live_stream"
          data-tab="live_stream"
          className={`tab-section ${currentPage === 'live_stream' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="section-badge px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  TAB 04 // LIVE STREAM
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                  Real-Time Streaming Telemetry Generator &amp; Dual ML Detection
                </span>
              </div>
              <button
                onClick={() => handleSelectPage('overview')}
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" /> Back to Top
              </button>
            </div>
          </div>
          <LiveSimulationPage
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            scaler={datasetSplit?.scaler || null}
            theme={theme}
          />
        </section>

        {/* TAB 05: QUANTUM CIRCUIT */}
        <section
          id="section-quantum_lab"
          data-tab="quantum_lab"
          className={`tab-section ${currentPage === 'quantum_lab' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="section-badge px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                  TAB 05 // QUANTUM CIRCUIT
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                  Qiskit ZZFeatureMap Circuit &amp; Fidelity Statevector Heatmap
                </span>
              </div>
              <button
                onClick={() => handleSelectPage('overview')}
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" /> Back to Top
              </button>
            </div>
          </div>
          <QuantumLabPage kernelMatrix={kernelMatrix} theme={theme} />
        </section>

        {/* TAB 06: BENCHMARK */}
        <section
          id="section-benchmark"
          data-tab="benchmark"
          className={`tab-section ${currentPage === 'benchmark' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="section-badge px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  TAB 06 // BENCHMARK
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                  Rigorous Classical vs Quantum Evaluation &amp; Low-Data Experiment
                </span>
              </div>
              <button
                onClick={() => handleSelectPage('overview')}
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" /> Back to Top
              </button>
            </div>
          </div>
          <BenchmarkPage
            classicalMetrics={classicalMetrics}
            quantumMetrics={quantumMetrics}
            lowDataPoints={lowDataPoints}
            onRerunBenchmark={handleRerunBenchmark}
            isBenchmarking={isTraining}
            theme={theme}
          />
        </section>

        {/* TAB 07: REPORT */}
        <section
          id="section-report"
          data-tab="report"
          className={`tab-section ${currentPage === 'report' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="section-badge px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  TAB 07 // REPORT &amp; GIT
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                  VTU Hackathon Audit Checklist, Branch Guide &amp; CSV Export
                </span>
              </div>
              <button
                onClick={() => handleSelectPage('overview')}
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" /> Back to Top
              </button>
            </div>
          </div>
          <ReportPage
            report={report}
            samples={samples}
            onUploadCustomData={handleUploadCustomData}
            randomSeed={randomSeed}
            theme={theme}
          />
        </section>
      </main>

      {/* FLOATING QUICK-JUMP TAB CONTROLLER */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 shadow-2xl">
        <div
          className={`px-3.5 py-2 rounded-xl border flex items-center gap-3 backdrop-blur-md transition-all ${
            isDark
              ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-cyan-950/50'
              : 'bg-white/95 border-slate-300/80 text-slate-900 shadow-slate-300/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <div className="text-[11px] font-mono leading-none">
              <div className="font-bold text-cyan-600 dark:text-cyan-400">
                {tabSequence[currentIndex]?.number}/07 {tabSequence[currentIndex]?.label}
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                Scroll to change tab
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={handlePrevTab}
              title="Previous Tab"
              aria-label="Scroll to previous tab"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextTab}
              title="Next Tab"
              aria-label="Scroll to next tab"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectPage('overview')}
              title="Scroll to Top"
              aria-label="Scroll to top overview"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer
        className={`border-t py-8 sm:py-10 text-xs font-mono transition-colors ${
          isDark ? 'border-slate-800/80 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50/60 text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Q-RESILIENCE AI</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>VTU Qiskit Fall Fest 2026</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-cyan-600 dark:text-cyan-400">Quantum + AI/ML Track</span>
          </div>
          <div className="text-xs text-slate-500 text-center sm:text-right">
            Powered by Qiskit Quantum Feature Maps &amp; Scikit-learn Baselines
          </div>
        </div>
      </footer>
    </div>
  );
}
