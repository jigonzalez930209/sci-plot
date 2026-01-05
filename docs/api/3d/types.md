# 3D Types Reference

Complete TypeScript type definitions for the 3D module.

## Renderer Options

### Renderer3DOptions

```typescript
interface Renderer3DOptions {
  canvas: HTMLCanvasElement;
  backgroundColor?: [number, number, number, number];
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  maxInstances?: number;
}
```

### Bubble3DRendererOptions

```typescript
interface Bubble3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  style?: Bubble3DStyle;
  autoRender?: boolean;
}
```

## Style Options

### Bubble3DStyle

```typescript
interface Bubble3DStyle {
  opacity?: number;
  defaultColor?: [number, number, number];
  defaultScale?: number;
  geometry?: 'icosphere' | 'uvsphere' | 'cube';
  subdivisions?: number;
  enableLighting?: boolean;
  lightDirection?: Vec3;
  ambient?: number;
}
```

## Data Types

### Bubble3DData

```typescript
interface Bubble3DData {
  positions: Float32Array;  // xyz interleaved (length = count * 3)
  scales?: Float32Array;    // per-instance scale (length = count)
  colors?: Float32Array;    // rgb interleaved (length = count * 3)
}
```

## Scene Configuration

### Axis3DConfig

```typescript
interface Axis3DConfig {
  visible?: boolean;
  min?: number;
  max?: number;
  label?: string;
  color?: [number, number, number];
  gridLines?: boolean;
  gridColor?: [number, number, number];
}
```

### Scene3DOptions

```typescript
interface Scene3DOptions {
  xAxis?: Axis3DOptions;
  yAxis?: Axis3DOptions;
  zAxis?: Axis3DOptions;
  showAxes?: boolean;
  showGrid?: boolean;
  gridPlane?: 'xz' | 'xy' | 'yz' | 'all';
  backgroundColor?: [number, number, number, number];
}
```

### Light3DOptions

```typescript
interface Light3DOptions {
  direction?: Vec3;
  color?: [number, number, number];
  intensity?: number;
  ambient?: number;
}
```

## Bounds & Stats

### Bounds3D

```typescript
interface Bounds3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}
```

### RenderStats3D

```typescript
interface RenderStats3D {
  instanceCount: number;
  drawCalls: number;
  frameTime: number;
  fps: number;
}
```

## Camera

### CameraState

```typescript
interface CameraState {
  target: Vec3;
  radius: number;
  theta: number;
  phi: number;
  fov: number;
}
```

### OrbitCameraOptions

```typescript
interface OrbitCameraOptions {
  target?: Vec3;
  radius?: number;
  theta?: number;
  phi?: number;
  fov?: number;
  near?: number;
  far?: number;
  minRadius?: number;
  maxRadius?: number;
  minPhi?: number;
  maxPhi?: number;
}
```

### OrbitControllerOptions

```typescript
interface OrbitControllerOptions {
  rotateSpeed?: number;
  zoomSpeed?: number;
  panSpeed?: number;
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  rotateButton?: number;
  panButton?: number;
  dampingFactor?: number;
}
```

## Events

### Renderer3DEventType

```typescript
type Renderer3DEventType = 
  | 'render'
  | 'resize'
  | 'cameraChange'
  | 'dataUpdate';
```

### Renderer3DEvent

```typescript
interface Renderer3DEvent {
  type: Renderer3DEventType;
  timestamp: number;
  stats?: RenderStats3D;
  camera?: CameraState;
}
```

### Renderer3DEventCallback

```typescript
type Renderer3DEventCallback = (event: Renderer3DEvent) => void;
```

## Geometry

### GeometryData

```typescript
interface GeometryData {
  positions: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  indexCount: number;
}
```

### InstanceData

```typescript
interface InstanceData {
  positions: Float32Array;  // xyz per instance
  scales: Float32Array;     // scale per instance
  colors: Float32Array;     // rgb per instance
}
```

## Shader

### ShaderProgram3D

```typescript
interface ShaderProgram3D {
  program: WebGLProgram;
  attributes: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation | null>;
}
```

### ProgramBundle3D

```typescript
interface ProgramBundle3D {
  bubbleProgram: ShaderProgram3D;
  bubbleFlatProgram: ShaderProgram3D;
  axisProgram: ShaderProgram3D;
  surfaceProgram: ShaderProgram3D;
  linePointProgram: ShaderProgram3D;
  waterfallProgram: ShaderProgram3D;
}
```
