---
title: Bubble3DRenderer API
description: Master the Bubble3DRenderer for high-performance 3D bubble charts, utilizing WebGL2 instanced rendering for visualizing thousands of 3D data points.
---

# Bubble3DRenderer

High-performance 3D bubble chart renderer with instanced rendering.

## Constructor

```typescript
new Bubble3DRenderer(options: Bubble3DRendererOptions)
```

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `canvas` | `HTMLCanvasElement` | **required** | Target canvas element |
| `backgroundColor` | `[r, g, b, a]` | `[0.05, 0.05, 0.1, 1]` | Background color |
| `antialias` | `boolean` | `true` | Enable antialiasing |
| `maxInstances` | `number` | `100000` | Maximum bubble count |
| `autoRender` | `boolean` | `true` | Auto render loop |
| `camera` | `OrbitCameraOptions` | `{}` | Camera configuration |
| `controls` | `OrbitControllerOptions` | `{}` | Control settings |
| `style` | `Bubble3DStyle` | `{}` | Visual style |

### Style Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `geometry` | `'icosphere' \| 'uvsphere' \| 'cube'` | `'icosphere'` | Bubble geometry |
| `subdivisions` | `number` | `1` | Icosphere subdivisions |
| `enableLighting` | `boolean` | `true` | Enable diffuse lighting |
| `lightDirection` | `[x, y, z]` | `[1, 1, 1]` | Light direction |
| `ambient` | `number` | `0.3` | Ambient light intensity |
| `opacity` | `number` | `1` | Global opacity |
| `defaultColor` | `[r, g, b]` | `[0.2, 0.6, 1]` | Default bubble color |
| `defaultScale` | `number` | `0.1` | Default bubble size |

## Methods

### setData(data)

Set bubble data for rendering.

```typescript
renderer.setData({
  positions: Float32Array,  // xyz interleaved (length = count * 3)
  colors?: Float32Array,    // rgb interleaved (length = count * 3)
  scales?: Float32Array,    // per-bubble scale (length = count)
});
```

### fitToData()

Adjust camera to view all data.

```typescript
renderer.fitToData();
```

### render()

Render a single frame (called automatically if `autoRender: true`).

```typescript
renderer.render();
```

### requestRender()

Request render on next frame.

```typescript
renderer.requestRender();
```

### getCamera()

Get camera instance for direct manipulation.

```typescript
const camera = renderer.getCamera();
camera.setSpherical(theta, phi, radius);
```

### getController()

Get controller instance.

```typescript
const controller = renderer.getController();
controller.rotateSpeed = 0.01;
```

### setStyle(style)

Update style options.

```typescript
renderer.setStyle({
  opacity: 0.8,
  enableLighting: false,
});
```

### setBackgroundColor(r, g, b, a?)

Set background color.

```typescript
renderer.setBackgroundColor(0.1, 0.1, 0.2, 1);
```

### getStats()

Get render statistics.

```typescript
const stats = renderer.getStats();
// { instanceCount, drawCalls, frameTime, fps }
```

### on(event, callback)

Add event listener.

```typescript
renderer.on('render', (e) => {
  console.log(e.stats.fps);
});
```

Events: `'render'`, `'resize'`, `'cameraChange'`, `'dataUpdate'`

### off(event, callback)

Remove event listener.

### resize()

Manually trigger resize (called automatically on window resize).

### destroy()

Clean up all resources.

```typescript
renderer.destroy();
```

## Example

```typescript
import { Bubble3DRenderer } from 'scichart-engine/core/3d';

const renderer = new Bubble3DRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  style: {
    geometry: 'icosphere',
    subdivisions: 2,
    enableLighting: true,
  },
});

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
  scales[i] = 0.05 + Math.random() * 0.1;
}

renderer.setData({ positions, colors, scales });
renderer.fitToData();
```
