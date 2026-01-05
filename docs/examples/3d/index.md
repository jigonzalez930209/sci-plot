# 3D Charts

High-performance WebGL2-based 3D chart visualizations with instanced rendering.

## Available Chart Types

### Core Charts

| Chart | Description | Use Case |
|-------|-------------|----------|
| [Bubble 3D](/examples/3d/bubble-chart) | Spherical markers in 3D | Point clouds, multi-dimensional data |
| [Surface Mesh](/examples/3d/surface-mesh) | Height-mapped grid surface | Terrain, mathematical surfaces |
| [Waterfall](/examples/3d/waterfall-chart) | Cascading spectral slices | Audio spectrograms, time-frequency |
| [Point Line](/examples/3d/point-line-chart) | Connected points in 3D | Trajectories, paths |
| [Column](/examples/3d/column-chart) | 3D bar/column chart | Categorical comparisons |

### Additional Charts

| Chart | Description | Use Case |
|-------|-------------|----------|
| [Scatter 3D](/examples/3d/scatter-chart) | Unconnected points | Clusters, distributions |
| [Ribbon](/examples/3d/ribbon-chart) | Extruded line with width | Uncertainty, flow |
| [Area 3D](/examples/3d/area-chart) | Filled area under line | Curtain visualization |
| [Heatmap 3D](/examples/3d/heatmap-chart) | Colored grid on XZ plane | Density, temperature |
| [Impulse](/examples/3d/impulse-chart) | Vertical stems | Discrete signals, events |

## Quick Start

```typescript
import { Chart3D } from 'scichart-engine/core/3d';

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
