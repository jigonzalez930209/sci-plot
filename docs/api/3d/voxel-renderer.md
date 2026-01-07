---
title: Voxel3DRenderer API
description: Master volumetric data visualization with the Voxel3DRenderer, ideal for MRI/CT scans and 3D grid intensity volumes.
---

# Voxel3DRenderer

Renders volumetric data as a grid of interactive 3D blocks.

## Constructor

```typescript
const renderer = new Voxel3DRenderer(options: Voxel3DRendererOptions);
```

### Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `canvas` | `HTMLCanvasElement` | **Required** | The target canvas element. |
| `voxelSize` | `number` | `1.0` | Size of each voxel cube. |
| `threshold` | `number` | `0.0` | Visibility cutoff (0.0 to 1.0). |
| `opacity` | `number` | `0.9` | Global transparency. |

## Methods

### `setData(data: VoxelData): void`
Sets the voxel positions and intensities.

### `updateThreshold(value: number): void`
Updates the GPU threshold immediately. Useful for "peeling" volumetric layers.

### `updateVoxelSize(size: number): void`
Global scale for individual voxels.

## Interfaces

### VoxelData
```typescript
interface VoxelData {
  positions: Float32Array; // [x, y, z] centers
  values: Float32Array;    // Intensity [0-1] for each voxel
}
```

## Lighting
Includes a built-in **Lambertian lighting** model in the fragment shader to provide realistic shading and depth to the volume.
