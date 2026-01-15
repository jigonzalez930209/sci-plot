# Scientific Analysis (FFT & Filters)

<AnalysisAdvancedChart height="500px" />

SciChart Engine provides a powerful suite of scientific analysis tools for signal processing, frequency analysis, and statistical evaluation.

::: tip Plugin Required
While these functions are available as standalone utilities, the `PluginAnalysis` provides integrated access via `chart.analysis`.
:::

## Spectral Analysis (FFT)

The `analysis` module includes a high-performance FFT (Fast Fourier Transform) implementation.

### Compute Spectrum
```typescript
import { analyzeSpectrum } from 'scichart-engine';

const data = new Float32Array([/* ... signal ... */]);
const sampleRate = 1000; // 1kHz

const result = analyzeSpectrum(data, sampleRate);

console.log(result.frequency); // Frequency bins in Hz
console.log(result.magnitude); // Magnitude spectrum
```

### Power Spectrum (dB)
```typescript
import { powerSpectrum } from 'scichart-engine';

const ps = powerSpectrum(data, sampleRate);
// Plot ps.frequency vs ps.powerDb for an industry-standard PSD plot
```

### Dominant Frequency
```typescript
import { dominantFrequency } from 'scichart-engine';

const { frequency, magnitude } = dominantFrequency(data, sampleRate);
console.log(`Peak at ${frequency} Hz with amplitude ${magnitude}`);
```

### Windowing Functions
Apply windows to reduce spectral leakage before FFT:
- `hanningWindow(data)`
- `hammingWindow(data)`
- `blackmanWindow(data)`

### Complex FFT (Real & Imaginary Parts)

For advanced signal processing, you can access the full complex spectrum with separate real and imaginary components:

```typescript
import { analyzeComplexSpectrum, type ComplexFFTResult } from 'scichart-engine';

const signal = new Float32Array([/* ... */]);
const sampleRate = 1000;

const result: ComplexFFTResult = analyzeComplexSpectrum(signal, sampleRate);

console.log(result.real);      // Float32Array - Real part of spectrum
console.log(result.imag);      // Float32Array - Imaginary part of spectrum
console.log(result.magnitude); // Float32Array - |Z| = sqrt(real² + imag²)
console.log(result.phase);     // Float32Array - atan2(imag, real)
console.log(result.frequency); // Float32Array - Frequency bins
console.log(result.length);    // Spectrum length (power of 2)
console.log(result.nyquist);   // Nyquist index (length / 2)
```

### FFT from Complex Input

Process complex signals (e.g., I/Q data, previous FFT results):

```typescript
import { fftFromComplexInput } from 'scichart-engine';

// Separate real and imaginary arrays
const realPart = new Float32Array([1, 0, -1, 0, 1, 0, -1, 0]);
const imagPart = new Float32Array([0, 1, 0, -1, 0, 1, 0, -1]);

const result = fftFromComplexInput(realPart, imagPart);
// result.real, result.imag contain the FFT of the complex input
```

### Utility Functions

```typescript
import { 
  complexToArrays, 
  arraysToComplex, 
  ifftFromArrays,
  ifftComplex,
  getPositiveFrequencies 
} from 'scichart-engine';

// Convert Complex[] to separate arrays
const { real, imag } = complexToArrays(spectrum.complex);

// Convert arrays back to Complex[]
const complex = arraysToComplex(real, imag);

// Inverse FFT from arrays (returns real part)
const reconstructed = ifftFromArrays(real, imag);

// Inverse FFT with complex output
const { real: outReal, imag: outImag } = ifftComplex(complex);

// Get only positive frequencies (up to Nyquist)
const positive = getPositiveFrequencies(complexResult);
```

## Digital Filtering

Standard FIR and IIR filters for noise reduction and feature extraction.

### Low-pass / High-pass / Band-pass
```typescript
import { lowPassFilter, butterworth } from 'scichart-engine';

// Simple FIR Low-pass
const smoothed = lowPassFilter(data, 50, 1000); // 50Hz cutoff

// Professional IIR Butterworth (Zero-phase)
const filtered = butterworth(data, {
  type: 'lowpass',
  cutoff: 50,
  sampleRate: 1000,
  order: 4
});

// Single Frequency Notch Filter (Remove specific interference like 50Hz/60Hz)
const cleaned = singleFrequencyFilter(data, {
  frequency: 50,
  sampleRate: 1000,
  bandwidth: 2 // 2Hz width
});
```

### Smoothing Filters
- **EMA**: `exponentialMovingAverage(data, alpha)`
- **Gaussian**: `gaussianSmooth(data, sigma)` - Great for visual smoothness.
- **Savitzky-Golay**: `savitzkyGolay(data, windowSize, order)` - Preserves peaks better than moving average.
- **Median Filter**: `medianFilter(data, windowSize)` - Specifically for removing "spike" noise (outliers).

## Statistical Tools

### Anomaly Detection
Detect outliers or unusual patterns in real-time.

```typescript
import { detectAnomalies } from 'scichart-engine';

const result = detectAnomalies(data, {
  method: 'zscore', // or 'mad', 'iqr', 'isolation'
  threshold: 3
});

console.log('Outlier indices:', result.indices);
```

### Correlation
Find similarities between signals or lag times.

```typescript
import { crossCorrelation } from 'scichart-engine';

const corr = crossCorrelation(signal1, signal2);
console.log(`Signals align at lag: ${corr.lagAtMax}`);
```

### Numerical Integration
Calculate area under the curve.

```typescript
import { trapezoidalIntegration, simpsonsIntegration } from 'scichart-engine';

const area = trapezoidalIntegration(yData, xData);
const refinedArea = simpsonsIntegration(yData, 0.1); // For uniform spacing
```

### Statistical Tests
Compare datasets for scientific significance.

```typescript
import { tTest } from 'scichart-engine';

const result = tTest(groupA, groupB);
if (result.significant) {
  console.log(`p-value: ${result.pValue}`);
}
```

## Advanced Usage

### Real-time Filtering
You can combine these with data appending for a real-time reactive chart:

```typescript
chart.on('dataUpdate', (newPoints) => {
  const filtered = butterworth(newPoints, { type: 'lowpass', cutoff: 10 });
  // update display...
});
```
