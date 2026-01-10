/**
 * Fast Fourier Transform (FFT) Implementation
 * 
 * Provides:
 * - FFT for spectral analysis
 * - Inverse FFT
 * - Power spectrum
 * - Frequency bins calculation
 */

// ============================================
// Complex Number Type
// ============================================

/** Complex number representation */
export interface Complex {
  re: number;
  im: number;
}

/** FFT Result */
export interface FFTResult {
  /** Frequency bins in Hz (if sample rate provided) or normalized */
  frequency: Float32Array;
  /** Magnitude spectrum */
  magnitude: Float32Array;
  /** Phase spectrum in radians */
  phase: Float32Array;
  /** Full complex spectrum as Complex[] array */
  complex: Complex[];
  /** Real part of full spectrum as Float32Array */
  real: Float32Array;
  /** Imaginary part of full spectrum as Float32Array */
  imag: Float32Array;
}

/** Complex FFT Result - full spectrum with separate real/imag arrays */
export interface ComplexFFTResult {
  /** Real part of spectrum */
  real: Float32Array;
  /** Imaginary part of spectrum */
  imag: Float32Array;
  /** Frequency bins in Hz (if sample rate provided) */
  frequency: Float32Array;
  /** Magnitude spectrum (sqrt(real² + imag²)) */
  magnitude: Float32Array;
  /** Phase spectrum in radians (atan2(imag, real)) */
  phase: Float32Array;
  /** Original spectrum length (power of 2) */
  length: number;
  /** Nyquist index (length / 2) */
  nyquist: number;
}

/** Power spectrum result */
export interface PowerSpectrumResult {
  /** Frequency bins */
  frequency: Float32Array;
  /** Power values (magnitude squared) */
  power: Float32Array;
  /** Power in dB */
  powerDb: Float32Array;
}

// ============================================
// FFT Implementation (Cooley-Tukey)
// ============================================

/**
 * Compute FFT using Cooley-Tukey algorithm
 * Input length must be a power of 2
 */
export function fft(input: Float32Array | Float64Array | number[]): Complex[] {
  const n = input.length;

  // Pad to power of 2 if necessary
  const paddedLength = nextPowerOf2(n);
  const padded = new Float64Array(paddedLength);
  for (let i = 0; i < n; i++) {
    padded[i] = input[i];
  }

  // Convert to complex
  const data: Complex[] = new Array(paddedLength);
  for (let i = 0; i < paddedLength; i++) {
    data[i] = { re: padded[i], im: 0 };
  }

  // Bit-reversal permutation
  bitReversePermutation(data);

  // Cooley-Tukey iterative FFT
  for (let size = 2; size <= paddedLength; size *= 2) {
    const halfSize = size / 2;
    const angle = -2 * Math.PI / size;

    for (let i = 0; i < paddedLength; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const theta = angle * j;
        const wRe = Math.cos(theta);
        const wIm = Math.sin(theta);

        const evenIdx = i + j;
        const oddIdx = i + j + halfSize;

        const tRe = wRe * data[oddIdx].re - wIm * data[oddIdx].im;
        const tIm = wRe * data[oddIdx].im + wIm * data[oddIdx].re;

        data[oddIdx].re = data[evenIdx].re - tRe;
        data[oddIdx].im = data[evenIdx].im - tIm;
        data[evenIdx].re = data[evenIdx].re + tRe;
        data[evenIdx].im = data[evenIdx].im + tIm;
      }
    }
  }

  return data;
}

/**
 * Compute inverse FFT
 */
export function ifft(spectrum: Complex[]): Float32Array {
  const n = spectrum.length;

  // Conjugate
  const conjugated = spectrum.map(c => ({ re: c.re, im: -c.im }));

  // Forward FFT
  const transformed = fftComplex(conjugated);

  // Conjugate and scale
  const result = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = transformed[i].re / n;
  }

  return result;
}

/**
 * FFT on complex input
 */
function fftComplex(input: Complex[]): Complex[] {
  const n = input.length;
  const data = input.map(c => ({ ...c }));

  bitReversePermutation(data);

  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const angle = -2 * Math.PI / size;

    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const theta = angle * j;
        const wRe = Math.cos(theta);
        const wIm = Math.sin(theta);

        const evenIdx = i + j;
        const oddIdx = i + j + halfSize;

        const tRe = wRe * data[oddIdx].re - wIm * data[oddIdx].im;
        const tIm = wRe * data[oddIdx].im + wIm * data[oddIdx].re;

        data[oddIdx].re = data[evenIdx].re - tRe;
        data[oddIdx].im = data[evenIdx].im - tIm;
        data[evenIdx].re = data[evenIdx].re + tRe;
        data[evenIdx].im = data[evenIdx].im + tIm;
      }
    }
  }

  return data;
}

/**
 * Bit-reversal permutation in-place
 */
function bitReversePermutation(data: Complex[]): void {
  const n = data.length;
  const bits = Math.log2(n);

  for (let i = 0; i < n; i++) {
    const reversed = reverseBits(i, bits);
    if (reversed > i) {
      const temp = data[i];
      data[i] = data[reversed];
      data[reversed] = temp;
    }
  }
}

/**
 * Reverse bits of a number
 */
function reverseBits(num: number, bits: number): number {
  let result = 0;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (num & 1);
    num >>= 1;
  }
  return result;
}

/**
 * Find next power of 2
 */
export function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// ============================================
// High-Level Analysis Functions
// ============================================

/**
 * Compute full FFT analysis with frequencies and magnitudes
 */
export function analyzeSpectrum(
  data: Float32Array | Float64Array | number[],
  sampleRate: number = 1.0
): FFTResult {
  const spectrum = fft(data);
  const n = spectrum.length;
  const nyquist = n / 2;

  const frequency = new Float32Array(nyquist);
  const magnitude = new Float32Array(nyquist);
  const phase = new Float32Array(nyquist);

  // Full spectrum real and imaginary parts
  const real = new Float32Array(n);
  const imag = new Float32Array(n);

  // Extract real and imaginary for full spectrum
  for (let i = 0; i < n; i++) {
    real[i] = spectrum[i].re;
    imag[i] = spectrum[i].im;
  }

  // Compute only positive frequencies (up to Nyquist)
  for (let i = 0; i < nyquist; i++) {
    frequency[i] = (i * sampleRate) / n;
    magnitude[i] = Math.sqrt(spectrum[i].re * spectrum[i].re + spectrum[i].im * spectrum[i].im) / n;
    phase[i] = Math.atan2(spectrum[i].im, spectrum[i].re);
  }

  // Normalize (except DC)
  for (let i = 1; i < nyquist; i++) {
    magnitude[i] *= 2;
  }

  return {
    frequency,
    magnitude,
    phase,
    complex: spectrum,
    real,
    imag,
  };
}

/**
 * Compute power spectrum
 */
export function powerSpectrum(
  data: Float32Array | Float64Array | number[],
  sampleRate: number = 1.0
): PowerSpectrumResult {
  const result = analyzeSpectrum(data, sampleRate);
  const n = result.frequency.length;

  const power = new Float32Array(n);
  const powerDb = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    power[i] = result.magnitude[i] * result.magnitude[i];
    powerDb[i] = 10 * Math.log10(Math.max(power[i], 1e-20));
  }

  return {
    frequency: result.frequency,
    power,
    powerDb,
  };
}

/**
 * Find dominant frequency in signal
 */
export function dominantFrequency(
  data: Float32Array | Float64Array | number[],
  sampleRate: number = 1.0,
  minFrequency: number = 0
): { frequency: number; magnitude: number } {
  const result = analyzeSpectrum(data, sampleRate);

  let maxMag = 0;
  let maxIdx = 0;

  for (let i = 0; i < result.magnitude.length; i++) {
    if (result.frequency[i] >= minFrequency && result.magnitude[i] > maxMag) {
      maxMag = result.magnitude[i];
      maxIdx = i;
    }
  }

  return {
    frequency: result.frequency[maxIdx],
    magnitude: maxMag,
  };
}

/**
 * Apply Hanning window to data
 */
export function hanningWindow(data: Float32Array | Float64Array): Float32Array {
  const n = data.length;
  const result = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
    result[i] = data[i] * window;
  }

  return result;
}

/**
 * Apply Hamming window to data
 */
export function hammingWindow(data: Float32Array | Float64Array): Float32Array {
  const n = data.length;
  const result = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
    result[i] = data[i] * window;
  }

  return result;
}

/**
 * Apply Blackman window to data
 */
export function blackmanWindow(data: Float32Array | Float64Array): Float32Array {
  const n = data.length;
  const result = new Float32Array(n);
  const a0 = 0.42;
  const a1 = 0.5;
  const a2 = 0.08;

  for (let i = 0; i < n; i++) {
    const window = a0 - a1 * Math.cos(2 * Math.PI * i / (n - 1))
      + a2 * Math.cos(4 * Math.PI * i / (n - 1));
    result[i] = data[i] * window;
  }

  return result;
}

// ============================================
// Complex FFT Functions
// ============================================

/**
 * Compute full complex FFT analysis with separate real and imaginary arrays
 * This is useful when you need direct access to real/imag components
 */
export function analyzeComplexSpectrum(
  data: Float32Array | Float64Array | number[],
  sampleRate: number = 1.0
): ComplexFFTResult {
  const spectrum = fft(data);
  const n = spectrum.length;
  const nyquist = n / 2;

  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  const frequency = new Float32Array(n);
  const magnitude = new Float32Array(n);
  const phase = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    real[i] = spectrum[i].re;
    imag[i] = spectrum[i].im;
    frequency[i] = (i * sampleRate) / n;
    magnitude[i] = Math.sqrt(spectrum[i].re * spectrum[i].re + spectrum[i].im * spectrum[i].im);
    phase[i] = Math.atan2(spectrum[i].im, spectrum[i].re);
  }

  return {
    real,
    imag,
    frequency,
    magnitude,
    phase,
    length: n,
    nyquist,
  };
}

/**
 * Compute FFT from complex input (real + imaginary arrays)
 * Useful for processing complex signals or chaining FFT operations
 */
export function fftFromComplexInput(
  real: Float32Array | Float64Array | number[],
  imag: Float32Array | Float64Array | number[]
): ComplexFFTResult {
  const n = real.length;
  if (imag.length !== n) {
    throw new Error('Real and imaginary arrays must have the same length');
  }

  const paddedLength = nextPowerOf2(n);
  const data: Complex[] = new Array(paddedLength);

  for (let i = 0; i < paddedLength; i++) {
    data[i] = {
      re: i < n ? real[i] : 0,
      im: i < n ? imag[i] : 0,
    };
  }

  // Use internal fftComplex
  bitReversePermutation(data);

  for (let size = 2; size <= paddedLength; size *= 2) {
    const halfSize = size / 2;
    const angle = -2 * Math.PI / size;

    for (let i = 0; i < paddedLength; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const theta = angle * j;
        const wRe = Math.cos(theta);
        const wIm = Math.sin(theta);

        const evenIdx = i + j;
        const oddIdx = i + j + halfSize;

        const tRe = wRe * data[oddIdx].re - wIm * data[oddIdx].im;
        const tIm = wRe * data[oddIdx].im + wIm * data[oddIdx].re;

        data[oddIdx].re = data[evenIdx].re - tRe;
        data[oddIdx].im = data[evenIdx].im - tIm;
        data[evenIdx].re = data[evenIdx].re + tRe;
        data[evenIdx].im = data[evenIdx].im + tIm;
      }
    }
  }

  const resultReal = new Float32Array(paddedLength);
  const resultImag = new Float32Array(paddedLength);
  const frequency = new Float32Array(paddedLength);
  const magnitude = new Float32Array(paddedLength);
  const phase = new Float32Array(paddedLength);

  for (let i = 0; i < paddedLength; i++) {
    resultReal[i] = data[i].re;
    resultImag[i] = data[i].im;
    frequency[i] = i / paddedLength; // Normalized frequency
    magnitude[i] = Math.sqrt(data[i].re * data[i].re + data[i].im * data[i].im);
    phase[i] = Math.atan2(data[i].im, data[i].re);
  }

  return {
    real: resultReal,
    imag: resultImag,
    frequency,
    magnitude,
    phase,
    length: paddedLength,
    nyquist: paddedLength / 2,
  };
}

/**
 * Convert Complex[] array to separate real and imaginary Float32Arrays
 */
export function complexToArrays(complex: Complex[]): { real: Float32Array; imag: Float32Array } {
  const n = complex.length;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    real[i] = complex[i].re;
    imag[i] = complex[i].im;
  }

  return { real, imag };
}

/**
 * Convert separate real and imaginary arrays to Complex[] array
 */
export function arraysToComplex(
  real: Float32Array | Float64Array | number[],
  imag: Float32Array | Float64Array | number[]
): Complex[] {
  const n = real.length;
  if (imag.length !== n) {
    throw new Error('Real and imaginary arrays must have the same length');
  }

  const result: Complex[] = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = { re: real[i], im: imag[i] };
  }

  return result;
}

/**
 * Compute inverse FFT from separate real and imaginary arrays
 * Returns the real part of the inverse transform
 */
export function ifftFromArrays(
  real: Float32Array | Float64Array | number[],
  imag: Float32Array | Float64Array | number[]
): Float32Array {
  const complex = arraysToComplex(real, imag);
  return ifft(complex);
}

/**
 * Compute inverse FFT returning complex result (both real and imaginary parts)
 */
export function ifftComplex(spectrum: Complex[]): { real: Float32Array; imag: Float32Array } {
  const n = spectrum.length;

  // Conjugate
  const conjugated = spectrum.map(c => ({ re: c.re, im: -c.im }));

  // Forward FFT on conjugated
  const data = conjugated.map(c => ({ ...c }));
  bitReversePermutation(data);

  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const angle = -2 * Math.PI / size;

    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const theta = angle * j;
        const wRe = Math.cos(theta);
        const wIm = Math.sin(theta);

        const evenIdx = i + j;
        const oddIdx = i + j + halfSize;

        const tRe = wRe * data[oddIdx].re - wIm * data[oddIdx].im;
        const tIm = wRe * data[oddIdx].im + wIm * data[oddIdx].re;

        data[oddIdx].re = data[evenIdx].re - tRe;
        data[oddIdx].im = data[evenIdx].im - tIm;
        data[evenIdx].re = data[evenIdx].re + tRe;
        data[evenIdx].im = data[evenIdx].im + tIm;
      }
    }
  }

  // Conjugate and scale
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    real[i] = data[i].re / n;
    imag[i] = -data[i].im / n;
  }

  return { real, imag };
}

/**
 * Get only positive frequencies (up to Nyquist) from complex spectrum
 */
export function getPositiveFrequencies(
  result: ComplexFFTResult
): { real: Float32Array; imag: Float32Array; frequency: Float32Array; magnitude: Float32Array; phase: Float32Array } {
  const nyquist = result.nyquist;

  return {
    real: result.real.slice(0, nyquist),
    imag: result.imag.slice(0, nyquist),
    frequency: result.frequency.slice(0, nyquist),
    magnitude: result.magnitude.slice(0, nyquist),
    phase: result.phase.slice(0, nyquist),
  };
}

