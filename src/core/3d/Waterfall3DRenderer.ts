/**
 * Waterfall 3D Renderer
 * Renders multiple 3D series (lines or areas) offset along the Z-axis.
 * Ideal for spettrograms and time-series evolution.
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
  Renderer3DEvent,
  Renderer3DEventCallback,
} from './types';

export interface WaterfallSeriesData {
  /** Y values for this slice */
  yValues: Float32Array;
  /** Fixed Z coordinate for this slice */
  z: number;
  /** Color for this slice */
  color?: [number, number, number];
}

export interface Waterfall3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** X values shared by all slices */
  xValues: Float32Array;
  /** Visual style: 'line' or 'area' (curtain) */
  sliceStyle?: 'line' | 'area';
  /** Base Y value (if sliceStyle is 'area') */
  baseY?: number;
  /** Global opacity */
  opacity?: number;
  /** Enable tooltips */
  enableTooltip?: boolean;
}

export class Waterfall3DRenderer {
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
  private indexBuffer: WebGLBuffer | null = null;
  private indexCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private sliceStyle: 'line' | 'area';
  private baseY: number;
  private opacity: number;
  private xValues: Float32Array;
  
  private slices: WaterfallSeriesData[] = [];
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private lastHitIndex: { slice: number, point: number } | null = null;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleMouseLeave?: () => void;

  constructor(options: Waterfall3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.sliceStyle = options.sliceStyle ?? 'area';
    this.baseY = options.baseY ?? 0;
    this.opacity = options.opacity ?? 0.9;
    this.xValues = options.xValues;
    
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

    this.resize();
    window.addEventListener('resize', this.handleResize);
    this.startRenderLoop();
  }

  setData(slices: WaterfallSeriesData[]): void {
    this.slices = slices;
    this.updateGeometry();
    this.updateBounds();
    this.needsRender = true;
  }

  private updateBounds(): void {
    if (this.slices.length === 0 || this.xValues.length === 0) return;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = this.baseY, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i < this.xValues.length; i++) {
      const x = this.xValues[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }

    for (const slice of this.slices) {
      if (slice.z < minZ) minZ = slice.z;
      if (slice.z > maxZ) maxZ = slice.z;
      for (let i = 0; i < slice.yValues.length; i++) {
        const y = slice.yValues[i];
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    this.bounds = { minX, maxX, minY, maxY, minZ, maxZ };
    if (this.axes) this.axes.updateBounds(this.bounds);
  }

  private updateGeometry(): void {
    if (this.slices.length === 0) return;
    const { gl } = this;

    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    for (const slice of this.slices) {
      const sliceColor = slice.color || [0.2, 0.6, 1.0];
      
      for (let i = 0; i < this.xValues.length; i++) {
        const x = this.xValues[i];
        const y = slice.yValues[i];
        const z = slice.z;

        if (this.sliceStyle === 'area') {
          // Top vertex
          positions.push(x, y, z);
          colors.push(...sliceColor);
          // Bottom vertex
          positions.push(x, this.baseY, z);
          colors.push(...sliceColor); 

          if (i < this.xValues.length - 1) {
            const v0 = vertexOffset + i * 2;
            const v1 = v0 + 1;
            const v2 = v0 + 2;
            const v3 = v0 + 3;
            indices.push(v0, v1, v2, v1, v3, v2);
          }
        } else {
          // Line style
          positions.push(x, y, z);
          colors.push(...sliceColor);
          if (i < this.xValues.length - 1) {
            indices.push(vertexOffset + i, vertexOffset + i + 1);
          }
        }
      }
      vertexOffset += (this.sliceStyle === 'area' ? this.xValues.length * 2 : this.xValues.length);
    }

    const program = this.programs.waterfallProgram;
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

    if (this.axes) {
      this.axes.render(viewProj);
    }

    if (this.indexCount > 0 && this.vao) {
      const program = this.programs.waterfallProgram;
      gl.useProgram(program.program);
      gl.uniformMatrix4fv(program.uniforms.u_viewProjection, false, viewProj);
      gl.uniform1f(program.uniforms.u_opacity, this.opacity);
      
      gl.uniform1f(program.uniforms.u_fadeStart, -1000);
      gl.uniform1f(program.uniforms.u_fadeEnd, 1000);

      gl.bindVertexArray(this.vao);
      if (this.sliceStyle === 'area') {
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
      } else {
        gl.drawElements(gl.LINES, this.indexCount, gl.UNSIGNED_INT, 0);
      }
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
    const dx = maxX - minX, dy = maxY - minY, dz = maxZ - minZ;
    const padding = 0.05;
    this.camera.fitToBounds(
      minX - dx * padding, minY - dy * padding, minZ - dz * padding,
      maxX + dx * padding, maxY + dy * padding, maxZ + dz * padding
    );
    this.camera.radius *= 1.1;
    this.needsRender = true;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.tooltip || this.slices.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.pickAtScreen(x, y);
    if (hit) {
      const isNew = !this.lastHitIndex || this.lastHitIndex.slice !== hit.seriesIndex || this.lastHitIndex.point !== hit.pointIndex;
      if (isNew) {
        this.lastHitIndex = { slice: hit.seriesIndex, point: hit.pointIndex };
        const slice = this.slices[hit.seriesIndex];
        this.tooltip.show({
          index: hit.pointIndex,
          position: [this.xValues[hit.pointIndex], slice.yValues[hit.pointIndex], slice.z],
          color: slice.color || [0.2, 0.6, 1.0],
          customData: { series: hit.seriesIndex, z: slice.z.toFixed(2) }
        }, x, y);
      } else {
        this.tooltip.updatePosition(x, y);
      }
    } else {
      if (this.lastHitIndex) {
        this.tooltip.hide();
        this.lastHitIndex = null;
      }
    }
  }

  private handleMouseLeave(): void {
    if (this.tooltip) {
      this.tooltip.hide();
      this.lastHitIndex = null;
    }
  }

  pickAtScreen(screenX: number, screenY: number) {
    if (this.slices.length === 0) return null;
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix() as Float32Array;
    const ray = createRayFromScreen(screenX, screenY, width, height, viewProj);
    
    const lines = this.slices.map(s => ({
      x: this.xValues,
      y: s.yValues,
      z: new Float32Array(this.xValues.length).fill(s.z)
    }));
    
    return pickLine(ray, lines, 0.4);
  }

  private handleResize = (): void => {
    this.resize();
    this.needsRender = true;
  }

  private resize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.camera.aspect = width / height;
  }

  getCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

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
    const event: Renderer3DEvent = {
      type: type as any,
      timestamp: performance.now(),
      stats: { fps: 60, frameTime: 16, instanceCount: this.slices.length, drawCalls: 1 },
      camera: { target: [...this.camera.target] as any, radius: this.camera.radius, theta: this.camera.theta, phi: this.camera.phi, fov: this.camera.fov }
    };
    listeners.forEach(cb => cb(event));
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.tooltip) {
      this.tooltip.destroy();
      if (this.boundHandleMouseMove) this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
      if (this.boundHandleMouseLeave) this.canvas.removeEventListener('mouseleave', this.boundHandleMouseLeave);
    }
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    deleteProgramBundle(gl, this.programs);
  }
}
