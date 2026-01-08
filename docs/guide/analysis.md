# Scientific Analysis Guide

SciChart Engine is more than just a renderer; it includes a suite of high-performance tools for scientific and engineering data analysis.

## Core Modules

Analysis tools are divided into four main categories:

| Module | Features | Best For |
|--------|----------|----------|
| **Spectral** | FFT, Windowing, Power Spectrum | Signal processing, Vibration analysis |
| **Filters** | LowPass, HighPass, EMA, Median | Noise reduction, Baseline smoothing |
| **Statistical** | Correlation, Anomaly Detection | Pattern matching, QC monitoring |
| **Geometry** | Integration, Fitting, Derivatives | Quantification, Trend modeling |

## Signal Smoothing

The most common task is removing noise from experimental data. For real-time data, the **Exponential Moving Average (EMA)** is highly recommended.

```typescript
import { exponentialMovingAverage } from 'scichart-engine/analysis'

// Smooth a noisy signal
const smoothedY = exponentialMovingAverage(noisyY, 0.2) // alpha=0.2

chart.addSeries({
  id: 'smoothed',
  data: { x, y: smoothedY },
  style: { color: '#00f2ff', width: 2 }
})
```

## Frequency Analysis (FFT)

Transform time-domain data into frequency-domain to identify dominant frequencies.

```typescript
import { fft, powerSpectrum } from 'scichart-engine/analysis'

// 1. Calculate FFT
const spectrum = fft(timeData)

// 2. Get Power Spectrum for visualization
const power = powerSpectrum(spectrum)

chart.addSeries({
  id: 'psd',
  type: 'line',
  data: { x: frequencies, y: power }
})
```

## Quantification with Integration

Calculate the area under a curve, essential for techniques like chromatography or cyclic voltammetry ($Q = \int I dt$).

```typescript
import { integrate } from 'scichart-engine/analysis'

// Calculate area between two cursors
const area = integrate(x, y, cursorMinX, cursorMaxX)

console.log(`Peak Area: ${area} units²`)
```

## Numerical Scaling & Prefixes

Scientific data often spans many orders of magnitude. The engine provides utilities to format these labels automatically.

```typescript
import { formatScientific, getBestPrefix } from 'scichart-engine/analysis'

// Format 0.00000123 as "1.23 µ"
const label = formatScientific(0.00000123, 'A') // "1.23 µA"
```

## Integrated Workflow Example

Most scientific applications follow this pipeline:

1. **Acqusition**: Collect raw data via WebSocket or File.
2. **Preprocessing**: Apply `lowPassFilter` or `savitzkyGolay`.
3. **Analysis**: Run `detectPeaks` or `fitData`.
4. **Visualization**: Add data to `Chart` and highlight results with `Annotations`.

```typescript
// Example: Complete Peak Analysis
const filteredY = lowPassFilter(rawY, sampleRate, 10);
const peaks = detectPeaks(x, filteredY, { minProminence: 0.5 });
const area = integrate(x, filteredY, peaks[0].x - 1, peaks[0].x + 1);

chart.addSeries({ id: 'signal', data: { x, y: filteredY } });
chart.addAnnotation({
  type: 'text',
  x: peaks[0].x,
  y: peaks[0].y,
  text: `Area: ${area.toFixed(4)}`
});
```

## Performance Note

All analysis functions are optimized for `Float32Array`. When processing long signals (>100k points), these utilities are significantly faster than native JavaScript array methods.
