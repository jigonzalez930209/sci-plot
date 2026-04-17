# OrbitController API

Mouse and touch controller for 3D camera navigation.

## Overview

The `OrbitController` handles user input for controlling the `OrbitCamera`:
- **Left mouse drag**: Rotate camera around target
- **Right mouse drag**: Pan camera target
- **Scroll wheel**: Zoom in/out
- **Pinch gesture**: Zoom on touch devices

## Basic Usage

```typescript
import { OrbitCamera, OrbitController } from 'velo-plot/core/3d';

const camera = new OrbitCamera();
const controller = new OrbitController(camera, canvas, {
  rotateSpeed: 0.005,
  zoomSpeed: 0.001,
  panSpeed: 0.003,
});

// Listen for changes
controller.onChange(() => {
  renderer.render();
});
```

## OrbitControllerOptions

```typescript
interface OrbitControllerOptions {
  // Speed settings
  rotateSpeed?: number;    // Rotation sensitivity (default: 0.005)
  zoomSpeed?: number;      // Zoom sensitivity (default: 0.001)
  panSpeed?: number;       // Pan sensitivity (default: 0.003)
  
  // Enable/disable features
  enableRotate?: boolean;  // Allow rotation (default: true)
  enableZoom?: boolean;    // Allow zoom (default: true)
  enablePan?: boolean;     // Allow panning (default: true)
  
  // Button mapping
  rotateButton?: number;   // Mouse button for rotate (default: 0 = left)
  panButton?: number;      // Mouse button for pan (default: 2 = right)
  
  // Momentum
  dampingFactor?: number;  // Inertia factor 0-1 (default: 0.1)
}
```

## Methods

### `onChange(callback)`

Set callback for camera changes:

```typescript
controller.onChange(() => {
  console.log('Camera moved');
  renderer.render();
});
```

### `update()`

Update momentum/damping. Call each frame for smooth deceleration:

```typescript
function animate() {
  const moving = controller.update();
  if (moving) {
    renderer.render();
  }
  requestAnimationFrame(animate);
}
```

### `stopMomentum()`

Immediately stop all momentum:

```typescript
controller.stopMomentum();
```

### `detach()`

Remove event listeners (useful for temporary disable):

```typescript
controller.detach();
```

### `destroy()`

Clean up all resources:

```typescript
controller.destroy();
```

## Mouse Button Mapping

| Button | Value | Default Action |
|--------|-------|----------------|
| Left | 0 | Rotate |
| Middle | 1 | - |
| Right | 2 | Pan |

```typescript
// Swap rotate and pan buttons
const controller = new OrbitController(camera, canvas, {
  rotateButton: 2,  // Right click to rotate
  panButton: 0,     // Left click to pan
});
```

## Touch Gestures

| Gesture | Action |
|---------|--------|
| Single finger drag | Rotate |
| Two finger drag | Pan |
| Pinch | Zoom |

## Momentum/Inertia

The controller supports smooth deceleration after releasing the mouse:

```typescript
const controller = new OrbitController(camera, canvas, {
  dampingFactor: 0.1,  // Higher = faster stop
});

// Must call update() each frame for momentum to work
function animate() {
  controller.update();
  requestAnimationFrame(animate);
}
```

Set `dampingFactor: 0` to disable momentum completely.

## Sensitivity Adjustment

```typescript
// High sensitivity (fast movement)
const controller = new OrbitController(camera, canvas, {
  rotateSpeed: 0.01,
  panSpeed: 0.01,
  zoomSpeed: 0.005,
});

// Low sensitivity (precise control)
const controller = new OrbitController(camera, canvas, {
  rotateSpeed: 0.002,
  panSpeed: 0.001,
  zoomSpeed: 0.0005,
});
```

## Disabling Specific Controls

```typescript
// Rotation only (no zoom, no pan)
const controller = new OrbitController(camera, canvas, {
  enableRotate: true,
  enableZoom: false,
  enablePan: false,
});

// Fixed position, zoom only
const controller = new OrbitController(camera, canvas, {
  enableRotate: false,
  enableZoom: true,
  enablePan: false,
});
```

## Integration with Bubble3DRenderer

The `Bubble3DRenderer` automatically creates an `OrbitController`:

```typescript
const renderer = new Bubble3DRenderer({
  canvas,
  controls: {
    rotateSpeed: 0.005,
    panSpeed: 0.003,
    enablePan: true,
  },
});

// Access the controller
const controller = renderer.getController();
controller.stopMomentum();
```

## Related

- [OrbitCamera](/api/3d/camera) - Camera API
- [Bubble3DRenderer](/api/3d/bubble-renderer) - Main renderer
- [3D Charts Guide](/guide/3d/getting-started) - Getting started guide
