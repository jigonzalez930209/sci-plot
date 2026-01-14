---
title: Polar Charts
description: Visualize data in polar coordinates (r, θ) for circular patterns and cyclic phenomena
---

# Polar Charts

Polar charts display data in polar coordinates, where each point is defined by a radial distance (r) and an angular position (θ). This visualization is ideal for circular patterns, directional data, and cyclic phenomena.

## Features

- **Dual Angle Modes**: Support for both degrees and radians
- **Fill Options**: Optional area fill from origin
- **Path Closing**: Connect last point to first for closed shapes
- **Polar Grid**: Customizable radial and angular grid lines
- **Flexible Rendering**: Line or filled area modes
- **Auto Bounds**: Automatic symmetric bounds calculation

## Basic Usage

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  title: 'Polar Chart Example'
});

// Create polar data
const polarData = {
  r: new Float32Array([1, 2, 3, 2.5, 1.5]),
  theta: new Float32Array([0, 72, 144, 216, 288]) // degrees
};

chart.addSeries({
  id: 'polar1',
  type: 'polar',
  name: 'Polar Series',
  data: polarData,
  style: {
    color: '#00f2ff',
    width: 2,
    angleMode: 'degrees'
  }
});
```

## Data Format

### PolarData Interface

```typescript
interface PolarData {
  /** Radial values (distance from origin) */
  r: Float32Array | Float64Array | number[];
  /** Angular values (theta) */
  theta: Float32Array | Float64Array | number[];
}
```

**Important**: The `r` and `theta` arrays must have the same length.

## Styling Options

### PolarStyle Interface

```typescript
interface PolarStyle {
  // Basic styling
  color?: string;              // Line/fill color
  width?: number;              // Line width in pixels
  opacity?: number;            // Overall opacity (0-1)
  
  // Angle configuration
  angleMode?: 'degrees' | 'radians';  // Default: 'degrees'
  
  // Fill options
  fill?: boolean;              // Fill area to origin (default: false)
  fillColor?: string;          // Fill color (default: same as line)
  fillOpacity?: number;        // Fill opacity (default: 0.3)
  closePath?: boolean;         // Connect last to first (default: false)
  
  // Grid configuration
  showRadialGrid?: boolean;    // Show concentric circles (default: true)
  showAngularGrid?: boolean;   // Show radial spokes (default: true)
  angularDivisions?: number;   // Number of angular divisions (default: 12)
  radialDivisions?: number;    // Number of radial divisions (default: 5)
  
  // Scatter points
  pointSize?: number;          // Point marker size
  symbol?: ScatterSymbol;      // Point marker shape
}
```

## Examples

### Wind Rose Diagram

```typescript
// Wind direction and speed data
const windData = {
  theta: new Float32Array([0, 45, 90, 135, 180, 225, 270, 315]),
  r: new Float32Array([5, 8, 12, 6, 4, 7, 15, 10])
};

chart.addSeries({
  id: 'wind-rose',
  type: 'polar',
  name: 'Wind Distribution',
  data: windData,
  style: {
    color: '#4ecdc4',
    width: 2,
    fill: true,
    fillOpacity: 0.4,
    closePath: true,
    angularDivisions: 8  // 45° intervals
  }
});
```

### Cyclic Voltammetry

```typescript
// Generate CV data (current vs potential in polar form)
function generateCVData(cycles: number = 1) {
  const points = 200 * cycles;
  const r = new Float32Array(points);
  const theta = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    const t = (i / points) * cycles * 2 * Math.PI;
    const potential = Math.sin(t);
    const current = Math.exp(-Math.pow(t - Math.PI, 2)) * 0.5;
    
    // Convert to polar
    r[i] = Math.sqrt(potential * potential + current * current);
    theta[i] = Math.atan2(current, potential) * 180 / Math.PI;
  }
  
  return { r, theta };
}

chart.addSeries({
  id: 'cv',
  type: 'polar',
  name: 'Cyclic Voltammetry',
  data: generateCVData(3),
  style: {
    color: '#ff6b6b',
    width: 1.5,
    angleMode: 'degrees'
  }
});
```

### Radar Chart (Multi-Metric)

```typescript
// Performance metrics
const metrics = {
  theta: new Float32Array([0, 60, 120, 180, 240, 300]),
  r: new Float32Array([85, 90, 75, 80, 95, 70])
};

chart.addSeries({
  id: 'performance',
  type: 'polar',
  name: 'Performance Metrics',
  data: metrics,
  style: {
    color: '#00f2ff',
    width: 2,
    fill: true,
    fillColor: 'rgba(0, 242, 255, 0.2)',
    closePath: true,
    pointSize: 6,
    symbol: 'circle',
    angularDivisions: 6
  }
});
```

### Spiral Pattern

```typescript
// Archimedean spiral
function generateSpiral(turns: number = 3) {
  const points = 200;
  const r = new Float32Array(points);
  const theta = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * turns * 360;
    theta[i] = angle;
    r[i] = angle / 360; // Radius increases linearly with angle
  }
  
  return { r, theta };
}

chart.addSeries({
  id: 'spiral',
  type: 'polar',
  data: generateSpiral(5),
  style: {
    color: '#9b59b6',
    width: 2,
    angleMode: 'degrees'
  }
});
```

## Angle Modes

### Degrees (Default)

```typescript
{
  angleMode: 'degrees',
  theta: [0, 90, 180, 270] // Quarter circle
}
```

- Range: 0° to 360°
- 0° is at 3 o'clock position
- Increases counter-clockwise

### Radians

```typescript
{
  angleMode: 'radians',
  theta: [0, Math.PI/2, Math.PI, 3*Math.PI/2]
}
```

- Range: 0 to 2π
- 0 is at 3 o'clock position
- Increases counter-clockwise

## Grid Customization

### Angular Divisions

Controls the number of radial spokes from the origin:

```typescript
{
  angularDivisions: 12  // 30° intervals (360/12)
}
```

Common values:
- `4` - Cardinal directions (N, E, S, W)
- `8` - 45° intervals
- `12` - 30° intervals (default)
- `16` - 22.5° intervals

### Radial Divisions

Controls the number of concentric circles:

```typescript
{
  radialDivisions: 5  // 5 concentric circles (default)
}
```

## Coordinate Conversion

The polar renderer automatically converts (r, θ) to Cartesian (x, y):

```
x = r × cos(θ)
y = r × sin(θ)
```

You can access the conversion utilities directly:

```typescript
import { polarToCartesian } from 'scichart-engine';

const cartesian = polarToCartesian(
  new Float32Array([1, 2, 3]),
  new Float32Array([0, 90, 180]),
  'degrees'
);
// Returns: Float32Array [1, 0, 0, 2, -3, 0]
```

## Bounds and Scaling

Polar charts use symmetric bounds centered at the origin:

```typescript
import { calculatePolarBounds } from 'scichart-engine';

const bounds = calculatePolarBounds(polarData);
// Returns: { xMin, xMax, yMin, yMax, maxRadius }
```

The chart automatically:
- Centers the origin at (0, 0)
- Sets symmetric bounds: `[-maxR, maxR]` for both axes
- Scales to fit the plot area

## Performance Tips

1. **Use Float32Array**: For large datasets, use typed arrays for better performance
2. **Limit Points**: Polar charts with 1000+ points may benefit from downsampling
3. **Disable Fill**: Line-only mode is faster than filled mode
4. **Reduce Grid**: Fewer divisions = faster rendering

## Common Use Cases

### Scientific Applications
- **Electrochemistry**: Cyclic voltammetry, Nyquist plots
- **Antenna Patterns**: Radiation patterns, directivity
- **Crystallography**: X-ray diffraction patterns

### Data Visualization
- **Wind Roses**: Wind speed and direction distribution
- **Radar Charts**: Multi-dimensional comparisons
- **Circular Histograms**: Angular data distribution

### Navigation & Mapping
- **Compass Roses**: Directional data
- **Sonar/Radar**: Detection patterns
- **Satellite Orbits**: Orbital mechanics

## API Reference

### Series Options

```typescript
interface PolarOptions {
  id: string;
  type: 'polar';
  name?: string;
  data: PolarData;
  style?: PolarStyle;
  visible?: boolean;
}
```

### Utility Functions

```typescript
// Convert polar to Cartesian
polarToCartesian(
  r: Float32Array,
  theta: Float32Array,
  angleMode: 'degrees' | 'radians'
): Float32Array

// Generate polar grid
generatePolarGrid(
  maxRadius: number,
  radialDivisions: number,
  angularDivisions: number,
  angleMode: 'degrees' | 'radians'
): { radialLines: Float32Array; angularLines: Float32Array }

// Calculate bounds
calculatePolarBounds(
  data: PolarData
): { xMin, xMax, yMin, yMax, maxRadius }

// Normalize angles
normalizeAngles(
  theta: Float32Array,
  angleMode: 'degrees' | 'radians'
): Float32Array
```

## See Also

- [Polar Chart Demo](/examples/polar-charts) - Interactive examples
- [Series Types](/api/series) - Other chart types
- [Styling](/api/themes) - Theme customization
