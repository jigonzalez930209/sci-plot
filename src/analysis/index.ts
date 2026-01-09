/**
 * Data Analysis module exports
 *
 * General-purpose utilities for data formatting, cycle detection,
 * peak detection, data validation, FFT, filters, and statistics.
 */

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
  // FFT
  fft,
  ifft,
  analyzeSpectrum,
  powerSpectrum,
  dominantFrequency,
  hanningWindow,
  hammingWindow,
  blackmanWindow,
  nextPowerOf2,
  // Complex FFT functions
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
  // Filters
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
  // Statistics
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
  // Moving Averages
  sma,
  ema,
  wma,
  dema,
  tema,
  
  // Momentum
  rsi,
  macd,
  stochastic,
  roc,
  momentum,
  
  // Volatility
  bollingerBands,
  atr,
  standardDeviation,
  
  // Volume
  vwap,
  obv,
  
  // Trend
  adx,
  aroon,
  
  // Utilities
  percentChange,
  cumsum,
  normalize,
} from './indicators';

export type {
  IndicatorResult,
  OHLCData,
} from './indicators';
