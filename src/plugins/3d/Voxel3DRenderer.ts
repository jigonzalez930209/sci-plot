/**
 * Volumetric Voxel 3D Renderer
 * Renders a 3D grid of values as cubes (voxels).
 * Optimized for medical imaging (MRI/CT), geological data, or 3D heatmaps.
 */

import { OrbitCamera, type OrbitCameraOptions } from './camera/OrbitCamera';
import { OrbitController, type OrbitControllerOptions } from './controls/OrbitController';
import {
  createProgramBundle3D,
  deleteProgramBundle,
  type ProgramBundle3D,
} from './shader/programs';
import { Axes3D, type Axes3DOptions } from './Axes3D';
import { Tooltip3D } from './Tooltip3D';
import { createRayFromScreen, pickBubble } from './Raycaster3D';
import { createVoxelCube } from './mesh';
import type {
  Renderer3DOptions,
  Bounds3D,
  Renderer3DEventCallback,
} from './types';
import type { CustomThemeOptions } from './colorThemes';

export interface VoxelData {
  /** Dimensions of the 3D grid [nx, ny, nz] */
  dimensions: [number, number, number];
  /** Voxel values [v000, v100, ..., v(nx-1)(ny-1)(nz-1)] */
  values: Float32Array;
  /** Voxel positions [x0, y0, z0, ...] if not a regular grid (optional) */
  positions?: Float32Array;
  /** Origin point of the grid [x, y, z] (default [0,0,0]) */
  origin?: [number, number, number];
  /** Spacing between voxels [dx, dy, dz] (default [1,1,1]) */
  spacing?: [number, number, number];
}

export interface Voxel3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** Size scale for each voxel cube (0.0 to 1.0, default 1.0) */
  voxelScale?: number;
  /** Threshold value: voxels below this won't be rendered (default 0.1) */
  threshold?: number;
  /** Global opacity (default: 1.0) */
  opacity?: number;
  /** Enable tooltips */
  enableTooltip?: boolean;
  /** Color theme options */
  theme?: CustomThemeOptions;
}

export class Voxel3DRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private dpr: number;
  
  private programs: ProgramBundle3D;
  private camera: OrbitCamera;
  private controller: OrbitController;
  private axes: Axes3D | null = null;
  
  // Base cube geometry
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private indexCount = 0;

  // Instance buffers
  private instancePosBuffer: WebGLBuffer | null = null;
  private instanceValueBuffer: WebGLBuffer | null = null;
  private voxelCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private voxelSize: number = 1.0;
  private voxelScale: number;
  private threshold: number;
  private opacity: number;
  
  private data: VoxelData | null = null;
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private lastHitIndex: number = -1;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleMouseLeave?: () => void;

  constructor(options: Voxel3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.voxelScale = options.voxelScale ?? 0.95;
    this.threshold = options.threshold ?? 0.1;
    this.opacity = options.opacity ?? 0.8;
    
    if (options.backgroundColor) this.backgroundColor = options.backgroundColor;

    const gl = this.canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.programs = createProgramBundle3D(gl);
    this.camera = new OrbitCamera(options.camera);
    this.controller = new OrbitController(this.camera, this.canvas, options.controls);
    this.controller.onChange(() => { this.needsRender = true; this.emitEvent('cameraChange'); });

    if (options.showAxes !== false) {
      this.axes = new Axes3D(gl, options.axes);
    }

    if (options.enableTooltip !== false) {
      this.tooltip = new Tooltip3D(this.canvas.parentElement || document.body);
      this.boundHandleMouseMove = this.handleMouseMove.bind(this);
      this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
      this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
      this.canvas.addEventListener('mouseleave', this.boundHandleMouseLeave);
    }

    this.initCubeGeometry();
    this.resize();
    window.addEventListener('resize', this.handleResize);
    this.startRenderLoop();
  }

  private initCubeGeometry(): void {
    const { gl } = this;
    const cube = createVoxelCube();
    const program = this.programs.voxelProgram;
    
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW);
    const posLoc = program.attributes.a_position;
    if (posLoc !== -1) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cube.indices, gl.STATIC_DRAW);
    this.indexCount = cube.indices.length;

    // Instance attributes
    this.instancePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
    const instPosLoc = program.attributes.a_instancePos;
    if (instPosLoc !== -1) {
      gl.enableVertexAttribArray(instPosLoc);
      gl.vertexAttribPointer(instPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(instPosLoc, 1);
    }

    this.instanceValueBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceValueBuffer);
    const valueLoc = program.attributes.a_value;
    if (valueLoc !== -1) {
      gl.enableVertexAttribArray(valueLoc);
      gl.vertexAttribPointer(valueLoc, 1, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(valueLoc, 1);
    }

    gl.bindVertexArray(null);
  }

  setData(data: VoxelData): void {
    this.data = data;
    const { dimensions, spacing = [1, 1, 1], origin = [0, 0, 0] } = data;
    const [nx, ny, nz] = dimensions;
    this.voxelCount = nx * ny * nz;
    this.voxelSize = Math.max(...spacing) * this.voxelScale;

    const positions = new Float32Array(this.voxelCount * 3);
    for (let z = 0; z < nz; z++) {
      for (let y = 0; y < ny; y++) {
        for (let x = 0; x < nx; x++) {
          const i = (z * nx * ny + y * nx + x) * 3;
          positions[i] = origin[0] + x * spacing[0];
          positions[i + 1] = origin[1] + y * spacing[1];
          positions[i + 2] = origin[2] + z * spacing[2];
        }
      }
    }

    const { gl } = this;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceValueBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.values, gl.STATIC_DRAW);

    this.updateBounds();
    this.needsRender = true;
  }

  private updateBounds(): void {
    if (!this.data) return;
    const { dimensions, spacing = [1, 1, 1], origin = [0, 0, 0] } = this.data;
    const [nx, ny, nz] = dimensions;
    
    this.bounds = {
      minX: origin[0],
      maxX: origin[0] + (nx - 1) * spacing[0],
      minY: origin[1],
      maxY: origin[1] + (ny - 1) * spacing[1],
      minZ: origin[2],
      maxZ: origin[2] + (nz - 1) * spacing[2]
    };
    if (this.axes) this.axes.updateBounds(this.bounds);
  }

  render(): void {
    const { gl, camera } = this;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewProj = camera.getViewProjectionMatrix() as Float32Array;
    if (this.axes) this.axes.render(viewProj);

    if (this.voxelCount > 0 && this.vao) {
      const program = this.programs.voxelProgram;
      gl.useProgram(program.program);
      gl.uniformMatrix4fv(program.uniforms.u_viewProjection, false, viewProj);
      gl.uniform1f(program.uniforms.u_opacity, this.opacity);
      gl.uniform1f(program.uniforms.u_voxelSize, this.voxelSize);
      gl.uniform1f(program.uniforms.u_threshold, this.threshold);
      gl.uniform3fv(program.uniforms.u_lightDir, new Float32Array([1, 1, 1]));

      gl.bindVertexArray(this.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, this.voxelCount);
      gl.bindVertexArray(null);
    }
    this.emitEvent('render');
  }

  private startRenderLoop(): void {
    const loop = () => {
      const moving = this.controller.update();
      if (this.needsRender || moving) {
        this.render();
        this.needsRender = false;
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  fitToData(): void {
    if (!this.bounds) return;
    const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;
    this.camera.fitToBounds(minX, minY, minZ, maxX, maxY, maxZ);
    this.camera.radius *= 1.3;
    this.needsRender = true;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.tooltip || !this.data) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    
    // Pick based on voxel centers
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix() as Float32Array;
    const ray = createRayFromScreen(x, y, width, height, viewProj);
    
    // We treat voxels as small bubbles for picking purposes
    const nx = this.data.dimensions[0], ny = this.data.dimensions[1], nz = this.data.dimensions[2];
    const positions = new Float32Array(this.voxelCount * 3);
    const { spacing = [1,1,1], origin = [0,0,0] } = this.data;

    for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const idx = (k * nx * ny + j * nx + i);
          if (this.data.values[idx] < this.threshold) continue;
          positions[idx*3] = origin[0] + i * spacing[0];
          positions[idx*3+1] = origin[1] + j * spacing[1];
          positions[idx*3+2] = origin[2] + k * spacing[2];
        }
      }
    }

    const hit = pickBubble(ray, positions, new Float32Array(this.voxelCount).fill(this.voxelSize * 0.5));

    if (hit) {
      if (hit.index !== this.lastHitIndex) {
        this.lastHitIndex = hit.index;
        const val = this.data.values[hit.index];
        const nx = this.data.dimensions[0], ny = this.data.dimensions[1];
        const vz = Math.floor(hit.index / (nx * ny));
        const vy = Math.floor((hit.index % (nx * ny)) / nx);
        const vx = hit.index % nx;

        this.tooltip.show({
          index: hit.index,
          position: [positions[hit.index*3], positions[hit.index*3+1], positions[hit.index*3+2]],
          customData: { Value: val.toFixed(3), Coords: `(${vx}, ${vy}, ${vz})` }
        }, x, y);
      } else {
        this.tooltip.updatePosition(x, y);
      }
    } else if (this.lastHitIndex !== -1) {
      this.tooltip.hide();
      this.lastHitIndex = -1;
    }
  }

  private handleMouseLeave(): void {
    if (this.tooltip) { this.tooltip.hide(); this.lastHitIndex = -1; }
  }

  private handleResize = () => { this.resize(); this.needsRender = true; }
  private resize(): void {
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    this.canvas.width = width * this.dpr; this.canvas.height = height * this.dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.camera.aspect = width / height;
  }
  getCanvasSize() { const rect = this.canvas.getBoundingClientRect(); return { width: rect.width, height: rect.height }; }
  
  getAxisLabels() {
    return this.axes?.getLabels() ?? [];
  }

  getViewProjectionMatrix() {
    return this.camera.getViewProjectionMatrix();
  }

  projectToScreen(worldPos: [number, number, number]) {
    if (!this.axes) return { x: 0, y: 0, visible: false };
    const { width, height } = this.getCanvasSize();
    return this.axes.projectToScreen(worldPos, this.camera.getViewProjectionMatrix(), width, height);
  }
  
  on(event: string, callback: Renderer3DEventCallback): void {
    if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
    this.eventListeners.get(event)!.add(callback);
  }

  private emitEvent(type: string): void {
    const listeners = this.eventListeners.get(type);
    if (!listeners) return;
    listeners.forEach(cb => cb({ 
      type: type as any, timestamp: performance.now(), 
      stats: { fps: 60, frameTime: 16, instanceCount: this.voxelCount, drawCalls: 1 },
      camera: { target: [...this.camera.target] as any, radius: this.camera.radius, theta: this.camera.theta, phi: this.camera.phi, fov: this.camera.fov }
    }));
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.tooltip) this.tooltip.destroy();
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    [this.positionBuffer, this.indexBuffer, this.instancePosBuffer, this.instanceValueBuffer].forEach(b => b && gl.deleteBuffer(b));
    deleteProgramBundle(gl, this.programs);
  }
}
