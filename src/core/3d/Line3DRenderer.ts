/**
 * Line 3D Renderer
 * Renders continuous 3D lines/tubes with configurable thickness.
 * Uses a tube geometry approach for smooth lines.
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
import { createRayFromScreen, pickLine } from './Raycaster3D';

export interface Line3DData {
  /** X coordinates */
  x: Float32Array;
  /** Y coordinates */
  y: Float32Array;
  /** Z coordinates */
  z: Float32Array;
  /** Color per vertex (optional, RGB) */
  colors?: Float32Array;
  /** Single line color [r, g, b] (used if colors not provided) */
  color?: [number, number, number];
}

export interface Line3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** Line thickness in world units (default: 0.05) */
  lineWidth?: number;
  /** Number of segments around the tube (default: 8) */
  tubeSides?: number;
  /** Enable tooltips (default: true) */
  enableTooltip?: boolean;
  tooltip?: Tooltip3DOptions;
}

export class Line3DRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private dpr: number;
  
  private programs: ProgramBundle3D;
  private camera: OrbitCamera;
  private controller: OrbitController;
  private axes: Axes3D | null = null;
  
  // Tube geometry buffers
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private normalBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private indexCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private showAxes: boolean;
  private lineWidth: number;
  private tubeSides: number;
  
  private lines: Line3DData[] = [];
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private enableTooltip: boolean;
  private lastHitIndex: { series: number, point: number } | null = null;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleMouseLeave?: () => void;
  
  // Stats
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  private lastFpsUpdate = 0;
  
  constructor(options: Line3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.showAxes = options.showAxes ?? true;
    this.lineWidth = options.lineWidth ?? 0.05;
    this.tubeSides = options.tubeSides ?? 8;
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
    if (!this.tooltip || this.lines.length === 0) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.pickAtScreen(x, y);
    
    if (hit) {
      const isNew = !this.lastHitIndex || 
                   this.lastHitIndex.series !== hit.seriesIndex || 
                   this.lastHitIndex.point !== hit.pointIndex;
      
      if (isNew) {
        this.lastHitIndex = { series: hit.seriesIndex, point: hit.pointIndex };
        const line = this.lines[hit.seriesIndex];
        const color = line.color || [0.5, 0.7, 1.0];
        
        this.tooltip.show({
          index: hit.pointIndex,
          position: [line.x[hit.pointIndex], line.y[hit.pointIndex], line.z[hit.pointIndex]],
          color: color,
          customData: { series: hit.seriesIndex }
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
    if (this.lines.length === 0) return null;
    
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix();
    const ray = createRayFromScreen(screenX, screenY, width, height, viewProj);
    
    return pickLine(ray, this.lines, this.lineWidth * 3);
  }
  
  private initBuffers(): void {
    const { gl } = this;
    
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    
    this.positionBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    
    gl.bindVertexArray(null);
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
   * Set line data (single line or array of lines)
   */
  setData(lines: Line3DData | Line3DData[]): void {
    this.lines = Array.isArray(lines) ? lines : [lines];
    this.buildTubeGeometry();
    this.calculateBounds();
    
    if (this.axes && this.bounds) {
      this.axes.updateBounds(this.bounds);
    }
    
    this.needsRender = true;
    this.emitEvent('dataUpdate');
  }
  
  /**
   * Add a single line
   */
  addLine(line: Line3DData): void {
    this.lines.push(line);
    this.buildTubeGeometry();
    this.calculateBounds();
    
    if (this.axes && this.bounds) {
      this.axes.updateBounds(this.bounds);
    }
    
    this.needsRender = true;
  }
  
  /**
   * Clear all lines
   */
  clearLines(): void {
    this.lines = [];
    this.indexCount = 0;
    this.needsRender = true;
  }
  
  private buildTubeGeometry(): void {
    const { gl, lineWidth, tubeSides, lines } = this;
    
    if (lines.length === 0) {
      this.indexCount = 0;
      return;
    }
    
    const allPositions: number[] = [];
    const allNormals: number[] = [];
    const allColors: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;
    
    for (const line of lines) {
      const pointCount = line.x.length;
      if (pointCount < 2) continue;
      
      const defaultColor = line.color ?? [0.5, 0.7, 1.0];
      
      // Generate tube cross-section for each segment
      for (let i = 0; i < pointCount; i++) {
        // Current point
        const px = line.x[i];
        const py = line.y[i];
        const pz = line.z[i];
        
        // Calculate tangent direction
        let tx: number, ty: number, tz: number;
        if (i === 0) {
          // Forward difference for first point
          tx = line.x[1] - line.x[0];
          ty = line.y[1] - line.y[0];
          tz = line.z[1] - line.z[0];
        } else if (i === pointCount - 1) {
          // Backward difference for last point
          tx = line.x[i] - line.x[i - 1];
          ty = line.y[i] - line.y[i - 1];
          tz = line.z[i] - line.z[i - 1];
        } else {
          // Central difference for middle points
          tx = line.x[i + 1] - line.x[i - 1];
          ty = line.y[i + 1] - line.y[i - 1];
          tz = line.z[i + 1] - line.z[i - 1];
        }
        
        // Normalize tangent
        const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (tLen > 0.0001) {
          tx /= tLen;
          ty /= tLen;
          tz /= tLen;
        }
        
        // Find perpendicular vectors (Frenet frame approximation)
        // Use world up (0, 1, 0) unless tangent is nearly vertical
        let upX = 0, upY = 1, upZ = 0;
        if (Math.abs(ty) > 0.99) {
          upX = 1; upY = 0; upZ = 0;
        }
        
        // Normal = tangent × up
        let nx = ty * upZ - tz * upY;
        let ny = tz * upX - tx * upZ;
        let nz = tx * upY - ty * upX;
        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (nLen > 0.0001) {
          nx /= nLen;
          ny /= nLen;
          nz /= nLen;
        }
        
        // Binormal = tangent × normal
        const bx = ty * nz - tz * ny;
        const by = tz * nx - tx * nz;
        const bz = tx * ny - ty * nx;
        
        // Generate circle of vertices around the point
        for (let s = 0; s < tubeSides; s++) {
          const angle = (s / tubeSides) * Math.PI * 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          // Offset from center line
          const ox = (nx * cos + bx * sin) * lineWidth;
          const oy = (ny * cos + by * sin) * lineWidth;
          const oz = (nz * cos + bz * sin) * lineWidth;
          
          allPositions.push(px + ox, py + oy, pz + oz);
          allNormals.push(nx * cos + bx * sin, ny * cos + by * sin, nz * cos + bz * sin);
          
          // Color
          if (line.colors) {
            allColors.push(
              line.colors[i * 3],
              line.colors[i * 3 + 1],
              line.colors[i * 3 + 2]
            );
          } else {
            allColors.push(defaultColor[0], defaultColor[1], defaultColor[2]);
          }
        }
        
        // Generate indices (connect to next ring)
        if (i < pointCount - 1) {
          for (let s = 0; s < tubeSides; s++) {
            const current = vertexOffset + i * tubeSides + s;
            const next = vertexOffset + i * tubeSides + ((s + 1) % tubeSides);
            const currentNext = current + tubeSides;
            const nextNext = next + tubeSides;
            
            // Two triangles per quad
            allIndices.push(current, next, currentNext);
            allIndices.push(next, nextNext, currentNext);
          }
        }
      }
      
      vertexOffset += pointCount * tubeSides;
    }
    
    // Upload to GPU
    const positions = new Float32Array(allPositions);
    const normals = new Float32Array(allNormals);
    const colors = new Float32Array(allColors);
    const indices = new Uint32Array(allIndices);
    
    this.indexCount = indices.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }
  
  private calculateBounds(): void {
    if (this.lines.length === 0) {
      this.bounds = null;
      return;
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (const line of this.lines) {
      for (let i = 0; i < line.x.length; i++) {
        if (line.x[i] < minX) minX = line.x[i];
        if (line.x[i] > maxX) maxX = line.x[i];
        if (line.y[i] < minY) minY = line.y[i];
        if (line.y[i] > maxY) maxY = line.y[i];
        if (line.z[i] < minZ) minZ = line.z[i];
        if (line.z[i] > maxZ) maxZ = line.z[i];
      }
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
    const padding = 0.01;
    
    this.camera.fitToBounds(
      minX - dx * padding, minY - dy * padding, minZ - dz * padding,
      maxX + dx * padding, maxY + dy * padding, maxZ + dz * padding
    );
    
    // Closer fit
    this.camera.radius *= 1.05;
    
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
    
    // Render tubes
    if (this.indexCount > 0) {
      const program = this.programs.surfaceProgram;
      gl.useProgram(program.program);
      
      gl.uniformMatrix4fv(program.uniforms['u_viewProjection'], false, viewProj);
      gl.uniform1f(program.uniforms['u_opacity'], 1.0);
      gl.uniform3f(program.uniforms['u_lightDir'], 1, 1, 1);
      gl.uniform1f(program.uniforms['u_ambient'], 0.35);
      
      gl.bindVertexArray(this.vao);
      
      // Position
      const posLoc = program.attributes['a_position'];
      if (posLoc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      }
      
      // Normal
      const normalLoc = program.attributes['a_normal'];
      if (normalLoc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(normalLoc);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
      }
      
      // Color
      const colorLoc = program.attributes['a_color'];
      if (colorLoc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
      }
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
      
      gl.bindVertexArray(null);
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
      instanceCount: this.indexCount / 6, // Approximate triangle count
      frameTime: this.lastFrameTime,
      drawCalls: 1,
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
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.normalBuffer) gl.deleteBuffer(this.normalBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    
    this.controller.destroy();
    deleteProgramBundle(gl, this.programs);
    
    if (this.axes) {
      this.axes.destroy();
    }
    
    this.eventListeners.clear();
  }
}
