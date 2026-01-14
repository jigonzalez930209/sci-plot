/**
 * Anomaly Detection Algorithms
 * Each method has distinct characteristics for different use cases
 */

import type { AnomalyPoint, AnomalyMethod } from './types';

/**
 * Z-Score method: Standard statistical approach
 * - Uses MEAN and STANDARD DEVIATION (parametric)
 * - Assumes normal distribution
 * - Sensitive to extreme outliers
 * - Best for: Clean, normally distributed data
 */
export function detectZScore(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  threshold: number = 3
): AnomalyPoint[] {
  const n = y.length;
  if (n < 3) return [];
  
  const anomalies: AnomalyPoint[] = [];
  const windowSize = Math.min(20, Math.floor(n / 10));
  
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(n, i + windowSize + 1);
    
    // Calculate local MEAN (parametric - sensitive to outliers)
    let localSum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      if (j !== i) {
        localSum += y[j];
        count++;
      }
    }
    const localMean = localSum / count;
    
    // Calculate local STANDARD DEVIATION (parametric)
    let localSumSq = 0;
    for (let j = start; j < end; j++) {
      if (j !== i) {
        localSumSq += Math.pow(y[j] - localMean, 2);
      }
    }
    const localStdDev = Math.sqrt(localSumSq / count);
    
    if (localStdDev === 0) continue;
    
    // Z-score: measures how many standard deviations away from mean
    const zScore = Math.abs((y[i] - localMean) / localStdDev);
    
    if (zScore > threshold) {
      anomalies.push({
        index: i,
        x: x[i],
        y: y[i],
        score: zScore,
        method: 'zscore'
      });
    }
  }
  
  return anomalies;
}

/**
 * MAD (Median Absolute Deviation) method: Robust statistical approach
 * - Uses MEDIAN instead of mean (non-parametric)
 * - Robust to outliers in the window
 * - Doesn't assume normal distribution
 * - Best for: Data with existing outliers, skewed distributions
 */
export function detectMAD(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  threshold: number = 3.5
): AnomalyPoint[] {
  const n = y.length;
  if (n < 3) return [];
  
  const anomalies: AnomalyPoint[] = [];
  const windowSize = Math.min(20, Math.floor(n / 10));
  
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(n, i + windowSize + 1);
    
    // Get local window values
    const localValues: number[] = [];
    for (let j = start; j < end; j++) {
      if (j !== i) {
        localValues.push(y[j]);
      }
    }
    
    // Calculate MEDIAN (robust to outliers)
    localValues.sort((a, b) => a - b);
    const localMedian = localValues[Math.floor(localValues.length / 2)];
    
    // Calculate MAD (Median Absolute Deviation - robust measure of spread)
    const deviations = localValues.map(v => Math.abs(v - localMedian));
    deviations.sort((a, b) => a - b);
    const mad = deviations[Math.floor(deviations.length / 2)];
    
    if (mad === 0) continue;
    
    // Modified Z-score using MAD (more robust than standard Z-score)
    // 0.6745 is the consistency constant for normal distribution
    const modifiedZScore = Math.abs((0.6745 * (y[i] - localMedian)) / mad);
    
    if (modifiedZScore > threshold) {
      anomalies.push({
        index: i,
        x: x[i],
        y: y[i],
        score: modifiedZScore,
        method: 'mad'
      });
    }
  }
  
  return anomalies;
}

/**
 * IQR (Interquartile Range) method: Quartile-based approach
 * - Uses PERCENTILES (25th and 75th)
 * - Classic box-plot outlier detection
 * - Non-parametric, distribution-free
 * - Best for: General purpose, well-understood method
 */
export function detectIQR(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  multiplier: number = 1.5
): AnomalyPoint[] {
  const n = y.length;
  if (n < 4) return [];
  
  const anomalies: AnomalyPoint[] = [];
  const windowSize = Math.min(20, Math.floor(n / 10));
  
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(n, i + windowSize + 1);
    
    // Get local window values
    const localValues: number[] = [];
    for (let j = start; j < end; j++) {
      if (j !== i) {
        localValues.push(y[j]);
      }
    }
    
    // Calculate QUARTILES (percentile-based)
    localValues.sort((a, b) => a - b);
    const q1Index = Math.floor(localValues.length * 0.25);
    const q3Index = Math.floor(localValues.length * 0.75);
    const q1 = localValues[q1Index];
    const q3 = localValues[q3Index];
    const iqr = q3 - q1;
    
    if (iqr === 0) continue;
    
    // IQR method: points outside [Q1 - k*IQR, Q3 + k*IQR] are outliers
    // k=1.5 for outliers, k=3.0 for extreme outliers
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;
    
    if (y[i] < lowerBound || y[i] > upperBound) {
      const score = y[i] < lowerBound 
        ? (lowerBound - y[i]) / iqr
        : (y[i] - upperBound) / iqr;
      
      anomalies.push({
        index: i,
        x: x[i],
        y: y[i],
        score,
        method: 'iqr'
      });
    }
  }
  
  return anomalies;
}

/**
 * Simplified Isolation Forest: Detects anomalies using random partitioning
 * - Machine learning approach
 * - Isolates anomalies through random splits
 * - Works well with high-dimensional data
 * - Best for: Complex patterns, unknown distributions
 */
export function detectIsolationForest(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  contamination: number = 0.05,
  numTrees: number = 10
): AnomalyPoint[] {
  const n = y.length;
  if (n < 10) return [];
  
  // Calculate anomaly scores for each point
  const scores = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    let totalDepth = 0;
    
    // Build multiple trees
    for (let t = 0; t < numTrees; t++) {
      totalDepth += isolationDepth(y, i, 0, 8); // Max depth 8
    }
    
    // Average depth (normalized)
    const avgDepth = totalDepth / numTrees;
    const c = 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1) / n);
    scores[i] = Math.pow(2, -avgDepth / c);
  }
  
  // Sort scores to find threshold
  const sortedScores = Array.from(scores).sort((a, b) => b - a);
  const thresholdIndex = Math.floor(n * contamination);
  const threshold = sortedScores[thresholdIndex];
  
  // Find anomalies
  const anomalies: AnomalyPoint[] = [];
  for (let i = 0; i < n; i++) {
    if (scores[i] >= threshold) {
      anomalies.push({
        index: i,
        x: x[i],
        y: y[i],
        score: scores[i],
        method: 'isolation-forest'
      });
    }
  }
  
  return anomalies;
}

/**
 * Helper: Calculate isolation depth for a point
 */
function isolationDepth(
  data: Float32Array | Float64Array,
  pointIndex: number,
  currentDepth: number,
  maxDepth: number
): number {
  if (currentDepth >= maxDepth) return currentDepth;
  
  // Random split
  const min = Math.min(...Array.from(data));
  const max = Math.max(...Array.from(data));
  const splitValue = min + Math.random() * (max - min);
  
  // Check which side the point falls on
  if (data[pointIndex] < splitValue) {
    return isolationDepth(data, pointIndex, currentDepth + 1, maxDepth);
  } else {
    return isolationDepth(data, pointIndex, currentDepth + 1, maxDepth);
  }
}

/**
 * Main detection function - routes to appropriate algorithm
 */
export function detectAnomalies(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  method: AnomalyMethod,
  sensitivity: number
): AnomalyPoint[] {
  switch (method) {
    case 'zscore':
      return detectZScore(x, y, sensitivity);
    case 'mad':
      return detectMAD(x, y, sensitivity);
    case 'iqr':
      return detectIQR(x, y, sensitivity);
    case 'isolation-forest':
      return detectIsolationForest(x, y, sensitivity);
    default:
      return detectZScore(x, y, sensitivity);
  }
}
