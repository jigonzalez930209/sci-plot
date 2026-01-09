/**
 * 3D Axes Renderer
 * Renders X, Y, Z axes with:
 * - Grid lines on 3 wall planes (XZ floor, XY back, YZ side)
 * - Axis lines at the edges of the bounding box
 * - Tick marks with numeric labels
 * - Support for billboard text labels (rendered via 2D canvas overlay)
 */

import type { Bounds3D, Axis3DConfig } from './types';

/** Axis label info for text overlay rendering */
export interface AxisLabel3D {
  text: string;
  worldPosition: [number, number, number];
  axis: 'x' | 'y' | 'z' | 'title';
  color: [number, number, number];
}

/** Full axis configuration with defaults applied */
export interface Axes3DOptions {
  /** X-axis configuration */
  xAxis?: Axis3DConfig & { label?: string; tickFormat?: (v: number) => string };
  /** Y-axis configuration */
  yAxis?: Axis3DConfig & { label?: string; tickFormat?: (v: number) => string };
  /** Z-axis configuration */
  zAxis?: Axis3DConfig & { label?: string; tickFormat?: (v: number) => string };
  /** Show axis lines */
  showAxes?: boolean;
  /** Show wall grids */
  showWallGrids?: boolean;
  /** Show floor grid (XZ plane) */
  showFloorGrid?: boolean;
  /** Grid line color */
  gridColor?: [number, number, number];
  /** Grid line opacity */
  gridOpacity?: number;
  /** Wall grid opacity (slightly more transparent) */
  wallGridOpacity?: number;
  /** Number of ticks per axis */
  tickCount?: number;
  /** Axis line width */
  lineWidth?: number;
  /** Box wireframe color */
  boxColor?: [number, number, number];
  /** Box wireframe opacity */
  boxOpacity?: number;
}

/** Default axis colors */
const AXIS_COLORS = {
  x: [0.9, 0.3, 0.3] as [number, number, number],  // Red
  y: [0.3, 0.9, 0.3] as [number, number, number],  // Green
  z: [0.3, 0.3, 0.9] as [number, number, number],  // Blue
  grid: [0.4, 0.45, 0.5] as [number, number, number], // Subtle gray-blue
  box: [0.3, 0.35, 0.4] as [number, number, number], // Dark box edges
};

export class Axes3D {
  private gl: WebGL2RenderingContext;
  
  // Line buffers
  private axisVAO: WebGLVertexArrayObject | null = null;
  private axisPositionBuffer: WebGLBuffer | null = null;
  private axisColorBuffer: WebGLBuffer | null = null;
  
  private gridVAO: WebGLVertexArrayObject | null = null;
  private gridPositionBuffer: WebGLBuffer | null = null;
  private gridColorBuffer: WebGLBuffer | null = null;
  
  private boxVAO: WebGLVertexArrayObject | null = null;
  private boxPositionBuffer: WebGLBuffer | null = null;
  private boxColorBuffer: WebGLBuffer | null = null;
  
  // Line shader program
  private lineProgram: WebGLProgram | null = null;
  private lineUniforms: { [key: string]: WebGLUniformLocation } = {};
  
  // Data
  private axisVertexCount = 0;
  private gridVertexCount = 0;
  private boxVertexCount = 0;
  private bounds: Bounds3D = { minX: -1, maxX: 1, minY: -1, maxY: 1, minZ: -1, maxZ: 1 };
  
  // Labels for text overlay
  private labels: AxisLabel3D[] = [];
  
  // Options
  private options: Required<Axes3DOptions>;
  
  constructor(gl: WebGL2RenderingContext, options?: Axes3DOptions) {
    this.gl = gl;
    
    // Apply defaults
    this.options = {
      xAxis: { visible: true, label: 'X', color: AXIS_COLORS.x, ...options?.xAxis },
      yAxis: { visible: true, label: 'Y', color: AXIS_COLORS.y, ...options?.yAxis },
      zAxis: { visible: true, label: 'Z', color: AXIS_COLORS.z, ...options?.zAxis },
      showAxes: options?.showAxes ?? true,
      showWallGrids: options?.showWallGrids ?? true,
      showFloorGrid: options?.showFloorGrid ?? true,
      gridColor: options?.gridColor ?? AXIS_COLORS.grid,
      gridOpacity: options?.gridOpacity ?? 0.4,
      wallGridOpacity: options?.wallGridOpacity ?? 0.2,
      tickCount: options?.tickCount ?? 5,
      lineWidth: options?.lineWidth ?? 1,
      boxColor: options?.boxColor ?? AXIS_COLORS.box,
      boxOpacity: options?.boxOpacity ?? 0.5,
    };
    
    this.initLineShader();
    this.initBuffers();
  }
  
  private initLineShader(): void {
    const { gl } = this;
    
    const vertexShaderSource = `#version 300 es
      in vec3 a_position;
      in vec3 a_color;
      
      uniform mat4 u_viewProjection;
      
      out vec3 v_color;
      
      void main() {
        gl_Position = u_viewProjection * vec4(a_position, 1.0);
        v_color = a_color;
      }
    `;
    
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      in vec3 v_color;
      uniform float u_opacity;
      
      out vec4 fragColor;
      
      void main() {
        fragColor = vec4(v_color, u_opacity);
      }
    `;
    
    // Compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Axes vertex shader error:', gl.getShaderInfoLog(vertexShader));
      return;
    }
    
    // Compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Axes fragment shader error:', gl.getShaderInfoLog(fragmentShader));
      return;
    }
    
    // Link program
    this.lineProgram = gl.createProgram()!;
    gl.attachShader(this.lineProgram, vertexShader);
    gl.attachShader(this.lineProgram, fragmentShader);
    gl.linkProgram(this.lineProgram);
    
    if (!gl.getProgramParameter(this.lineProgram, gl.LINK_STATUS)) {
      console.error('Axes program link error:', gl.getProgramInfoLog(this.lineProgram));
      return;
    }
    
    // Get uniform locations
    this.lineUniforms = {
      u_viewProjection: gl.getUniformLocation(this.lineProgram, 'u_viewProjection')!,
      u_opacity: gl.getUniformLocation(this.lineProgram, 'u_opacity')!,
    };
    
    // Cleanup
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }
  
  private initBuffers(): void {
    const { gl } = this;
    
    // Axis VAO
    this.axisVAO = gl.createVertexArray();
    this.axisPositionBuffer = gl.createBuffer();
    this.axisColorBuffer = gl.createBuffer();
    
    // Grid VAO
    this.gridVAO = gl.createVertexArray();
    this.gridPositionBuffer = gl.createBuffer();
    this.gridColorBuffer = gl.createBuffer();
    
    // Box VAO
    this.boxVAO = gl.createVertexArray();
    this.boxPositionBuffer = gl.createBuffer();
    this.boxColorBuffer = gl.createBuffer();
  }
  
  /**
   * Update axes geometry based on data bounds
   */
  updateBounds(bounds: Bounds3D): void {
    this.bounds = { ...bounds };
    this.buildBoxGeometry();
    this.buildGridGeometry();
    this.buildAxisGeometry();
    this.buildLabels();
  }
  
  private buildBoxGeometry(): void {
    const { gl, bounds, options } = this;
    
    const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
    
    const positions: number[] = [];
    const colors: number[] = [];
    const boxColor = options.boxColor;
    
    // Helper to add a line segment
    const addLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(...boxColor, ...boxColor);
    };
    
    // Bottom face edges (Y = minY)
    addLine(minX, minY, minZ, maxX, minY, minZ);
    addLine(maxX, minY, minZ, maxX, minY, maxZ);
    addLine(maxX, minY, maxZ, minX, minY, maxZ);
    addLine(minX, minY, maxZ, minX, minY, minZ);
    
    // Top face edges (Y = maxY)
    addLine(minX, maxY, minZ, maxX, maxY, minZ);
    addLine(maxX, maxY, minZ, maxX, maxY, maxZ);
    addLine(maxX, maxY, maxZ, minX, maxY, maxZ);
    addLine(minX, maxY, maxZ, minX, maxY, minZ);
    
    // Vertical edges
    addLine(minX, minY, minZ, minX, maxY, minZ);
    addLine(maxX, minY, minZ, maxX, maxY, minZ);
    addLine(maxX, minY, maxZ, maxX, maxY, maxZ);
    addLine(minX, minY, maxZ, minX, maxY, maxZ);
    
    this.boxVertexCount = positions.length / 3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boxPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boxColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  }
  
  private buildGridGeometry(): void {
    const { gl, bounds, options } = this;
    
    const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
    const gridColor = options.gridColor;
    const tickCount = options.tickCount;
    
    const positions: number[] = [];
    const colors: number[] = [];
    
    // Helper to add grid line
    const addLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(...gridColor, ...gridColor);
    };
    
    // Floor grid (XZ plane at Y = minY)
    if (options.showFloorGrid) {
      // Lines parallel to Z
      for (let i = 0; i <= tickCount; i++) {
        const x = minX + (maxX - minX) * (i / tickCount);
        addLine(x, minY, minZ, x, minY, maxZ);
      }
      // Lines parallel to X
      for (let i = 0; i <= tickCount; i++) {
        const z = minZ + (maxZ - minZ) * (i / tickCount);
        addLine(minX, minY, z, maxX, minY, z);
      }
    }
    
    // Back wall grid (XY plane at Z = minZ)
    if (options.showWallGrids) {
      // Lines parallel to Y
      for (let i = 0; i <= tickCount; i++) {
        const x = minX + (maxX - minX) * (i / tickCount);
        addLine(x, minY, minZ, x, maxY, minZ);
      }
      // Lines parallel to X
      for (let i = 0; i <= tickCount; i++) {
        const y = minY + (maxY - minY) * (i / tickCount);
        addLine(minX, y, minZ, maxX, y, minZ);
      }
    }
    
    // Left wall grid (YZ plane at X = minX)
    if (options.showWallGrids) {
      // Lines parallel to Z
      for (let i = 0; i <= tickCount; i++) {
        const y = minY + (maxY - minY) * (i / tickCount);
        addLine(minX, y, minZ, minX, y, maxZ);
      }
      // Lines parallel to Y
      for (let i = 0; i <= tickCount; i++) {
        const z = minZ + (maxZ - minZ) * (i / tickCount);
        addLine(minX, minY, z, minX, maxY, z);
      }
    }
    
    this.gridVertexCount = positions.length / 3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  }
  
  private buildAxisGeometry(): void {
    const { gl, bounds, options } = this;
    
    const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
    const tickLen = (maxX - minX) * 0.02;
    
    const positions: number[] = [];
    const colors: number[] = [];
    
    const addLine = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: [number, number, number]) => {
      positions.push(x1, y1, z1, x2, y2, z2);
      colors.push(...color, ...color);
    };
    
    // X-axis at bottom-front edge
    if (options.xAxis.visible !== false) {
      const xColor = options.xAxis.color || AXIS_COLORS.x;
      // Main axis line
      addLine(minX, minY, maxZ, maxX, minY, maxZ, xColor);
      
      // Tick marks
      for (let i = 0; i <= options.tickCount; i++) {
        const x = minX + (maxX - minX) * (i / options.tickCount);
        addLine(x, minY, maxZ, x, minY - tickLen, maxZ, xColor);
        addLine(x, minY, maxZ, x, minY, maxZ + tickLen, xColor);
      }
    }
    
    // Y-axis at left-front edge
    if (options.yAxis.visible !== false) {
      const yColor = options.yAxis.color || AXIS_COLORS.y;
      // Main axis line
      addLine(minX, minY, maxZ, minX, maxY, maxZ, yColor);
      
      // Tick marks
      for (let i = 0; i <= options.tickCount; i++) {
        const y = minY + (maxY - minY) * (i / options.tickCount);
        addLine(minX, y, maxZ, minX - tickLen, y, maxZ, yColor);
        addLine(minX, y, maxZ, minX, y, maxZ + tickLen, yColor);
      }
    }
    
    // Z-axis at bottom-left edge
    if (options.zAxis.visible !== false) {
      const zColor = options.zAxis.color || AXIS_COLORS.z;
      // Main axis line
      addLine(minX, minY, minZ, minX, minY, maxZ, zColor);
      
      // Tick marks
      for (let i = 0; i <= options.tickCount; i++) {
        const z = minZ + (maxZ - minZ) * (i / options.tickCount);
        addLine(minX, minY, z, minX - tickLen, minY, z, zColor);
        addLine(minX, minY, z, minX, minY - tickLen, z, zColor);
      }
    }
    
    this.axisVertexCount = positions.length / 3;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.axisPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.axisColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  }
  
  private buildLabels(): void {
    const { bounds, options } = this;
    const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
    
    this.labels = [];
    
    const formatNumber = (v: number): string => {
      if (Math.abs(v) < 0.001 && v !== 0) return v.toExponential(1);
      if (Math.abs(v) >= 10000) return v.toExponential(1);
      return v.toFixed(1);
    };
    
    const offset = (maxX - minX) * 0.08;
    
    // X-axis labels (at bottom-front)
    if (options.xAxis.visible !== false) {
      const xColor = options.xAxis.color || AXIS_COLORS.x;
      const formatter = options.xAxis.tickFormat || formatNumber;
      
      for (let i = 0; i <= options.tickCount; i++) {
        const t = i / options.tickCount;
        const x = minX + (maxX - minX) * t;
        const value = minX + (maxX - minX) * t;
        this.labels.push({
          text: formatter(value),
          worldPosition: [x, minY - offset, maxZ + offset],
          axis: 'x',
          color: xColor,
        });
      }
      
      // Axis title
      if (options.xAxis.label) {
        this.labels.push({
          text: options.xAxis.label,
          worldPosition: [(minX + maxX) / 2, minY - offset * 2.5, maxZ + offset],
          axis: 'title',
          color: xColor,
        });
      }
    }
    
    // Y-axis labels (at left-front)
    if (options.yAxis.visible !== false) {
      const yColor = options.yAxis.color || AXIS_COLORS.y;
      const formatter = options.yAxis.tickFormat || formatNumber;
      
      for (let i = 0; i <= options.tickCount; i++) {
        const t = i / options.tickCount;
        const y = minY + (maxY - minY) * t;
        const value = minY + (maxY - minY) * t;
        this.labels.push({
          text: formatter(value),
          worldPosition: [minX - offset, y, maxZ + offset],
          axis: 'y',
          color: yColor,
        });
      }
      
      // Axis title
      if (options.yAxis.label) {
        this.labels.push({
          text: options.yAxis.label,
          worldPosition: [minX - offset * 2.5, (minY + maxY) / 2, maxZ + offset],
          axis: 'title',
          color: yColor,
        });
      }
    }
    
    // Z-axis labels (at bottom-left)
    if (options.zAxis.visible !== false) {
      const zColor = options.zAxis.color || AXIS_COLORS.z;
      const formatter = options.zAxis.tickFormat || formatNumber;
      
      for (let i = 0; i <= options.tickCount; i++) {
        const t = i / options.tickCount;
        const z = minZ + (maxZ - minZ) * t;
        const value = minZ + (maxZ - minZ) * t;
        this.labels.push({
          text: formatter(value),
          worldPosition: [minX - offset, minY - offset, z],
          axis: 'z',
          color: zColor,
        });
      }
      
      // Axis title
      if (options.zAxis.label) {
        this.labels.push({
          text: options.zAxis.label,
          worldPosition: [minX - offset * 2.5, minY - offset, (minZ + maxZ) / 2],
          axis: 'title',
          color: zColor,
        });
      }
    }
  }
  
  /**
   * Render axes and grid
   */
  render(viewProjectionMatrix: Float32Array): void {
    const { gl, options } = this;
    
    if (!this.lineProgram) return;
    
    gl.useProgram(this.lineProgram);
    gl.uniformMatrix4fv(this.lineUniforms.u_viewProjection, false, viewProjectionMatrix);
    
    // Render box wireframe
    if (this.boxVertexCount > 0) {
      gl.uniform1f(this.lineUniforms.u_opacity, options.boxOpacity);
      this.renderLines(this.boxVAO!, this.boxPositionBuffer!, this.boxColorBuffer!, this.boxVertexCount);
    }
    
    // Render grids
    if (this.gridVertexCount > 0) {
      gl.uniform1f(this.lineUniforms.u_opacity, options.gridOpacity);
      this.renderLines(this.gridVAO!, this.gridPositionBuffer!, this.gridColorBuffer!, this.gridVertexCount);
    }
    
    // Render axes
    if (options.showAxes && this.axisVertexCount > 0) {
      gl.uniform1f(this.lineUniforms.u_opacity, 1.0);
      this.renderLines(this.axisVAO!, this.axisPositionBuffer!, this.axisColorBuffer!, this.axisVertexCount);
    }
    
    // Reset GL state for next renderer
    gl.useProgram(null);
  }
  
  private renderLines(vao: WebGLVertexArrayObject, posBuffer: WebGLBuffer, colorBuffer: WebGLBuffer, count: number): void {
    const { gl, lineProgram } = this;
    
    if (!lineProgram) return;
    
    gl.bindVertexArray(vao);
    
    // Position attribute
    const posLoc = gl.getAttribLocation(lineProgram, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(posLoc, 0);
    
    // Color attribute
    const colorLoc = gl.getAttribLocation(lineProgram, 'a_color');
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(colorLoc, 0);
    
    // Draw lines
    gl.drawArrays(gl.LINES, 0, count);
    
    // Cleanup
    gl.disableVertexAttribArray(posLoc);
    gl.disableVertexAttribArray(colorLoc);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
  
  /**
   * Get labels for 2D text overlay rendering.
   * Returns world positions that need to be projected to screen coordinates.
   */
  getLabels(): AxisLabel3D[] {
    return this.labels;
  }
  
  /**
   * Project a 3D world position to 2D screen coordinates.
   */
  projectToScreen(
    worldPos: [number, number, number],
    viewProjectionMatrix: Float32Array,
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number; visible: boolean } {
    // Transform to clip space
    const [wx, wy, wz] = worldPos;
    const m = viewProjectionMatrix;
    
    const clipX = m[0] * wx + m[4] * wy + m[8] * wz + m[12];
    const clipY = m[1] * wx + m[5] * wy + m[9] * wz + m[13];
    const clipZ = m[2] * wx + m[6] * wy + m[10] * wz + m[14];
    const clipW = m[3] * wx + m[7] * wy + m[11] * wz + m[15];
    
    // Perspective divide
    if (clipW <= 0) return { x: 0, y: 0, visible: false };
    
    const ndcX = clipX / clipW;
    const ndcY = clipY / clipW;
    const ndcZ = clipZ / clipW;
    
    // Check if visible (in front of camera and within view)
    const visible = ndcZ >= -1 && ndcZ <= 1 && 
                   ndcX >= -1.5 && ndcX <= 1.5 && 
                   ndcY >= -1.5 && ndcY <= 1.5;
    
    // Convert to screen coordinates
    const screenX = (ndcX + 1) * 0.5 * canvasWidth;
    const screenY = (1 - ndcY) * 0.5 * canvasHeight; // Flip Y
    
    return { x: screenX, y: screenY, visible };
  }
  
  /**
   * Update options
   */
  setOptions(options: Partial<Axes3DOptions>): void {
    Object.assign(this.options, options);
    this.buildBoxGeometry();
    this.buildGridGeometry();
    this.buildAxisGeometry();
    this.buildLabels();
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    const { gl } = this;
    
    if (this.axisVAO) gl.deleteVertexArray(this.axisVAO);
    if (this.axisPositionBuffer) gl.deleteBuffer(this.axisPositionBuffer);
    if (this.axisColorBuffer) gl.deleteBuffer(this.axisColorBuffer);
    
    if (this.gridVAO) gl.deleteVertexArray(this.gridVAO);
    if (this.gridPositionBuffer) gl.deleteBuffer(this.gridPositionBuffer);
    if (this.gridColorBuffer) gl.deleteBuffer(this.gridColorBuffer);
    
    if (this.boxVAO) gl.deleteVertexArray(this.boxVAO);
    if (this.boxPositionBuffer) gl.deleteBuffer(this.boxPositionBuffer);
    if (this.boxColorBuffer) gl.deleteBuffer(this.boxColorBuffer);
    
    if (this.lineProgram) gl.deleteProgram(this.lineProgram);
  }
}
