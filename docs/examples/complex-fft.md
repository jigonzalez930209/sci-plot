---
title: Complex FFT Analysis
description: Interactive example demonstrating complex Fourier Transform with real and imaginary components.
---

# Complex FFT Analysis

The Complex FFT API provides full access to the **real and imaginary parts** of the Fourier Transform, enabling advanced signal processing applications.

## Interactive Demo

<ComplexFFTDemo height="450px" />

## Understanding the Demo

### View Modes

| Mode | Description |
|------|-------------|
| **Re/Im** | Shows the real (cyan) and imaginary (orange) parts of the FFT spectrum |
| **\|Z\|** | Shows the magnitude spectrum: `√(real² + imag²)` |
| **∠φ** | Shows the phase spectrum: `atan2(imag, real)` in radians |
| **IFFT** | Demonstrates perfect reconstruction via inverse FFT |

### Signal Types

| Signal | Formula | FFT Behavior |
|--------|---------|--------------|
| **sin(ωt)** | `sin(2πft)` | Pure imaginary peaks at ±f |
| **cos(ωt)** | `cos(2πft)` | Pure real peaks at ±f |
| **e^(jωt)** | `cos(ωt) + j·sin(ωt)` | Single peak at +f only (complex exponential) |
| **δ(t)** | Impulse at t=0 | Flat spectrum (white noise in frequency) |

### Key Observations

1. **Sine wave**: The FFT has only imaginary components because `sin(ωt) = (e^jωt - e^-jωt) / 2j`
2. **Cosine wave**: The FFT has only real components because `cos(ωt) = (e^jωt + e^-jωt) / 2`  
3. **Complex exponential**: Shows only positive frequency (no negative frequency component)
4. **Impulse**: Equal energy at all frequencies (constant magnitude)

---

## API Usage

### Basic Complex FFT

```typescript
import { analyzeComplexSpectrum } from 'scichart-engine';

const signal = new Float32Array(1024);
// Fill with data...

const result = analyzeComplexSpectrum(signal, sampleRate);

// Access real and imaginary parts directly
const realPart = result.real;  // Float32Array
const imagPart = result.imag;  // Float32Array

// Also available:
console.log(result.magnitude); // |Z| = sqrt(real² + imag²)
console.log(result.phase);     // atan2(imag, real)
console.log(result.frequency); // Frequency bins
console.log(result.nyquist);   // Nyquist frequency index
```

### FFT of Complex Input (I/Q Data)

For complex signals like I/Q from SDR (Software Defined Radio):

```typescript
import { fftFromComplexInput } from 'scichart-engine';

// I/Q data from radio receiver
const inPhase = new Float32Array([...]);     // I component
const quadrature = new Float32Array([...]);  // Q component

const result = fftFromComplexInput(inPhase, quadrature);

// Full complex spectrum
console.log(result.real);  // Real part of FFT
console.log(result.imag);  // Imaginary part of FFT
```

### Inverse FFT with Complex Output

```typescript
import { ifftComplex, arraysToComplex } from 'scichart-engine';

// After manipulating spectrum...
const complex = arraysToComplex(modifiedReal, modifiedImag);
const { real, imag } = ifftComplex(complex);

// 'real' and 'imag' contain the reconstructed time-domain signal
```

### Positive Frequencies Only

```typescript
import { analyzeComplexSpectrum, getPositiveFrequencies } from 'scichart-engine';

const fullSpectrum = analyzeComplexSpectrum(data, sampleRate);
const positive = getPositiveFrequencies(fullSpectrum);

// Only frequencies from 0 to Nyquist
console.log(positive.frequency); // [0, df, 2df, ... Nyquist]
console.log(positive.real);
console.log(positive.imag);
```

---

## Practical Applications

### 1. Phase Shift Detection

```typescript
// Compare phase between two signals
const spec1 = analyzeComplexSpectrum(signal1, sr);
const spec2 = analyzeComplexSpectrum(signal2, sr);

// Phase difference at a specific frequency
const freqIndex = Math.round(targetFreq / (sr / spec1.length));
const phaseDiff = spec2.phase[freqIndex] - spec1.phase[freqIndex];
console.log(`Phase shift: ${phaseDiff * 180 / Math.PI} degrees`);
```

### 2. Frequency-Domain Filtering

```typescript
// Remove specific frequency bands
const spec = analyzeComplexSpectrum(signal, sampleRate);
const real = new Float32Array(spec.real);
const imag = new Float32Array(spec.imag);

// Zero out frequencies above 100 Hz
const cutoffBin = Math.round(100 * spec.length / sampleRate);
for (let i = cutoffBin; i < spec.nyquist; i++) {
  real[i] = 0;
  imag[i] = 0;
  // Mirror for negative frequencies
  real[spec.length - i] = 0;
  imag[spec.length - i] = 0;
}

// Reconstruct
const filtered = ifftFromArrays(real, imag);
```

### 3. Complex Demodulation

```typescript
// AM demodulation: multiply by carrier and low-pass
const carrier = new Float32Array(N);
for (let i = 0; i < N; i++) {
  carrier[i] = Math.cos(2 * Math.PI * carrierFreq * i / sampleRate);
}

// Multiply in time domain = convolve in frequency domain
const demod = new Float32Array(N);
for (let i = 0; i < N; i++) {
  demod[i] = signal[i] * carrier[i];
}

const spec = analyzeComplexSpectrum(demod, sampleRate);
// Low-pass to extract baseband...
```

---

## Mathematical Background

The Discrete Fourier Transform (DFT) of a signal x[n] is:

$$X[k] = \sum_{n=0}^{N-1} x[n] \cdot e^{-j2\pi kn/N}$$

Which expands to:

$$X[k] = \sum_{n=0}^{N-1} x[n] \cdot [\cos(2\pi kn/N) - j\sin(2\pi kn/N)]$$

The result is complex:
- **Real part**: `X[k].re = Σ x[n]·cos(2πkn/N)`
- **Imaginary part**: `X[k].im = -Σ x[n]·sin(2πkn/N)`

### Symmetry Properties (for real input)

| Property | Description |
|----------|-------------|
| `X[N-k] = X[k]*` | Complex conjugate symmetry |
| `Re(X[k]) = Re(X[N-k])` | Real part is even |
| `Im(X[k]) = -Im(X[N-k])` | Imaginary part is odd |

This is why we typically only show positive frequencies (0 to N/2).
