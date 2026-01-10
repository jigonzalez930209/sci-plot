/**
 * SciChartEngine Engine - Data Analysis Plugin
 * 
 * Provides mathematical and statistical tools including:
 * - FFT (Fast Fourier Transform)
 * - Digital Filters (Kalman, Low-pass, etc.)
 * - Curve Fitting and Regression
 * - Peak and Contour Detection
 * - Financial Indicators (SMA, EMA, RSI, etc.)
 * 
 * @module plugins/analysis
 */

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";
import { addFitLine } from "./SeriesFit";
import { fft } from "./fft";

// ============================================
// Core Exports (Utilities)
// ============================================

export {
  formatWithPrefix,
  formatValue,
  formatScientific,
  getBestPrefix,
  detectCycles,
  generateCycleColors,
  detectPeaks,
  validateData,
  calculateStats,
  movingAverage,
  downsampleLTTB,
  subtractBaseline,
} from './utils';

export {
  solveLinearSystem,
  calculateR2,
  integrate,
  derivative,
  cumulativeIntegral,
} from './math';

export {
  fitData,
} from './fitting';

export type {
  CycleInfo,
  Peak,
  PrefixInfo,
  ValidationResult,
  DataStats,
} from './utils';

export type {
  FitType,
  FitOptions,
  FitResult,
} from './fitting';

export * from './contours';

// ============================================
// Advanced Analysis (FFT, Filters, Statistics)
// ============================================

export {
  fft,
  ifft,
  analyzeSpectrum,
  powerSpectrum,
  dominantFrequency,
  hanningWindow,
  hammingWindow,
  blackmanWindow,
  nextPowerOf2,
  analyzeComplexSpectrum,
  fftFromComplexInput,
  complexToArrays,
  arraysToComplex,
  ifftFromArrays,
  ifftComplex,
  getPositiveFrequencies,
} from './fft';

export type {
  Complex,
  FFTResult,
  ComplexFFTResult,
  PowerSpectrumResult,
} from './fft';

export {
  lowPassFilter,
  highPassFilter,
  bandPassFilter,
  bandStopFilter,
  butterworth,
  exponentialMovingAverage,
  gaussianSmooth,
  savitzkyGolay,
  medianFilter,
} from './filters';

export type {
  FilterType,
  FilterOptions,
  ButterworthOptions,
} from './filters';

export {
  crossCorrelation,
  autoCorrelation,
  detectAnomalies,
  trapezoidalIntegration,
  simpsonsIntegration,
  cumulativeIntegration as cumulativeIntegral2,
  tTest,
} from './statistics';

export type {
  CorrelationResult,
  AnomalyResult,
  AnomalyOptions,
  TTestResult,
} from './statistics';

// ============================================
// Technical/Financial Indicators
// ============================================

export {
  sma,
  ema,
  wma,
  dema,
  tema,
  rsi,
  macd,
  stochastic,
  roc,
  momentum,
  bollingerBands,
  atr,
  standardDeviation,
  vwap,
  obv,
  adx,
  aroon,
  percentChange,
  cumsum,
  normalize,
} from './indicators';

export type {
  IndicatorResult,
  OHLCData,
} from './indicators';

// ============================================
// Plugin Definition
// ============================================

export interface PluginAnalysisConfig {
    /** Enable worker-based off-main-thread processing */
    useWorkers?: boolean;
    /** Precision for statistical calculations */
    precision?: number;
}

const manifestAnalysis: PluginManifest = {
    name: "scichart-analysis",
    version: "1.0.0",
    description: "Data analysis and signal processing for scichart-engine",
    provides: ["analysis"],
    tags: ["fft", "filters", "statistics", "math"],
};

/**
 * SciChartEngine Analysis Plugin
 * 
 * Adds comprehensive data analysis capabilities to the chart.
 */
export function PluginAnalysis(_config: PluginAnalysisConfig = {}): ChartPlugin<PluginAnalysisConfig> {
    let _ctx: PluginContext;

    return {
        manifest: manifestAnalysis,

        onInit(ctx: PluginContext) {
            _ctx = ctx; 
        },

        onDestroy(_ctx: PluginContext) {
        },

        api: {
            addFitLine(seriesId: string, type: any, options?: any) {
                return addFitLine(_ctx.chart, seriesId, type, options);
            },
            fft: (data: any) => {
                return fft(data);
            },
        }
    };
}

export default PluginAnalysis;
