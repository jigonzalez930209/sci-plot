---
title: 3D Bubble Chart
description: Interactive 3D bubble chart with instanced rendering for high performance, visualizing data with customizable spheres, colors, and sizes in WebGL2.
---

# 3D Bubble Chart

Interactive 3D bubble chart with instanced rendering for high performance.

<ChartDemo3D type="bubble-3d" />

## Overview

The 3D Bubble Chart renders thousands of spherical markers in 3D space, each with customizable position, size, and color. Uses WebGL2 instanced rendering for optimal performance.

## Basic Usage

```typescript
import { Bubble3DRenderer } from 'sci-plot/core/3d';

const renderer = new Bubble3DRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  style: {
    geometry: 'icosphere',
    subdivisions: 1,
    enableLighting: true,
  },
});

// Generate random data
const count = 10000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const scales = new Float32Array(count);

for (let i = 0; i < count; i++) {
  positions[i * 3] = Math.random() * 10 - 5;
  positions[i * 3 + 1] = Math.random() * 10 - 5;
  positions[i * 3 + 2] = Math.random() * 10 - 5;
  
  colors[i * 3] = Math.random();
  colors[i * 3 + 1] = Math.random();
  colors[i * 3 + 2] = Math.random();
  
  scales[i] = 0.05 + Math.random() * 0.15;
}

renderer.setData({ positions, colors, scales });
renderer.fitToData();
```

## Configuration Options

### Geometry Types

```typescript
// Icosphere (default) - uniform vertex distribution
style: { geometry: 'icosphere', subdivisions: 2 }

// UV Sphere - good for textured spheres
style: { geometry: 'uvsphere' }

// Cube - fastest, good for distant/small bubbles
style: { geometry: 'cube' }
```

### Lighting

```typescript
style: {
  enableLighting: true,
  lightDirection: [1, 1, 1],
  ambient: 0.3,
}
```

### Camera Controls

| Action | Mouse | Touch |
|--------|-------|-------|
| Rotate | Left click + drag | 1 finger drag |
| Zoom | Scroll wheel | Pinch 2 fingers |
| Pan | Right click + drag | — |

## Performance

- **10,000 bubbles**: 60 FPS
- **100,000 bubbles**: 30-60 FPS (depends on GPU)
- **Single draw call**: All instances rendered in one GPU call

## API Reference

See [Bubble3DRenderer API](/api/3d/bubble-renderer)
