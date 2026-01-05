# 3D Ribbon Chart

Extruded line with variable width in 3D space.

<ChartDemo3D type="ribbon-3d" />

## Overview

The Ribbon 3D chart renders a path with width, creating a ribbon-like surface. Useful for:
- Uncertainty visualization (width = confidence)
- Flow visualization
- Trajectory with magnitude

## Basic Usage

```typescript
import { Chart3D } from 'scichart-engine/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

// Create spiral ribbon
const points = 200;
const positions = new Float32Array(points * 3);
const widths = new Float32Array(points);

for (let i = 0; i < points; i++) {
  const t = i / points * Math.PI * 4;
  const r = 2 + t * 0.2;
  
  positions[i * 3] = r * Math.cos(t);
  positions[i * 3 + 1] = t * 0.3;
  positions[i * 3 + 2] = r * Math.sin(t);
  
  // Variable width
  widths[i] = 0.2 + Math.sin(t * 3) * 0.15;
}

chart.addSeries({
  type: 'ribbon',
  id: 'spiral-ribbon',
  positions,
  widths,
  defaultWidth: 0.3,
});
```

## Variable Width

```typescript
// Width based on data value
for (let i = 0; i < points; i++) {
  widths[i] = dataValues[i] * 0.5; // Scale to ribbon width
}
```

## Custom Colors

```typescript
const colors = new Float32Array(points * 3);
for (let i = 0; i < points; i++) {
  const t = i / points;
  colors[i * 3] = 0.2 + t * 0.6;
  colors[i * 3 + 1] = 0.5;
  colors[i * 3 + 2] = 0.8 - t * 0.3;
}

chart.addSeries({
  type: 'ribbon',
  positions,
  widths,
  colors,
});
```

## API Reference

See [Ribbon3D API](/api/3d/ribbon)
