---
title: Waveform Generators Demo
description: Interactive demo of testing utilities - sine, square, triangle, CV, and Nyquist waveform generators
---

<script setup>
import WaveformsDemo from '../.vitepress/theme/demos/WaveformsDemo.vue'
</script>

# Waveform Generators Demo

Generate test data for chart development and automated testing. Select a waveform type and adjust parameters to see the generated data.

<WaveformsDemo />

## Available Generators

| Generator | Description |
|-----------|-------------|
| **Sine Wave** | Classic sinusoidal waveform |
| **Square Wave** | Digital-style on/off signal |
| **Triangle Wave** | Linear ramp up and down |
| **Sawtooth Wave** | Ramp up with sharp reset |
| **CV (Cyclic Voltammogram)** | Electrochemical scan data |
| **Nyquist (EIS)** | Impedance spectroscopy plot |

## Usage

```typescript
import {
  generateSineWave,
  generateSquareWave,
  generateTriangleWave,
  generateSawtoothWave,
  generateCVData,
  generateNyquistData,
} from 'sci-plot';

// Basic waveforms
const sine = generateSineWave({
  pointCount: 1000,
  frequency: 2,     // Hz
  amplitude: 1,     // Peak value
  noise: 0.1,       // 10% noise
  xStart: 0,
  xEnd: 10,
});

// Cyclic Voltammetry
const cv = generateCVData({
  pointCount: 500,
  vMin: -0.5,        // Start potential (V)
  vMax: 0.5,         // End potential (V)
  cycles: 2,         // Number of cycles
  peakCurrent: 10e-6, // Peak current (A)
  noise: 0.02,
});

// EIS Nyquist plot
const nyquist = generateNyquistData({
  pointCount: 50,
  rSolution: 100,    // Solution resistance (Ω)
  rCharge: 1000,     // Charge transfer resistance (Ω)
});
```

## Benchmarking

Use the testing utilities for performance benchmarking:

```typescript
import { benchmarkRender, assertPerformance } from 'sci-plot';

// Measure render performance
const result = await benchmarkRender(chart, {
  iterations: 100,
  warmupIterations: 10,
});

console.log(`FPS: ${result.fps}`);
console.log(`Avg frame time: ${result.averageMs}ms`);

// Assert minimum performance
assertPerformance(result, {
  minFps: 30,
  maxFrameTime: 33,
});
```

## Snapshot Testing

```typescript
import { createSnapshot, compareSnapshots } from 'sci-plot';

// Create a snapshot of chart state
const snapshot = createSnapshot(chart);

// Later, compare to detect changes
const comparison = compareSnapshots(snapshot, createSnapshot(chart));

if (!comparison.equal) {
  console.log('Changes detected:', comparison.differences);
}
```

See [Testing Utilities](/guide/utilities#testing-utilities) for complete documentation.
