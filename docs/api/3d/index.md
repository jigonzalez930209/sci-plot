---
title: 3D API Reference
description: Documentation for Sci Plot's high-performance 3D rendering module, featuring specialized renderers for waterfall, point cloud, and volumetric visualizations.
---

# 3D API Reference

Complete API documentation for the 3D rendering module.

## Architecture

Sci Plot 3D uses specialized renderer classes that manage their own WebGL2 context, camera, and interaction. This provides maximum performance for complex visualizations like surface meshes or high-density point clouds.

## Core Renderers

### Area3DRenderer
Renders filled 3D areas (curtain effect) with lighting and tooltips.

```typescript
import { Area3DRenderer } from 'velo-plot/plugins/3d';

const renderer = new Area3DRenderer({
  canvas: document.getElementById('my-canvas'),
  showAxes: true,
  opacity: 0.8
});
```

### Waterfall3DRenderer
Specialized for cascading spectral results or time-series profiles.

```typescript
import { Waterfall3DRenderer } from 'velo-plot/plugins/3d';
```

## Specialized Renderer Classes

| Class | Type | Description |
|-------|------|-------------|
| [Waterfall3DRenderer](/api/3d/waterfall-renderer) | `'waterfall'` | Cascading spectral results |
| [VectorField3DRenderer](/api/3d/vector-field-renderer) | `'quiver'` | Directional 3D vector fields |
| [PointCloud3DRenderer](/api/3d/point-cloud-renderer) | `'pointcloud'` | High-density 3D markers |
| [Voxel3DRenderer](/api/3d/voxel-renderer) | `'voxel'` | Volumetric intensity grids |
| [Ribbon3DRenderer](/api/3d/ribbon-renderer) | `'ribbon'` | Lit extruded path ribbons |
| [SurfaceBar3DRenderer](/api/3d/surface-bar-renderer) | `'column'` | Instanced 3D histogram |

## Series Renderers

| Class | Type | Description |
|-------|------|-------------|
| `SurfaceMesh3D` | `'surface'` | Grid-based height map |
| `PointLine3D` | `'pointline'` | Connected points |
| `Scatter3D` | `'scatter'` | Clusters / Points |
| `Area3D` | `'area'` | Filled area under line |
| `Heatmap3D` | `'heatmap'` | Colored grid on plane |
| `Impulse3D` | `'impulse'` | Vertical stems |

## Camera & Controls

| Class | Description |
|-------|-------------|
| `OrbitCamera` | Spherical coordinate camera |
| `OrbitController` | Mouse/touch interaction handler |

## Math Utilities

| Module | Description |
|--------|-------------|
| `Mat4` | 4x4 matrix operations |
| `Vec3` | 3D vector operations |

## Types

See [Types Reference](/api/3d/types) for all TypeScript interfaces.

## Quick Links

- [Bubble3DRenderer](/api/3d/bubble-renderer)
- [Axes3D](/api/3d/axes)
- [OrbitController](/api/3d/controls)
- [OrbitCamera](/api/3d/camera)
- [Series Types](/api/3d/series)
- [Math Utilities](/api/3d/math)

