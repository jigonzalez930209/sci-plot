# 3D Surface Mesh Chart

Render height-mapped surfaces with colormap visualization.

<ChartDemo3D type="surface-mesh-3d" />

## Overview

The Surface Mesh 3D chart displays a grid-based height map where Y values represent elevation. Colors can be mapped to height values using various colormaps.

## Basic Usage

```typescript
import { Chart3D, SurfaceMesh3D } from 'scichart-engine/core/3d';

// Create chart
const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

// Generate surface data (sine wave)
const cols = 50;
const rows = 50;
const xValues = new Float32Array(cols);
const zValues = new Float32Array(rows);
const yValues = new Float32Array(cols * rows);

for (let i = 0; i < cols; i++) {
  xValues[i] = i * 0.2;
}
for (let j = 0; j < rows; j++) {
  zValues[j] = j * 0.2;
}

for (let j = 0; j < rows; j++) {
  for (let i = 0; i < cols; i++) {
    const x = xValues[i];
    const z = zValues[j];
    yValues[j * cols + i] = Math.sin(x) * Math.cos(z) * 2;
  }
}

// Add surface series
chart.addSeries({
  type: 'surface',
  xValues,
  zValues,
  yValues,
  colormap: 'viridis',
  wireframe: false,
});
```

## Colormaps

Available colormaps:
- `viridis` (default)
- `plasma`
- `jet`
- `hot`
- `cool`
- `grayscale`
- `rainbow`

```typescript
chart.addSeries({
  type: 'surface',
  colormap: 'jet',
  // ...
});
```

## Wireframe Mode

```typescript
chart.addSeries({
  type: 'surface',
  wireframe: true,
  // ...
});
```

## Real-time Updates

```typescript
function updateSurface(time: number) {
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = xValues[i];
      const z = zValues[j];
      yValues[j * cols + i] = Math.sin(x + time) * Math.cos(z + time) * 2;
    }
  }
  
  chart.updateSeries('surface-1', { yValues });
}

let t = 0;
setInterval(() => {
  updateSurface(t);
  t += 0.05;
}, 16);
```

## Mathematical Surfaces

### Gaussian

```typescript
for (let j = 0; j < rows; j++) {
  for (let i = 0; i < cols; i++) {
    const x = (i - cols/2) * 0.2;
    const z = (j - rows/2) * 0.2;
    yValues[j * cols + i] = Math.exp(-(x*x + z*z) / 2);
  }
}
```

### Saddle

```typescript
yValues[j * cols + i] = x * x - z * z;
```

### Ripple

```typescript
const r = Math.sqrt(x*x + z*z);
yValues[j * cols + i] = Math.sin(r * 3) / (r + 0.1);
```

## API Reference

See [SurfaceMesh3D API](/api/3d/surface-mesh)
