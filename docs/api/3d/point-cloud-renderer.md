# PointCloud3DRenderer

Massively parallel renderer for high-density 3D points.

## Constructor

```typescript
const renderer = new PointCloud3DRenderer(options: PointCloud3DRendererOptions);
```

### Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `canvas` | `HTMLCanvasElement` | **Required** | The target canvas element. |
| `globalPointSize` | `number` | `1.0` | Base size of all points in pixels. |
| `circular` | `boolean` | `true` | If true, renders points as smooth circles. |
| `opacity` | `number` | `1.0` | Global transparency. |

## Methods

### `setData(data: PointCloudData): void`
Uploads point coordinates and attributes to the GPU. Supports millions of points.

### `updatePointSize(size: number): void`
Dynamically changes the particle size.

## Interfaces

### PointCloudData
```typescript
interface PointCloudData {
  positions: Float32Array; // Flattened [x, y, z]
  colors?: Float32Array;    // Flattened [r, g, b] or [r, g, b, a]
  sizes?: Float32Array;     // Per-point scaling factor
}
```

## Performance Note
Optimized for **Zero Latency** interaction. It includes a custom shader that performs depth attenuation (points appear smaller when farther away) to enhance the sense of perspective.
