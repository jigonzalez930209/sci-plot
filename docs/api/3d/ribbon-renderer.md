---
title: Ribbon3DRenderer API
description: Visualize trajectories and flow analysis with the Ribbon3DRenderer, featuring continuous 3D lit ribbons and customizable widths.
---

# Ribbon3DRenderer

Renders time-series or profile data as continuous 3D lit ribbons.

## Constructor

```typescript
const renderer = new Ribbon3DRenderer(options: Ribbon3DRendererOptions);
```

### Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `canvas` | `HTMLCanvasElement` | **Required** | The target canvas element. |
| `opacity` | `number` | `0.9` | Global transparency. |
| `showAxes` | `boolean` | `true` | Show coordinate system. |

## Methods

### `setData(series: RibbonSeriesData[]): void`
Submits multiple series to be rendered as ribbons.

### `fitToData(): void`
Fits the camera to encompass all ribbons.

## Interfaces

### RibbonSeriesData
```typescript
interface RibbonSeriesData {
  xValues: Float32Array;   // Path X coordinates
  yValues: Float32Array;   // Path Y coordinates
  z: number;               // Fixed depth for this slice
  width?: number;          // Ribbon width (thickness)
  color?: [number, number, number]; // RGB fill
}
```

## Geometry
Each ribbon is dynamically generated as a triangular strip. Surface normals are computed for each segment to ensure smooth directional lighting and a premium 3D look.
