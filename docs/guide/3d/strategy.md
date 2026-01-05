# Motor 3D ligero sin dependencias (scichart-engine)

> **Estado: ✅ Implementado** - Módulo completo en `src/core/3d/`

Este documento describe la arquitectura del módulo 3D para renderizado de burbujas con instancing, sin dependencias externas (sin Three.js ni gl-matrix).

## Objetivos
- Mantener el núcleo ligero (<10 KB adicionales estimados) y agnóstico.
- Maximizar performance (instanced rendering, un solo draw call por lote).
- Proveer API clara para series 3D de burbujas (posiciones, color, tamaño).
- Separar responsabilidades: matemáticas, cámara, mesh instanciado, shaders, interacción.

## Alcance inicial
- WebGL2 como baseline (usar extensiones para WebGL1 solo si es trivial).
- Sin iluminación ni sombras; color plano por instancia.
- Interacción básica: rotación orbital y zoom; raycasting opcional/futuro.
- Geometría base simple (ico/cubo subdividido) para las burbujas.

## Arquitectura de carpetas (implementada)
```
src/core/3d/
├── index.ts                    # Exportaciones públicas
├── Bubble3DRenderer.ts         # Renderer principal (integra todo)
├── types.ts                    # Interfaces comunes
├── math/
│   ├── Mat4.ts                 # Matrices 4x4 (perspective, lookAt, multiply, etc.)
│   ├── Vec3.ts                 # Vectores 3D
│   └── index.ts
├── camera/
│   ├── OrbitCamera.ts          # Cámara orbital (theta, phi, radius)
│   └── index.ts
├── mesh/
│   ├── geometry.ts             # Generadores (icosphere, uvsphere, cube)
│   ├── InstancedMesh.ts        # Buffers instanciados + draw call
│   └── index.ts
├── shader/
│   ├── sources.ts              # GLSL WebGL2 + fallback WebGL1
│   ├── programs.ts             # Compilación/enlazado
│   └── index.ts
└── controls/
    ├── OrbitController.ts      # Mouse/touch/wheel -> cámara
    └── index.ts
```

## Módulos esenciales

### 1) Math3D (Mat4 mínimo)
- **Funciones**: `create()`, `perspective(fov, aspect, near, far)`, `lookAt(eye, center, up)`, `multiply(out, a, b)`, `translate(out, a, v)`, `rotate(out, a, axis, rad)`.
- **Tipo**: `Float32Array(16)`.
- **Riesgos**: signos/orden de multiplicación; añadir tests simples (deterministic matrices) en unit tests.

### 2) Instanced rendering pipeline
- **Geometría base**: ico o cubo subdividido (bajo número de vértices). Subir una sola vez a GPU (VBO + IBO).
- **Buffers de instancia**: estructura intercalada: `[px, py, pz, sx, sy, sz? (o uniform scale), r, g, b]`.
  - Layout propuesto (Float32): pos (3), scale (1), color (3) = 7 floats por instancia (opcional scale vec3 = 9).
- **Draw call**: `gl.drawElementsInstanced` (WebGL2). Si WebGL1: fallback con `ANGLE_instanced_arrays`.
- **Batching**: permitir fraccionar en lotes si `instanceCount > maxInstances` (por límites de buffer).

### 3) Shaders mínimos (GLSL)
- **Vertex**:
  - Atributos: `a_position` (vec3 base geom), `a_instancePos` (vec3), `a_scale` (float), `a_color` (vec3).
  - Uniform: `u_viewProjection` (mat4).
  - Salida: `v_color`.
  - `gl_Position = u_viewProjection * vec4(a_position * a_scale + a_instancePos, 1.0);`
- **Fragment**:
  - Entrada: `v_color`.
  - Salida: color plano (sin luz).
- **Future hooks**: opcional `u_opacity`, `u_sizeJitter`, `u_colorJitter`.

### 4) Cámara / interacción
- **OrbitCamera**: estado `target`, `radius`, `theta`, `phi`, `up`, `fov`, `near`, `far`, `aspect`.
- **OrbitController**: mouse move -> `theta/phi`; wheel -> `radius` (zoom) o `fov`; clamping de `phi` para evitar gimbal flip.
- **Matrices**: `view = lookAt(eye, target, up)`; `proj = perspective(fov, aspect, near, far)`; `viewProj = proj * view`.
- **Resize**: actualizar `aspect` y `proj` en `resize`.

### 5) Datos y API esperada (propuesta)
- Nueva serie: `Bubble3DSeries` (nombre a confirmar) que reciba:
  - `positions: Float32Array` (len % 3 === 0)
  - `colors?: Float32Array` (len % 3 === instanceCount, opcional default)
  - `scales?: Float32Array` (len === instanceCount, default 1)
  - `geometry?: 'ico' | 'cube-low'` (default `ico`)
  - `opacity?: number`
- Renderer 3D dedicado: `NativeWebGLRenderer3D` (paralelo al 2D actual) o modo 3D dentro de uno nuevo.
- Integración con plot area 3D: por ahora, escena completa; sin ejes 3D todavía (separar alcance).

## Roadmap incremental
1) **Math3D + tests**: implementar Mat4 y validar con casos conocidos.
2) **Shader + programas**: compilar/enlazar y exponer locations.
3) **Mesh instanciado**: cargar geometría base y atributos de instancia; un draw call.
4) **Cámara + controles**: orbit + zoom + resize.
5) **API serie 3D**: data ingestion, buffers, actualización.
6) **Demo interna**: 10k-100k instancias, medir FPS; validar límites (MAX_VERTEX_ATTRIBS, stride).
7) **Docs/guía**: ejemplo completo (cargar datos, crear cámara, render loop).

## Riesgos y mitigaciones
- **Errores de matriz**: cubrir con tests unitarios y snapshot de matriz resultante.
- **Compatibilidad WebGL1**: mantener código modular para añadir extensión `ANGLE_instanced_arrays` si se requiere.
- **Interacción compleja (click picking)**: dejar fuera de MVP; documentar limitación y posible approach (inversión de matrices + color picking).
- **Límites de atributos/stride**: confirmar `MAX_VERTEX_ATTRIBS` y `vertexAttribDivisor` soporte; ajustar layout si es necesario.

## Criterios de éxito MVP
- Renderizar ≥10k burbujas a 60 FPS en desktop moderno con un solo draw call.
- API estable para cargar posiciones/colores/escalas.
- Control orbital suave (rotar/zoom) sin stutter.
- Código core añadido ≤10 KB minificado aprox.

## Ejemplo de uso

```typescript
import { Bubble3DRenderer } from 'scichart-engine/core/3d';

// Crear renderer
const renderer = new Bubble3DRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  backgroundColor: [0.05, 0.05, 0.1, 1],
  style: {
    geometry: 'icosphere',
    subdivisions: 1,
    enableLighting: true,
    ambient: 0.3,
  },
});

// Generar 10k burbujas aleatorias
const count = 10000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const scales = new Float32Array(count);

for (let i = 0; i < count; i++) {
  // Posición aleatoria en cubo [-5, 5]
  positions[i * 3] = Math.random() * 10 - 5;
  positions[i * 3 + 1] = Math.random() * 10 - 5;
  positions[i * 3 + 2] = Math.random() * 10 - 5;
  
  // Color aleatorio
  colors[i * 3] = Math.random();
  colors[i * 3 + 1] = Math.random();
  colors[i * 3 + 2] = Math.random();
  
  // Escala aleatoria
  scales[i] = 0.05 + Math.random() * 0.1;
}

// Cargar datos
renderer.setData({ positions, colors, scales });

// Ajustar cámara para ver todos los datos
renderer.fitToData();

// Acceder a cámara/controles si se necesita
const camera = renderer.getCamera();
camera.setSpherical(Math.PI / 4, Math.PI / 4, 15);

// Escuchar eventos
renderer.on('render', (e) => {
  console.log(`FPS: ${e.stats?.fps}, Instances: ${e.stats?.instanceCount}`);
});

// Limpiar al destruir
// renderer.destroy();
```

## Controles de interacción

| Acción | Mouse | Touch |
|--------|-------|-------|
| Rotar | Click izq + arrastrar | 1 dedo arrastrar |
| Zoom | Rueda scroll | Pinch 2 dedos |
| Pan | Click der + arrastrar | — |

## Próximos pasos (futuros)
- [x] Ejes 3D con labels y grid ✅ **Implementado**
- [ ] Raycasting para selección de burbujas
- [ ] Tooltips al hover
- [ ] Exportar imagen/snapshot
- [ ] Soporte WebGL1 con extensión `ANGLE_instanced_arrays`

