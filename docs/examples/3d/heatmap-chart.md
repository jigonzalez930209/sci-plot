# 3D Heatmap Chart

Colored grid visualization on the XZ plane.

<ChartDemo3D type="heatmap-3d" />

## Overview

The Heatmap 3D chart displays intensity values as colors on a flat grid, useful for:
- Density maps
- Temperature distributions
- 2D data with color encoding

## Basic Usage

```typescript
import { Chart3D } from 'sci-plot/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

const cols = 50;
const rows = 50;
const xValues = new Float32Array(cols);
const zValues = new Float32Array(rows);
const values = new Float32Array(cols * rows);

for (let i = 0; i < cols; i++) xValues[i] = i;
for (let j = 0; j < rows; j++) zValues[j] = j;

// Gaussian blob
for (let j = 0; j < rows; j++) {
  for (let i = 0; i < cols; i++) {
    const dx = i - cols / 2;
    const dz = j - rows / 2;
    values[j * cols + i] = Math.exp(-(dx*dx + dz*dz) / 200);
  }
}

chart.addSeries({
  type: 'heatmap',
  xValues,
  zValues,
  values,
  colormap: 'viridis',
});
```

## Colormaps

```typescript
colormap: 'viridis'   // Default, perceptually uniform
colormap: 'jet'       // Classic rainbow
colormap: 'hot'       // Black-red-yellow-white
colormap: 'grayscale' // Black-white
```

## Value Range

```typescript
chart.addSeries({
  type: 'heatmap',
  values,
  minValue: 0,    // Clamp minimum
  maxValue: 1,    // Clamp maximum
});
```

## API Reference

See [Heatmap3D API](/api/3d/heatmap)
