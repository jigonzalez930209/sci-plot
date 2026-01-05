/**
 * Surface Mesh 3D Renderer
 * Complete renderer for surface mesh visualization with axes, camera, and controls.
 */

import { OrbitCamera, type OrbitCameraOptions } from './camera/OrbitCamera';
import { OrbitController, type OrbitControllerOptions } from './controls/OrbitController';
import { SurfaceMesh3D } from './series/SurfaceMesh3D';
import {
  createProgramBundle3D,
  deleteProgramBundle,
  type ProgramBundle3D,
} from './shader/programs';
import { Axes3D, type Axes3DOptions } from './Axes3D';
import type { SurfaceMesh3DData } from './series/types';
import type {
  Renderer3DOptions,
  Bounds3D,
  RenderStats3D,
  Renderer3DEvent,
  Renderer3DEventCallback,
} from './types';

export interface SurfaceMesh3DRendererOptions extends Renderer3DOptions {
  camera?: OrbitCameraOptions;
  controls?: OrbitControllerOptions;
  axes?: Axes3DOptions;
  showAxes?: boolean;
  wireframe?: boolean;
  opacity?: number;
  enableLighting?: boolean;
  ambient?: number;
  lightDirection?: [number, number, number];
}

export class SurfaceMesh3DRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private dpr: number;
  
  private programs: ProgramBundle3D;
  private mesh: SurfaceMesh3D;
  private camera: OrbitCamera;
  private controller: OrbitController;
  private axes: Axes3D | null = null;
  
  private backgroundColor: [number, number, number, number] = [0.05, 0.05, 0.1, 1];
  private showAxes: boolean;
  private wireframe: boolean;
  private opacity: number;
  private enableLighting: boolean;
  private ambient: number;
  private lightDirection: [number, number, number];
  
  private bounds: Bounds3D | null = null;
  private vertexCount = 0;
  
  private animationFrameId: number | null = null;
  private needsRender = true;
  
  private eventListeners: Map<string, Set<Renderer3DEventCallback>> = new Map();
  
  // Stats
  private lastFrameTime = 0;
  private frameCount = 0;
  private fps = 0;
  private lastFpsUpdate = 0;
  
  constructor(options: SurfaceMesh3DRendererOptions) {
    this.canvas = options.canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.showAxes = options.showAxes ?? true;
    this.wireframe = options.wireframe ?? false;
    this.opacity = options.opacity ?? 1;
    this.enableLighting = options.enableLighting ?? true;
    this.ambient = options.ambient ?? 0.35;
    this.lightDirection = options.lightDirection ?? [1, 1, 1];
    
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
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Create shader programs
    this.programs = createProgramBundle3D(gl);
    
    // Create surface mesh
    this.mesh = new SurfaceMesh3D(gl);
    
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
    
    // Handle resize
    this.resize();
    window.addEventListener('resize', this.handleResize);
    
    // Start render loop
    this.startRenderLoop();
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
   * Set surface mesh data
   */
  setData(data: SurfaceMesh3DData): void {
    this.mesh.updateData(data);
    this.vertexCount = data.xValues.length * data.zValues.length;
    
    // Calculate bounds
    this.bounds = this.calculateBounds(data);
    
    // Update axes
    if (this.axes && this.bounds) {
      this.axes.updateBounds(this.bounds);
    }
    
    this.needsRender = true;
    this.emitEvent('dataUpdate');
  }
  
  private calculateBounds(data: SurfaceMesh3DData): Bounds3D {
    const xMin = Math.min(...data.xValues);
    const xMax = Math.max(...data.xValues);
    const zMin = Math.min(...data.zValues);
    const zMax = Math.max(...data.zValues);
    
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < data.yValues.length; i++) {
      if (data.yValues[i] < yMin) yMin = data.yValues[i];
      if (data.yValues[i] > yMax) yMax = data.yValues[i];
    }
    
    return { minX: xMin, maxX: xMax, minY: yMin, maxY: yMax, minZ: zMin, maxZ: zMax };
  }
  
  /**
   * Fit camera to show all data
   */
  fitToData(): void {
    if (!this.bounds) return;
    
    const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;
    const center: [number, number, number] = [
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2,
    ];
    
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const maxSize = Math.max(sizeX, sizeY, sizeZ);
    
    this.camera.target = center;
    this.camera.radius = maxSize * 2;
    this.camera.theta = Math.PI / 4;
    this.camera.phi = Math.PI / 4;
    
    this.needsRender = true;
  }
  
  /**
   * Render a single frame
   */
  render(): void {
    const { gl, programs, mesh, camera, backgroundColor } = this;
    
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
    
    // Render surface mesh
    const program = programs.surfaceProgram;
    gl.useProgram(program.program);
    
    // Set uniforms
    gl.uniformMatrix4fv(program.uniforms['u_viewProjection'], false, viewProj);
    gl.uniform1f(program.uniforms['u_opacity'], this.opacity);
    
    if (this.enableLighting) {
      const [lx, ly, lz] = this.lightDirection;
      gl.uniform3f(program.uniforms['u_lightDir'], lx, ly, lz);
      gl.uniform1f(program.uniforms['u_ambient'], this.ambient);
    }
    
    mesh.render(program, this.wireframe);
    
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
  
  /**
   * Set wireframe mode
   */
  setWireframe(enabled: boolean): void {
    this.wireframe = enabled;
    this.needsRender = true;
  }
  
  /**
   * Set background color
   */
  setBackgroundColor(color: [number, number, number, number]): void {
    this.backgroundColor = color;
    this.needsRender = true;
  }
  
  /**
   * Get rendering stats
   */
  getStats(): RenderStats3D {
    return {
      fps: this.fps,
      instanceCount: this.vertexCount,
      frameTime: this.lastFrameTime,
      drawCalls: 1,
    };
  }
  
  /**
   * Get the camera
   */
  getCamera(): OrbitCamera {
    return this.camera;
  }
  
  /**
   * Get axis labels for 2D text overlay
   */
  getAxisLabels(): { text: string; worldPosition: [number, number, number]; axis: string; color: [number, number, number] }[] {
    if (!this.axes) return [];
    return this.axes.getLabels();
  }
  
  /**
   * Project world coordinates to screen coordinates
   */
  projectToScreen(worldPos: [number, number, number]): { x: number; y: number; visible: boolean } {
    if (!this.axes) return { x: 0, y: 0, visible: false };
    
    const viewProj = this.camera.getViewProjectionMatrix();
    const rect = this.canvas.getBoundingClientRect();
    
    return this.axes.projectToScreen(worldPos, viewProj, rect.width, rect.height);
  }
  
  /**
   * Get the current view-projection matrix
   */
  getViewProjectionMatrix(): Float32Array {
    return this.camera.getViewProjectionMatrix();
  }
  
  /**
   * Get canvas dimensions
   */
  getCanvasSize(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }
  
  /**
   * Add event listener
   */
  on(event: string, callback: Renderer3DEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }
  
  /**
   * Remove event listener
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
   * Clean up all resources
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
