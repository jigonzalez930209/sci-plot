/**
 * Surface Bar 3D Renderer (3D Histogram)
 * Renders a grid of vertical bars on a 3D plane.
 * Optimized for 3D histograms, grid-based population density, or spatial data.
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
import { createTheme, type CustomThemeOptions, type ColorTheme } from './colorThemes';

export interface SurfaceBarData {
  /** Number of rows in the grid (Z axis) */
  rows: number;
  /** Number of columns in the grid (X axis) */
  cols: number;
  /** Height values for each bar [v_0_0, v_0_1, ..., v_r-1_c-1] */
  heights: Float32Array;
  /** Colors per bar [r0, g0, b0, ...] (optional) */
  colors?: Float32Array;
  /** Origin point of the grid [x, y, z] (default [0,0,0]) */
  origin?: [number, number, number];
  /** Spacing between bars [dx, dz] (default [1,1]) */
  spacing?: [number, number];
}

export interface SurfaceBar3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** Opacity (default: 1.0) */
  opacity?: number;
  /** Bar scale (default: 1.0) */
  barScale?: number;
  /** Color theme options */
  theme?: CustomThemeOptions;
  /** Enable tooltips */
  enableTooltip?: boolean;
}

export class SurfaceBar3DRenderer {
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
  private heightBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private barCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private barWidth: number = 0.8;
  private barDepth: number = 0.8;
  private barScale: number;
  private opacity: number;
  
  private data: SurfaceBarData | null = null;
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private lastHitIndex: number = -1;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleMouseLeave?: () => void;
  
  // Color theme
  private colorTheme: ColorTheme;

  constructor(options: SurfaceBar3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.barScale = options.barScale ?? 0.8;
    this.opacity = options.opacity ?? 1.0;
    
    if (options.backgroundColor) this.backgroundColor = options.backgroundColor;
    
    // Initialize color theme
    this.colorTheme = createTheme(options.theme || {}, this.backgroundColor);

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
    const cube = createVoxelCube();
    const program = this.programs.surfaceBarProgram;
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

    this.heightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.heightBuffer);
    const heightLoc = program.attributes.a_height;
    if (heightLoc !== -1) {
      gl.enableVertexAttribArray(heightLoc);
      gl.vertexAttribPointer(heightLoc, 1, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(heightLoc, 1);
    }

    this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    const colorLoc = program.attributes.a_color;
    if (colorLoc !== -1) {
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(colorLoc, 1);
    }

    gl.bindVertexArray(null);
  }

  setData(data: SurfaceBarData): void {
    this.data = data;
    const { rows, cols, spacing = [1, 1], origin = [0, 0, 0] } = data;
    this.barCount = rows * cols;
    this.barWidth = spacing[0] * this.barScale;
    this.barDepth = spacing[1] * this.barScale;

    const positions = new Float32Array(this.barCount * 3);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 3;
        positions[i] = origin[0] + c * spacing[0];
        positions[i + 1] = origin[1]; // Base Y
        positions[i + 2] = origin[2] + r * spacing[1];
      }
    }

    const { gl } = this;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.heightBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.heights, gl.STATIC_DRAW);

    // Use theme palette if no colors provided
    const colors = data.colors || this.generateThemeColors(this.barCount);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    this.updateBounds();
    this.needsRender = true;
  }

  private updateBounds(): void {
    if (!this.data) return;
    const { rows, cols, heights, spacing = [1, 1], origin = [0, 0, 0] } = this.data;
    
    let maxH = -Infinity, minH = Infinity;
    for (let i = 0; i < heights.length; i++) {
        if (heights[i] > maxH) maxH = heights[i];
        if (heights[i] < minH) minH = heights[i];
    }

    this.bounds = {
      minX: origin[0] - spacing[0]/2,
      maxX: origin[0] + (cols - 1) * spacing[0] + spacing[0]/2,
      minY: origin[1],
      maxY: origin[1] + maxH,
      minZ: origin[2] - spacing[1]/2,
      maxZ: origin[2] + (rows - 1) * spacing[1] + spacing[1]/2
    };
    if (this.axes) this.axes.updateBounds(this.bounds);
  }
  
  private generateThemeColors(count: number): Float32Array {
    const colors = new Float32Array(count * 3);
    const palette = this.colorTheme.seriesPalette;
    for (let i = 0; i < count; i++) {
      const c = palette[i % palette.length];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }
    return colors;
  }

  render(): void {
    const { gl, camera } = this;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewProj = camera.getViewProjectionMatrix() as Float32Array;
    if (this.axes) this.axes.render(viewProj);

    if (this.barCount > 0 && this.vao) {
      const program = this.programs.surfaceBarProgram;
      gl.useProgram(program.program);
      gl.uniformMatrix4fv(program.uniforms.u_viewProjection, false, viewProj);
      gl.uniform1f(program.uniforms.u_opacity, this.opacity);
      gl.uniform1f(program.uniforms.u_barWidth, this.barWidth);
      gl.uniform1f(program.uniforms.u_barDepth, this.barDepth);
      gl.uniform3fv(program.uniforms.u_lightDir, new Float32Array([0.5, 1, 0.3]));

      gl.bindVertexArray(this.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, this.barCount);
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
    
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix() as Float32Array;
    const ray = createRayFromScreen(x, y, width, height, viewProj);
    
    // Pick based on bar centers (offset by height/2)
    const { rows, cols, heights, spacing = [1,1], origin = [0,0,0] } = this.data;
    const centers = new Float32Array(this.barCount * 3);
    const radii = new Float32Array(this.barCount);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        centers[idx*3] = origin[0] + c * spacing[0];
        centers[idx*3+1] = origin[1] + heights[idx] / 2;
        centers[idx*3+2] = origin[2] + r * spacing[1];
        radii[idx] = Math.max(this.barWidth, this.barDepth, heights[idx]) * 0.6;
      }
    }

    const hit = pickBubble(ray, centers, radii);

    if (hit) {
      if (hit.index !== this.lastHitIndex) {
        this.lastHitIndex = hit.index;
        const val = this.data.heights[hit.index];
        const r = Math.floor(hit.index / cols);
        const c = hit.index % cols;

        this.tooltip.show({
          index: hit.index,
          position: [centers[hit.index*3], origin[1] + heights[hit.index], centers[hit.index*3+2]],
          customData: { Height: val.toFixed(2), Row: r, Col: c }
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
      stats: { fps: 60, frameTime: 16, instanceCount: this.barCount, drawCalls: 1 },
      camera: { target: [...this.camera.target] as any, radius: this.camera.radius, theta: this.camera.theta, phi: this.camera.phi, fov: this.camera.fov }
    }));
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.tooltip) this.tooltip.destroy();
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    [this.positionBuffer, this.indexBuffer, this.instancePosBuffer, this.heightBuffer, this.colorBuffer].forEach(b => b && gl.deleteBuffer(b));
    deleteProgramBundle(gl, this.programs);
  }
}
