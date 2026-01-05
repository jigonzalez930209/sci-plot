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
import type {
  Bubble3DData,
  Bubble3DStyle,
  Renderer3DOptions,
  Bounds3D,
  RenderStats3D,
  Renderer3DEvent,
  Renderer3DEventCallback,
} from './types';

export interface Bubble3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  style?: Bubble3DStyle;
  autoRender?: boolean;
  /** Axes configuration */
  axes?: Axes3DOptions;
  /** Show axes (default: true) */
  showAxes?: boolean;
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
  
  // Stats
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  private lastFpsUpdate = 0;
  
  constructor(options: Bubble3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.autoRender = options.autoRender ?? true;
    this.showAxes = options.showAxes ?? true;
    
    if (options.backgroundColor) {
      this.backgroundColor = options.backgroundColor;
    }
    
    // Initialize style with defaults
    this.style = {
      opacity: options.style?.opacity ?? 1,
      defaultColor: options.style?.defaultColor ?? [0.2, 0.6, 1],
      defaultScale: options.style?.defaultScale ?? 0.1,
      geometry: options.style?.geometry ?? 'icosphere',
      subdivisions: options.style?.subdivisions ?? 1,
      enableLighting: options.style?.enableLighting ?? true,
      lightDirection: options.style?.lightDirection ?? [1, 1, 1],
      ambient: options.style?.ambient ?? 0.3,
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
    
    // Handle resize
    this.resize();
    window.addEventListener('resize', this.handleResize);
    
    // Start render loop if autoRender
    if (this.autoRender) {
      this.startRenderLoop();
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
      this.camera.fitToBounds(
        this.bounds.minX, this.bounds.minY, this.bounds.minZ,
        this.bounds.maxX, this.bounds.maxY, this.bounds.maxZ
      );
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
   * Clean up all resources.
   */
  destroy(): void {
    this.stopRenderLoop();
    
    window.removeEventListener('resize', this.handleResize);
    
    this.controller.destroy();
    this.mesh.destroy();
    deleteProgramBundle(this.gl, this.programs);
    
    if (this.axes) {
      this.axes.destroy();
    }
    
    this.eventListeners.clear();
  }
}
