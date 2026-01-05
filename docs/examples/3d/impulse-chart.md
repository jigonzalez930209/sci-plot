# 3D Impulse/Stem Chart

Vertical lines from base plane to data points.

<demo src="impulse-3d" />

## Overview

The Impulse 3D chart renders vertical stems from a base plane to data points, similar to a stem plot. Ideal for:
- Discrete signal visualization
- Event markers in 3D
- Sparse data representation

## Basic Usage

```typescript
import { Chart3D } from 'scichart-engine/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

// Random impulses
const count = 100;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  positions[i * 3] = Math.random() * 10 - 5;
  positions[i * 3 + 1] = Math.random() * 5;
  positions[i * 3 + 2] = Math.random() * 10 - 5;
}

chart.addSeries({
  type: 'impulse',
  id: 'stems',
  positions,
  baseY: 0,
  showMarkers: true,
});
```

## Custom Colors

```typescript
const colors = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const h = positions[i * 3 + 1] / 5; // Height normalized
  colors[i * 3] = h;
  colors[i * 3 + 1] = 0.5;
  colors[i * 3 + 2] = 1 - h;
}

chart.addSeries({
  type: 'impulse',
  positions,
  colors,
});
```

## API Reference

See [Impulse3D API](/api/3d/impulse)
