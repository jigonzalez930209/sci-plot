/**
 * High-Density Point Cloud 3D Renderer
 * Renders millions of points using gl.POINTS and Point Sprites.
 * Optimized for massive datasets like LiDAR or medical imaging.
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
import type {
  Renderer3DOptions,
  Bounds3D,
  Renderer3DEventCallback,
} from './types';

export interface PointCloudData {
  /** Positions [x0, y0, z0, x1, y1, z1, ...] */
  positions: Float32Array;
  /** Colors per point [r0, g0, b0, ...] (optional) */
  colors?: Float32Array;
  /** Sizes per point (optional) */
  sizes?: Float32Array;
}

export interface PointCloud3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** Global point size multiplier (default: 1.0) */
  pointSize?: number;
  /** Use circular points instead of squares (default: true) */
  circular?: boolean;
  /** Global opacity (default: 1.0) */
  opacity?: number;
  /** Enable tooltips */
  enableTooltip?: boolean;
}

export class PointCloud3DRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private dpr: number;
  
  private programs: ProgramBundle3D;
  private camera: OrbitCamera;
  private controller: OrbitController;
  private axes: Axes3D | null = null;
  
  // Buffers
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private sizeBuffer: WebGLBuffer | null = null;
  private pointCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private globalPointSize: number;
  private circular: boolean;
  private opacity: number;
  
  private positions: Float32Array | null = null;
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private lastHitIndex: number = -1;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleMouseLeave?: () => void;

  constructor(options: PointCloud3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.globalPointSize = options.pointSize ?? 2.0;
    this.circular = options.circular ?? true;
    this.opacity = options.opacity ?? 1.0;
    
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

    this.initBuffers();
    this.resize();
    window.addEventListener('resize', this.handleResize);
    this.startRenderLoop();
  }

  private initBuffers(): void {
    const { gl } = this;
    const program = this.programs.pointCloudProgram;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const posLoc = program.attributes.a_position;
    if (posLoc !== -1) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    const colorLoc = program.attributes.a_color;
    if (colorLoc !== -1) {
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    }

    this.sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    const sizeLoc = program.attributes.a_size;
    if (sizeLoc !== -1) {
      gl.enableVertexAttribArray(sizeLoc);
      gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
    }

    gl.bindVertexArray(null);
  }

  setData(data: PointCloudData): void {
    this.positions = data.positions;
    this.pointCount = data.positions.length / 3;
    const { gl } = this;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.DYNAMIC_DRAW);

    const colors = data.colors || new Float32Array(this.pointCount * 4).fill(1.0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

    const sizes = data.sizes || new Float32Array(this.pointCount).fill(1.0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);

    this.updateBounds();
    this.needsRender = true;
  }

  private updateBounds(): void {
    if (!this.positions) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < this.positions.length; i += 3) {
      const x = this.positions[i], y = this.positions[i+1], z = this.positions[i+2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    this.bounds = { minX, maxX, minY, maxY, minZ, maxZ };
    if (this.axes) this.axes.updateBounds(this.bounds);
  }

  render(): void {
    const { gl, camera } = this;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewProj = camera.getViewProjectionMatrix() as Float32Array;
    if (this.axes) this.axes.render(viewProj);

    if (this.pointCount > 0 && this.vao) {
      const program = this.programs.pointCloudProgram;
      gl.useProgram(program.program);
      gl.uniformMatrix4fv(program.uniforms.u_viewProjection, false, viewProj);
      gl.uniform1f(program.uniforms.u_opacity, this.opacity);
      gl.uniform1f(program.uniforms.u_globalSize, this.globalPointSize * this.dpr);
      gl.uniform1i(program.uniforms.u_circular, this.circular ? 1 : 0);

      gl.bindVertexArray(this.vao);
      gl.drawArrays(gl.POINTS, 0, this.pointCount);
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
    this.camera.radius *= 1.2;
    this.needsRender = true;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.tooltip || !this.positions) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    
    // Efficiency: for PointCloud we only pick if not too many points or use spatial hashing.
    // For now, reuse pickBubble which is optimized with distance check.
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix() as Float32Array;
    const ray = createRayFromScreen(x, y, width, height, viewProj);
    const hit = pickBubble(ray, this.positions, new Float32Array(this.pointCount).fill(0.2));

    if (hit) {
      if (hit.index !== this.lastHitIndex) {
        this.lastHitIndex = hit.index;
        const i3 = hit.index * 3;
        this.tooltip.show({
          index: hit.index,
          position: [this.positions[i3], this.positions[i3+1], this.positions[i3+2]]
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
      stats: { fps: 60, frameTime: 16, instanceCount: this.pointCount, drawCalls: 1 },
      camera: { target: [...this.camera.target] as any, radius: this.camera.radius, theta: this.camera.theta, phi: this.camera.phi, fov: this.camera.fov }
    }));
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.tooltip) this.tooltip.destroy();
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    [this.positionBuffer, this.colorBuffer, this.sizeBuffer].forEach(b => b && gl.deleteBuffer(b));
    deleteProgramBundle(gl, this.programs);
  }
}
