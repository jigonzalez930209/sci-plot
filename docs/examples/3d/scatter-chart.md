# 3D Scatter Chart

Point cloud visualization in 3D space.

<ChartDemo3D type="scatter-3d" />

## Overview

The Scatter 3D chart renders individual points without connections, ideal for:
- Point cloud data
- Statistical distributions
- Cluster visualization

## Basic Usage

```typescript
import { Chart3D } from 'scichart-engine/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
});

// Generate random point cloud
const count = 5000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const sizes = new Float32Array(count);

for (let i = 0; i < count; i++) {
  // Gaussian distribution
  const r = Math.sqrt(-2 * Math.log(Math.random()));
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI * 2;
  
  positions[i * 3] = r * Math.sin(theta) * Math.cos(phi) * 3;
  positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi) * 3;
  positions[i * 3 + 2] = r * Math.cos(theta) * 3;
  
  // Color by distance from center
  const dist = r / 3;
  colors[i * 3] = dist;
  colors[i * 3 + 1] = 0.5;
  colors[i * 3 + 2] = 1 - dist;
  
  sizes[i] = 0.05 + Math.random() * 0.1;
}

chart.addSeries({
  type: 'scatter',
  id: 'cloud',
  positions,
  colors,
  sizes,
  symbol: 'sphere',
});
```

## Symbol Types

```typescript
// Sphere (default) - smooth spherical markers
symbol: 'sphere'

// Cube - box markers
symbol: 'cube'

// Diamond - rotated cube
symbol: 'diamond'

// Point - simple GL points (fastest)
symbol: 'point'
```

## Cluster Visualization

```typescript
// Create 3 clusters
const clusters = [
  { center: [-3, 0, 0], color: [1, 0.2, 0.2] },
  { center: [3, 0, 0], color: [0.2, 1, 0.2] },
  { center: [0, 3, 0], color: [0.2, 0.2, 1] },
];

const pointsPerCluster = 1000;
const total = clusters.length * pointsPerCluster;

const positions = new Float32Array(total * 3);
const colors = new Float32Array(total * 3);

clusters.forEach((cluster, ci) => {
  for (let i = 0; i < pointsPerCluster; i++) {
    const idx = ci * pointsPerCluster + i;
    
    // Random offset from cluster center
    positions[idx * 3] = cluster.center[0] + (Math.random() - 0.5) * 2;
    positions[idx * 3 + 1] = cluster.center[1] + (Math.random() - 0.5) * 2;
    positions[idx * 3 + 2] = cluster.center[2] + (Math.random() - 0.5) * 2;
    
    colors[idx * 3] = cluster.color[0];
    colors[idx * 3 + 1] = cluster.color[1];
    colors[idx * 3 + 2] = cluster.color[2];
  }
});

chart.addSeries({ type: 'scatter', positions, colors });
```

## API Reference

See [Scatter3D API](/api/3d/scatter)
