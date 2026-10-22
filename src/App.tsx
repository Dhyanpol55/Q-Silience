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
import {
  ChevronUp,
  ChevronDown,
  ArrowUp,
  Sparkles,
  Layers,
  Activity,
  Zap,
  Eye,
  Radio,
  Atom,
  BarChart3,
  FileText,
} from 'lucide-react';

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
  const tabSequence = useMemo(
    () => [
      { id: 'overview' as PageId, label: 'Overview', number: '01', subtitle: 'Executive Dashboard & Real-Time Telemetry', accent: 'cyan' },
      { id: 'scenario_lab' as PageId, label: 'Scenario Lab', number: '02', subtitle: 'Physics Compliance & Transient Injector', accent: 'amber' },
      { id: 'investigation' as PageId, label: 'Investigation', number: '03', subtitle: 'State Space & Anomaly Forensics', accent: 'cyan' },
      { id: 'live_stream' as PageId, label: 'Live Stream', number: '04', subtitle: 'Continuous Telemetry & Dual ML Stream', accent: 'rose' },
      { id: 'quantum_lab' as PageId, label: 'Quantum Circuit', number: '05', subtitle: 'Qiskit ZZFeatureMap Hilbert Space', accent: 'violet' },
      { id: 'benchmark' as PageId, label: 'Benchmark', number: '06', subtitle: 'Empirical Scikit-Learn vs QSVC Comparison', accent: 'sky' },
      { id: 'report' as PageId, label: 'Report & Git', number: '07', subtitle: 'VTU Dossier, Source Audit & CSV Export', accent: 'indigo' },
    ],
    []
  );

  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const isManualScrolling = useRef<boolean>(false);

  // Smooth scroll to target tab section with arrival pulse
  const handleSelectPage = useCallback((pageId: PageId) => {
    setCurrentPage(pageId);
    isManualScrolling.current = true;
    const el = document.getElementById(`section-${pageId}`);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // Add visual arrival highlight pulse
      el.classList.remove('section-targeted');
      void el.offsetWidth; // force browser layout reflow
      el.classList.add('section-targeted');
      setTimeout(() => {
        el.classList.remove('section-targeted');
      }, 1300);
    }
    setTimeout(() => {
      isManualScrolling.current = false;
    }, 850);
  }, []);

  // High-performance RAF scroll tracker & scroll spy (zero lag, 60fps/120fps sync)
  useEffect(() => {
    let rafId: number | null = null;
    let lastPercent = -1;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const pct = Math.round(Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)));
          if (Math.abs(pct - lastPercent) >= 1) {
            lastPercent = pct;
            setScrollPercent(pct);
          }
        }

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
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [tabSequence]);

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

  // Left-side vertical navigation items with icons, full names, and deep ink fonts
  const leftVerticalNavItems = useMemo(
    () => [
      {
        id: 'overview' as PageId,
        label: 'Overview',
        number: '01',
        subtitle: 'Executive Telemetry & KPI Matrix',
        icon: <Activity className="w-4 h-4 stroke-[2.2]" />,
        activeClass: 'bg-cyan-500 text-slate-950 font-extrabold ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/30',
        inactiveClass: 'text-slate-900 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-900/90 font-bold',
        badgeColor: 'text-slate-950 dark:text-cyan-300 bg-slate-200/90 dark:bg-cyan-500/20 border-slate-300 dark:border-cyan-500/30 font-bold',
      },
      {
        id: 'scenario_lab' as PageId,
        label: 'Scenario Lab',
        number: '02',
        subtitle: 'Multi-Modal Physics Transient Injector',
        icon: <Zap className="w-4 h-4 stroke-[2.2]" />,
        activeClass: 'bg-amber-500 text-slate-950 font-extrabold ring-2 ring-amber-400/50 shadow-md shadow-amber-500/30',
        inactiveClass: 'text-slate-900 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-900/90 font-bold',
        badgeColor: 'text-slate-950 dark:text-amber-300 bg-slate-200/90 dark:bg-amber-500/20 border-slate-300 dark:border-amber-500/30 font-bold',
      },
      {
        id: 'investigation' as PageId,
        label: 'Investigation',
        number: '03',
        subtitle: '4D State-Space Anomaly Forensics',
        icon: <Eye className="w-4 h-4 stroke-[2.2]" />,
        activeClass: 'bg-cyan-600 text-white font-extrabold ring-2 ring-cyan-500/50 shadow-md shadow-cyan-600/30',
        inactiveClass: 'text-slate-900 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-900/90 font-bold',
        badgeColor: 'text-slate-950 dark:text-cyan-300 bg-slate-200/90 dark:bg-cyan-500/20 border-slate-300 dark:border-cyan-500/30 font-bold',
      },
      {
        id: 'live_stream' as PageId,
        label: 'Live Stream',
        number: '04',
        subtitle: 'Continuous Telemetry & Dual ML Stream',
        icon: (
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
        ),
        activeClass: 'bg-rose-500 text-white font-extrabold ring-2 ring-rose-400/50 shadow-md shadow-rose-500/30',
        inactiveClass: 'text-slate-900 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-900/90 font-bold',
        badgeColor: 'text-slate-950 dark:text-rose-300 bg-slate-200/90 dark:bg-rose-500/20 border-slate-300 dark:border-rose-500/30 font-bold',
      },
      {
        id: 'quantum_lab' as PageId,
        label: 'Quantum Circuit',
        number: '05',
        subtitle: 'Qiskit ZZFeatureMap Hilbert Space',
        icon: <Atom className="w-4 h-4 stroke-[2]" />,
        activeClass: 'bg-violet-600 text-white font-extrabold ring-2 ring-violet-400/50 shadow-md shadow-violet-600/30',
        inactiveClass: 'text-slate-900 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-900/90 font-bold',
        badgeColor: 'text-slate-950 dark:text-violet-300 bg-slate-200/90 dark:bg-violet-500/20 border-slate-300 dark:border-violet-500/30 font-bold',
      },
      {
        id: 'benchmark' as PageId,
        label: 'Benchmark',
        number: '06',
        subtitle: 'Classical vs Quantum Empirical Regimes',
        icon: <BarChart3 className="w-4 h-4 stroke-[2]" />,
        activeClass: 'bg-sky-600 text-white font-extrabold ring-2 ring-sky-400/50 shadow-md shadow-sky-600/30',
        inactiveClass: 'text-slate-900 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-900/90 font-bold',
        badgeColor: 'text-slate-950 dark:text-sky-300 bg-slate-200/90 dark:bg-sky-500/20 border-slate-300 dark:border-sky-500/30 font-bold',
      },
      {
        id: 'report' as PageId,
        label: 'Report & Git',
        number: '07',
        subtitle: 'VTU Dossier, Source Audit & CSV Export',
        icon: <FileText className="w-4 h-4 stroke-[2]" />,
        activeClass: 'bg-indigo-600 text-white font-extrabold ring-2 ring-indigo-400/50 shadow-md shadow-indigo-600/30',
        inactiveClass: 'text-slate-900 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/90 font-bold',
        badgeColor: 'text-slate-950 dark:text-indigo-300 bg-slate-200/90 dark:bg-indigo-500/20 border-slate-300 dark:border-indigo-500/30 font-bold',
      },
    ],
    []
  );

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

      {/* TELEMETRY SCROLL PROGRESS LINE (0 - 100%) */}
      <div className="fixed top-[68px] sm:top-[72px] left-0 right-0 z-40 h-[2.5px] bg-slate-200/40 dark:bg-slate-800/40 pointer-events-none">
        <div
          className="h-full scroll-progress-line transition-all duration-150 ease-out"
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      {/* LEFT-SIDE VERTICAL NAVIGATION: Displays icons WITH full names for Overview, Scenario Lab, Investigation, Live Stream */}
      <aside
        aria-label="Vertical navigation sidebar"
        style={{ width: '190px', height: '500px' }}
        className={`fixed left-2 sm:left-3 lg:left-4 top-20 z-30 hidden md:flex flex-col justify-between p-2 lg:p-3 rounded-2xl backdrop-blur-xl border transition-all duration-200 shadow-2xl overflow-y-auto w-[190px] h-[500px] ${
          isDark
            ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-cyan-950/50'
            : 'bg-white border-slate-300 text-slate-950 shadow-slate-300/60'
        }`}
      >
        <div className="flex flex-col gap-1.5">
          {/* Header Title in Sidebar */}
          <div className="pb-2 mb-1 border-b border-slate-200 dark:border-slate-800">
            <div className="hidden lg:flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                Navigation
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                v1.4.0
              </span>
            </div>
            <div className="lg:hidden text-[9px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 text-center">
              Nav
            </div>
          </div>

          {/* Primary 4 sections requested: Overview, Scenario Lab, Investigation, Live Stream */}
          <div className="space-y-1">
            <div className="hidden lg:block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 px-2 py-0.5">
              Core Modules
            </div>
            {leftVerticalNavItems.slice(0, 4).map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPage(item.id)}
                  aria-label={`Navigate to ${item.label}`}
                  title={`${item.number}. ${item.label} — ${item.subtitle}`}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left ${
                    isActive
                      ? item.activeClass
                      : item.inactiveClass
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="hidden lg:flex flex-1 items-center justify-between min-w-0">
                    <span className="text-xs font-bold truncate text-slate-950 dark:text-white">{item.label}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'bg-black/20 text-inherit border-black/30'
                          : item.badgeColor
                      }`}
                    >
                      {item.number}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subtle Divider */}
          <div className="my-1.5 border-t border-slate-200 dark:border-slate-800" />

          {/* Secondary chapters: Quantum Circuit, Benchmark, Report */}
          <div className="space-y-1">
            <div className="hidden lg:block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 px-2 py-0.5">
              Deep Analysis
            </div>
            {leftVerticalNavItems.slice(4).map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPage(item.id)}
                  aria-label={`Navigate to ${item.label}`}
                  title={`${item.number}. ${item.label} — ${item.subtitle}`}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer text-left ${
                    isActive
                      ? item.activeClass
                      : item.inactiveClass
                  }`}
                >
                  <span className="shrink-0 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="hidden lg:flex flex-1 items-center justify-between min-w-0">
                    <span className="text-xs font-semibold truncate text-slate-950 dark:text-white">{item.label}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'bg-black/20 text-inherit border-black/30'
                          : item.badgeColor
                      }`}
                    >
                      {item.number}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll Progress depth meter at the bottom of the sidebar */}
        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="hidden lg:flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-900 dark:text-slate-200 font-bold">
              <span>Scroll Depth</span>
              <span className="font-extrabold text-cyan-700 dark:text-cyan-400">{scrollPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-150"
                style={{ width: `${scrollPercent}%` }}
              />
            </div>
          </div>
          <div className="lg:hidden text-center font-mono text-[9px] font-bold text-cyan-700 dark:text-cyan-400">
            {scrollPercent}%
          </div>
        </div>
      </aside>

      {/* CONTINUOUS SCROLL CONTAINER: All Tabs rendered with High-Performance Scroll-Spy Sync */}
      <main className="flex-1 space-y-20 pb-28 md:pl-16 lg:pl-64">
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

        {/* CHAPTER 02: SCENARIO LAB */}
        <section
          id="section-scenario_lab"
          data-tab="scenario_lab"
          className={`tab-section ${currentPage === 'scenario_lab' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-amber-700 dark:text-amber-400 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Chapter 02</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>Physics-Calibrated Testbench</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">
                Microgrid Scenario Laboratory
              </h2>
              <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 mt-1 max-w-2xl font-medium">
                Inject multi-modal power grid transients, inverter trip faults, and battery cutoffs to evaluate IEEE 1547 and EN 50160 tolerance envelope compliance.
              </p>
            </div>
            <button
              onClick={() => handleSelectPage('overview')}
              className="btn-ghost text-xs font-mono text-slate-800 hover:text-black dark:text-slate-200 dark:hover:text-white shrink-0 self-start sm:self-auto font-semibold"
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" /> Back to Top
            </button>
          </div>
          <ScenarioLabPage
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            scaler={datasetSplit?.scaler || null}
            theme={theme}
          />
        </section>

        {/* CHAPTER 03: INVESTIGATION */}
        <section
          id="section-investigation"
          data-tab="investigation"
          className={`tab-section ${currentPage === 'investigation' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-cyan-700 dark:text-cyan-400 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                <span>Chapter 03</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>State Space Analysis</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">
                Multi-Modal Anomaly Investigation
              </h2>
              <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 mt-1 max-w-2xl font-medium">
                Explore individual sensor samples across the 4D parameter space and drill into specific fault triggers, angle mappings, and decision boundaries.
              </p>
            </div>
            <button
              onClick={() => handleSelectPage('overview')}
              className="btn-ghost text-xs font-mono text-slate-800 hover:text-black dark:text-slate-200 dark:hover:text-white shrink-0 self-start sm:self-auto font-semibold"
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" /> Back to Top
            </button>
          </div>
          <AnomalyInvestigationPage
            samples={samples}
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            scaler={datasetSplit?.scaler || null}
            theme={theme}
          />
        </section>

        {/* CHAPTER 04: LIVE STREAM */}
        <section
          id="section-live_stream"
          data-tab="live_stream"
          className={`tab-section ${currentPage === 'live_stream' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-rose-700 dark:text-rose-400 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                <span>Chapter 04</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>Real-Time Ingestion</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">
                Continuous Telemetry Stream
              </h2>
              <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 mt-1 max-w-2xl font-medium">
                Simulated real-time sensor stream executing concurrent Classical SVC and Qiskit quantum kernel classification with sub-second response times.
              </p>
            </div>
            <button
              onClick={() => handleSelectPage('overview')}
              className="btn-ghost text-xs font-mono text-slate-800 hover:text-black dark:text-slate-200 dark:hover:text-white shrink-0 self-start sm:self-auto font-semibold"
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" /> Back to Top
            </button>
          </div>
          <LiveSimulationPage
            classicalModel={classicalModel}
            quantumModel={quantumModel}
            scaler={datasetSplit?.scaler || null}
            theme={theme}
          />
        </section>

        {/* CHAPTER 05: QUANTUM CIRCUIT */}
        <section
          id="section-quantum_lab"
          data-tab="quantum_lab"
          className={`tab-section ${currentPage === 'quantum_lab' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-violet-700 dark:text-violet-400 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                <span>Chapter 05</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>Hilbert Space Feature Encoding</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">
                Qiskit ZZFeatureMap Quantum Circuit
              </h2>
              <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 mt-1 max-w-2xl font-medium">
                Direct visual inspection of Hadamard gates, parameterized Rz phase rotations, and CNOT entanglement layers mapping 4D inputs into 16D Hilbert space.
              </p>
            </div>
            <button
              onClick={() => handleSelectPage('overview')}
              className="btn-ghost text-xs font-mono text-slate-800 hover:text-black dark:text-slate-200 dark:hover:text-white shrink-0 self-start sm:self-auto font-semibold"
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" /> Back to Top
            </button>
          </div>
          <QuantumLabPage kernelMatrix={kernelMatrix} theme={theme} />
        </section>

        {/* CHAPTER 06: BENCHMARK */}
        <section
          id="section-benchmark"
          data-tab="benchmark"
          className={`tab-section ${currentPage === 'benchmark' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-sky-700 dark:text-sky-400 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                <span>Chapter 06</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>Empirical Performance &amp; Low-Data Regimes</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">
                Model Evaluation &amp; Sample Efficiency
              </h2>
              <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 mt-1 max-w-2xl font-medium">
                Held-out test set accuracy, precision, recall, F1, and confusion matrix comparisons with honest documentation of the NISQ optimization gap.
              </p>
            </div>
            <button
              onClick={() => handleSelectPage('overview')}
              className="btn-ghost text-xs font-mono text-slate-800 hover:text-black dark:text-slate-200 dark:hover:text-white shrink-0 self-start sm:self-auto font-semibold"
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" /> Back to Top
            </button>
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

        {/* CHAPTER 07: REPORT */}
        <section
          id="section-report"
          data-tab="report"
          className={`tab-section ${currentPage === 'report' ? 'section-active' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-indigo-700 dark:text-indigo-400 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                <span>Chapter 07</span>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span>Audit &amp; Deployment</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">
                Hackathon Dossier &amp; Source Control
              </h2>
              <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 mt-1 max-w-2xl font-medium">
                VTU-Qiskit Fall Fest 2026 rubric compliance checklist, repository branch status, and reproducible JSON/CSV export.
              </p>
            </div>
            <button
              onClick={() => handleSelectPage('overview')}
              className="btn-ghost text-xs font-mono text-slate-800 hover:text-black dark:text-slate-200 dark:hover:text-white shrink-0 self-start sm:self-auto font-semibold"
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" /> Back to Top
            </button>
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

      {/* FLOATING WORKSTATION CONTROLLER */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 shadow-2xl">
        <div
          className={`px-4 py-2.5 rounded-2xl border flex items-center gap-4 backdrop-blur-xl transition-all shadow-xl ${
            isDark
              ? 'bg-slate-950/90 border-slate-800 text-white shadow-cyan-950/50'
              : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-200/80'
          }`}
        >
          {/* Chapter dots indicator */}
          <div className="flex items-center gap-1.5">
            {tabSequence.map((tab) => {
              const isActive = currentPage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectPage(tab.id)}
                  title={`${tab.number}. ${tab.label}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 ring-2 ring-cyan-500/40 scale-125'
                      : isDark
                      ? 'bg-slate-700 hover:bg-slate-500'
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Active section label */}
          <div className="text-left font-mono leading-tight">
            <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
              {tabSequence[currentIndex]?.number}. {tabSequence[currentIndex]?.label}
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500">
              Scroll spy synchronized
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={handlePrevTab}
              title="Previous Chapter"
              aria-label="Scroll to previous chapter"
              className="btn-ghost p-1.5 h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextTab}
              title="Next Chapter"
              aria-label="Scroll to next chapter"
              className="btn-ghost p-1.5 h-7 w-7 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSelectPage('overview')}
              title="Return to Executive Overview"
              aria-label="Scroll to top overview"
              className="btn-ghost p-1.5 h-7 w-7 rounded-lg text-cyan-600 dark:text-cyan-400"
            >
              <ArrowUp className="w-3.5 h-3.5" />
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
