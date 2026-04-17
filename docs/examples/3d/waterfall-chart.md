---
title: Waterfall 3D Chart
description: Interactive 3D waterfall chart for spectral analysis and time-frequency data, featuring real-time streaming, depth fading, and scientific colormaps.
---

# Interactive Waterfall 3D Chart

Cascading spectral visualization for time-series and frequency data.

<ChartDemo3D type="waterfall-3d" />

## Overview

The Waterfall 3D chart displays multiple data slices arranged along the Z-axis, creating a cascading "waterfall" effect. Ideal for:

- **Audio spectrograms**: Frequency vs time
- **Scientific instruments**: Spectral analysis over time
- **Financial data**: Multiple time series comparison

## Basic Usage

```typescript
import { Chart3D } from 'sci-plot/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

// Create frequency axis (X)
const freqPoints = 256;
const xValues = new Float32Array(freqPoints);
for (let i = 0; i < freqPoints; i++) {
  xValues[i] = i * 20; // 0-5120 Hz
}

// Create initial slices
const sliceCount = 50;
const slices: Float32Array[] = [];

for (let s = 0; s < sliceCount; s++) {
  const slice = new Float32Array(freqPoints);
  for (let i = 0; i < freqPoints; i++) {
    // Simulated spectrum with peaks
    slice[i] = Math.random() * 0.2 + 
               Math.exp(-Math.pow(i - 50, 2) / 200) * 0.8 +
               Math.exp(-Math.pow(i - 150, 2) / 300) * 0.5;
  }
  slices.push(slice);
}

chart.addSeries({
  type: 'waterfall',
  id: 'spectrum',
  xValues,
  slices,
  zStep: 0.5,
  colormap: 'viridis',
  fillMode: 'gradient',
});
```

## Real-time Streaming

Push new slices in real-time for live spectral analysis:

```typescript
// Simulated audio analysis
function analyzeAudio(): Float32Array {
  const spectrum = new Float32Array(freqPoints);
  // ... FFT analysis ...
  return spectrum;
}

// Update at 30 FPS
setInterval(() => {
  const newSlice = analyzeAudio();
  chart.pushSlice('spectrum', newSlice);
}, 33);
```

## Fill Modes

### Gradient (default)
Smooth color gradient based on height values.

```typescript
fillMode: 'gradient'
```

### Solid
Solid filled surface with lighting.

```typescript
fillMode: 'solid'
```

### Wireframe
Line-only rendering for clarity.

```typescript
fillMode: 'wireframe'
```

## Colormaps

```typescript
// Scientific colormaps
colormap: 'viridis'  // Perceptually uniform
colormap: 'plasma'   // High contrast
colormap: 'jet'      // Classic rainbow
colormap: 'hot'      // Black-red-yellow-white
colormap: 'grayscale'
```

## Depth Fading

Fade older slices for emphasis on recent data:

```typescript
chart.addSeries({
  type: 'waterfall',
  fadeStart: 0.3,  // Start fading at 30% depth
  fadeEnd: 1.0,    // Fully faded at 100% depth
  // ...
});
```

## Audio Spectrogram Example

```typescript
// Web Audio API integration
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    const freqData = new Uint8Array(analyser.frequencyBinCount);
    
    function update() {
      analyser.getByteFrequencyData(freqData);
      
      // Convert to Float32Array and normalize
      const spectrum = new Float32Array(freqData.length);
      for (let i = 0; i < freqData.length; i++) {
        spectrum[i] = freqData[i] / 255;
      }
      
      chart.pushSlice('spectrum', spectrum);
      requestAnimationFrame(update);
    }
    
    update();
  });
```

## Performance Tips

- **Slice count**: Keep under 100 slices for smooth performance
- **Resolution**: 256-512 points per slice is optimal
- **Update rate**: 30 FPS is sufficient for most visualizations

## API Reference

See [Waterfall3D API](/api/3d/waterfall)
