---
title: VectorField3DRenderer API
description: Visualize complex 3D vector fields and directional quiver plots using the high-performance VectorField3DRenderer with instanced geometry.
---

# VectorField3DRenderer

Visualizes directional vector fields (quiver plots) using instanced arrow primitives.

## Constructor

```typescript
const renderer = new VectorField3DRenderer(options: VectorField3DRendererOptions);
```

### Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `canvas` | `HTMLCanvasElement` | **Required** | The target canvas element. |
| `scaleMultiplier` | `number` | `1.0` | Global scaling factor for arrow length. |
| `opacity` | `number` | `1.0` | Global opacity for all vectors. |
| `enableTooltip` | `boolean` | `true` | Enable interactive data tooltips. |

## Methods

### `setData(data: VectorFieldData): void`
Submits new vector data to the GPU.

### `updateScale(multiplier: number): void`
Updates the `scaleMultiplier` without regenerating geometry.

### `fitToData(): void`
Centers the camera on the bounding box of all vectors.

## Interfaces

### VectorFieldData
```typescript
interface VectorFieldData {
  positions: Float32Array;  // Flattened [x, y, z] origins
  directions: Float32Array; // Flattened [dx, dy, dz] vectors
  colors?: Float32Array;    // Optional flattened [r, g, b] per vector
  color?: [number, number, number]; // Fallback color
}
```

## Performance
Uses **Instanced Rendering** to draw thousands of arrows in a single draw call. The rotation and scaling matrices are computed per-vertex in the GPU shader for maximum performance.
