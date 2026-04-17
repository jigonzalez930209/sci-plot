# 3D High-Density Point Cloud

Render millions of points with insane performance for LIDAR data, medical imaging, and massive datasets.

<ChartDemo3D type="point-cloud-3d" />

## Overview

The Point Cloud 3D renderer is optimized for visualizing massive datasets where individual markers are needed. It uses specialized GPU shaders to maintain 60 FPS even with millions of points.

- **LIDAR / Laser Scanning**: Real-world environment captures
- **Astronomy**: Star charts and cosmic structures
- **Biology**: Single-cell sequencing and protein clusters
- **Big Data**: Dimensionality reduction (t-SNE/UMAP) results

## Basic Usage

```typescript
import { PointCloud3DRenderer } from 'velo-plot/core/3d';

const renderer = new PointCloud3DRenderer({
  canvas: document.getElementById('canvas'),
  globalPointSize: 2.0,
  circular: true, // Use smooth spheres instead of squares
});

// Generate 100,000 points
const count = 100000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  // Gaussian distribution
  positions[i * 3] = Math.random() * 10 - 5;
  positions[i * 3 + 1] = Math.random() * 10 - 5;
  positions[i * 3 + 2] = Math.random() * 10 - 5;
  
  // Color based on position
  colors[i * 3] = (positions[i * 3] + 5) / 10;
  colors[i * 3 + 1] = 0.5;
  colors[i * 3 + 2] = (positions[i * 3 + 2] + 5) / 10;
}

renderer.setData({
  positions,
  colors,
});
```

## Performance Scaling

To handle even larger datasets (1M+ points), use `gl.DYNAMIC_DRAW` and avoid recalculating data on the main thread:

```typescript
// For very large datasets, point size is attenuated by depth
// so distant points don't clutter the view.
const renderer = new PointCloud3DRenderer({
  canvas: canvas,
  opacity: 0.8,
});
```

## Variable Point Sizes

Each point can have its own size attribute to represent weight or importance:

```typescript
const sizes = new Float32Array(count);
for (let i = 0; i < count; i++) {
  sizes[i] = Math.random() * 5 + 1;
}

renderer.setData({
  positions,
  colors,
  sizes,
});
```

## Circular vs Square Markers

Toggle `circular: true` for a more premium look at a slight performance cost, or `circular: false` for maximum speed.

## API Reference

See [PointCloud3DRenderer API](/api/3d/point-cloud-renderer)
