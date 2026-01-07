# Scientific Analysis (FFT & Filters)

<ChartDemo type="analysis" height="450px" />

SciChart Engine provides a powerful suite of scientific analysis tools for signal processing, frequency analysis, and statistical evaluation.

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
