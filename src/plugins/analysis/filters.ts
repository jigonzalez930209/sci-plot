/**
 * Digital Filters Implementation
 * 
 * Provides:
 * - Low-pass filter
 * - High-pass filter
 * - Band-pass filter
 * - Band-stop (notch) filter
 * - Butterworth filter
 * - Moving average (for smoothing)
 * - Savitzky-Golay filter
 */

// ============================================
// Filter Types
// ============================================

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';

export interface FilterOptions {
  /** Cutoff frequency in Hz (or normalized 0-1) */
  cutoff: number;
  /** Second cutoff for bandpass/bandstop filters */
  cutoffHigh?: number;
  /** Sample rate in Hz (default: 1.0 for normalized) */
  sampleRate?: number;
  /** Filter order (default: 2) */
  order?: number;
}

export interface ButterworthOptions extends FilterOptions {
  /** Filter type */
  type: FilterType;
}

export interface SingleFrequencyFilterOptions {
  /** Frequency to remove in Hz */
  frequency: number;
  /** Sampling rate in Hz */
  sampleRate: number;
  /** Bandwidth of the notch in Hz (default: 1.0) */
  bandwidth?: number;
}

// ============================================
// Simple FIR Filters
// ============================================

/**
 * Apply a simple low-pass FIR filter
 */
export function lowPassFilter(
  data: Float32Array | Float64Array,
  cutoffHz: number,
  sampleRate: number,
  order: number = 5
): Float32Array {
  const normalized = cutoffHz / (sampleRate / 2);
  const coefficients = designFIRLowPass(Math.min(normalized, 0.99), order);
  return applyFIRFilter(data, coefficients);
}

/**
 * Apply a simple high-pass FIR filter
 */
export function highPassFilter(
  data: Float32Array | Float64Array,
  cutoffHz: number,
  sampleRate: number,
  order: number = 5
): Float32Array {
  const normalized = cutoffHz / (sampleRate / 2);
  const coefficients = designFIRHighPass(Math.min(normalized, 0.99), order);
  return applyFIRFilter(data, coefficients);
}

/**
 * Apply a band-pass FIR filter
 */
export function bandPassFilter(
  data: Float32Array | Float64Array,
  lowCutoffHz: number,
  highCutoffHz: number,
  sampleRate: number,
  order: number = 5
): Float32Array {
  const normLow = lowCutoffHz / (sampleRate / 2);
  const normHigh = highCutoffHz / (sampleRate / 2);
  const coefficients = designFIRBandPass(
    Math.max(normLow, 0.01), 
    Math.min(normHigh, 0.99), 
    order
  );
  return applyFIRFilter(data, coefficients);
}

/**
 * Apply a band-stop (notch) FIR filter
 */
export function bandStopFilter(
  data: Float32Array | Float64Array,
  lowCutoffHz: number,
  highCutoffHz: number,
  sampleRate: number,
  order: number = 5
): Float32Array {
  const normLow = lowCutoffHz / (sampleRate / 2);
  const normHigh = highCutoffHz / (sampleRate / 2);
  const coefficients = designFIRBandStop(
    Math.max(normLow, 0.01), 
    Math.min(normHigh, 0.99), 
    order
  );
  return applyFIRFilter(data, coefficients);
}

// ============================================
// FIR Filter Design (Windowed Sinc)
// ============================================

/**
 * Design FIR low-pass filter coefficients
 */
function designFIRLowPass(normalizedCutoff: number, order: number): Float32Array {
  const n = 2 * order + 1;
  const coeffs = new Float32Array(n);
  const fc = normalizedCutoff;
  
  for (let i = 0; i < n; i++) {
    const m = i - order;
    if (m === 0) {
      coeffs[i] = 2 * fc;
    } else {
      coeffs[i] = Math.sin(2 * Math.PI * fc * m) / (Math.PI * m);
    }
    // Apply Hamming window
    coeffs[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
  }
  
  // Normalize
  let sum = 0;
  for (let i = 0; i < n; i++) sum += coeffs[i];
  for (let i = 0; i < n; i++) coeffs[i] /= sum;
  
  return coeffs;
}

/**
 * Design FIR high-pass filter coefficients
 */
function designFIRHighPass(normalizedCutoff: number, order: number): Float32Array {
  const lowPass = designFIRLowPass(normalizedCutoff, order);
  const n = lowPass.length;
  const coeffs = new Float32Array(n);
  
  // Spectral inversion
  for (let i = 0; i < n; i++) {
    coeffs[i] = -lowPass[i];
  }
  coeffs[order] += 1;
  
  return coeffs;
}

/**
 * Design FIR band-pass filter coefficients
 */
function designFIRBandPass(
  normalizedLow: number, 
  normalizedHigh: number, 
  order: number
): Float32Array {
  const n = 2 * order + 1;
  const coeffs = new Float32Array(n);
  const fcLow = normalizedLow;
  const fcHigh = normalizedHigh;
  
  for (let i = 0; i < n; i++) {
    const m = i - order;
    if (m === 0) {
      coeffs[i] = 2 * (fcHigh - fcLow);
    } else {
      coeffs[i] = (Math.sin(2 * Math.PI * fcHigh * m) - Math.sin(2 * Math.PI * fcLow * m)) 
                  / (Math.PI * m);
    }
    // Apply Hamming window
    coeffs[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
  }
  
  return coeffs;
}

/**
 * Design FIR band-stop filter coefficients
 */
function designFIRBandStop(
  normalizedLow: number, 
  normalizedHigh: number, 
  order: number
): Float32Array {
  const bandPass = designFIRBandPass(normalizedLow, normalizedHigh, order);
  const n = bandPass.length;
  const coeffs = new Float32Array(n);
  
  // Spectral inversion
  for (let i = 0; i < n; i++) {
    coeffs[i] = -bandPass[i];
  }
  coeffs[order] += 1;
  
  return coeffs;
}

/**
 * Apply FIR filter to data
 */
function applyFIRFilter(data: Float32Array | Float64Array, coeffs: Float32Array): Float32Array {
  const n = data.length;
  const m = coeffs.length;
  const halfM = Math.floor(m / 2);
  const result = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < m; j++) {
      const idx = i - halfM + j;
      if (idx >= 0 && idx < n) {
        sum += data[idx] * coeffs[j];
      }
    }
    result[i] = sum;
  }
  
  return result;
}

// ============================================
// IIR Butterworth Filter
// ============================================

/**
 * Apply Butterworth filter (IIR)
 */
export function butterworth(
  data: Float32Array | Float64Array,
  options: ButterworthOptions
): Float32Array {
  const { type, cutoff, cutoffHigh, sampleRate = 1.0, order = 2 } = options;
  const wc = (2 * cutoff) / sampleRate; // Normalized frequency (0-1)
  const wc2 = cutoffHigh ? (2 * cutoffHigh) / sampleRate : undefined;
  
  // Design filter coefficients
  const { b, a } = designButterworth(type, wc, wc2, order);
  
  // Apply filter (forward-backward for zero phase)
  return filtfilt(data, b, a);
}

/**
 * Apply a single frequency notch filter to remove periodic noise.
 * Implementing a 2nd order IIR notch filter.
 */
export function singleFrequencyFilter(
  data: Float32Array | Float64Array,
  options: SingleFrequencyFilterOptions
): Float32Array {
  const { frequency, sampleRate, bandwidth = 1.0 } = options;
  const { b, a } = designNotchFilter(frequency, sampleRate, bandwidth);
  
  // Apply zero-phase filtering
  return filtfilt(data, b, a);
}

/**
 * Design 2nd order IIR Notch Filter coefficients.
 * H(z) = (1 - 2*cos(w0)*z^-1 + z^-2) / (1 - 2*r*cos(w0)*z^-1 + r^2*z^-2)
 */
function designNotchFilter(
  frequency: number,
  sampleRate: number,
  bandwidth: number
): { b: number[]; a: number[] } {
  const w0 = (2 * Math.PI * frequency) / sampleRate;
  const bw = (2 * Math.PI * bandwidth) / sampleRate;
  
  // r is the pole radius, related to bandwidth
  const r = 1 - (bw / 2);
  
  const cosW0 = Math.cos(w0);
  
  const b = [1, -2 * cosW0, 1];
  const a = [1, -2 * r * cosW0, r * r];
  
  return { b, a };
}

/**
 * Design Butterworth filter coefficients
 */
function designButterworth(
  type: FilterType,
  wc: number,
  wc2: number | undefined,
  order: number
): { b: number[]; a: number[] } {
  // Pre-warp for bilinear transform
  const wa = Math.tan(Math.PI * wc / 2);
  
  // Simple 2nd order Butterworth for now
  // Extended implementation would support higher orders
  const effectiveOrder = Math.min(order, 4);
  
  if (type === 'lowpass') {
    return butterLowPass(wa, effectiveOrder);
  } else if (type === 'highpass') {
    return butterHighPass(wa, effectiveOrder);
  } else if (type === 'bandpass' && wc2) {
    const wa2 = Math.tan(Math.PI * wc2 / 2);
    return butterBandPass(wa, wa2, effectiveOrder);
  } else if (type === 'bandstop' && wc2) {
    const wa2 = Math.tan(Math.PI * wc2 / 2);
    return butterBandStop(wa, wa2, effectiveOrder);
  }
  
  // Default to lowpass
  return butterLowPass(wa, effectiveOrder);
}

/**
 * 2nd order Butterworth low-pass coefficients
 */
function butterLowPass(wa: number, _order: number): { b: number[]; a: number[] } {
  const k = wa;
  const k2 = k * k;
  const sqrt2 = Math.sqrt(2);
  
  const norm = 1 / (1 + sqrt2 * k + k2);
  
  return {
    b: [k2 * norm, 2 * k2 * norm, k2 * norm],
    a: [1, 2 * (k2 - 1) * norm, (1 - sqrt2 * k + k2) * norm],
  };
}

/**
 * 2nd order Butterworth high-pass coefficients
 */
function butterHighPass(wa: number, _order: number): { b: number[]; a: number[] } {
  const k = wa;
  const k2 = k * k;
  const sqrt2 = Math.sqrt(2);
  
  const norm = 1 / (1 + sqrt2 * k + k2);
  
  return {
    b: [norm, -2 * norm, norm],
    a: [1, 2 * (k2 - 1) * norm, (1 - sqrt2 * k + k2) * norm],
  };
}

/**
 * 2nd order Butterworth band-pass coefficients
 */
function butterBandPass(waLow: number, waHigh: number, _order: number): { b: number[]; a: number[] } {
  const w0 = Math.sqrt(waLow * waHigh);
  const bw = waHigh - waLow;
  const q = w0 / bw;
  
  const norm = 1 / (1 + w0 / q + w0 * w0);
  
  return {
    b: [w0 / q * norm, 0, -w0 / q * norm],
    a: [1, 2 * (w0 * w0 - 1) * norm, (1 - w0 / q + w0 * w0) * norm],
  };
}

/**
 * 2nd order Butterworth band-stop coefficients
 */
function butterBandStop(waLow: number, waHigh: number, _order: number): { b: number[]; a: number[] } {
  const w0 = Math.sqrt(waLow * waHigh);
  const bw = waHigh - waLow;
  const q = w0 / bw;
  
  const norm = 1 / (1 + w0 / q + w0 * w0);
  
  return {
    b: [(1 + w0 * w0) * norm, 2 * (w0 * w0 - 1) * norm, (1 + w0 * w0) * norm],
    a: [1, 2 * (w0 * w0 - 1) * norm, (1 - w0 / q + w0 * w0) * norm],
  };
}

/**
 * Apply IIR filter (single direction)
 */
function iirFilter(data: Float32Array | Float64Array, b: number[], a: number[]): Float32Array {
  const n = data.length;
  const result = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    result[i] = b[0] * data[i];
    
    for (let j = 1; j < b.length; j++) {
      if (i - j >= 0) {
        result[i] += b[j] * data[i - j];
        result[i] -= a[j] * result[i - j];
      }
    }
  }
  
  return result;
}

/**
 * Forward-backward filtering for zero-phase response
 */
function filtfilt(data: Float32Array | Float64Array, b: number[], a: number[]): Float32Array {
  // Forward pass
  const forward = iirFilter(data, b, a);
  
  // Reverse
  const reversed = new Float32Array(forward.length);
  for (let i = 0; i < forward.length; i++) {
    reversed[i] = forward[forward.length - 1 - i];
  }
  
  // Backward pass
  const backward = iirFilter(reversed, b, a);
  
  // Reverse again
  const result = new Float32Array(backward.length);
  for (let i = 0; i < backward.length; i++) {
    result[i] = backward[backward.length - 1 - i];
  }
  
  return result;
}

// ============================================
// Smoothing Filters
// ============================================

/**
 * Exponential moving average filter
 */
export function exponentialMovingAverage(
  data: Float32Array | Float64Array,
  alpha: number = 0.3
): Float32Array {
  const n = data.length;
  const result = new Float32Array(n);
  
  result[0] = data[0];
  for (let i = 1; i < n; i++) {
    result[i] = alpha * data[i] + (1 - alpha) * result[i - 1];
  }
  
  return result;
}

/**
 * Gaussian smoothing filter
 */
export function gaussianSmooth(
  data: Float32Array | Float64Array,
  sigma: number = 2
): Float32Array {
  const n = data.length;
  const result = new Float32Array(n);
  
  // Generate Gaussian kernel
  const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
  const halfKernel = Math.floor(kernelSize / 2);
  const kernel = new Float32Array(kernelSize);
  
  let sum = 0;
  for (let i = 0; i < kernelSize; i++) {
    const x = i - halfKernel;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  
  // Normalize
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }
  
  // Convolve
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let j = 0; j < kernelSize; j++) {
      const idx = i - halfKernel + j;
      if (idx >= 0 && idx < n) {
        acc += data[idx] * kernel[j];
      }
    }
    result[i] = acc;
  }
  
  return result;
}

/**
 * Savitzky-Golay smoothing filter
 */
export function savitzkyGolay(
  data: Float32Array | Float64Array,
  windowSize: number = 5,
  polynomialOrder: number = 2
): Float32Array {
  const n = data.length;
  const result = new Float32Array(n);
  const halfWindow = Math.floor(windowSize / 2);
  
  // Pre-compute coefficients for polynomial fitting
  const coeffs = computeSGCoefficients(windowSize, polynomialOrder);
  
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < n) {
        sum += data[idx] * coeffs[j + halfWindow];
      } else if (idx < 0) {
        sum += data[0] * coeffs[j + halfWindow];
      } else {
        sum += data[n - 1] * coeffs[j + halfWindow];
      }
    }
    result[i] = sum;
  }
  
  return result;
}

/**
 * Compute Savitzky-Golay coefficients
 */
function computeSGCoefficients(windowSize: number, _order: number): Float32Array {
  const halfWindow = Math.floor(windowSize / 2);
  const coeffs = new Float32Array(windowSize);
  
  // Simple approximation for smoothing (order 0)
  // For full SG, would need matrix inversion
  const weight = 1 / windowSize;
  for (let i = 0; i < windowSize; i++) {
    // Quadratic weighting for better smoothing
    const x = i - halfWindow;
    coeffs[i] = weight * (1 - (x * x) / ((halfWindow + 1) * (halfWindow + 1)));
  }
  
  // Normalize
  let sum = 0;
  for (let i = 0; i < windowSize; i++) sum += coeffs[i];
  for (let i = 0; i < windowSize; i++) coeffs[i] /= sum;
  
  return coeffs;
}

// ============================================
// Median Filter
// ============================================

/**
 * Median filter (good for spike removal)
 */
export function medianFilter(
  data: Float32Array | Float64Array,
  windowSize: number = 5
): Float32Array {
  const n = data.length;
  const result = new Float32Array(n);
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < n; i++) {
    const window: number[] = [];
    
    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < n) {
        window.push(data[idx]);
      }
    }
    
    window.sort((a, b) => a - b);
    result[i] = window[Math.floor(window.length / 2)];
  }
  
  return result;
}
