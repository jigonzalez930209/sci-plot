# Waterfall3DRenderer

High-performance 3D renderer for cascading spectral or time-series data.

## Constructor

```typescript
const renderer = new Waterfall3DRenderer(options: Waterfall3DRendererOptions);
```

### Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `canvas` | `HTMLCanvasElement` | **Required** | The target canvas element. |
| `sliceStyle` | `'line' \| 'area'` | `'area'` | Render as simple lines or filled ribbons. |
| `baseY` | `number` | `0` | Base Y level for the area fill. |
| `opacity` | `number` | `1.0` | Global series opacity. |
| `showAxes` | `boolean` | `true` | Whether to display 3D axes. |

## Methods

### `setData(xValues: Float32Array, slices: WaterfallSlice[]): void`
Sets the entire dataset for the renderer.

### `pushSlice(slice: WaterfallSlice): void`
Adds a new slice to the end of the waterfall and removes the oldest if the limit is reached.

### `updateSlice(index: number, yValues: Float32Array): void`
Updates the data for a specific slice index.

### `fitToData(): void`
Automatically adjusts the camera to fit the current data bounds.

### `projectToScreen(worldPos: [number, number, number]): { x: number, y: number, visible: boolean }`
Projects a 3D world coordinate to 2D screen coordinates.

## Interfaces

### WaterfallSlice
```typescript
interface WaterfallSlice {
  z: number;               // Position along the depth axis
  yValues: Float32Array;   // Heights for each X point
  color?: [number, number, number]; // RGB color [0-1]
}
```

## Internal Components

- **Geometry**: Custom mesh generated based on `sliceStyle`.
- **Shaders**: `WATERFALL_VERT` and `WATERFALL_FRAG`.
- **Interactions**: Inherits default `OrbitController` behavior.
