---
title: Ternary Charts API
description: Triangular diagrams for three-component compositional data
---

# Ternary Charts

Ternary charts (also known as ternary plots or triangle plots) are specialized visualizations for displaying data with three components where the sum must equal 1 (or 100%). They are widely used in:

- **Phase diagrams** in metallurgy and materials science
- **Soil classification** (sand, silt, clay percentages)
- **Chemical composition** analysis
- **Geological studies** (rock composition)
- **Economic data** (budget allocation across 3 categories)

## Basic Usage

```typescript
import { renderTernaryPlot } from 'sci-plot/renderer/ternary';

// Prepare data (3 components that sum to 1)
const data = {
  a: [0.2, 0.3, 0.5, 0.1], // Component A (top vertex)
  b: [0.3, 0.4, 0.2, 0.6], // Component B (bottom-left)
  c: [0.5, 0.3, 0.3, 0.3]  // Component C (bottom-right)
};

// Get canvas context
const canvas = document.getElementById('ternary-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Render ternary plot
renderTernaryPlot(ctx, data, {
  labelA: 'Sand',
  labelB: 'Silt',
  labelC: 'Clay',
  showGrid: true,
  showLabels: true,
  style: {
    pointSize: 8,
    color: '#00f2ff',
    gridColor: 'rgba(255, 255, 255, 0.2)',
    gridDivisions: 10
  }
});
```

## API Reference

### Data Structure

#### `TernaryData`

```typescript
interface TernaryData {
  /** Component A values (0-1) - top vertex */
  a: number[];
  /** Component B values (0-1) - bottom-left vertex */
  b: number[];
  /** Component C values (0-1) - bottom-right vertex */
  c: number[];
}
```

**Important**: For each point `i`, the sum `a[i] + b[i] + c[i]` should equal 1. If not, the values are automatically normalized.

### Styling Options

#### `TernaryStyle`

```typescript
interface TernaryStyle {
  /** Point size for scatter mode (default: 6) */
  pointSize?: number;
  /** Point color (default: '#00f2ff') */
  color?: string;
  /** Fill opacity for regions (default: 0.3) */
  fillOpacity?: number;
  /** Grid line color (default: 'rgba(255, 255, 255, 0.2)') */
  gridColor?: string;
  /** Grid line width (default: 1) */
  gridWidth?: number;
  /** Number of grid divisions (default: 10) */
  gridDivisions?: number;
}
```

### Configuration Options

#### `TernaryOptions`

```typescript
interface TernaryOptions {
  /** Label for component A (top vertex) */
  labelA?: string;
  /** Label for component B (bottom-left vertex) */
  labelB?: string;
  /** Label for component C (bottom-right vertex) */
  labelC?: string;
  /** Style options */
  style?: TernaryStyle;
  /** Show grid lines (default: true) */
  showGrid?: boolean;
  /** Show component labels (default: true) */
  showLabels?: boolean;
}
```

## Core Functions

### `ternaryToCartesian()`

Converts ternary coordinates to Cartesian coordinates.

```typescript
function ternaryToCartesian(
  a: number,
  b: number,
  c: number
): CartesianPoint
```

**Example:**
```typescript
import { ternaryToCartesian } from 'sci-plot/renderer/ternary';

const point = ternaryToCartesian(0.2, 0.3, 0.5);
console.log(point); // { x: 0.65, y: 0.2598... }
```

### `convertTernaryData()`

Converts arrays of ternary coordinates to Cartesian coordinates.

```typescript
function convertTernaryData(data: TernaryData): CartesianPoint[]
```

### `renderTernaryPlot()`

Complete ternary plot renderer (all-in-one function).

```typescript
function renderTernaryPlot(
  ctx: CanvasRenderingContext2D,
  data: TernaryData,
  options?: TernaryOptions
): void
```

### Individual Drawing Functions

For advanced use cases, you can use these individual functions:

#### `drawTernaryGrid()`

```typescript
function drawTernaryGrid(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  divisions?: number,
  gridColor?: string,
  gridWidth?: number
): void
```

#### `drawTernaryOutline()`

```typescript
function drawTernaryOutline(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  color?: string,
  lineWidth?: number
): void
```

#### `drawTernaryLabels()`

```typescript
function drawTernaryLabels(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  labelA?: string,
  labelB?: string,
  labelC?: string,
  fontSize?: number,
  color?: string
): void
```

#### `renderTernaryPoints()`

```typescript
function renderTernaryPoints(
  ctx: CanvasRenderingContext2D,
  data: TernaryData,
  centerX: number,
  centerY: number,
  size: number,
  pointSize?: number,
  color?: string
): void
```

## Common Use Cases

### Soil Classification

```typescript
const soilData = {
  a: [0.60, 0.40, 0.20, 0.10], // Sand %
  b: [0.30, 0.40, 0.60, 0.20], // Silt %
  c: [0.10, 0.20, 0.20, 0.70]  // Clay %
};

renderTernaryPlot(ctx, soilData, {
  labelA: 'Sand',
  labelB: 'Silt',
  labelC: 'Clay',
  style: {
    pointSize: 10,
    color: '#8B4513' // Brown color for soil
  }
});
```

### Phase Diagrams

```typescript
const phaseData = {
  a: [0.5, 0.6, 0.3], // Component A
  b: [0.3, 0.2, 0.4], // Component B
  c: [0.2, 0.2, 0.3]  // Component C
};

renderTernaryPlot(ctx, phaseData, {
  labelA: 'Fe',
  labelB: 'Cr',
  labelC: 'Ni',
  style: {
    gridDivisions: 20, // Finer grid
    color: '#ff6b6b'
  }
});
```

### Budget Allocation

```typescript
const budgetData = {
  a: [0.5, 0.4, 0.6], // Education
  b: [0.3, 0.4, 0.2], // Healthcare
  c: [0.2, 0.2, 0.2]  // Infrastructure
};

renderTernaryPlot(ctx, budgetData, {
  labelA: 'Education',
  labelB: 'Healthcare',
  labelC: 'Infrastructure',
  style: {
    pointSize: 12,
    color: '#3b82f6'
  }
});
```

## Coordinate System

The ternary triangle is positioned as follows:

```
        A (top)
       / \
      /   \
     /     \
    /       \
   /         \
  B-----------C
(bottom-left) (bottom-right)
```

**Conversion Formula:**
- `x = c + b/2`
- `y = b × √3/2`

Where each component is normalized so that `a + b + c = 1`.

## Grid Lines

The grid displays percentage lines for each component:
- Lines parallel to BC show constant A values
- Lines parallel to AC show constant B values
- Lines parallel to AB show constant C values

## Best Practices

1. **Data Normalization**: Always ensure your data sums to 1 (or normalize it to percentages that sum to 100%).

2. **Grid Divisions**: Use 10 divisions for general use, 20 for detailed analysis.

3. **Point Size**: Adjust based on data density:
   - Few points (< 20): `pointSize: 10-12`
   - Medium (20-100): `pointSize: 6-8`
   - Many points (> 100): `pointSize: 3-5`

4. **Colors**: Use contrasting colors for different datasets when overlaying multiple series.

5. **Labels**: Keep component labels short and descriptive.

## Performance Considerations

- **Point Count**: Ternary plots can handle thousands of points efficiently.
- **Grid Complexity**: Higher `gridDivisions` values increase rendering time linearly.
- **Canvas Size**: Use at least 600x600px for clear visualization.

## Limitations

- Only supports 3-component data
- All components must be non -negative
- No built-in support for contour lines (can be added manually)
- No automatic legend for regions

## See Also

- [Ternary Chart Demo](/examples/ternary-charts)
- [Polar Charts](/api/polar-charts) - For 2D polar coordinate systems
- [Radar Charts](/api/plugin-radar) - For multi-axis comparisons
