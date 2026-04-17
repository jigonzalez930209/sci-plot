# 3D Point Line Chart

Connected points in 3D space with optional markers.

<ChartDemo3D type="point-line-3d" />

## Overview

The Point Line 3D chart renders connected data points in 3D space, ideal for:
- Trajectories and paths
- Time series in 3D
- Scientific measurements with spatial coordinates

## Basic Usage

```typescript
import { Chart3D } from 'velo-plot/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

// Create spiral path
const points = 500;
const positions = new Float32Array(points * 3);

for (let i = 0; i < points; i++) {
  const t = i / points * Math.PI * 6;
  const r = 2 + t * 0.3;
  
  positions[i * 3] = r * Math.cos(t);     // X
  positions[i * 3 + 1] = t * 0.5;          // Y (height)
  positions[i * 3 + 2] = r * Math.sin(t);  // Z
}

chart.addSeries({
  type: 'pointline',
  id: 'spiral',
  positions,
  showPoints: true,
  showLines: true,
  lineWidth: 2,
  pointSize: 6,
});
```

## Display Options

### Lines Only

```typescript
chart.addSeries({
  type: 'pointline',
  showPoints: false,
  showLines: true,
  lineWidth: 3,
});
```

### Points Only

```typescript
chart.addSeries({
  type: 'pointline',
  showPoints: true,
  showLines: false,
  pointSize: 8,
});
```

## Custom Colors

```typescript
const colors = new Float32Array(points * 3);
for (let i = 0; i < points; i++) {
  const t = i / points;
  colors[i * 3] = t;           // R: gradient
  colors[i * 3 + 1] = 0.5;     // G: constant
  colors[i * 3 + 2] = 1 - t;   // B: inverse gradient
}

chart.addSeries({
  type: 'pointline',
  positions,
  colors,
});
```

## Animated Paths

```typescript
let phase = 0;

function animate() {
  for (let i = 0; i < points; i++) {
    const t = i / points * Math.PI * 6 + phase;
    const r = 2 + Math.sin(t * 2) * 0.5;
    
    positions[i * 3] = r * Math.cos(t);
    positions[i * 3 + 1] = t * 0.3;
    positions[i * 3 + 2] = r * Math.sin(t);
  }
  
  chart.updateSeries('spiral', { positions });
  phase += 0.02;
  
  requestAnimationFrame(animate);
}

animate();
```

## Multiple Paths

```typescript
// Path 1: Helix
chart.addSeries({
  type: 'pointline',
  id: 'helix-1',
  positions: helix1Positions,
  colors: new Float32Array([...].fill(1, 0, 0)), // Red
});

// Path 2: Another helix
chart.addSeries({
  type: 'pointline',
  id: 'helix-2',
  positions: helix2Positions,
  colors: new Float32Array([...].fill(0, 1, 0)), // Green
});
```

## API Reference

See [PointLine3D API](/api/3d/point-line)
