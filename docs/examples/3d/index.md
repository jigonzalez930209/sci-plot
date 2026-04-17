---
title: 3D Chart Examples
description: Explore a wide range of interactive 3D chart types, including waterfall, point cloud, surface mesh, and volumetric voxel charts powered by WebGL2.
---

# 3D Charts

High-performance WebGL2-based 3D chart visualizations with instanced rendering.

## Available Chart Types

### Specialized Renderers

| Chart | Description | Use Case |
|-------|-------------|----------|
| [Waterfall](/examples/3d/waterfall-chart) | Cascading spectral slices | Audio spectrograms, time-frequency |
| [Vector Field](/examples/3d/vector-field) | Directional quiver plot | CFD, fluid flow, magnetics |
| [Point Cloud](/examples/3d/point-cloud) | Massive point datasets | LIDAR, medical scans |
| [Voxel (Volumetric)](/examples/3d/voxel-chart) | 3D grid intensity volumes | MRI, CT scans, scalar fields |
| [Ribbon 3D](/examples/3d/ribbon-chart) | Lit extruded paths | Flow analysis, trajectories |
| [Surface Bar](/examples/3d/column-chart) | 3D Histogram grid | Demographics, spatial stats |

### Core Charts

| Chart | Description | Use Case |
|-------|-------------|----------|
| [Bubble 3D](/examples/3d/bubble-chart) | Spherical markers in 3D | Point clouds, multi-dimensional data |
| [Surface Mesh](/examples/3d/surface-mesh) | Height-mapped grid surface | Terrain, mathematical surfaces |
| [Scatter 3D](/examples/3d/scatter-chart) | Unconnected points | Clusters, distributions |
| [Point Line](/examples/3d/point-line-chart) | Connected points in 3D | Trajectories, paths |
| [Area 3D](/examples/3d/area-chart) | Filled area under line | Curtain visualization |
| [Impulse](/examples/3d/impulse-chart) | Vertical stems | Discrete signals, events |

## Quick Start

```typescript
import { Chart3D } from 'sci-plot/core/3d';

const chart = new Chart3D({
  canvas: document.getElementById('canvas'),
  backgroundColor: [0.05, 0.05, 0.1, 1],
});

// Add any series type
chart.addSeries({
  type: 'bubble',  // or 'surface', 'waterfall', etc.
  // ... series-specific options
});
```

## Common Features

### Camera Controls

All 3D charts share the same orbit camera controls:

| Action | Mouse | Touch |
|--------|-------|-------|
| Rotate | Left click + drag | 1 finger drag |
| Zoom | Scroll wheel | Pinch 2 fingers |
| Pan | Right click + drag | — |

### Colormaps

Available for Surface, Waterfall, and Heatmap charts:

- `viridis` - Perceptually uniform (default)
- `plasma` - High contrast
- `jet` - Classic rainbow
- `hot` - Black-red-yellow-white
- `cool` - Cyan-magenta
- `grayscale` - Black-white

### Performance

- **Instanced rendering**: 100k+ objects in single draw call
- **WebGL2**: Hardware-accelerated graphics
- **No dependencies**: Custom math library (~10KB)

## API Reference

- [Chart3D](/api/3d/chart)
- [OrbitCamera](/api/3d/camera)
- [Series Types](/api/3d/series)
