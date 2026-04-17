# Scientific Analysis Guide

Sci Plot is more than just a renderer; it includes a suite of high-performance tools for scientific and engineering data analysis. These features are provided by the **PluginAnalysis** module.

## Getting Started

To use the analysis features, you must load the `PluginAnalysis` plugin.

```typescript
import { createChart } from 'velo-plot';
import { PluginAnalysis } from 'velo-plot/plugins';

const chart = createChart({ container });

// Enable analysis capabilities
await chart.use(PluginAnalysis());

// The analysis methods are now available on the chart instance
const analysis = chart.analysis;
```
## Core Modules

Analysis tools are divided into four main categories:

| Module | Features | Best For |
|--------|----------|----------|
| **Spectral** | FFT, Windowing, Power Spectrum | Signal processing, Vibration analysis |
| **Filters** | LowPass, HighPass, EMA, Median | Noise reduction, Baseline smoothing |
| **Statistical** | Correlation, Anomaly Detection | Pattern matching, QC monitoring |
| **Geometry** | Integration, Fitting, Derivatives | Quantification, Trend modeling |

## Signal Smoothing

The most common task is removing noise from experimental data. The **Savitzky-Golay** filter is highly recommended for scientific data as it preserves peak heights better than moving averages.

```typescript
import { createChart } from 'velo-plot';

const chart = createChart({ container });
const analysis = chart.analysis;

// Smooth a noisy signal using 15-point window and 3rd order polynomial
const smoothedY = analysis.savitzkyGolay(noisyY, 15, 3);

chart.addSeries({
  id: 'smoothed',
  data: { x, y: smoothedY },
  style: { color: '#00f2ff', width: 2 }
});
```

## Frequency Analysis (FFT)

Transform time-domain data into frequency-domain to identify dominant frequencies.

```typescript
const analysis = chart.analysis;

// 1. Calculate FFT
const spectrum = analysis.fft(timeData);

// 2. Get Magnitude for visualization
const power = spectrum.magnitude;

chart.addSeries({
  id: 'spectrum',
  type: 'line',
  data: { x: frequencies, y: power }
});
```

## Automatic Curve Fitting

The engine can automatically calculate and display regression lines (Linear, Polynomial, Exponential, Power).

```typescript
// Add a 2nd order polynomial fit line to an existing series
chart.addFitLine('sensor-1', {
  order: 2,
  color: '#ff00ff',
  width: 2,
  showEquation: true
});
```

## Numerical Integration

Calculates the area under a curve, essential for techniques like chromatography or cyclic voltammetry ($Q = \int I dt$).

```typescript
const analysis = chart.analysis;

// Calculate area under the entire curve
const totalArea = analysis.integrate(x, y);

// Calculate area between two X values
const peakArea = analysis.integrate(x, y, { xMin: 2.5, xMax: 4.0 });

console.log(`Peak Area: ${peakArea.toFixed(4)} units²`);
```

## Integrated Workflow Example

Most scientific applications follow this pipeline:

1. **Acqusition**: Collect raw data.
2. **Preprocessing**: Apply `savitzkyGolay`.
3. **Analysis**: Run `detectPeaks` or `addFitLine`.
4. **Visualization**: Add data to `Chart` and highlight results.

```typescript
const analysis = chart.analysis;

// Process
const filteredY = analysis.lowPassFilter(rawY, sampleRate, 10);
const peaks = analysis.detectPeaks(x, filteredY, { minProminence: 0.5 });

// Render
chart.addSeries({ id: 'signal', data: { x, y: filteredY } });

// Annotate result
peaks.forEach(peak => {
    chart.addAnnotation({
      type: 'text',
      x: peak.x,
      y: peak.y,
      text: `Peak: ${peak.y.toFixed(2)}`
    });
});
```

## Performance Note

All analysis functions are optimized for `Float32Array` or `Float64Array`. When processing long signals (>1M points), the engine uses vectorized operations and Web Workers where applicable to prevent UI stuttering.
