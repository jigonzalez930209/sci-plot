# OrbitCamera

Spherical coordinate camera for 3D scene navigation.

## Constructor

```typescript
new OrbitCamera(options?: OrbitCameraOptions)
```

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `target` | `[x, y, z]` | `[0, 0, 0]` | Point to orbit around |
| `radius` | `number` | `5` | Distance from target |
| `theta` | `number` | `0` | Horizontal angle (radians) |
| `phi` | `number` | `π/4` | Vertical angle (radians) |
| `fov` | `number` | `π/4` | Field of view (radians) |
| `near` | `number` | `0.1` | Near clipping plane |
| `far` | `number` | `1000` | Far clipping plane |
| `minRadius` | `number` | `0.5` | Minimum zoom distance |
| `maxRadius` | `number` | `100` | Maximum zoom distance |
| `minPhi` | `number` | `0.01` | Minimum vertical angle |
| `maxPhi` | `number` | `π - 0.01` | Maximum vertical angle |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `target` | `[x, y, z]` | Current target position |
| `radius` | `number` | Current distance |
| `theta` | `number` | Current horizontal angle |
| `phi` | `number` | Current vertical angle |
| `fov` | `number` | Field of view |
| `aspect` | `number` | Aspect ratio |
| `near` | `number` | Near plane |
| `far` | `number` | Far plane |

## Methods

### setAspect(aspect)

Set aspect ratio (width / height).

```typescript
camera.setAspect(canvas.width / canvas.height);
```

### rotate(deltaTheta, deltaPhi)

Rotate camera by delta angles.

```typescript
camera.rotate(0.1, 0.05); // Rotate right and up
```

### zoom(delta)

Zoom by delta radius (positive = zoom out).

```typescript
camera.zoom(1); // Zoom out
camera.zoom(-1); // Zoom in
```

### zoomFactor(factor)

Zoom by factor (1 = no change, <1 = zoom in, >1 = zoom out).

```typescript
camera.zoomFactor(0.9); // Zoom in 10%
```

### pan(deltaX, deltaY)

Pan camera target in world space.

```typescript
camera.pan(1, 0); // Pan right
```

### setTarget(x, y, z)

Set target position directly.

```typescript
camera.setTarget(0, 0, 0);
```

### setSpherical(theta, phi, radius)

Set camera position from spherical coordinates.

```typescript
camera.setSpherical(Math.PI / 4, Math.PI / 4, 10);
```

### getViewMatrix()

Get view matrix (Float32Array of 16 elements).

```typescript
const view = camera.getViewMatrix();
```

### getProjectionMatrix()

Get projection matrix.

```typescript
const proj = camera.getProjectionMatrix();
```

### getViewProjectionMatrix()

Get combined view-projection matrix.

```typescript
const viewProj = camera.getViewProjectionMatrix();
gl.uniformMatrix4fv(loc, false, viewProj);
```

### getEyePosition()

Get current eye position in world space.

```typescript
const [x, y, z] = camera.getEyePosition();
```

### getForwardDirection()

Get normalized forward direction.

```typescript
const [fx, fy, fz] = camera.getForwardDirection();
```

### reset()

Reset camera to default position.

```typescript
camera.reset();
```

### fitToBounds(minX, minY, minZ, maxX, maxY, maxZ)

Fit camera to view a bounding box.

```typescript
camera.fitToBounds(-5, 0, -5, 5, 10, 5);
```

---

# OrbitController

Mouse/touch interaction handler for OrbitCamera.

## Constructor

```typescript
new OrbitController(camera: OrbitCamera, element: HTMLElement, options?: OrbitControllerOptions)
```

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `rotateSpeed` | `number` | `0.005` | Rotation sensitivity |
| `zoomSpeed` | `number` | `0.001` | Zoom sensitivity |
| `panSpeed` | `number` | `0.01` | Pan sensitivity |
| `enableRotate` | `boolean` | `true` | Enable rotation |
| `enableZoom` | `boolean` | `true` | Enable zoom |
| `enablePan` | `boolean` | `true` | Enable panning |
| `rotateButton` | `number` | `0` | Mouse button for rotate (0=left) |
| `panButton` | `number` | `2` | Mouse button for pan (2=right) |
| `dampingFactor` | `number` | `0.1` | Momentum damping (0-1) |

## Methods

### onChange(callback)

Set callback for camera changes.

```typescript
controller.onChange(() => {
  renderer.requestRender();
});
```

### update()

Update damping (call each frame). Returns `true` if camera is still moving.

```typescript
function animate() {
  const moving = controller.update();
  if (moving) renderer.render();
  requestAnimationFrame(animate);
}
```

### stopMomentum()

Stop all momentum immediately.

```typescript
controller.stopMomentum();
```

### detach()

Remove event listeners.

```typescript
controller.detach();
```

### destroy()

Clean up all resources.

```typescript
controller.destroy();
```

## Interaction Mapping

| Action | Mouse | Touch |
|--------|-------|-------|
| Rotate | Left click + drag | 1 finger drag |
| Zoom | Scroll wheel | Pinch 2 fingers |
| Pan | Right click + drag | — |
