# 3D Vector Field (Quiver) Chart

Visualize directional data (velocity, fluid flow, gradients) in 3D space with high-performance arrows.

<ChartDemo3D type="quiver-3d" />

## Overview

The Vector Field 3D chart renders a grid of directional arrows (vectors). Each arrow's position, direction, and color can be independently controlled, making it ideal for:

- **Computational Fluid Dynamics (CFD)**: Flow velocity and pressure
- **Magnetic Fields**: Strength and orientation
- **Wind Patterns**: Meteorology and climate modeling
- **Gradient Analysis**: Mathematical surfaces and physics

## Basic Usage

```typescript
import { VectorField3DRenderer } from 'scichart-engine/core/3d';

const renderer = new VectorField3DRenderer({
  canvas: document.getElementById('canvas'),
  showAxes: true,
});

// Create a 10x10x10 grid of vectors
const gridSize = 10;
const positions = new Float32Array(gridSize ** 3 * 3);
const directions = new Float32Array(gridSize ** 3 * 3);

for (let x = 0; x < gridSize; x++) {
  for (let y = 0; y < gridSize; y++) {
    for (let z = 0; z < gridSize; z++) {
      const idx = (x * gridSize * gridSize + y * gridSize + z) * 3;
      
      // Position in space
      positions[idx] = x - 5;
      positions[idx + 1] = y - 5;
      positions[idx + 2] = z - 5;
      
      // Direction (e.g., a vortex flow)
      directions[idx] = -positions[idx + 1]; // dx
      directions[idx + 1] = positions[idx];  // dy
      directions[idx + 2] = 0.1;             // dz
    }
  }
}

renderer.setData({
  positions,
  directions,
});
```

## Scaling and Magnitudes

The renderer automatically scales the arrows based on the magnitude of the direction vectors. You can further adjust this with `scaleMultiplier`:

```typescript
const renderer = new VectorField3DRenderer({
  canvas: canvas,
  scaleMultiplier: 1.5, // Globally increase arrow size
});
```

## Color Mapping

You can provide per-vector colors to represent additional variables like temperature or speed magnitude:

```typescript
const colors = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const speed = magnitude(directions[i]); // Calculate magnitude
  const color = colorScale(speed);         // Map speed to color
  colors[i * 3] = color[0];
  colors[i * 3 + 1] = color[1];
  colors[i * 3 + 2] = color[2];
}

renderer.setData({
  positions,
  directions,
  colors,
});
```

## Interactive Tooltips

When enabled, hovering over a vector provides precise data:

```typescript
const renderer = new VectorField3DRenderer({
  canvas: canvas,
  enableTooltip: true,
});
```

## API Reference

See [VectorField3DRenderer API](/api/3d/vector-field-renderer)
