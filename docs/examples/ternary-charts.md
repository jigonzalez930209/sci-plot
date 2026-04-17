---
title: Ternary Charts
description: Triangular diagrams for three-component compositional data
---

# Ternary Charts

Ternary charts are specialized visualizations for displaying compositional data with three variables that sum to a constant (typically 100% or 1). They are essential tools in many scientific fields.

## Interactive Demo

<TernaryDemo height="600px" />

## What are Ternary Charts?

A ternary plot (also called ternary diagram, triangle plot, or de Finetti diagram) displays the proportions of three variables as positions in an equilateral triangle. Each side of the triangle represents 0% to 100% of one of the three components.

### Key Characteristics:

- **Three Components**: Each point represents a composition of three parts (A, B, C)
- **Sum Constraint**: The three components must sum to 100% (or 1 in normalized form)
- **2D Representation**: Despite having 3 variables, the dependency allows 2D plotting
- **Triangular Grid**: Percentage lines running parallel to each side

## Common Applications

### 1. Soil Classification

The most well-known use of ternary plots is in soil science, where soils are classified based on their sand, silt, and clay content.

```typescript
const soilSamples = {
  a: [0.60, 0.40, 0.20], // Sand %
  b: [0.30, 0.40, 0.60], // Silt %
  c: [0.10, 0.20, 0.20]  // Clay %
};
```

**Soil Types by Position:**
- Top (high sand): Sandy soils
- Bottom-left (high silt): Silty soils
- Bottom-right (high clay): Clay soils
- Center: Loamy soils (balanced)

### 2. Phase Diagrams

In materials science and metallurgy, ternary phase diagrams show the phases present in alloys of three metals at different compositions.

```typescript
const alloyComposition = {
  a: [0.5, 0.6, 0.3], // Iron (Fe)
  b: [0.3, 0.2, 0.4], // Chromium (Cr)
  c: [0.2, 0.2, 0.3]  // Nickel (Ni)
};
```

### 3. Geological Studies

Rock classification based on mineral content:

```typescript
const rockSamples = {
  a: [0.7, 0.5, 0.3], // Quartz
  b: [0.2, 0.3, 0.5], // Feldspar
  c: [0.1, 0.2, 0.2]  // Lithic fragments
};
```

### 4. Economic Data

Budget or resource allocation across three categories:

```typescript
const budgetAllocation = {
  a: [0.5, 0.4, 0.6], // Education
  b: [0.3, 0.4, 0.2], // Healthcare
  c: [0.2, 0.2, 0.2]  // Infrastructure
};
```

### 5. Chemical Analysis

Analyzing chemical compositions or reaction products:

```typescript
const chemicalMixture = {
  a: [0.4, 0.5, 0.3], // Compound A
  b: [0.3, 0.3, 0.4], // Compound B
  c: [0.3, 0.2, 0.3]  // Compound C
};
```

## Reading a Ternary Plot

### Understanding the Axes

Each vertex of the triangle represents 100% of one component:

```
        A = 100%
       / \
      /   \
     /     \
    /       \
   /         \
  B = 100%----C = 100%
```

### How to Read Values:

1. **Component A (top vertex)**: Read parallel to the bottom side (BC)
2. **Component B (left vertex)**: Read parallel to the right side (AC)
3. **Component C (right vertex)**: Read parallel to the left side (AB)

### Example Point:

If a point is located at:
- 50% along lines parallel to BC
- 30% along lines parallel to AC
- 20% along lines parallel to AB

Then the composition is: **A=50%, B=30%, C=20%**

## Basic Implementation

```typescript
import { renderTernaryPlot } from 'sci-plot/renderer/ternary';

// Prepare canvas
const canvas = document.getElementById('ternary') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Define data (must sum to 1 for each point)
const data = {
  a: [0.5, 0.3, 0.6],
  b: [0.3, 0.4, 0.2],
  c: [0.2, 0.3, 0.2]
};

// Render with options
renderTernaryPlot(ctx, data, {
  labelA: 'Component A',
  labelB: 'Component B',
  labelC: 'Component C',
  showGrid: true,
  showLabels: true,
  style: {
    pointSize: 8,
    color: '#00f2ff',
    gridDivisions: 10
  }
});
```

## Styling Options

### Grid Customization

```typescript
style: {
  gridColor: 'rgba(255, 255, 255, 0.2)',
  gridWidth: 1,
  gridDivisions: 10  // 10%, 20%, 30%, etc.
}
```

**Grid Divisions:**
- `5`: Coarse grid (20% intervals)
- `10`: Standard grid (10% intervals) ← Recommended
- `20`: Fine grid (5% intervals)

### Point Styling

```typescript
style: {
  pointSize: 8,
  color: '#00f2ff',
  fillOpacity: 0.7
}
```

**Point Size Guidelines:**
- Small datasets (< 20 points): `pointSize: 10-12`
- Medium datasets (20-100): `pointSize: 6-8`
- Large datasets (> 100): `pointSize: 3-5`

## Advanced Features

### Multiple Datasets

To compare multiple datasets, render them with different colors:

```typescript
// Dataset 1 - Soil Type A
renderTernaryPlot(ctx, soilTypeA, {
  style: { color: '#00f2ff', pointSize: 8 }
});

// Dataset 2 - Soil Type B (overlay)
renderTernaryPoints(ctx, soilTypeB, centerX, centerY, size, 8, '#ff6b6b');
```

### Data Normalization

The renderer automatically normalizes data if it doesn't sum to 1:

```typescript
// These will be normalized automatically
const data = {
  a: [60, 40, 20],  // Will become [0.6, 0.4, 0.2]
  b: [30, 40, 60],  // Will become [0.3, 0.4, 0.6]
  c: [10, 20, 20]   // Will become [0.1, 0.2, 0.2]
};
// Sum for each point: 100, 100, 100 → normalized to 1
```

### Coordinate Conversion

Convert between ternary and Cartesian coordinates:

```typescript
import { ternaryToCartesian } from 'sci-plot/renderer/ternary';

const point = ternaryToCartesian(0.5, 0.3, 0.2);
// Returns: { x: 0.35, y: 0.2598... }
```

## Best Practices

### 1. Data Validation

Always ensure your data is valid:

```typescript
function validateTernaryData(a: number, b: number, c: number): boolean {
  return a >= 0 && b >= 0 && c >= 0 && Math.abs(a + b + c - 1) < 0.001;
}
```

### 2. Meaningful Labels

Use clear, descriptive component names:

```typescript
// Good
{ labelA: 'Sand (%)', labelB: 'Silt (%)', labelC: 'Clay (%)' }

// Bad
{ labelA: 'A', labelB: 'B', labelC: 'C' }
```

### 3. Appropriate Grid Resolution

Choose grid divisions based on data precision:

- Laboratory data: `gridDivisions: 20` (5% precision)
- Field data: `gridDivisions: 10` (10% precision)
- Estimates: `gridDivisions: 5` (20% precision)

### 4. Color Selection

Use colors that contrast well with the background and each other:

- Dark theme: Bright colors (#00f2ff, #ff6b6b, #ffd700)
- Light theme: Darker colors (#0066cc, #cc0000, #cc8800)

## Performance Considerations

- **Canvas Size**: Use at least 600x600px for clear visualization
- **Point Count**: Can efficiently handle thousands of points
- **Grid Complexity**: Higher divisions increase render time linearly
- **Device Pixel Ratio**: The demo accounts for high-DPI displays automatically

## Limitations

- Only works for exactly **3 components**
- Components must be **non-negative**
- No built-in **contour lines** (can be added manually)
- No automatic **region labeling** (e.g., soil type regions)

## Mathematical Background

### Coordinate Transformation

The transformation from ternary (a, b, c) to Cartesian (x, y) is:

```
x = c + b/2
y = b × √3/2
```

Where:
- a, b, c are normalized so that a + b + c = 1
- The triangle has unit base length
- Height = √3/2

### Why It Works

Since a + b + c = 1, we only need two independent variables. The ternary plot exploits this constraint to represent 3D compositional space in 2D.

## Troubleshooting

### Points Not Visible

**Cause**: Data not normalized or out of range  
**Solution**: Check that each point sums to 1 (or use automatic normalization)

### Grid Lines Missing

**Cause**: `showGrid: false` or grid color matches background  
**Solution**: Set `showGrid: true` and adjust `gridColor`

### Labels Cut Off

**Cause**: Canvas too small  
**Solution**: Use minimum 600x600px canvas size

## See Also

- [Ternary Charts API Reference](/api/ternary-charts)
- [Polar Charts](/examples/polar-charts) - For 2D polar coordinates
- [Radar Charts](/examples/radar-charts) - For multi-axis comparisons
- [Sankey Diagrams](/examples/sankey-diagram) - For flow visualization
