# 3D Area Chart

Filled area under a 3D line (curtain effect).

<demo src="area-3d" />

## Overview

The Area 3D chart fills the space between a line and a base plane, creating a curtain-like visualization.

## Basic Usage

```typescript
import { Chart3D } from 'scichart-engine/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

// Create wave path
const points = 100;
const positions = new Float32Array(points * 3);

for (let i = 0; i < points; i++) {
  const t = i / points * Math.PI * 4;
  positions[i * 3] = t;
  positions[i * 3 + 1] = Math.sin(t) * 2 + 2;
  positions[i * 3 + 2] = 0;
}

chart.addSeries({
  type: 'area',
  id: 'wave',
  positions,
  baseY: 0,
  fillOpacity: 0.6,
});
```

## Multiple Areas

```typescript
// Create multiple area series at different Z positions
for (let z = 0; z < 5; z++) {
  const positions = new Float32Array(points * 3);
  
  for (let i = 0; i < points; i++) {
    const t = i / points * Math.PI * 4;
    positions[i * 3] = t;
    positions[i * 3 + 1] = Math.sin(t + z * 0.5) * 2 + 2;
    positions[i * 3 + 2] = z * 2;
  }
  
  chart.addSeries({
    type: 'area',
    id: `wave-${z}`,
    positions,
    baseY: 0,
    fillOpacity: 0.5,
  });
}
```

## API Reference

See [Area3D API](/api/3d/area)
