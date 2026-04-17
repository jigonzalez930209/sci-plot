# 3D Voxel (Volumetric Heatmap)

Visualize volumetric data, 3D scalar fields, and medical imaging data as a grid of cubes.

<ChartDemo3D type="voxel-3d" />

## Overview

Voxels (Volumetric Pixels) are the 3D equivalent of pixels. The Voxel 3DRenderer allows you to visualize a dense or sparse 3D grid of values, with interactive thresholding and real-time lighting.

- **Medical Imaging**: MRI and CT scan data
- **Material Science**: Internal structure and porosity
- **Meteorology**: Atmospheric pressure and humidity volumes
- **Physics**: Particle density and field simulations

## Basic Usage

```typescript
import { Voxel3DRenderer } from 'velo-plot/core/3d';

const renderer = new Voxel3DRenderer({
  canvas: document.getElementById('canvas'),
  voxelSize: 0.8,    // Space between voxel centers
  threshold: 0.1,    // Hide values below this intensity
  opacity: 0.9,      // Global transparency
});

// Create a 20x20x20 volume
const size = 20;
const count = size ** 3;
const positions = new Float32Array(count * 3);
const values = new Float32Array(count);

for (let x = 0; x < size; x++) {
  for (let y = 0; y < size; y++) {
    for (let z = 0; z < size; z++) {
      const idx = x * size * size + y * size + z;
      
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;
      
      // Scalar value (e.g., distance to center)
      const dist = Math.sqrt((x-10)**2 + (y-10)**2 + (z-10)**2);
      values[idx] = Math.max(0, 1 - dist / 10);
    }
  }
}

renderer.setData({
  positions,
  values,
});
```

## Volumetric Thresholding

One of the most powerful features of Voxel rendering is the ability to filter data in real-time on the GPU. Adjusting the `threshold` allows you to see "inside" the volume:

```typescript
// Only show voxels with intensity > 0.5
renderer.updateThreshold(0.5);
```

## Scientific Colormapping

The Voxel renderer uses a high-performance fragment shader to map intensities to colors. It automatically handles shading to provide depth and structure to the volume.

## Sparse vs Dense Volumes

The renderer is optimized for both dense grids (full cubes) and sparse datasets (only a few points in 3D space). Simply provide the positions of the active voxels.

## API Reference

See [Voxel3DRenderer API](/api/3d/voxel-renderer)
