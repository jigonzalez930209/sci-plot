# 3D Series Types

All available series types for 3D charts.

## Series Data Interfaces

### Bubble3DSeriesData

```typescript
interface Bubble3DSeriesData {
  type: 'bubble';
  id: string;
  visible: boolean;
  opacity: number;
  positions: Float32Array;  // xyz interleaved
  scales?: Float32Array;    // per-instance scale
  colors?: Float32Array;    // rgb interleaved
}
```

### SurfaceMesh3DData

```typescript
interface SurfaceMesh3DData {
  type: 'surface';
  id: string;
  visible: boolean;
  opacity: number;
  xValues: Float32Array;    // X axis values (columns)
  zValues: Float32Array;    // Z axis values (rows)
  yValues: Float32Array;    // Height values (rows * cols)
  colors?: Float32Array;    // Optional per-vertex colors
  wireframe?: boolean;
  colormap?: ColormapName;
}
```

### PointLine3DData

```typescript
interface PointLine3DData {
  type: 'pointline';
  id: string;
  visible: boolean;
  opacity: number;
  positions: Float32Array;  // xyz interleaved
  colors?: Float32Array;
  lineWidth?: number;
  pointSize?: number;
  showPoints?: boolean;
  showLines?: boolean;
}
```

### Column3DData

```typescript
interface Column3DData {
  type: 'column';
  id: string;
  visible: boolean;
  opacity: number;
  xValues: Float32Array;
  zValues: Float32Array;
  yValues: Float32Array;    // Heights
  colors?: Float32Array;
  columnWidth?: number;
  columnDepth?: number;
}
```

### Waterfall3DData

```typescript
interface Waterfall3DData {
  type: 'waterfall';
  id: string;
  visible: boolean;
  opacity: number;
  slices: Float32Array[];   // Array of Y value slices
  xValues: Float32Array;    // X axis (frequency/position)
  zStep: number;            // Z spacing between slices
  zStart?: number;
  colormap?: ColormapName;
  fillMode?: 'solid' | 'wireframe' | 'gradient';
  strokeColor?: [number, number, number];
}
```

### Scatter3DData

```typescript
interface Scatter3DData {
  type: 'scatter';
  id: string;
  visible: boolean;
  opacity: number;
  positions: Float32Array;
  colors?: Float32Array;
  sizes?: Float32Array;
  symbol?: 'sphere' | 'cube' | 'diamond' | 'point';
}
```

### Ribbon3DData

```typescript
interface Ribbon3DData {
  type: 'ribbon';
  id: string;
  visible: boolean;
  opacity: number;
  positions: Float32Array;  // Center line xyz
  widths?: Float32Array;    // Width at each point
  colors?: Float32Array;
  defaultWidth?: number;
}
```

### Area3DData

```typescript
interface Area3DData {
  type: 'area';
  id: string;
  visible: boolean;
  opacity: number;
  positions: Float32Array;
  baseY?: number;           // Y value for base (default 0)
  colors?: Float32Array;
  fillOpacity?: number;
}
```

### Heatmap3DData

```typescript
interface Heatmap3DData {
  type: 'heatmap';
  id: string;
  visible: boolean;
  opacity: number;
  xValues: Float32Array;
  zValues: Float32Array;
  values: Float32Array;     // Intensity values
  colormap?: ColormapName;
  minValue?: number;
  maxValue?: number;
}
```

### Impulse3DData

```typescript
interface Impulse3DData {
  type: 'impulse';
  id: string;
  visible: boolean;
  opacity: number;
  positions: Float32Array;  // xyz tip positions
  baseY?: number;
  colors?: Float32Array;
  lineWidth?: number;
  showMarkers?: boolean;
}
```

## Colormap Names

```typescript
type ColormapName =
  | 'viridis'
  | 'plasma'
  | 'inferno'
  | 'magma'
  | 'jet'
  | 'rainbow'
  | 'grayscale'
  | 'hot'
  | 'cool'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'ocean'
  | 'terrain';
```

## Union Type

```typescript
type Series3DData =
  | Bubble3DSeriesData
  | SurfaceMesh3DData
  | PointLine3DData
  | Column3DData
  | Waterfall3DData
  | Scatter3DData
  | Ribbon3DData
  | Area3DData
  | Heatmap3DData
  | Impulse3DData;
```
