# Math Utilities

Minimal linear algebra for 3D rendering. No external dependencies.

## Mat4

4x4 matrix operations in column-major order (OpenGL/WebGL convention).

### Types

```typescript
type Mat4 = Float32Array; // 16 elements
type Vec3 = [number, number, number];
```

### Functions

#### create()

Create identity matrix.

```typescript
const m = Mat4.create();
// [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
```

#### identity(out)

Set matrix to identity.

```typescript
Mat4.identity(m);
```

#### copy(out, a)

Copy matrix a to out.

```typescript
Mat4.copy(out, source);
```

#### multiply(out, a, b)

Multiply two matrices: out = a * b.

```typescript
Mat4.multiply(viewProj, proj, view);
```

#### perspective(out, fovY, aspect, near, far)

Create perspective projection matrix.

```typescript
Mat4.perspective(proj, Math.PI / 4, 16/9, 0.1, 1000);
```

#### lookAt(out, eye, center, up)

Create view matrix looking at target from eye position.

```typescript
Mat4.lookAt(view, [0, 5, 10], [0, 0, 0], [0, 1, 0]);
```

#### translate(out, a, v)

Translate matrix by vector.

```typescript
Mat4.translate(model, model, [1, 2, 3]);
```

#### scale(out, a, v)

Scale matrix by vector.

```typescript
Mat4.scale(model, model, [2, 2, 2]);
```

#### rotateX(out, a, rad)

Rotate matrix around X axis.

```typescript
Mat4.rotateX(model, model, Math.PI / 4);
```

#### rotateY(out, a, rad)

Rotate matrix around Y axis.

```typescript
Mat4.rotateY(model, model, Math.PI / 4);
```

#### rotateZ(out, a, rad)

Rotate matrix around Z axis.

```typescript
Mat4.rotateZ(model, model, Math.PI / 4);
```

#### invert(out, a)

Invert matrix. Returns null if not invertible.

```typescript
const inv = Mat4.invert(out, m);
if (!inv) console.error('Matrix not invertible');
```

#### ortho(out, left, right, bottom, top, near, far)

Create orthographic projection matrix.

```typescript
Mat4.ortho(proj, -10, 10, -10, 10, 0.1, 100);
```

---

## Vec3

3D vector operations.

### Types

```typescript
type Vec3 = [number, number, number];
```

### Functions

#### create(x?, y?, z?)

Create a new Vec3.

```typescript
const v = Vec3.create(1, 2, 3);
```

#### clone(a)

Clone a Vec3.

```typescript
const copy = Vec3.clone(v);
```

#### add(out, a, b)

Add two vectors: out = a + b.

```typescript
Vec3.add(result, v1, v2);
```

#### subtract(out, a, b)

Subtract vectors: out = a - b.

```typescript
Vec3.subtract(result, v1, v2);
```

#### scale(out, a, s)

Scale vector: out = a * scalar.

```typescript
Vec3.scale(result, v, 2);
```

#### normalize(out, a)

Normalize vector to unit length.

```typescript
Vec3.normalize(result, v);
```

#### dot(a, b)

Dot product of two vectors.

```typescript
const d = Vec3.dot(v1, v2);
```

#### cross(out, a, b)

Cross product: out = a × b.

```typescript
Vec3.cross(result, v1, v2);
```

#### length(a)

Length of vector.

```typescript
const len = Vec3.length(v);
```

#### distance(a, b)

Distance between two vectors.

```typescript
const dist = Vec3.distance(v1, v2);
```

#### lerp(out, a, b, t)

Linear interpolation: out = a + t * (b - a).

```typescript
Vec3.lerp(result, start, end, 0.5);
```

#### transformMat4(out, a, m)

Transform Vec3 by Mat4 (assumes w=1).

```typescript
Vec3.transformMat4(worldPos, localPos, modelMatrix);
```

## Usage Example

```typescript
import { Mat4, Vec3 } from 'velo-plot/core/3d';

// Create matrices
const model = Mat4.create();
const view = Mat4.create();
const proj = Mat4.create();
const mvp = Mat4.create();

// Setup view
Mat4.lookAt(view, [0, 5, 10], [0, 0, 0], [0, 1, 0]);

// Setup projection
Mat4.perspective(proj, Math.PI / 4, canvas.width / canvas.height, 0.1, 1000);

// Animate model
function animate(time: number) {
  Mat4.identity(model);
  Mat4.rotateY(model, model, time * 0.001);
  
  // Combine: MVP = Proj * View * Model
  Mat4.multiply(mvp, view, model);
  Mat4.multiply(mvp, proj, mvp);
  
  // Upload to shader
  gl.uniformMatrix4fv(mvpLocation, false, mvp);
}
```
