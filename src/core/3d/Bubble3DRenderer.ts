/**
 * Main 3D Bubble renderer integrating all components.
 * Provides a high-level API for rendering instanced 3D bubbles.
 */

import { OrbitCamera, type OrbitCameraOptions } from './camera/OrbitCamera';
import { OrbitController, type OrbitControllerOptions } from './controls/OrbitController';
import {
  createIcosphere,
  createUVSphere,
  createCube,
  type GeometryData,
} from './mesh/geometry';
import { InstancedMesh, type InstanceData } from './mesh/InstancedMesh';
import {
  createProgramBundle3D,
  deleteProgramBundle,
  type ProgramBundle3D,
} from './shader/programs';
import { Axes3D, type Axes3DOptions } from './Axes3D';
import {
  createRayFromScreen,
  pickBubble,
  type Ray3D,
  type HitResult,
} from './Raycaster3D';
import type {
  Bubble3DData,
  Bubble3DStyle,
  Renderer3DOptions,
  Bounds3D,
  RenderStats3D,
  Renderer3DEvent,
  Renderer3DEventCallback,
} from './types';
import { Tooltip3D, type Tooltip3DOptions, type Tooltip3DData } from './Tooltip3D';
import { createTheme, type CustomThemeOptions, type ColorTheme } from './colorThemes';

export interface Bubble3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  style?: Bubble3DStyle;
  autoRender?: boolean;
  /** Axes configuration */
  axes?: Axes3DOptions;
  /** Show axes (default: true) */
  showAxes?: boolean;
  /** Enable tooltips on hover (default: true) */
  enableTooltip?: boolean;
  /** Tooltip configuration */
  tooltip?: Tooltip3DOptions;
  /** Custom tooltip formatter */
  tooltipFormatter?: (data: Tooltip3DData) => string;
  /** Color theme options */
  theme?: CustomThemeOptions;
}

export class Bubble3DRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private dpr: number;
  
  private programs: ProgramBundle3D;
  private mesh: InstancedMesh;
  private camera: OrbitCamera;
  private controller: OrbitController;
  private axes: Axes3D | null = null;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private style: Required<Bubble3DStyle>;
  private showAxes: boolean;
  
  private instanceData: InstanceData | null = null;
  private bounds: Bounds3D | null = null;
  
  private animationFrameId: number | null = null;
  private autoRender: boolean;
  private needsRender = true;
  
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Tooltip
  private tooltip: Tooltip3D | null = null;
  private enableTooltip: boolean;
  private lastHitIndex = -1;
  private boundHandleMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundHandleMouseLeave: (() => void) | null = null;
  
  // Stats
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  private lastFpsUpdate = 0;
  
  // Color theme
  private colorTheme: ColorTheme;
  
  constructor(options: Bubble3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.autoRender = options.autoRender ?? true;
    this.showAxes = options.showAxes ?? true;
    
    if (options.backgroundColor) {
      this.backgroundColor = options.backgroundColor;
    }
    
    // Initialize color theme
    this.colorTheme = createTheme(options.theme || {}, this.backgroundColor);
    
    // Initialize style with defaults (using theme colors)
    this.style = {
      opacity: options.style?.opacity ?? 1,
      defaultColor: options.style?.defaultColor ?? this.colorTheme.seriesPalette[0],
      defaultScale: options.style?.defaultScale ?? 0.1,
      geometry: options.style?.geometry ?? 'icosphere',
      subdivisions: options.style?.subdivisions ?? 1,
      enableLighting: options.style?.enableLighting ?? true,
      lightDirection: options.style?.lightDirection ?? [1, 1, 1],
      ambient: options.style?.ambient ?? 0.4,
    };
    
    // Initialize WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: options.antialias ?? true,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: options.powerPreference ?? 'high-performance',
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
    
    // Create geometry based on style
    const geometry = this.createGeometry();
    
    // Create instanced mesh
    this.mesh = new InstancedMesh(gl, {
      geometry,
      maxInstances: options.maxInstances ?? 100000,
    });
    
    // Create camera
    this.camera = new OrbitCamera(options.camera);
    
    // Create controller
    this.controller = new OrbitController(
      this.camera,
      this.canvas,
      options.controls
    );
    
    // Setup controller callback
    this.controller.onChange(() => {
      this.needsRender = true;
      this.emitEvent('cameraChange');
    });
    
    // Create axes renderer
    if (this.showAxes) {
      this.axes = new Axes3D(this.gl, options.axes);
    }
    
    // Initialize tooltip
    this.enableTooltip = options.enableTooltip ?? true;
    if (this.enableTooltip) {
      const tooltipOptions: Tooltip3DOptions = {
        ...options.tooltip,
        formatter: options.tooltipFormatter,
      };
      this.tooltip = new Tooltip3D(this.canvas.parentElement || document.body, tooltipOptions);
      
      // Setup hover handlers
      this.boundHandleMouseMove = this.handleMouseMove.bind(this);
      this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
      this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
      this.canvas.addEventListener('mouseleave', this.boundHandleMouseLeave);
    }
    
    // Handle resize
    this.resize();
    window.addEventListener('resize', this.handleResize);
    
    // Start render loop if autoRender
    if (this.autoRender) {
      this.startRenderLoop();
    }
  }
  
  private handleMouseMove(e: MouseEvent): void {
    if (!this.tooltip || !this.instanceData) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.pickAtScreen(x, y);
    
    if (hit) {
      if (hit.index !== this.lastHitIndex) {
        this.lastHitIndex = hit.index;
        
        const bubbleData = this.getBubbleData(hit.index);
        if (bubbleData) {
          this.tooltip.show({
            index: hit.index,
            position: bubbleData.position,
            color: bubbleData.color,
            scale: bubbleData.scale,
          }, x, y);
          
          this.emitEvent('hover');
        }
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
  
  private createGeometry(): GeometryData {
    switch (this.style.geometry) {
      case 'uvsphere':
        return createUVSphere(16, 12);
      case 'cube':
        return createCube();
      case 'icosphere':
      default:
        return createIcosphere(this.style.subdivisions);
    }
  }
  
  private handleResize = (): void => {
    this.resize();
    this.needsRender = true;
    this.emitEvent('resize');
  };
  
  /**
   * Resize canvas to match display size.
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width * this.dpr;
    const height = rect.height * this.dpr;
    
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
      this.camera.setAspect(width / height);
    }
  }
  
  /**
   * Set bubble data for rendering.
   */
  setData(data: Bubble3DData): void {
    const count = data.positions.length / 3;
    
    // Create scales array if not provided
    const scales = data.scales ?? new Float32Array(count).fill(this.style.defaultScale);
    
    // Create colors array if not provided
    let colors: Float32Array;
    if (data.colors) {
      colors = data.colors;
    } else {
      colors = new Float32Array(count * 3);
      const [r, g, b] = this.style.defaultColor;
      for (let i = 0; i < count; i++) {
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
    }
    
    this.instanceData = {
      positions: data.positions,
      scales,
      colors,
    };
    
    // Calculate bounds
    this.bounds = this.calculateBounds(data.positions);
    
    // Update axes with new bounds
    if (this.axes && this.bounds) {
      this.axes.updateBounds(this.bounds);
    }
    
    // Update mesh
    this.mesh.updateInstances(this.instanceData);
    
    this.needsRender = true;
    this.emitEvent('dataUpdate');
  }
  
  private calculateBounds(positions: Float32Array): Bounds3D {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    
    return { minX, maxX, minY, maxY, minZ, maxZ };
  }
  
  /**
   * Fit camera to view all data.
   */
  fitToData(): void {
    if (this.bounds) {
      const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;
      
      const dx = maxX - minX;
      const dy = maxY - minY;
      const dz = maxZ - minZ;
      const padding = 0.01;
      
      this.camera.fitToBounds(
        minX - dx * padding, minY - dy * padding, minZ - dz * padding,
        maxX + dx * padding, maxY + dy * padding, maxZ + dz * padding
      );
      
      this.camera.radius *= 1.05;
      this.needsRender = true;
    }
  }
  
  /**
   * Render a single frame.
   */
  render(): void {
    const { gl, programs, mesh, camera, style, backgroundColor } = this;
    
    const startTime = performance.now();
    
    // Clear
    gl.clearColor(
      backgroundColor[0],
      backgroundColor[1],
      backgroundColor[2],
      backgroundColor[3]
    );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    if (!this.instanceData) return;
    
    // Get view projection matrix
    const viewProj = camera.getViewProjectionMatrix();
    
    // Render axes first (behind bubbles)
    if (this.axes) {
      this.axes.render(viewProj);
    }
    
    // Now set up and render bubbles
    // Select program based on lighting
    const program = style.enableLighting
      ? programs.bubbleProgram
      : programs.bubbleFlatProgram;
    
    gl.useProgram(program.program);
    
    // Set uniforms
    gl.uniformMatrix4fv(program.uniforms['u_viewProjection'], false, viewProj);
    gl.uniform1f(program.uniforms['u_opacity'], style.opacity);
    
    if (style.enableLighting) {
      const [lx, ly, lz] = style.lightDirection;
      gl.uniform3f(program.uniforms['u_lightDir'], lx, ly, lz);
      gl.uniform1f(program.uniforms['u_ambient'], style.ambient);
    }
    
    // Render instances
    mesh.render(program);
    
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
  
  /**
   * Start automatic render loop.
   */
  startRenderLoop(): void {
    if (this.animationFrameId !== null) return;
    
    const loop = (): void => {
      // Update controller damping
      const moving = this.controller.update();
      
      if (this.needsRender || moving) {
        this.render();
        this.needsRender = false;
      }
      
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }
  
  /**
   * Stop automatic render loop.
   */
  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Request a render on next frame.
   */
  requestRender(): void {
    this.needsRender = true;
  }
  
  /**
   * Get render statistics.
   */
  getStats(): RenderStats3D {
    return {
      instanceCount: this.mesh.getInstanceCount(),
      drawCalls: 1,
      frameTime: this.lastFrameTime,
      fps: this.fps,
    };
  }
  
  /**
   * Get camera instance for direct manipulation.
   */
  getCamera(): OrbitCamera {
    return this.camera;
  }
  
  /**
   * Get controller instance for configuration.
   */
  getController(): OrbitController {
    return this.controller;
  }
  
  /**
   * Update style options.
   */
  setStyle(style: Partial<Bubble3DStyle>): void {
    Object.assign(this.style, style);
    this.needsRender = true;
  }
  
  /**
   * Set background color.
   */
  setBackgroundColor(r: number, g: number, b: number, a = 1): void {
    this.backgroundColor = [r, g, b, a];
    this.needsRender = true;
  }
  
  /**
   * Add event listener.
   */
  on(event: string, callback: Renderer3DEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }
  
  /**
   * Remove event listener.
   */
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
    
    listeners.forEach(callback => {
      callback(event);
    });
  }
  
  /**
   * Get axis labels for 2D text overlay rendering.
   * Returns labels with world positions that need to be projected to screen.
   */
  getAxisLabels(): { text: string; worldPosition: [number, number, number]; axis: string; color: [number, number, number] }[] {
    if (!this.axes) return [];
    return this.axes.getLabels();
  }
  
  /**
   * Project world coordinates to screen coordinates.
   * Useful for positioning 2D overlay text.
   */
  projectToScreen(worldPos: [number, number, number]): { x: number; y: number; visible: boolean } {
    if (!this.axes) return { x: 0, y: 0, visible: false };
    
    const viewProj = this.camera.getViewProjectionMatrix();
    const rect = this.canvas.getBoundingClientRect();
    
    return this.axes.projectToScreen(worldPos, viewProj, rect.width, rect.height);
  }
  
  /**
   * Get the current view-projection matrix.
   */
  getViewProjectionMatrix(): Float32Array {
    return this.camera.getViewProjectionMatrix();
  }
  
  /**
   * Get canvas dimensions.
   */
  getCanvasSize(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }
  
  /**
   * Get WebGL context info.
   */
  getContextInfo(): Record<string, any> {
    const { gl } = this;
    return {
      renderer: gl.getParameter(gl.RENDERER),
      vendor: gl.getParameter(gl.VENDOR),
      version: gl.getParameter(gl.VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    };
  }
  
  /**
   * Pick a bubble at screen coordinates.
   * @param screenX X coordinate relative to canvas
   * @param screenY Y coordinate relative to canvas
   * @returns Hit result with bubble index, or null if no hit
   */
  pickAtScreen(screenX: number, screenY: number): HitResult | null {
    if (!this.instanceData) return null;
    
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix();
    
    const ray = createRayFromScreen(screenX, screenY, width, height, viewProj);
    
    return pickBubble(ray, this.instanceData.positions, this.instanceData.scales);
  }
  
  /**
   * Create a ray from screen coordinates.
   * Useful for custom picking logic.
   */
  createRay(screenX: number, screenY: number): Ray3D {
    const { width, height } = this.getCanvasSize();
    const viewProj = this.camera.getViewProjectionMatrix();
    return createRayFromScreen(screenX, screenY, width, height, viewProj);
  }
  
  /**
   * Get data for a specific bubble by index.
   */
  getBubbleData(index: number): { position: [number, number, number]; color: [number, number, number]; scale: number } | null {
    if (!this.instanceData || index < 0 || index >= this.instanceData.scales.length) {
      return null;
    }
    
    const i3 = index * 3;
    return {
      position: [
        this.instanceData.positions[i3],
        this.instanceData.positions[i3 + 1],
        this.instanceData.positions[i3 + 2],
      ],
      color: [
        this.instanceData.colors[i3],
        this.instanceData.colors[i3 + 1],
        this.instanceData.colors[i3 + 2],
      ],
      scale: this.instanceData.scales[index],
    };
  }
  /**
   * Export the current view as an image.
   * @param format Image format ('png' | 'jpeg' | 'webp')
   * @param quality Quality for jpeg/webp (0-1)
   * @param transparent Use transparent background (only for 'png')
   * @returns Data URL of the image
   */
  exportImage(
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality = 0.92,
    transparent = false
  ): string {
    // Save current background
    const savedBg = [...this.backgroundColor];
    
    // Set transparent background if requested
    if (transparent && format === 'png') {
      this.backgroundColor = [0, 0, 0, 0];
    }
    
    // Force a render to capture current state
    this.render();
    
    // Restore background
    this.backgroundColor = savedBg as [number, number, number, number];
    
    // Export canvas
    const mimeType = `image/${format}`;
    return this.canvas.toDataURL(mimeType, quality);
  }
  
  /**
   * Export the current view as a Blob.
   * @param format Image format ('png' | 'jpeg' | 'webp')
   * @param quality Quality for jpeg/webp (0-1)
   * @returns Promise that resolves to Blob
   */
  async exportImageBlob(
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality = 0.92
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.render();
      const mimeType = `image/${format}`;
      this.canvas.toBlob(resolve, mimeType, quality);
    });
  }
  
  /**
   * Download the current view as an image file.
   * @param filename Filename without extension
   * @param format Image format
   * @param quality Quality for jpeg/webp
   */
  downloadImage(
    filename = 'chart-3d',
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality = 0.92
  ): void {
    const dataUrl = this.exportImage(format, quality);
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = dataUrl;
    link.click();
  }
  
  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.stopRenderLoop();
    
    window.removeEventListener('resize', this.handleResize);
    
    // Clean up tooltip
    if (this.tooltip) {
      this.tooltip.destroy();
      if (this.boundHandleMouseMove) {
        this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
      }
      if (this.boundHandleMouseLeave) {
        this.canvas.removeEventListener('mouseleave', this.boundHandleMouseLeave);
      }
    }
    
    this.controller.destroy();
    this.mesh.destroy();
    deleteProgramBundle(this.gl, this.programs);
    
    if (this.axes) {
      this.axes.destroy();
    }
    
    this.eventListeners.clear();
  }
}
