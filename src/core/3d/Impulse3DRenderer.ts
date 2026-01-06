/**
 * Impulse 3D Renderer
 * Renders stem/impulse plots with vertical lines from base plane to data points.
 * Uses cylinder geometry for smooth stems.
 */

import { OrbitCamera, type OrbitCameraOptions } from './camera/OrbitCamera';
import { OrbitController, type OrbitControllerOptions } from './controls/OrbitController';
import {
  createProgramBundle3D,
  deleteProgramBundle,
  type ProgramBundle3D,
} from './shader/programs';
import { Axes3D, type Axes3DOptions } from './Axes3D';
import { Tooltip3D, type Tooltip3DOptions } from './Tooltip3D';
import type {
  Renderer3DOptions,
  Bounds3D,
  RenderStats3D,
  Renderer3DEvent,
  Renderer3DEventCallback,
} from './types';
import { createRayFromScreen, pickImpulse } from './Raycaster3D';

export interface ImpulseSeriesData {
  /** X coordinates */
  x: Float32Array;
  /** Y coordinates (top of stems) */
  y: Float32Array;
  /** Z coordinates */
  z: Float32Array;
  /** Base Y value (default: 0) */
  baseY?: number;
  /** Color per point (RGB) */
  colors?: Float32Array;
  /** Single color for all stems */
  color?: [number, number, number];
}

export interface Impulse3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** Stem thickness (default: 0.03) */
  stemWidth?: number;
  /** Number of sides for cylinder (default: 6) */
  stemSides?: number;
  /** Show marker at top of stem (default: true) */
  showMarkers?: boolean;
  /** Marker size multiplier (default: 2) */
  markerSize?: number;
  /** Enable tooltips (default: true) */
  enableTooltip?: boolean;
  tooltip?: Tooltip3DOptions;
}

export class Impulse3DRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private dpr: number;
  
  private programs: ProgramBundle3D;
  private camera: OrbitCamera;
  private controller: OrbitController;
  private axes: Axes3D | null = null;
  
  // Stem geometry buffers
  private stemVao: WebGLVertexArrayObject | null = null;
  private stemPositionBuffer: WebGLBuffer | null = null;
  private stemNormalBuffer: WebGLBuffer | null = null;
  private stemColorBuffer: WebGLBuffer | null = null;
  private stemIndexBuffer: WebGLBuffer | null = null;
  private stemIndexCount = 0;
  
  // Marker geometry buffers (spheres at top)
  private markerVao: WebGLVertexArrayObject | null = null;
  private markerPositionBuffer: WebGLBuffer | null = null;
  private markerNormalBuffer: WebGLBuffer | null = null;
  private markerColorBuffer: WebGLBuffer | null = null;
  private markerIndexBuffer: WebGLBuffer | null = null;
  private markerIndexCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private showAxes: boolean;
  private stemWidth: number;
  private stemSides: number;
  private showMarkers: boolean;
  private markerSize: number;
  
  private impulseData: ImpulseSeriesData | null = null;
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private enableTooltip: boolean;
  private lastHitIndex: number = -1;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleMouseLeave?: () => void;
  
  // Stats
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  private lastFpsUpdate = 0;
  
  constructor(options: Impulse3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.showAxes = options.showAxes ?? true;
    this.stemWidth = options.stemWidth ?? 0.03;
    this.stemSides = options.stemSides ?? 6;
    this.showMarkers = options.showMarkers ?? true;
    this.markerSize = options.markerSize ?? 2;
    this.enableTooltip = options.enableTooltip ?? true;
    
    if (options.backgroundColor) {
      this.backgroundColor = options.backgroundColor;
    }
    
    // Get WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    });
    
    if (!gl) {
      throw new Error('WebGL2 not supported');
    }
    this.gl = gl;
    
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    // Create shader programs
    this.programs = createProgramBundle3D(gl);
    
    // Create buffers
    this.initBuffers();
    
    // Create camera
    this.camera = new OrbitCamera(options.camera);
    
    // Create controller
    this.controller = new OrbitController(this.camera, this.canvas, options.controls);
    this.controller.onChange(() => {
      this.needsRender = true;
      this.emitEvent('cameraChange');
    });
    
    // Create axes
    if (this.showAxes) {
      this.axes = new Axes3D(gl, options.axes);
    }
    
    // Initialize tooltip
    if (this.enableTooltip) {
      this.tooltip = new Tooltip3D(this.canvas.parentElement || document.body, options.tooltip);
      
      this.boundHandleMouseMove = this.handleMouseMove.bind(this);
      this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
      this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
      this.canvas.addEventListener('mouseleave', this.boundHandleMouseLeave);
    }
    
    // Handle resize
    this.resize();
    window.addEventListener('resize', this.handleResize);
    
    // Start render loop
    this.startRenderLoop();
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.tooltip || !this.impulseData) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.pickAtScreen(x, y);
    
    if (hit) {
      if (hit.index !== this.lastHitIndex) {
        this.lastHitIndex = hit.index;
        const i3 = hit.index * 3;
        const color: [number, number, number] = this.impulseData.colors 
          ? [this.impulseData.colors[i3], this.impulseData.colors[i3+1], this.impulseData.colors[i3+2]]
          : (this.impulseData.color || [0.5, 0.7, 1.0]);
        
        this.tooltip.show({
          index: hit.index,
          position: [this.impulseData.x[hit.index], this.impulseData.y[hit.index], this.impulseData.z[hit.index]],
          color: color,
        }, x, y);
      } else {
        this.tooltip.updatePosition(x, y);
      }
    } else {
      if (this.lastHitIndex !== -1) {
        this.tooltip.hide();
        this.lastHitIndex = -1;
      }
    }
  }

  private handleMouseLeave(): void {
    if (this.tooltip) {
      this.tooltip.hide();
      this.lastHitIndex = -1;
    }
  }

  pickAtScreen(screenX: number, screenY: number) {
    if (!this.impulseData) return null;
    
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix();
    const ray = createRayFromScreen(screenX, screenY, width, height, viewProj);
    
    return pickImpulse(ray, this.impulseData, this.stemWidth * 4);
  }
  
  private initBuffers(): void {
    const { gl } = this;
    
    // Stem buffers
    this.stemVao = gl.createVertexArray();
    this.stemPositionBuffer = gl.createBuffer();
    this.stemNormalBuffer = gl.createBuffer();
    this.stemColorBuffer = gl.createBuffer();
    this.stemIndexBuffer = gl.createBuffer();
    
    // Marker buffers
    this.markerVao = gl.createVertexArray();
    this.markerPositionBuffer = gl.createBuffer();
    this.markerNormalBuffer = gl.createBuffer();
    this.markerColorBuffer = gl.createBuffer();
    this.markerIndexBuffer = gl.createBuffer();
  }
  
  private handleResize = (): void => {
    this.resize();
    this.needsRender = true;
  };
  
  resize(): void {
    const { canvas, gl, dpr, camera } = this;
    
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    camera.aspect = width / height;
  }
  
  /**
   * Set impulse data
   */
  setData(data: ImpulseSeriesData): void {
    this.impulseData = data;
    this.buildGeometry();
    this.calculateBounds();
    
    if (this.axes && this.bounds) {
      this.axes.updateBounds(this.bounds);
    }
    
    this.needsRender = true;
    this.emitEvent('dataUpdate');
  }
  
  private buildGeometry(): void {
    if (!this.impulseData) return;
    
    this.buildStemGeometry();
    if (this.showMarkers) {
      this.buildMarkerGeometry();
    }
  }
  
  private buildStemGeometry(): void {
    const { gl, stemWidth, stemSides, impulseData } = this;
    if (!impulseData) return;
    
    const count = impulseData.x.length;
    const defaultColor = impulseData.color ?? [0.5, 0.7, 1.0];
    const baseY = impulseData.baseY ?? 0;
    
    const allPositions: number[] = [];
    const allNormals: number[] = [];
    const allColors: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;
    
    for (let i = 0; i < count; i++) {
      const x = impulseData.x[i];
      const y = impulseData.y[i];
      const z = impulseData.z[i];
      
      const r = impulseData.colors ? impulseData.colors[i * 3] : defaultColor[0];
      const g = impulseData.colors ? impulseData.colors[i * 3 + 1] : defaultColor[1];
      const b = impulseData.colors ? impulseData.colors[i * 3 + 2] : defaultColor[2];
      
      // Create cylinder for each stem
      // Bottom ring
      for (let s = 0; s <= stemSides; s++) {
        const angle = (s / stemSides) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const ox = cos * stemWidth;
        const oz = sin * stemWidth;
        
        // Bottom vertex
        allPositions.push(x + ox, baseY, z + oz);
        allNormals.push(cos, 0, sin);
        allColors.push(r * 0.5, g * 0.5, b * 0.5); // Darker at base
        
        // Top vertex
        allPositions.push(x + ox, y, z + oz);
        allNormals.push(cos, 0, sin);
        allColors.push(r, g, b);
      }
      
      // Indices for cylinder
      for (let s = 0; s < stemSides; s++) {
        const bl = vertexOffset + s * 2;
        const br = bl + 2;
        const tl = bl + 1;
        const tr = br + 1;
        
        allIndices.push(bl, br, tl);
        allIndices.push(tl, br, tr);
      }
      
      vertexOffset += (stemSides + 1) * 2;
    }
    
    // Upload to GPU
    const positions = new Float32Array(allPositions);
    const normals = new Float32Array(allNormals);
    const colors = new Float32Array(allColors);
    const indices = new Uint32Array(allIndices);
    
    this.stemIndexCount = indices.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stemPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stemNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stemColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.stemIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }
  
  private buildMarkerGeometry(): void {
    const { gl, stemWidth, markerSize, impulseData } = this;
    if (!impulseData) return;
    
    const count = impulseData.x.length;
    const defaultColor = impulseData.color ?? [0.5, 0.7, 1.0];
    const radius = stemWidth * markerSize;
    
    // Simple octahedron for markers (fast)
    const allPositions: number[] = [];
    const allNormals: number[] = [];
    const allColors: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;
    
    // Octahedron template
    const octVerts = [
      [0, 1, 0], [1, 0, 0], [0, 0, 1],
      [-1, 0, 0], [0, 0, -1], [0, -1, 0]
    ];
    const octFaces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
      [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
    ];
    
    for (let i = 0; i < count; i++) {
      const x = impulseData.x[i];
      const y = impulseData.y[i];
      const z = impulseData.z[i];
      
      const r = impulseData.colors ? impulseData.colors[i * 3] : defaultColor[0];
      const g = impulseData.colors ? impulseData.colors[i * 3 + 1] : defaultColor[1];
      const b = impulseData.colors ? impulseData.colors[i * 3 + 2] : defaultColor[2];
      
      // Add octahedron vertices
      for (const [ox, oy, oz] of octVerts) {
        allPositions.push(x + ox * radius, y + oy * radius, z + oz * radius);
        allNormals.push(ox, oy, oz);
        allColors.push(r, g, b);
      }
      
      // Add octahedron faces
      for (const [a, b2, c] of octFaces) {
        allIndices.push(vertexOffset + a, vertexOffset + b2, vertexOffset + c);
      }
      
      vertexOffset += 6;
    }
    
    // Upload to GPU
    const positions = new Float32Array(allPositions);
    const normals = new Float32Array(allNormals);
    const colors = new Float32Array(allColors);
    const indices = new Uint32Array(allIndices);
    
    this.markerIndexCount = indices.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markerColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.markerIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }
  
  private calculateBounds(): void {
    if (!this.impulseData) {
      this.bounds = null;
      return;
    }
    
    const data = this.impulseData;
    const baseY = data.baseY ?? 0;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = baseY, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < data.x.length; i++) {
      if (data.x[i] < minX) minX = data.x[i];
      if (data.x[i] > maxX) maxX = data.x[i];
      if (data.y[i] > maxY) maxY = data.y[i];
      if (data.z[i] < minZ) minZ = data.z[i];
      if (data.z[i] > maxZ) maxZ = data.z[i];
    }
    
    this.bounds = { minX, maxX, minY, maxY, minZ, maxZ };
  }
  
  /**
   * Fit camera to show all data
   */
  fitToData(): void {
    if (!this.bounds) return;
    
    const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;
    
    // Add 20% padding to bounds for better fit
    const dx = maxX - minX;
    const dy = maxY - minY;
    const dz = maxZ - minZ;
    const padding = 0.05;
    
    this.camera.fitToBounds(
      minX - dx * padding, minY - dy * padding, minZ - dz * padding,
      maxX + dx * padding, maxY + dy * padding, maxZ + dz * padding
    );
    
    // Closer fit
    this.camera.radius *= 1.0;
    
    this.needsRender = true;
  }
  
  getCanvasSize(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  /**
   * Render a single frame
   */
  render(): void {
    const { gl, camera, backgroundColor } = this;
    
    const startTime = performance.now();
    
    // Clear
    gl.clearColor(
      backgroundColor[0],
      backgroundColor[1],
      backgroundColor[2],
      backgroundColor[3]
    );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Get view projection matrix
    const viewProj = camera.getViewProjectionMatrix();
    
    // Render axes first
    if (this.axes) {
      this.axes.render(viewProj);
    }
    
    const program = this.programs.surfaceProgram;
    gl.useProgram(program.program);
    
    gl.uniformMatrix4fv(program.uniforms['u_viewProjection'], false, viewProj);
    gl.uniform1f(program.uniforms['u_opacity'], 1.0);
    gl.uniform3f(program.uniforms['u_lightDir'], 1, 1, 1);
    gl.uniform1f(program.uniforms['u_ambient'], 0.4);
    
    // Render stems
    if (this.stemIndexCount > 0) {
      this.renderBuffers(
        program,
        this.stemPositionBuffer,
        this.stemNormalBuffer,
        this.stemColorBuffer,
        this.stemIndexBuffer,
        this.stemIndexCount
      );
    }
    
    // Render markers
    if (this.showMarkers && this.markerIndexCount > 0) {
      this.renderBuffers(
        program,
        this.markerPositionBuffer,
        this.markerNormalBuffer,
        this.markerColorBuffer,
        this.markerIndexBuffer,
        this.markerIndexCount
      );
    }
    
    // Update stats
    const frameTime = performance.now() - startTime;
    this.lastFrameTime = frameTime;
    this.frameCount++;
    
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
    
    this.emitEvent('render');
  }
  
  private renderBuffers(
    program: any,
    posBuffer: WebGLBuffer | null,
    normalBuffer: WebGLBuffer | null,
    colorBuffer: WebGLBuffer | null,
    indexBuffer: WebGLBuffer | null,
    indexCount: number
  ): void {
    const { gl } = this;
    
    // Position
    const posLoc = program.attributes['a_position'];
    if (posLoc >= 0 && posBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    // Normal
    const normalLoc = program.attributes['a_normal'];
    if (normalLoc >= 0 && normalBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    // Color
    const colorLoc = program.attributes['a_color'];
    if (colorLoc >= 0 && colorBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
  }
  
  startRenderLoop(): void {
    if (this.animationFrameId !== null) return;
    
    const loop = (): void => {
      this.controller.update();
      
      if (this.needsRender) {
        this.render();
        this.needsRender = false;
      }
      
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    loop();
  }
  
  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  getStats(): RenderStats3D {
    return {
      fps: this.fps,
      instanceCount: this.impulseData?.x.length ?? 0,
      frameTime: this.lastFrameTime,
      drawCalls: this.showMarkers ? 2 : 1,
    };
  }
  
  getCamera(): OrbitCamera {
    return this.camera;
  }
  
  getAxisLabels() {
    if (!this.axes) return [];
    return this.axes.getLabels();
  }

  getViewProjectionMatrix(): Float32Array {
    return this.camera.getViewProjectionMatrix();
  }

  projectToScreen(worldPos: [number, number, number]): { x: number; y: number; visible: boolean } {
    if (!this.axes) return { x: 0, y: 0, visible: false };
    const rect = this.canvas.getBoundingClientRect();
    const viewProj = this.camera.getViewProjectionMatrix();
    return this.axes.projectToScreen(worldPos, viewProj, rect.width, rect.height);
  }

  exportImage(
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality = 0.92,
    transparent = false
  ): string {
    const savedBg = [...this.backgroundColor];
    if (transparent && format === 'png') {
      this.backgroundColor = [0, 0, 0, 0];
    }
    this.render();
    this.backgroundColor = savedBg as [number, number, number, number];
    const mimeType = `image/${format}`;
    return this.canvas.toDataURL(mimeType, quality);
  }
  
  on(event: string, callback: Renderer3DEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }
  
  off(event: string, callback: Renderer3DEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }
  
  private emitEvent(type: string): void {
    const listeners = this.eventListeners.get(type);
    if (!listeners) return;
    
    const event: Renderer3DEvent = {
      type: type as any,
      timestamp: performance.now(),
      stats: this.getStats(),
      camera: {
        target: [...this.camera.target] as [number, number, number],
        radius: this.camera.radius,
        theta: this.camera.theta,
        phi: this.camera.phi,
        fov: this.camera.fov,
      },
    };
    
    listeners.forEach(callback => callback(event));
  }
  
  destroy(): void {
    this.stopRenderLoop();
    
    window.removeEventListener('resize', this.handleResize);
    
    if (this.tooltip) {
      this.tooltip.destroy();
      if (this.boundHandleMouseMove) this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
      if (this.boundHandleMouseLeave) this.canvas.removeEventListener('mouseleave', this.boundHandleMouseLeave);
    }
    
    const { gl } = this;
    
    // Stem buffers
    if (this.stemVao) gl.deleteVertexArray(this.stemVao);
    if (this.stemPositionBuffer) gl.deleteBuffer(this.stemPositionBuffer);
    if (this.stemNormalBuffer) gl.deleteBuffer(this.stemNormalBuffer);
    if (this.stemColorBuffer) gl.deleteBuffer(this.stemColorBuffer);
    if (this.stemIndexBuffer) gl.deleteBuffer(this.stemIndexBuffer);
    
    // Marker buffers
    if (this.markerVao) gl.deleteVertexArray(this.markerVao);
    if (this.markerPositionBuffer) gl.deleteBuffer(this.markerPositionBuffer);
    if (this.markerNormalBuffer) gl.deleteBuffer(this.markerNormalBuffer);
    if (this.markerColorBuffer) gl.deleteBuffer(this.markerColorBuffer);
    if (this.markerIndexBuffer) gl.deleteBuffer(this.markerIndexBuffer);
    
    this.controller.destroy();
    deleteProgramBundle(gl, this.programs);
    
    if (this.axes) {
      this.axes.destroy();
    }
    
    this.eventListeners.clear();
  }
}
