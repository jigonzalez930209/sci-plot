/**
 * Area 3D Renderer
 * Renders filled areas (curtain effect) as continuous surfaces.
 * Creates a mesh from a line down to a base plane.
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
import { createRayFromScreen, pickArea } from './Raycaster3D';
import { createTheme, type CustomThemeOptions, type ColorTheme } from './colorThemes';

export interface AreaSeriesData {
  /** X coordinates */
  x: Float32Array;
  /** Y coordinates (top of area) */
  y: Float32Array;
  /** Z coordinates */
  z: Float32Array;
  /** Base Y value (bottom of area, default: 0) */
  baseY?: number;
  /** Color per vertex (optional, RGB) */
  colors?: Float32Array;
  /** Single area color [r, g, b] */
  color?: [number, number, number];
}

export interface Area3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  /** Opacity of areas (default: 0.8) */
  opacity?: number;
  /** Enable tooltips (default: true) */
  enableTooltip?: boolean;
  tooltip?: Tooltip3DOptions;
  /** Color theme options */
  theme?: CustomThemeOptions;
}

export class Area3DRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private dpr: number;
  
  private programs: ProgramBundle3D;
  private camera: OrbitCamera;
  private controller: OrbitController;
  private axes: Axes3D | null = null;
  
  // Geometry buffers
  private vao: WebGLVertexArrayObject | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private normalBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private indexCount = 0;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private showAxes: boolean;
  private opacity: number;
  
  private areas: AreaSeriesData[] = [];
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Hover highlight
  private hoveredSeriesIndex: number | null = null;
  private colorTheme: ColorTheme;
  
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
  
  constructor(options: Area3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.showAxes = options.showAxes ?? true;
    this.opacity = options.opacity ?? 0.8;
    this.enableTooltip = options.enableTooltip ?? true;
    
    if (options.backgroundColor) {
      this.backgroundColor = options.backgroundColor;
    }
    
    // Initialize color theme
    this.colorTheme = createTheme(options.theme || {}, this.backgroundColor);
    
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
    
    // Enable depth testing and blending
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
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
    if (this.areas.length === 0) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.pickAtScreen(x, y);
    
    // Update hovered series
    const newHoveredIndex = hit ? hit.seriesIndex : null;
    if (newHoveredIndex !== this.hoveredSeriesIndex) {
      this.hoveredSeriesIndex = newHoveredIndex;
      this.buildAreaGeometry();
      this.needsRender = true;
    }
    
    // Tooltip logic
    if (this.tooltip) {
      if (hit) {
        const isNew = !this.lastHitIndex || 
                     this.lastHitIndex.series !== hit.seriesIndex || 
                     this.lastHitIndex.point !== hit.pointIndex;
        
        if (isNew) {
          this.lastHitIndex = { series: hit.seriesIndex, point: hit.pointIndex };
          const area = this.areas[hit.seriesIndex];
          const color = area.color || [0.5, 0.7, 1.0];
          
          this.tooltip.show({
            index: hit.pointIndex,
            position: [area.x[hit.pointIndex], area.y[hit.pointIndex], area.z[hit.pointIndex]],
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
  }

  private handleMouseLeave(): void {
    // Reset highlight
    if (this.hoveredSeriesIndex !== null) {
      this.hoveredSeriesIndex = null;
      this.buildAreaGeometry();
      this.needsRender = true;
    }
    
    if (this.tooltip) {
      this.tooltip.hide();
      this.lastHitIndex = null;
    }
  }

  pickAtScreen(screenX: number, screenY: number) {
    if (this.areas.length === 0) return null;
    
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix();
    const ray = createRayFromScreen(screenX, screenY, width, height, viewProj);
    
    return pickArea(ray, this.areas, 0.5);
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
   * Set area data (single area or array of areas)
   */
  setData(areas: AreaSeriesData | AreaSeriesData[]): void {
    this.areas = Array.isArray(areas) ? areas : [areas];
    this.buildAreaGeometry();
    this.calculateBounds();
    
    if (this.axes && this.bounds) {
      this.axes.updateBounds(this.bounds);
    }
    
    this.needsRender = true;
    this.emitEvent('dataUpdate');
  }
  
  /**
   * Add a single area
   */
  addArea(area: AreaSeriesData): void {
    this.areas.push(area);
    this.buildAreaGeometry();
    this.calculateBounds();
    
    if (this.axes && this.bounds) {
      this.axes.updateBounds(this.bounds);
    }
    
    this.needsRender = true;
  }
  
  /**
   * Clear all areas
   */
  clearAreas(): void {
    this.areas = [];
    this.indexCount = 0;
    this.needsRender = true;
  }
  
  private buildAreaGeometry(): void {
    const { gl, areas } = this;
    
    if (areas.length === 0) {
      this.indexCount = 0;
      return;
    }
    
    const allPositions: number[] = [];
    const allNormals: number[] = [];
    const allColors: number[] = [];
    const allIndices: number[] = [];
    let vertexOffset = 0;
    
    // Get color palette from theme
    const colorPalette = this.colorTheme.seriesPalette;
    const highlightColor = this.colorTheme.highlightColor;
    
    for (let areaIdx = 0; areaIdx < areas.length; areaIdx++) {
      const area = areas[areaIdx];
      const pointCount = area.x.length;
      if (pointCount < 2) continue;
      
      // Use highlight color if this series is hovered
      const isHovered = areaIdx === this.hoveredSeriesIndex;
      const defaultColor = isHovered
        ? highlightColor
        : (area.color ?? colorPalette[areaIdx % colorPalette.length]);
      
      const baseY = area.baseY ?? 0;
      
      // For each segment, create a quad (2 triangles)
      // Top-left, Top-right, Bottom-left, Bottom-right pattern
      for (let i = 0; i < pointCount; i++) {
        const x = area.x[i];
        const y = area.y[i];
        const z = area.z[i];
        
        // Top vertex
        allPositions.push(x, y, z);
        // Bottom vertex
        allPositions.push(x, baseY, z);
        
        // Calculate normal (perpendicular to surface)
        // For a curtain, the normal points in the Z direction
        // (or we can calculate from adjacent points)
        let nx = 0, ny = 0, nz = 1;
        
        if (i < pointCount - 1) {
          // Forward direction
          const dx = area.x[i + 1] - area.x[i];
          const dy = area.y[i + 1] - area.y[i];
          const dz = area.z[i + 1] - area.z[i];
          
          // Cross product with up vector to get normal
          // normal = forward × up
          nx = dy * 0 - 0 * 1; // dz=0 assumed for curtain
          ny = 0 * dx - dx * 0;
          nz = dx * 1 - dy * 0;
          
          // Actually, for curtain facing outward, use perpendicular in XZ plane
          // Simplified: normal perpendicular to line direction in XZ
          const len = Math.sqrt(dx * dx + dz * dz);
          if (len > 0.001) {
            nx = -dz / len;
            ny = 0;
            nz = dx / len;
          }
        }
        
        // Same normal for top and bottom
        allNormals.push(nx, ny, nz);
        allNormals.push(nx, ny, nz);
        
        // Colors with gradient (darker at base)
        if (area.colors) {
          const r = area.colors[i * 3];
          const g = area.colors[i * 3 + 1];
          const b = area.colors[i * 3 + 2];
          allColors.push(r, g, b); // Top
          allColors.push(r * 0.5, g * 0.5, b * 0.5); // Bottom (darker)
        } else {
          allColors.push(defaultColor[0], defaultColor[1], defaultColor[2]); // Top
          allColors.push(defaultColor[0] * 0.5, defaultColor[1] * 0.5, defaultColor[2] * 0.6); // Bottom
        }
        
        // Generate indices (connect to next segment)
        if (i < pointCount - 1) {
          const topLeft = vertexOffset + i * 2;
          const bottomLeft = topLeft + 1;
          const topRight = topLeft + 2;
          const bottomRight = topLeft + 3;
          
          // Two triangles per quad
          allIndices.push(topLeft, bottomLeft, topRight);
          allIndices.push(topRight, bottomLeft, bottomRight);
        }
      }
      
      vertexOffset += pointCount * 2;
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
    if (this.areas.length === 0) {
      this.bounds = null;
      return;
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (const area of this.areas) {
      const baseY = area.baseY ?? 0;
      if (baseY < minY) minY = baseY;
      
      for (let i = 0; i < area.x.length; i++) {
        if (area.x[i] < minX) minX = area.x[i];
        if (area.x[i] > maxX) maxX = area.x[i];
        if (area.y[i] < minY) minY = area.y[i];
        if (area.y[i] > maxY) maxY = area.y[i];
        if (area.z[i] < minZ) minZ = area.z[i];
        if (area.z[i] > maxZ) maxZ = area.z[i];
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
    const padding = 0.001;
    
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
    
    // Render areas
    if (this.indexCount > 0) {
      const program = this.programs.surfaceProgram;
      gl.useProgram(program.program);
      
      gl.uniformMatrix4fv(program.uniforms['u_viewProjection'], false, viewProj);
      gl.uniform1f(program.uniforms['u_opacity'], this.opacity);
      gl.uniform3f(program.uniforms['u_lightDir'], 1, 1, 1);
      gl.uniform1f(program.uniforms['u_ambient'], 0.6);
      
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
      instanceCount: this.indexCount / 6,
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
