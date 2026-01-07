/**
 * Advanced Statistical Analysis
 * 
 * Provides:
 * - Cross-correlation
 * - Auto-correlation
 * - Anomaly detection
 * - Statistical tests
 * - Numerical integration (Simpson, trapezoidal)
 */

// ============================================
// Correlation Analysis
// ============================================

/** Cross-correlation result */
export interface CorrelationResult {
  /** Correlation values at each lag */
  correlation: Float32Array;
  /** Lag values */
  lags: Float32Array;
  /** Maximum correlation value */
  maxCorrelation: number;
  /** Lag at maximum correlation */
  lagAtMax: number;
}

/**
 * Compute cross-correlation between two signals
 */
export function crossCorrelation(
  signal1: Float32Array | Float64Array,
  signal2: Float32Array | Float64Array,
  maxLag?: number
): CorrelationResult {
  const n1 = signal1.length;
  const n2 = signal2.length;
  const effectiveMaxLag = maxLag ?? Math.min(n1, n2) - 1;
  const numLags = 2 * effectiveMaxLag + 1;
  
  const correlation = new Float32Array(numLags);
  const lags = new Float32Array(numLags);
  
  // Compute means
  let mean1 = 0, mean2 = 0;
  for (let i = 0; i < n1; i++) mean1 += signal1[i];
  for (let i = 0; i < n2; i++) mean2 += signal2[i];
  mean1 /= n1;
  mean2 /= n2;
  
  // Compute standard deviations
  let std1 = 0, std2 = 0;
  for (let i = 0; i < n1; i++) std1 += (signal1[i] - mean1) ** 2;
  for (let i = 0; i < n2; i++) std2 += (signal2[i] - mean2) ** 2;
  std1 = Math.sqrt(std1 / n1);
  std2 = Math.sqrt(std2 / n2);
  
  const normFactor = std1 * std2 * Math.min(n1, n2);
  
  let maxCorr = -Infinity;
  let maxLagIdx = 0;
  
  for (let lagIdx = 0; lagIdx < numLags; lagIdx++) {
    const lag = lagIdx - effectiveMaxLag;
    lags[lagIdx] = lag;
    
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < n1; i++) {
      const j = i + lag;
      if (j >= 0 && j < n2) {
        sum += (signal1[i] - mean1) * (signal2[j] - mean2);
        count++;
      }
    }
    
    correlation[lagIdx] = normFactor > 0 ? sum / normFactor : 0;
    
    if (correlation[lagIdx] > maxCorr) {
      maxCorr = correlation[lagIdx];
      maxLagIdx = lagIdx;
    }
  }
  
  return {
    correlation,
    lags,
    maxCorrelation: maxCorr,
    lagAtMax: lags[maxLagIdx],
  };
}

/**
 * Compute auto-correlation of a signal
 */
export function autoCorrelation(
  signal: Float32Array | Float64Array,
  maxLag?: number
): CorrelationResult {
  return crossCorrelation(signal, signal, maxLag);
}

// ============================================
// Anomaly Detection
// ============================================

/** Anomaly detection result */
export interface AnomalyResult {
  /** Indices of anomalous points */
  indices: number[];
  /** Anomaly scores for all points */
  scores: Float32Array;
  /** Threshold used for detection */
  threshold: number;
}

/** Anomaly detection options */
export interface AnomalyOptions {
  /** Detection method */
  method?: 'zscore' | 'mad' | 'iqr' | 'isolation';
  /** Threshold multiplier (default: 3 for zscore, 2.5 for mad, 1.5 for iqr) */
  threshold?: number;
  /** Window size for local anomaly detection (default: use global) */
  windowSize?: number;
}

/**
 * Detect anomalies in a signal
 */
export function detectAnomalies(
  data: Float32Array | Float64Array,
  options: AnomalyOptions = {}
): AnomalyResult {
  const { method = 'zscore', windowSize } = options;
  
  switch (method) {
    case 'zscore':
      return detectAnomaliesZScore(data, options.threshold ?? 3, windowSize);
    case 'mad':
      return detectAnomaliesMAD(data, options.threshold ?? 2.5, windowSize);
    case 'iqr':
      return detectAnomaliesIQR(data, options.threshold ?? 1.5);
    case 'isolation':
      return detectAnomaliesIsolation(data, options.threshold ?? 0.5);
    default:
      return detectAnomaliesZScore(data, 3, windowSize);
  }
}

/**
 * Z-score based anomaly detection
 */
function detectAnomaliesZScore(
  data: Float32Array | Float64Array,
  threshold: number,
  windowSize?: number
): AnomalyResult {
  const n = data.length;
  const scores = new Float32Array(n);
  const indices: number[] = [];
  
  if (windowSize && windowSize < n) {
    // Local anomaly detection
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(n, i + halfWindow + 1);
      
      let mean = 0;
      for (let j = start; j < end; j++) mean += data[j];
      mean /= (end - start);
      
      let std = 0;
      for (let j = start; j < end; j++) std += (data[j] - mean) ** 2;
      std = Math.sqrt(std / (end - start));
      
      scores[i] = std > 0 ? Math.abs(data[i] - mean) / std : 0;
      
      if (scores[i] > threshold) {
        indices.push(i);
      }
    }
  } else {
    // Global anomaly detection
    let mean = 0;
    for (let i = 0; i < n; i++) mean += data[i];
    mean /= n;
    
    let std = 0;
    for (let i = 0; i < n; i++) std += (data[i] - mean) ** 2;
    std = Math.sqrt(std / n);
    
    for (let i = 0; i < n; i++) {
      scores[i] = std > 0 ? Math.abs(data[i] - mean) / std : 0;
      
      if (scores[i] > threshold) {
        indices.push(i);
      }
    }
  }
  
  return { indices, scores, threshold };
}

/**
 * Median Absolute Deviation (MAD) based anomaly detection
 */
function detectAnomaliesMAD(
  data: Float32Array | Float64Array,
  threshold: number,
  _windowSize?: number
): AnomalyResult {
  const n = data.length;
  const scores = new Float32Array(n);
  const indices: number[] = [];
  
  // Compute median
  const sorted = Array.from(data).sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];
  
  // Compute MAD
  const absDeviations = sorted.map(x => Math.abs(x - median)).sort((a, b) => a - b);
  const mad = absDeviations[Math.floor(n / 2)];
  const scaledMad = 1.4826 * mad; // Scale factor for normal distribution
  
  for (let i = 0; i < n; i++) {
    scores[i] = scaledMad > 0 ? Math.abs(data[i] - median) / scaledMad : 0;
    
    if (scores[i] > threshold) {
      indices.push(i);
    }
  }
  
  return { indices, scores, threshold };
}

/**
 * IQR (Interquartile Range) based anomaly detection
 */
function detectAnomaliesIQR(
  data: Float32Array | Float64Array,
  threshold: number
): AnomalyResult {
  const n = data.length;
  const scores = new Float32Array(n);
  const indices: number[] = [];
  
  const sorted = Array.from(data).sort((a, b) => a - b);
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - threshold * iqr;
  const upperBound = q3 + threshold * iqr;
  
  for (let i = 0; i < n; i++) {
    if (data[i] < lowerBound) {
      scores[i] = (lowerBound - data[i]) / iqr;
      indices.push(i);
    } else if (data[i] > upperBound) {
      scores[i] = (data[i] - upperBound) / iqr;
      indices.push(i);
    } else {
      scores[i] = 0;
    }
  }
  
  return { indices, scores, threshold };
}

/**
 * Simplified isolation-based anomaly detection
 */
function detectAnomaliesIsolation(
  data: Float32Array | Float64Array,
  threshold: number,
  _windowSize?: number
): AnomalyResult {
  const n = data.length;
  const scores = new Float32Array(n);
  const indices: number[] = [];
  
  // For each point, count how many neighbors are close
  const neighborRadius = calculateNeighborRadius(data);
  
  for (let i = 0; i < n; i++) {
    let neighborCount = 0;
    
    for (let j = 0; j < n; j++) {
      if (i !== j && Math.abs(data[i] - data[j]) < neighborRadius) {
        neighborCount++;
      }
    }
    
    // Isolation score: fewer neighbors = more isolated = higher score
    scores[i] = 1 - (neighborCount / n);
    
    if (scores[i] > threshold) {
      indices.push(i);
    }
  }
  
  return { indices, scores, threshold };
}

/**
 * Calculate neighbor radius for isolation detection
 */
function calculateNeighborRadius(data: Float32Array | Float64Array): number {
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  
  return (max - min) * 0.1; // 10% of range
}

// ============================================
// Numerical Integration
// ============================================

/**
 * Trapezoidal integration
 */
export function trapezoidalIntegration(
  y: Float32Array | Float64Array,
  x?: Float32Array | Float64Array | number
): number {
  const n = y.length;
  if (n < 2) return 0;
  
  let sum = 0;
  
  if (typeof x === 'number') {
    // Uniform spacing
    const dx = x;
    for (let i = 1; i < n; i++) {
      sum += (y[i - 1] + y[i]) * dx / 2;
    }
  } else if (x) {
    // Non-uniform spacing
    for (let i = 1; i < n; i++) {
      sum += (y[i - 1] + y[i]) * (x[i] - x[i - 1]) / 2;
    }
  } else {
    // Assume unit spacing
    for (let i = 1; i < n; i++) {
      sum += (y[i - 1] + y[i]) / 2;
    }
  }
  
  return sum;
}

/**
 * Simpson's rule integration (requires odd number of points)
 */
export function simpsonsIntegration(
  y: Float32Array | Float64Array,
  x?: Float32Array | Float64Array | number
): number {
  const n = y.length;
  if (n < 3) return trapezoidalIntegration(y, x);
  
  // Ensure odd number of points
  const useN = n % 2 === 0 ? n - 1 : n;
  
  let sum = 0;
  
  if (typeof x === 'number') {
    // Uniform spacing
    const dx = x;
    
    sum = y[0] + y[useN - 1];
    
    for (let i = 1; i < useN - 1; i++) {
      sum += (i % 2 === 0 ? 2 : 4) * y[i];
    }
    
    sum *= dx / 3;
    
    // Add last interval if we had to skip a point
    if (n !== useN) {
      sum += (y[n - 2] + y[n - 1]) * dx / 2;
    }
  } else if (x) {
    // Non-uniform spacing - use trapezoidal as fallback
    return trapezoidalIntegration(y, x);
  } else {
    // Assume unit spacing
    return simpsonsIntegration(y, 1.0);
  }
  
  return sum;
}

/**
 * Cumulative integration (returns running integral)
 */
export function cumulativeIntegration(
  y: Float32Array | Float64Array,
  x?: Float32Array | Float64Array | number
): Float32Array {
  const n = y.length;
  const result = new Float32Array(n);
  
  if (n < 2) {
    result[0] = 0;
    return result;
  }
  
  result[0] = 0;
  
  if (typeof x === 'number') {
    const dx = x;
    for (let i = 1; i < n; i++) {
      result[i] = result[i - 1] + (y[i - 1] + y[i]) * dx / 2;
    }
  } else if (x) {
    for (let i = 1; i < n; i++) {
      result[i] = result[i - 1] + (y[i - 1] + y[i]) * (x[i] - x[i - 1]) / 2;
    }
  } else {
    for (let i = 1; i < n; i++) {
      result[i] = result[i - 1] + (y[i - 1] + y[i]) / 2;
    }
  }
  
  return result;
}

// ============================================
// Statistical Tests
// ============================================

/** T-test result */
export interface TTestResult {
  /** T-statistic */
  tStatistic: number;
  /** Degrees of freedom */
  degreesOfFreedom: number;
  /** Approximate p-value (two-tailed) */
  pValue: number;
  /** Whether the difference is significant at 0.05 level */
  significant: boolean;
}

/**
 * Two-sample t-test (Welch's t-test)
 */
export function tTest(
  sample1: Float32Array | Float64Array | number[],
  sample2: Float32Array | Float64Array | number[]
): TTestResult {
  const n1 = sample1.length;
  const n2 = sample2.length;
  
  // Calculate means
  let mean1 = 0, mean2 = 0;
  for (let i = 0; i < n1; i++) mean1 += sample1[i];
  for (let i = 0; i < n2; i++) mean2 += sample2[i];
  mean1 /= n1;
  mean2 /= n2;
  
  // Calculate variances
  let var1 = 0, var2 = 0;
  for (let i = 0; i < n1; i++) var1 += (sample1[i] - mean1) ** 2;
  for (let i = 0; i < n2; i++) var2 += (sample2[i] - mean2) ** 2;
  var1 /= (n1 - 1);
  var2 /= (n2 - 1);
  
  // Calculate t-statistic
  const se = Math.sqrt(var1 / n1 + var2 / n2);
  const tStatistic = (mean1 - mean2) / se;
  
  // Welch-Satterthwaite degrees of freedom
  const num = (var1 / n1 + var2 / n2) ** 2;
  const denom = (var1 / n1) ** 2 / (n1 - 1) + (var2 / n2) ** 2 / (n2 - 1);
  const degreesOfFreedom = num / denom;
  
  // Approximate p-value using normal distribution for large df
  const pValue = 2 * (1 - normalCDF(Math.abs(tStatistic)));
  
  return {
    tStatistic,
    degreesOfFreedom,
    pValue,
    significant: pValue < 0.05,
  };
}

/**
 * Approximate normal CDF
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1 + sign * y);
}
