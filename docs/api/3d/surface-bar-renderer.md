# SurfaceBar3DRenderer

High-performance 3D histogram/bar chart for grid-based data.

## Constructor

```typescript
const renderer = new SurfaceBar3DRenderer(options: SurfaceBar3DRendererOptions);
```

### Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `canvas` | `HTMLCanvasElement` | **Required** | The target canvas element. |
| `barScale` | `number` | `0.8` | Width of bars relative to grid spacing. |
| `opacity` | `number` | `1.0` | Global transparency. |

## Methods

### `setData(data: SurfaceBarData): void`
Submits a grid of height values.

### `fitToData(): void`
Centers the camera on the histogram grid.

## Interfaces

### SurfaceBarData
```typescript
interface SurfaceBarData {
  rows: number;            // Number of rows (Z axis)
  cols: number;            // Number of columns (X axis)
  heights: Float32Array;   // One height value per cell
  colors?: Float32Array;   // Optional RGB per bar
  origin?: [number, number, number]; // Grid start position
  spacing?: [number, number];        // Distance between cells [dx, dz]
}
```

## Performance
Uses **GLSL Instancing**. Each bar's unique height and color are passed as instance attributes, allowing thousands of bars to be rendered and updated with extremely low CPU overhead.
