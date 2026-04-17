# Advanced Scientific Analysis

Sci Plot includes a comprehensive set of mathematical functions for professional scientific analysis. All functions are optimized for large datasets and are available directly from the chart instance.

<script setup>
import AdvancedMathDemo from '../.vitepress/theme/demos/2d/AdvancedMathDemo.vue'
</script>

## Interactive Demo

Experiment with real-time analysis functions:

<AdvancedMathDemo />

---

## Available Functions

### 📈 Savitzky-Golay (Smart Smoothing)

The Savitzky-Golay filter fits a local polynomial to a window of points, removing noise while preserving the shape, width, and height of peaks.

```typescript
import { PluginAnalysis } from 'sci-plot';

// Using the analysis plugin
const analysis = chart.getPluginAPI('sci-plot-analysis');
const smoothed = analysis.savitzkyGolay(rawSignal, 11, 3);
```

**Parameters:**
- `data`: Data array to smooth.
- `windowSize`: Window size (must be odd).
- `polynomialOrder`: Polynomial order (typically 2-4).

---

### 📉 Baseline Correction

Eliminates linear drift or signal shifts to isolate true peaks.

```typescript
import { subtractBaseline } from 'sci-plot';

// Subtract linear baseline between x=0 and x=10
const corrected = subtractBaseline(x, y, 0, 10);
```

**Typical Use:**
- Electrochemical signals with capacitive drift.
- Spectra with background tilt.
- Chromatograms with varying baseline.

---

### 🎯 Peak Detection

Automatically detects local peaks with prominence filtering.

```typescript
const peaks = chart.analysis.detectPeaks(x, y, {
  minProminence: 0.5,  // Minimum prominence
  type: 'max'          // 'max', 'min', or 'both'
});

// Result
peaks.forEach(peak => {
  console.log(`Peak at x=${peak.x}, y=${peak.y}, prominence=${peak.prominence}`);
});
```

**Options:**
- `minProminence`: Minimum height relative to neighboring valleys.
- `type`: Type of extrema to detect.

---

### ∫ Numerical Integration

Calculates the area under the curve using the trapezoidal rule.

```typescript
// Total Area
const totalArea = chart.analysis.integrate(x, y);

// Area in specific range
const partialArea = chart.analysis.integrate(x, y, { xMin: 2, xMax: 5 });
```

**Applications:**
- Total charge (Q = ∫I dt) in electrochemistry.
- Concentration in chromatography.
- Energy in power signals.

---

### 📐 Numerical Derivatives

Calculates the first or second derivative of the data.

```typescript
// First derivative
const dy = chart.analysis.derivative(x, y, 1);

// Second derivative with prior smoothing
const d2y = chart.analysis.derivative(x, y, 2, 5);
```

**Uses:**
- Finding inflection points.
- Detecting slope changes.
- Titration analysis.

---

### 🔍 LTTB Downsampling

Reduces the number of points while preserving visual shape (Largest-Triangle-Three-Buckets).

```typescript
// Reduce 100,000 points to 1,000
const downsampled = chart.analysis.downsampleLTTB(x, y, 1000);

chart.addSeries({
  id: 'optimized',
  type: 'line',
  data: downsampled
});
```

**Benefits:**
- Extreme performance with large datasets.
- Preserves peaks and valleys (unlike averaging).
- Identical visualization with 100x fewer points.

---

### 📏 Delta Tool (Measurement Tool)

Measures distances, deltas, and slopes between two points on the chart.

```typescript
// Enable Delta Tool (auto-loaded)
chart.setMode('delta');

// Listen for measurements
chart.on('measure', (measurement) => {
  console.log(`ΔX: ${measurement.deltaX}`);
  console.log(`ΔY: ${measurement.deltaY}`);
  console.log(`Slope: ${measurement.slope}`);
});
```

---

## FFT and Digital Filters

### Fourier Transform

```typescript
// Calculate frequency spectrum
const spectrum = chart.analysis.fft(timeDomainData);
console.log(spectrum.magnitude); // Amplitude
console.log(spectrum.phase);     // Phase

// Inverse transform
const reconstructed = chart.analysis.ifft(spectrum);
```

### FIR Filters

```typescript
// Low-pass filter at 100 Hz with sample rate 1000 Hz
const filtered = chart.analysis.lowPassFilter(data, 100, 1000);

// High-pass filter
const highPassed = chart.analysis.highPassFilter(data, 50, 1000);

// Band-pass filter
const bandPassed = chart.analysis.bandPassFilter(data, 50, 200, 1000);
```

### Butterworth Filter

```typescript
// Order 4 Butterworth with cutoff frequency 0.1 (normalized)
const filtered = chart.analysis.butterworth(data, 4, 0.1);
```

---

## Financial Indicators

```typescript
// Simple Moving Average (20 periods)
const ma20 = chart.analysis.sma(closeData, 20);

// Exponential Moving Average
const ema12 = chart.analysis.ema(closeData, 12);

// MACD
const macdResult = chart.analysis.macd(closeData, 12, 26, 9);

// RSI
const rsiValues = chart.analysis.rsi(closeData, 14);

// Bollinger Bands
const bands = chart.analysis.bollingerBands(closeData, 20, 2);
```

---

## Statistics and Anomaly Detection

```typescript
// Cross-correlation between two signals
const correlation = chart.analysis.crossCorrelation(signal1, signal2);

// Anomaly detection with Z-score
const anomalies = chart.analysis.detectAnomalies(data, {
  method: 'zscore',
  threshold: 3
});

// Two-sample T-test
const result = chart.analysis.tTest(sample1, sample2);
console.log(`p-value: ${result.pValue}, significant: ${result.significant}`);
```

---

## Accessing from the Chart

Most analysis functions are available directly via the `PluginAnalysis` (auto-loaded in ChartCore):

```typescript
const chart = createChart({ container });

// Access analysis via plugin API
const analysis = chart.getPluginAPI('sci-plot-analysis');

analysis.savitzkyGolay(data, 11, 3);
analysis.fft(signal);
analysis.sma(prices, 20);
```

This ensures you can perform complex analysis without additional imports, with direct access to chart features.
