# Getting Started with 3D Charts

Learn how to create interactive 3D visualizations with sci-plot.

## Overview

sci-plot provides a lightweight, high-performance WebGL2-based 3D rendering system with:

- **100,000+ data points** rendered in a single draw call
- **Interactive orbit camera** with rotate, zoom, and pan
- **3D axis system** with grids, ticks, and labels
- **Multiple chart types**: Bubble, Scatter, Surface, Waterfall, and more

## Quick Start

### 1. Installation

```bash
npm install sci-plot
# or
pnpm add sci-plot
```

### 2. Create a Container

```html
<div id="chart-container" style="width: 800px; height: 600px;"></div>
```

### 3. Initialize the Renderer

```typescript
import { Bubble3DRenderer } from 'sci-plot/core/3d';

const canvas = document.createElement('canvas');
document.getElementById('chart-container').appendChild(canvas);

const renderer = new Bubble3DRenderer({
  canvas,
  backgroundColor: [0.05, 0.05, 0.1, 1], // Dark blue
});
```

### 4. Add Data

```typescript
const count = 5000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const scales = new Float32Array(count);

for (let i = 0; i < count; i++) {
  // Random positions
  positions[i * 3] = Math.random() * 10 - 5;
  positions[i * 3 + 1] = Math.random() * 10 - 5;
  positions[i * 3 + 2] = Math.random() * 10 - 5;
  
  // Colors (RGB, 0-1)
  colors[i * 3] = Math.random();
  colors[i * 3 + 1] = Math.random();
  colors[i * 3 + 2] = Math.random();
  
  // Size
  scales[i] = 0.1 + Math.random() * 0.2;
}

renderer.setData({ positions, colors, scales });
renderer.fitToData(); // Auto-fit camera to data
```

## Camera Controls

The 3D chart includes built-in camera controls:

| Gesture | Action |
|---------|--------|
| Left drag | Rotate around center |
| Right drag | Pan (move view) |
| Scroll | Zoom in/out |
| Pinch (touch) | Zoom |

### Programmatic Camera Control

```typescript
const camera = renderer.getCamera();

// Set camera position
camera.setPosition(10, 20, 15);

// Look at specific point
camera.target = [0, 0, 0];

// Adjust field of view
camera.fov = 45;

// Animate to position
camera.animateTo({
  target: [5, 0, 5],
  radius: 20,
  theta: Math.PI / 4,
  phi: Math.PI / 4,
}, 1000);
```

## 3D Axis System

The axis system is enabled by default and includes:

- **Box wireframe** around data bounds
- **Grid lines** on floor and walls
- **Tick marks** with numeric values
- **Axis labels** (X, Y, Z titles)

### Customizing Axes

```typescript
const renderer = new Bubble3DRenderer({
  canvas,
  axes: {
    xAxis: { label: 'Temperature (°C)' },
    yAxis: { label: 'Pressure (kPa)' },
    zAxis: { label: 'Time (s)' },
    tickCount: 6,
    showWallGrids: true,
    showFloorGrid: true,
  },
});
```

### Custom Tick Formatting

```typescript
axes: {
  xAxis: {
    label: 'Frequency',
    tickFormat: (value) => `${value.toFixed(0)} Hz`,
  },
  yAxis: {
    label: 'Power',
    tickFormat: (value) => `${value.toFixed(1)} dB`,
  },
}
```

## Geometry Styles

Choose different bubble geometries:

```typescript
const renderer = new Bubble3DRenderer({
  canvas,
  style: {
    geometry: 'icosphere', // 'icosphere' | 'uvsphere' | 'cube'
    subdivisions: 1,       // Detail level (0-3)
    enableLighting: true,
    ambient: 0.35,
  },
});
```

| Geometry | Description | Performance |
|----------|-------------|-------------|
| `icosphere` | Smooth sphere (default) | Good |
| `uvsphere` | UV-mapped sphere | Good |
| `cube` | Box geometry | Fastest |

## Lighting

Enable diffuse lighting for depth perception:

```typescript
style: {
  enableLighting: true,
  lightDirection: [1, 1, 1],  // Light direction vector
  ambient: 0.3,               // Ambient light level (0-1)
}
```

Set `enableLighting: false` for flat shading (faster, usable for huge datasets).

## Real-Time Updates

Update data dynamically:

```typescript
function updateData() {
  const positions = renderer.getData().positions;
  
  for (let i = 0; i < count; i++) {
    // Animate positions
    positions[i * 3 + 1] = Math.sin(Date.now() * 0.001 + i * 0.1) * 5;
  }
  
  renderer.setData({ positions, colors, scales });
}

// Update at 60 FPS
setInterval(updateData, 16);
```

## Performance Tips

### Large Datasets (50k+ points)

```typescript
const renderer = new Bubble3DRenderer({
  canvas,
  style: {
    geometry: 'cube',        // Faster than sphere
    subdivisions: 0,         // Minimum detail
    enableLighting: false,   // Flat shading
  },
  maxInstances: 200000,      // Pre-allocate buffer
});
```

### Memory Management

```typescript
// Destroy renderer when done
renderer.destroy();
```

## Event Handling

```typescript
// FPS and render stats
renderer.on('render', (event) => {
  console.log('FPS:', event.stats.fps);
  console.log('Instances:', event.stats.instanceCount);
});

// Camera changes
renderer.on('cameraChange', (event) => {
  console.log('Camera:', event.camera);
});
```

## Complete Example

```typescript
import { Bubble3DRenderer } from 'sci-plot/core/3d';

async function createChart() {
  const container = document.getElementById('chart');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%';
  container.appendChild(canvas);
  
  const renderer = new Bubble3DRenderer({
    canvas,
    backgroundColor: [0.05, 0.05, 0.1, 1],
    style: {
      geometry: 'icosphere',
      subdivisions: 1,
      enableLighting: true,
      ambient: 0.35,
    },
    axes: {
      xAxis: { label: 'X Axis' },
      yAxis: { label: 'Y Axis' },
      zAxis: { label: 'Z Axis' },
      tickCount: 5,
    },
  });
  
  // Generate sample data
  const count = 10000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 0.5) * 5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    
    const dist = r / 5;
    colors[i * 3] = 0.2 + dist * 0.5;
    colors[i * 3 + 1] = 0.5 - dist * 0.3;
    colors[i * 3 + 2] = 0.9 - dist * 0.4;
    
    scales[i] = 0.05 + Math.random() * 0.1;
  }
  
  renderer.setData({ positions, colors, scales });
  renderer.fitToData();
  
  // Log FPS
  renderer.on('render', (e) => {
    console.log(`FPS: ${e.stats.fps}, Points: ${e.stats.instanceCount}`);
  });
  
  return renderer;
}

createChart();
```

## Next Steps

- [Bubble Charts](/examples/3d/bubble-chart) - Interactive bubble examples
- [Surface Mesh](/examples/3d/surface-mesh) - 3D surface visualization
- [Waterfall Charts](/examples/3d/waterfall-chart) - Spectrogram-style charts
- [API Reference](/api/3d/) - Complete API documentation
