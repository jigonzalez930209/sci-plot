/**
 * Vector Field (Quiver) 3D Renderer
 * Renders an array of vectors (arrows/lines) oriented by direction and scaled by magnitude.
 * Uses instanced rendering for high performance.
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

export interface VectorFieldData {
  /** Origin positions [x0, y0, z0, x1, y1, z1, ...] */
  positions: Float32Array;
  /** Direction vectors [dx0, dy0, dz0, dx1, dy1, dz1, ...] */
  directions: Float32Array;
  /** Colors per vector [r0, g0, b0, ...] (optional) */
  colors?: Float32Array;
  /** Single color for all vectors (default: [0.3, 0.8, 1.0]) */
  color?: [number, number, number];
}

export interface VectorField3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** Arrow scale multiplier (default: 1.0) */
  scaleMultiplier?: number;
  /** Opacity (default: 1.0) */
  opacity?: number;
  /** Enable tooltips */
  enableTooltip?: boolean;
}

export class VectorField3DRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private dpr: number;
  
  private programs: ProgramBundle3D;
  private camera: OrbitCamera;
  private controller: OrbitController;
  private axes: Axes3D | null = null;
  
  // Base arrow geometry
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private normalBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private indexCount = 0;

  // Instance buffers
  private instancePosBuffer: WebGLBuffer | null = null;
  private instanceDirBuffer: WebGLBuffer | null = null;
  private instanceColorBuffer: WebGLBuffer | null = null;
  private vectorCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private scaleMultiplier: number;
  private opacity: number;
  
  private vectorData: VectorFieldData | null = null;
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private lastHitIndex: number = -1;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleMouseLeave?: () => void;

  constructor(options: VectorField3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.scaleMultiplier = options.scaleMultiplier ?? 1.0;
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

    this.initArrowGeometry();
    this.resize();
    window.addEventListener('resize', this.handleResize);
    this.startRenderLoop();
  }

  private initArrowGeometry(): void {
    const { gl } = this;
    // Simple arrow shape: box for stem, pyramid for head (simplified here to a pyramid/cone)
    // For now, let's use a simple long pyramid pointing in +Z
    const positions = new Float32Array([
      // Pyramid base
      -0.05, -0.05, 0.0,
       0.05, -0.05, 0.0,
       0.05,  0.05, 0.0,
      -0.05,  0.05, 0.0,
      // Tip
       0.0,   0.0,  1.0
    ]);
    const normals = new Float32Array([
       0.0,  0.0, -1.0, // base
       0.0,  0.0, -1.0, 
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  1.0,  0.0  // approx tip normal
    ]);
    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3, // base
      0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4 // sides
    ]);

    const program = this.programs.vectorFieldProgram;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = program.attributes.a_position;
    if (posLoc !== -1) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }

    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    const normalLoc = program.attributes.a_normal;
    if (normalLoc !== -1) {
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    }

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    this.indexCount = indices.length;

    // Instance attributes
    this.instancePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
    const instPosLoc = program.attributes.a_instancePos;
    if (instPosLoc !== -1) {
      gl.enableVertexAttribArray(instPosLoc);
      gl.vertexAttribPointer(instPosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(instPosLoc, 1);
    }

    this.instanceDirBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceDirBuffer);
    const dirLoc = program.attributes.a_direction;
    if (dirLoc !== -1) {
      gl.enableVertexAttribArray(dirLoc);
      gl.vertexAttribPointer(dirLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(dirLoc, 1);
    }

    this.instanceColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColorBuffer);
    const colorLoc = program.attributes.a_color;
    if (colorLoc !== -1) {
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(colorLoc, 1);
    }

    gl.bindVertexArray(null);
  }

  setData(data: VectorFieldData): void {
    this.vectorData = data;
    this.vectorCount = data.positions.length / 3;
    const { gl } = this;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceDirBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.directions, gl.STATIC_DRAW);

    const colors = data.colors || new Float32Array(this.vectorCount * 3).fill(0).map((_, i) => {
      const c = data.color || [0.3, 0.8, 1.0];
      return c[i % 3];
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    this.updateBounds();
    this.needsRender = true;
  }

  private updateBounds(): void {
    if (!this.vectorData) return;
    const p = this.vectorData.positions;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < p.length; i += 3) {
      if (p[i] < minX) minX = p[i]; if (p[i] > maxX) maxX = p[i];
      if (p[i+1] < minY) minY = p[i+1]; if (p[i+1] > maxY) maxY = p[i+1];
      if (p[i+2] < minZ) minZ = p[i+2]; if (p[i+2] > maxZ) maxZ = p[i+2];
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

    if (this.vectorCount > 0 && this.vao) {
      const program = this.programs.vectorFieldProgram;
      gl.useProgram(program.program);
      gl.uniformMatrix4fv(program.uniforms.u_viewProjection, false, viewProj);
      gl.uniform1f(program.uniforms.u_opacity, this.opacity);
      gl.uniform1f(program.uniforms.u_scaleMultiplier, this.scaleMultiplier);
      gl.uniform3fv(program.uniforms.u_lightDir, new Float32Array([0.5, 1.0, 0.3]));

      gl.bindVertexArray(this.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, this.vectorCount);
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
    if (!this.tooltip || !this.vectorData) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Simplificar: usamos pickBubble tratando los orígenes como esferas invisibles
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix() as Float32Array;
    const ray = createRayFromScreen(x, y, width, height, viewProj);
    const hit = pickBubble(ray, this.vectorData.positions, new Float32Array(this.vectorCount).fill(0.3));

    if (hit) {
      if (hit.index !== this.lastHitIndex) {
        this.lastHitIndex = hit.index;
        const i3 = hit.index * 3;
        const dx = this.vectorData.directions[i3];
        const dy = this.vectorData.directions[i3+1];
        const dz = this.vectorData.directions[i3+2];
        const mag = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        this.tooltip.show({
          index: hit.index,
          position: [this.vectorData.positions[i3], this.vectorData.positions[i3+1], this.vectorData.positions[i3+2]],
          customData: { Magnitude: mag.toFixed(3), Dir: `[${dx.toFixed(2)}, ${dy.toFixed(2)}, ${dz.toFixed(2)}]` }
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
      stats: { fps: 60, frameTime: 16, instanceCount: this.vectorCount, drawCalls: 1 },
      camera: { target: [...this.camera.target] as any, radius: this.camera.radius, theta: this.camera.theta, phi: this.camera.phi, fov: this.camera.fov }
    }));
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.tooltip) this.tooltip.destroy();
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    [this.positionBuffer, this.indexBuffer, this.instancePosBuffer, this.instanceDirBuffer, this.instanceColorBuffer].forEach(b => b && gl.deleteBuffer(b));
    deleteProgramBundle(gl, this.programs);
  }
}
