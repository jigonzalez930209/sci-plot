/**
 * Ribbon 3D Renderer
 * Renders multiple series as 3D ribbons (tapes) with width and lighting.
 * Ideal for comparing multiple 3D profiles or time-series evolution.
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
import { createRayFromScreen, pickLine } from './Raycaster3D';
import type {
  Renderer3DOptions,
  Bounds3D,
  Renderer3DEventCallback,
} from './types';
import { createTheme, type CustomThemeOptions, type ColorTheme } from './colorThemes';

export interface RibbonSeriesData {
  /** X coordinates */
  xValues: Float32Array;
  /** Y coordinates */
  yValues: Float32Array;
  /** Z center coordinate of this ribbon */
  z: number;
  /** Width of the ribbon along the Z axis (default 0.5) */
  width?: number;
  /** Color of the ribbon (default: [0.3, 0.8, 1.0]) */
  color?: [number, number, number];
}

export interface Ribbon3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** Global opacity (default: 0.9) */
  opacity?: number;
  /** Enable tooltips */
  enableTooltip?: boolean;
  /** Color theme options */
  theme?: CustomThemeOptions;
}

export class Ribbon3DRenderer {
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
  private normalBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private indexCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private opacity: number;
  
  private series: RibbonSeriesData[] = [];
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Hover highlight
  private hoveredSeriesIndex: number | null = null;
  private colorTheme: ColorTheme;
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private lastHitIndex: { series: number, point: number } | null = null;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleMouseLeave?: () => void;

  constructor(options: Ribbon3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.opacity = options.opacity ?? 0.9;
    
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

    this.resize();
    window.addEventListener('resize', this.handleResize);
    this.startRenderLoop();
  }

  setData(series: RibbonSeriesData[]): void {
    this.series = series;
    this.updateGeometry();
    this.updateBounds();
    this.needsRender = true;
  }

  private updateBounds(): void {
    if (this.series.length === 0) return;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const s of this.series) {
      const halfW = (s.width ?? 0.5) / 2;
      if (s.z - halfW < minZ) minZ = s.z - halfW;
      if (s.z + halfW > maxZ) maxZ = s.z + halfW;

      for (let i = 0; i < s.xValues.length; i++) {
        const x = s.xValues[i], y = s.yValues[i];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }

    this.bounds = { minX, maxX, minY, maxY, minZ, maxZ };
    if (this.axes) this.axes.updateBounds(this.bounds);
  }

  private updateGeometry(): void {
    if (this.series.length === 0) return;
    const { gl } = this;

    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    for (let seriesIdx = 0; seriesIdx < this.series.length; seriesIdx++) {
      const s = this.series[seriesIdx];
      
      // Use highlight color if this series is hovered
      const isHovered = seriesIdx === this.hoveredSeriesIndex;
      const col = isHovered 
        ? this.colorTheme.highlightColor
        : (s.color || this.colorTheme.seriesPalette[seriesIdx % this.colorTheme.seriesPalette.length]);
      
      const halfW = (s.width ?? 0.5) / 2;
      const n = s.xValues.length;

      for (let i = 0; i < n; i++) {
        const x = s.xValues[i], y = s.yValues[i], z = s.z;

        // Calculate tangent for normal
        let dx = 0, dy = 1;
        if (i < n - 1) {
          dx = s.xValues[i+1] - x; dy = s.yValues[i+1] - y;
        } else if (i > 0) {
          dx = x - s.xValues[i-1]; dy = y - s.yValues[i-1];
        }
        
        const mag = Math.sqrt(dx*dx + dy*dy);
        const nx = mag > 0 ? dy/mag : 0;
        const ny = mag > 0 ? -dx/mag : 1;

        positions.push(x, y, z - halfW);
        positions.push(x, y, z + halfW);

        normals.push(nx, ny, 0);
        normals.push(nx, ny, 0);

        colors.push(...col);
        colors.push(...col);

        if (i < n - 1) {
          const v0 = vertexOffset + i * 2;
          const v1 = v0 + 1;
          const v2 = v0 + 2;
          const v3 = v0 + 3;
          indices.push(v0, v1, v2, v1, v3, v2);
        }
      }
      vertexOffset += n * 2;
    }

    const program = this.programs.ribbonProgram;
    if (!this.vao) this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    if (!this.positionBuffer) this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const posLoc = program.attributes.a_position;
    if (posLoc !== -1) {
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }

    if (!this.normalBuffer) this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    const normalLoc = program.attributes.a_normal;
    if (normalLoc !== -1) {
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    }

    if (!this.colorBuffer) this.colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    const colorLoc = program.attributes.a_color;
    if (colorLoc !== -1) {
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    }

    if (!this.indexBuffer) this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
    this.indexCount = indices.length;

    gl.bindVertexArray(null);
  }

  render(): void {
    const { gl, camera } = this;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewProj = camera.getViewProjectionMatrix() as Float32Array;
    if (this.axes) this.axes.render(viewProj);

    if (this.indexCount > 0 && this.vao) {
      const program = this.programs.ribbonProgram;
      gl.useProgram(program.program);
      gl.uniformMatrix4fv(program.uniforms.u_viewProjection, false, viewProj);
      gl.uniform1f(program.uniforms.u_opacity, this.opacity);
      gl.uniform3fv(program.uniforms.u_lightDir, new Float32Array([0.5, 1.0, 0.3]));
      gl.uniform1f(program.uniforms['u_ambient'], 0.6);

      gl.bindVertexArray(this.vao);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
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
    if (this.series.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    
    // Pick based on center lines of ribbons
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix() as Float32Array;
    const ray = createRayFromScreen(x, y, width, height, viewProj);
    
    const lines = this.series.map(s => ({
      x: s.xValues, y: s.yValues,
      z: new Float32Array(s.xValues.length).fill(s.z)
    }));
    
    const hit = pickLine(ray, lines, 0.4);
    
    // Update hovered series
    const newHoveredIndex = hit ? hit.seriesIndex : null;
    if (newHoveredIndex !== this.hoveredSeriesIndex) {
      this.hoveredSeriesIndex = newHoveredIndex;
      this.updateGeometry();
      this.needsRender = true;
    }

    // Tooltip logic
    if (this.tooltip) {
      if (hit) {
        if (!this.lastHitIndex || this.lastHitIndex.series !== hit.seriesIndex || this.lastHitIndex.point !== hit.pointIndex) {
          this.lastHitIndex = { series: hit.seriesIndex, point: hit.pointIndex };
          const s = this.series[hit.seriesIndex];
          this.tooltip.show({
            index: hit.pointIndex,
            position: [s.xValues[hit.pointIndex], s.yValues[hit.pointIndex], s.z],
            color: s.color || [0.3, 0.8, 1.0],
            customData: { Series: hit.seriesIndex, Z: s.z.toFixed(2) }
          }, x, y);
        } else {
          this.tooltip.updatePosition(x, y);
        }
      } else if (this.lastHitIndex) {
        this.tooltip.hide();
        this.lastHitIndex = null;
      }
    }
  }

  private handleMouseLeave(): void {
    // Reset highlight
    if (this.hoveredSeriesIndex !== null) {
      this.hoveredSeriesIndex = null;
      this.updateGeometry();
      this.needsRender = true;
    }
    
    if (this.tooltip) { this.tooltip.hide(); this.lastHitIndex = null; }
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
      stats: { fps: 60, frameTime: 16, instanceCount: this.series.length, drawCalls: 1 },
      camera: { target: [...this.camera.target] as any, radius: this.camera.radius, theta: this.camera.theta, phi: this.camera.phi, fov: this.camera.fov }
    }));
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.tooltip) this.tooltip.destroy();
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    [this.positionBuffer, this.normalBuffer, this.colorBuffer, this.indexBuffer].forEach(b => b && gl.deleteBuffer(b));
    deleteProgramBundle(gl, this.programs);
  }
}
