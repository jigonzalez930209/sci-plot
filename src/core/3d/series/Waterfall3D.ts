/**
 * Waterfall 3D renderer.
 * Renders cascading spectral/time series data (like audio spectrograms).
 * Essential for scientific visualization of frequency/time data.
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { Waterfall3DData } from './types';

export interface WaterfallOptions {
  maxSlices?: number;
}

export class Waterfall3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  
  private vertexCount = 0;
  private indexCount = 0;
  private sliceCount = 0;
  private pointsPerSlice = 0;
  
  private fillMode: 'solid' | 'wireframe' | 'gradient' = 'gradient';
  
  constructor(gl: WebGL2RenderingContext, _options: WaterfallOptions = {}) {
    this.gl = gl;
    this.initBuffers();
  }
  
  private initBuffers(): void {
    const { gl } = this;
    
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    
    this.positionBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    
    gl.bindVertexArray(null);
  }
  
  /**
   * Update waterfall data.
   * Each slice is a row of Y values at increasing Z positions.
   */
  updateData(data: Waterfall3DData): void {
    this.sliceCount = data.slices.length;
    if (this.sliceCount === 0) return;
    
    this.pointsPerSlice = data.xValues.length;
    this.fillMode = data.fillMode ?? 'gradient';
    
    const zStart = data.zStart ?? 0;
    const zStep = data.zStep;
    
    // Find global min/max for color mapping
    let minY = Infinity, maxY = -Infinity;
    for (const slice of data.slices) {
      for (let i = 0; i < slice.length; i++) {
        if (slice[i] < minY) minY = slice[i];
        if (slice[i] > maxY) maxY = slice[i];
      }
    }
    const yRange = maxY - minY || 1;
    
    if (this.fillMode === 'wireframe') {
      this.buildWireframe(data, zStart, zStep, minY, yRange);
    } else {
      this.buildSolid(data, zStart, zStep, minY, yRange);
    }
  }
  
  private buildWireframe(
    data: Waterfall3DData,
    zStart: number,
    zStep: number,
    minY: number,
    yRange: number
  ): void {
    const { gl, sliceCount, pointsPerSlice } = this;
    
    // Each slice is a line strip
    this.vertexCount = sliceCount * pointsPerSlice;
    
    const positions = new Float32Array(this.vertexCount * 3);
    const colors = new Float32Array(this.vertexCount * 3);
    
    for (let s = 0; s < sliceCount; s++) {
      const z = zStart + s * zStep;
      const slice = data.slices[s];
      
      for (let p = 0; p < pointsPerSlice; p++) {
        const idx = s * pointsPerSlice + p;
        const i3 = idx * 3;
        
        positions[i3] = data.xValues[p];
        positions[i3 + 1] = slice[p];
        positions[i3 + 2] = z;
        
        // Color by height
        const t = (slice[p] - minY) / yRange;
        this.applyColormap(colors, i3, t, data.colormap);
      }
    }
    
    // Line indices - one line strip per slice
    const indices: number[] = [];
    for (let s = 0; s < sliceCount; s++) {
      for (let p = 0; p < pointsPerSlice - 1; p++) {
        const idx = s * pointsPerSlice + p;
        indices.push(idx, idx + 1);
      }
    }
    
    this.indexCount = indices.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
  }
  
  private buildSolid(
    data: Waterfall3DData,
    zStart: number,
    zStep: number,
    minY: number,
    yRange: number
  ): void {
    const { gl, sliceCount, pointsPerSlice } = this;
    
    // For solid fill, we create quads between adjacent slices
    // Each quad has 4 vertices, 2 triangles
    const quadRows = sliceCount - 1;
    const quadCols = pointsPerSlice - 1;
    
    if (quadRows <= 0 || quadCols <= 0) {
      this.vertexCount = 0;
      this.indexCount = 0;
      return;
    }
    
    // Use indexed rendering with shared vertices
    this.vertexCount = sliceCount * pointsPerSlice;
    
    const positions = new Float32Array(this.vertexCount * 3);
    const colors = new Float32Array(this.vertexCount * 3);
    
    for (let s = 0; s < sliceCount; s++) {
      const z = zStart + s * zStep;
      const slice = data.slices[s];
      
      for (let p = 0; p < pointsPerSlice; p++) {
        const idx = s * pointsPerSlice + p;
        const i3 = idx * 3;
        
        positions[i3] = data.xValues[p];
        positions[i3 + 1] = slice[p];
        positions[i3 + 2] = z;
        
        const t = (slice[p] - minY) / yRange;
        this.applyColormap(colors, i3, t, data.colormap);
      }
    }
    
    // Triangle indices
    const indices: number[] = [];
    for (let s = 0; s < quadRows; s++) {
      for (let p = 0; p < quadCols; p++) {
        const topLeft = s * pointsPerSlice + p;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + pointsPerSlice;
        const bottomRight = bottomLeft + 1;
        
        // Two triangles per quad
        indices.push(topLeft, bottomLeft, topRight);
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }
    
    this.indexCount = indices.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
  }
  
  private applyColormap(colors: Float32Array, i3: number, t: number, colormap?: string): void {
    // Clamp t to [0, 1]
    t = Math.max(0, Math.min(1, t));
    
    switch (colormap) {
      case 'jet':
        this.jetColormap(colors, i3, t);
        break;
      case 'hot':
        this.hotColormap(colors, i3, t);
        break;
      case 'cool':
        colors[i3] = t;
        colors[i3 + 1] = 1 - t;
        colors[i3 + 2] = 1;
        break;
      case 'grayscale':
        colors[i3] = t;
        colors[i3 + 1] = t;
        colors[i3 + 2] = t;
        break;
      case 'viridis':
      default:
        this.viridisColormap(colors, i3, t);
        break;
    }
  }
  
  private viridisColormap(colors: Float32Array, i3: number, t: number): void {
    // Simplified viridis approximation
    colors[i3] = 0.267 + t * 0.329 + t * t * 0.2;
    colors[i3 + 1] = 0.004 + t * 0.873;
    colors[i3 + 2] = 0.329 + t * 0.2 - t * t * 0.3;
  }
  
  private jetColormap(colors: Float32Array, i3: number, t: number): void {
    if (t < 0.25) {
      colors[i3] = 0;
      colors[i3 + 1] = 4 * t;
      colors[i3 + 2] = 1;
    } else if (t < 0.5) {
      colors[i3] = 0;
      colors[i3 + 1] = 1;
      colors[i3 + 2] = 1 - 4 * (t - 0.25);
    } else if (t < 0.75) {
      colors[i3] = 4 * (t - 0.5);
      colors[i3 + 1] = 1;
      colors[i3 + 2] = 0;
    } else {
      colors[i3] = 1;
      colors[i3 + 1] = 1 - 4 * (t - 0.75);
      colors[i3 + 2] = 0;
    }
  }
  
  private hotColormap(colors: Float32Array, i3: number, t: number): void {
    colors[i3] = Math.min(1, t * 3);
    colors[i3 + 1] = Math.max(0, Math.min(1, (t - 0.33) * 3));
    colors[i3 + 2] = Math.max(0, (t - 0.67) * 3);
  }
  
  /**
   * Add a new slice to the waterfall (for realtime updates).
   * Shifts existing slices back and adds new one at front.
   */
  pushSlice(yValues: Float32Array, data: Waterfall3DData): void {
    // Shift slices
    data.slices.pop();
    data.slices.unshift(yValues);
    
    // Rebuild mesh
    this.updateData(data);
  }
  
  render(program: ShaderProgram3D): void {
    const { gl } = this;
    
    if (this.indexCount === 0) return;
    
    gl.bindVertexArray(this.vao);
    
    const posLoc = program.attributes['a_position'];
    if (posLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    const colorLoc = program.attributes['a_color'];
    if (colorLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
    if (this.fillMode === 'wireframe') {
      gl.drawElements(gl.LINES, this.indexCount, gl.UNSIGNED_INT, 0);
    } else {
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
    }
    
    gl.bindVertexArray(null);
  }
  
  destroy(): void {
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
  }
}
