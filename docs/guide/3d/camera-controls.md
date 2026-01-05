# Camera Controls and Navigation

Learn how to control and customize 3D camera navigation.

## Overview

The 3D chart system uses an orbit camera model:
- Camera orbits around a target point
- User can rotate, zoom, and pan
- Supports mouse, touch, and programmatic control

## Default Controls

| Input | Action |
|-------|--------|
| Left mouse drag | Rotate camera |
| Right mouse drag | Pan (move target) |
| Scroll wheel | Zoom in/out |
| Touch drag | Rotate |
| Two-finger drag | Pan |
| Pinch | Zoom |

## Customizing Control Sensitivity

```typescript
const renderer = new Bubble3DRenderer({
  canvas,
  controls: {
    rotateSpeed: 0.005,  // Rotation sensitivity (default: 0.005)
    panSpeed: 0.003,     // Pan sensitivity (default: 0.003)
    zoomSpeed: 0.001,    // Zoom sensitivity (default: 0.001)
  },
});
```

### High Sensitivity (Fast Response)

```typescript
controls: {
  rotateSpeed: 0.01,
  panSpeed: 0.01,
  zoomSpeed: 0.005,
}
```

### Low Sensitivity (Precise Control)

```typescript
controls: {
  rotateSpeed: 0.002,
  panSpeed: 0.001,
  zoomSpeed: 0.0005,
}
```

## Enabling/Disabling Controls

```typescript
controls: {
  enableRotate: true,   // Allow rotation
  enableZoom: true,     // Allow zoom
  enablePan: true,      // Allow panning
}
```

### View-Only Mode (No Interaction)

```typescript
controls: {
  enableRotate: false,
  enableZoom: false,
  enablePan: false,
}
```

### Rotation Only (Fixed Position)

```typescript
controls: {
  enableRotate: true,
  enableZoom: false,
  enablePan: false,
}
```

## Button Remapping

```typescript
controls: {
  rotateButton: 0,  // Left mouse = rotate (default)
  panButton: 2,     // Right mouse = pan (default)
}

// Swap buttons
controls: {
  rotateButton: 2,  // Right click to rotate
  panButton: 0,     // Left click to pan
}
```

## Momentum/Inertia

The camera has smooth deceleration after releasing:

```typescript
controls: {
  dampingFactor: 0.1,  // 0 = no damping, 1 = instant stop
}
```

### Disable Momentum

```typescript
controls: {
  dampingFactor: 0,  // Instant stop
}
```

### Smooth Momentum

```typescript
controls: {
  dampingFactor: 0.05,  // Slower deceleration
}
```

## Programmatic Camera Control

### Access Camera

```typescript
const camera = renderer.getCamera();
```

### Set Camera Position

```typescript
// Set orbital position
camera.radius = 15;        // Distance from target
camera.theta = Math.PI / 4;  // Horizontal angle (radians)
camera.phi = Math.PI / 4;    // Vertical angle (radians)

// Set target (point camera looks at)
camera.target = [0, 0, 0];

// Set field of view
camera.fov = 45;  // degrees
```

### Get Camera State

```typescript
const state = renderer.getCameraState();
console.log(state);
// {
//   target: [0, 0, 0],
//   radius: 15,
//   theta: 0.785,
//   phi: 0.785,
//   fov: 45
// }
```

### Fit Camera to Data

```typescript
// Auto-fit to show all data
renderer.fitToData();

// Fit with padding
renderer.fitToData({ padding: 1.2 });
```

## Camera Animation

### Animate to Position

```typescript
camera.animateTo({
  target: [5, 0, 5],
  radius: 20,
  theta: Math.PI / 3,
  phi: Math.PI / 6,
}, 1000); // Duration in ms
```

### Animate with Easing

```typescript
camera.animateTo({
  target: [0, 0, 0],
  radius: 10,
}, 500, 'easeOutCubic');
```

Available easing functions:
- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`

### Reset Camera

```typescript
// Reset to initial position
camera.reset();

// Or animate to default
camera.animateTo({
  target: [0, 0, 0],
  radius: 15,
  theta: Math.PI / 4,
  phi: Math.PI / 4,
}, 500);
```

## Camera Events

```typescript
renderer.on('cameraChange', (event) => {
  console.log('Camera moved:', event.camera);
  
  // Save camera state
  localStorage.setItem('cameraState', JSON.stringify(event.camera));
});
```

### Restore Camera State

```typescript
const savedState = localStorage.getItem('cameraState');
if (savedState) {
  const state = JSON.parse(savedState);
  const camera = renderer.getCamera();
  camera.target = state.target;
  camera.radius = state.radius;
  camera.theta = state.theta;
  camera.phi = state.phi;
}
```

## Camera Constraints

### Limit Zoom Range

```typescript
camera.minRadius = 5;   // Minimum distance
camera.maxRadius = 100; // Maximum distance
```

### Limit Vertical Angle

```typescript
camera.minPhi = 0.1;           // Minimum angle (avoid zenith)
camera.maxPhi = Math.PI - 0.1; // Maximum angle (avoid nadir)
```

## Cinematic Animations

### Orbiting Animation

```typescript
function orbitalAnimation() {
  const camera = renderer.getCamera();
  let angle = 0;
  
  function animate() {
    angle += 0.01;
    camera.theta = angle;
    
    if (angle < Math.PI * 2) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}
```

### Flythrough Animation

```typescript
async function flythrough() {
  const camera = renderer.getCamera();
  
  // Keyframes
  const keyframes = [
    { target: [0, 0, 0], radius: 20, theta: 0, phi: Math.PI / 4 },
    { target: [5, 2, 3], radius: 15, theta: Math.PI / 2, phi: Math.PI / 3 },
    { target: [0, 5, 0], radius: 12, theta: Math.PI, phi: Math.PI / 4 },
    { target: [0, 0, 0], radius: 18, theta: Math.PI * 1.5, phi: Math.PI / 3 },
  ];
  
  for (const kf of keyframes) {
    await camera.animateTo(kf, 2000, 'easeInOutCubic');
    await sleep(500);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Multiple Views

### Split Screen

```typescript
// Create two renderers with linked data
const renderer1 = new Bubble3DRenderer({ canvas: canvas1 });
const renderer2 = new Bubble3DRenderer({ canvas: canvas2 });

// Share data
const data = generateData();
renderer1.setData(data);
renderer2.setData(data);

// Different camera angles
renderer1.getCamera().theta = 0;
renderer2.getCamera().theta = Math.PI / 2;
```

## Performance Tips

### Reduce Updates During Animation

```typescript
// Batch updates
renderer.stopRenderLoop();

// Make changes...
camera.target = [1, 2, 3];
camera.radius = 10;

// Resume rendering
renderer.startRenderLoop();
```

### Throttle Camera Events

```typescript
import { throttle } from 'lodash';

const handleCameraChange = throttle((event) => {
  console.log('Camera:', event.camera);
}, 100);

renderer.on('cameraChange', handleCameraChange);
```

## Related

- [OrbitController API](/api/3d/controls) - Controller reference
- [OrbitCamera API](/api/3d/camera) - Camera reference
- [Getting Started](/guide/3d/getting-started) - Introduction
