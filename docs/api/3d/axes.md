---
title: Axes3D API
description: Comprehensive documentation for 3D axis rendering, including wall grids, tick marks, numeric labels, and 2D text overlay projection utilities.
---

# Axes3D API

3D axis renderer with wall grids, tick marks, and text labels.

## Overview

The `Axes3D` class renders a complete 3D axis system including:
- **Box wireframe** around the data bounds
- **Wall grids** on three planes (XZ floor, XY back wall, YZ side wall)
- **Axis lines** with colored X (red), Y (green), Z (blue) indicators
- **Tick marks** with numeric labels
- **2D text overlay support** via projection utilities

## Basic Usage

```typescript
import { Bubble3DRenderer } from 'scichart-engine/core/3d';

// Axes are enabled by default
const renderer = new Bubble3DRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  showAxes: true, // default
  axes: {
    xAxis: { label: 'Time (s)' },
    yAxis: { label: 'Amplitude' },
    zAxis: { label: 'Frequency (Hz)' },
    showWallGrids: true,
    showFloorGrid: true,
    tickCount: 5,
  },
});
```

## Axes3DOptions

```typescript
interface Axes3DOptions {
  // Individual axis configuration
  xAxis?: Axis3DConfig & { label?: string; tickFormat?: (v: number) => string };
  yAxis?: Axis3DConfig & { label?: string; tickFormat?: (v: number) => string };
  zAxis?: Axis3DConfig & { label?: string; tickFormat?: (v: number) => string };
  
  // Display options
  showAxes?: boolean;        // Show colored axis lines (default: true)
  showWallGrids?: boolean;   // Show grids on back/side walls (default: true)
  showFloorGrid?: boolean;   // Show grid on XZ floor plane (default: true)
  
  // Styling
  gridColor?: [number, number, number];     // Grid line color RGB (default: [0.4, 0.45, 0.5])
  gridOpacity?: number;                     // Grid opacity (default: 0.4)
  wallGridOpacity?: number;                 // Wall grid opacity (default: 0.2)
  boxColor?: [number, number, number];      // Box wireframe color (default: [0.3, 0.35, 0.4])
  boxOpacity?: number;                      // Box wireframe opacity (default: 0.5)
  
  // Ticks
  tickCount?: number;        // Number of ticks per axis (default: 5)
  lineWidth?: number;        // Axis line width (default: 1)
  labelSize?: number;        // Label font size in pixels (default: 14)
}
```

## Axis3DConfig

Configuration for individual axes:

```typescript
interface Axis3DConfig {
  visible?: boolean;                        // Show this axis (default: true)
  min?: number;                             // Minimum value (auto-calculated from data)
  max?: number;                             // Maximum value (auto-calculated from data)
  label?: string;                           // Axis title (e.g., "Time (s)")
  color?: [number, number, number];         // Axis line color RGB
  gridLines?: boolean;                      // Show grid lines for this axis
  gridColor?: [number, number, number];     // Grid line color for this axis
}
```

## Custom Tick Formatting

```typescript
const renderer = new Bubble3DRenderer({
  canvas,
  axes: {
    xAxis: {
      label: 'Frequency',
      tickFormat: (v) => `${v.toFixed(0)} Hz`,
    },
    yAxis: {
      label: 'Power',
      tickFormat: (v) => `${v.toFixed(1)} dB`,
    },
    zAxis: {
      label: 'Time',
      tickFormat: (v) => `${v.toFixed(2)} s`,
    },
  },
});
```

## Accessing Labels for Text Overlay

The `Bubble3DRenderer` provides methods to get axis labels for custom 2D text rendering:

```typescript
// Get all axis labels with their 3D positions
const labels = renderer.getAxisLabels();
// Returns: Array<{
//   text: string;
//   worldPosition: [number, number, number];
//   axis: 'x' | 'y' | 'z' | 'title';
//   color: [number, number, number];
// }>

// Project a 3D position to 2D screen coordinates
const screen = renderer.projectToScreen([1, 2, 3]);
// Returns: { x: number; y: number; visible: boolean }
```

## Wall Grid Planes

The axis system renders grids on three wall planes:

| Plane | Description | Variables |
|-------|-------------|-----------|
| XZ Floor | Horizontal grid at Y minimum | X and Z axes |
| XY Back | Vertical back wall at Z minimum | X and Y axes |
| YZ Side | Vertical side wall at X minimum | Y and Z axes |

## Default Axis Colors

| Axis | Color | RGB |
|------|-------|-----|
| X | Red | `[0.9, 0.3, 0.3]` |
| Y | Green | `[0.3, 0.9, 0.3]` |
| Z | Blue | `[0.3, 0.3, 0.9]` |

## Disabling Axes

```typescript
// Disable all axes
const renderer = new Bubble3DRenderer({
  canvas,
  showAxes: false,
});

// Disable specific features
const renderer = new Bubble3DRenderer({
  canvas,
  axes: {
    showWallGrids: false,  // No wall grids
    showFloorGrid: true,   // Only floor grid
    xAxis: { visible: false }, // Hide X axis
  },
});
```

## Integration with Custom UIs

For advanced label rendering with custom fonts or animations:

```typescript
// Create a 2D canvas overlay
const overlay = document.createElement('canvas');
overlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
container.appendChild(overlay);
const ctx = overlay.getContext('2d');

// Render labels on each frame
renderer.on('render', () => {
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  
  const labels = renderer.getAxisLabels();
  for (const label of labels) {
    const screen = renderer.projectToScreen(label.worldPosition);
    if (!screen.visible) continue;
    
    ctx.fillStyle = `rgb(${label.color.map(c => c * 255).join(',')})`;
    ctx.fillText(label.text, screen.x, screen.y);
  }
});
```

## Related

- [Bubble3DRenderer](/api/3d/bubble-renderer) - Main 3D renderer
- [OrbitCamera](/api/3d/camera) - Camera controls
- [3D Charts Guide](/guide/3d/getting-started) - Getting started with 3D charts
