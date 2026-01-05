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

## Series Renderers

| Class | Type | Description |
|-------|------|-------------|
| `SurfaceMesh3D` | `'surface'` | Grid-based height map |
| `PointLine3D` | `'pointline'` | Connected points |
| `Column3D` | `'column'` | 3D bar chart |
| `Waterfall3D` | `'waterfall'` | Cascading spectral data |
| `Scatter3D` | `'scatter'` | Point cloud |
| `Ribbon3D` | `'ribbon'` | Extruded line with width |
| `Area3D` | `'area'` | Filled area under line |
| `Heatmap3D` | `'heatmap'` | Colored grid |
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
- [Series Types](/api/3d/series)
- [OrbitCamera](/api/3d/camera)
- [Math Utilities](/api/3d/math)
