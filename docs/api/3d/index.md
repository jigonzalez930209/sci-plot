---
title: 3D API Reference
description: Documentation for SciChart Engine's high-performance 3D rendering module, featuring specialized renderers for waterfall, point cloud, and volumetric visualizations.
---

# 3D API Reference

Complete API documentation for the 3D rendering module.

## Core Classes

### Chart3D
Main entry point for creating 3D visualizations.

```typescript
import { Chart3D } from 'scichart-engine/core/3d';
```

### Bubble3DRenderer
Specialized renderer for bubble/scatter visualizations with instanced rendering.

```typescript
import { Bubble3DRenderer } from 'scichart-engine/core/3d';
```

### Axes3D
3D axis renderer with wall grids, tick marks, and labels.

```typescript
import { Axes3D } from 'scichart-engine/core/3d';
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

