/**
 * Surface Mesh 3D renderer.
 * Renders a grid-based height map with optional colormap.
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { SurfaceMesh3DData } from './types';

export interface SurfaceMeshOptions {
  maxVertices?: number;
}

export class SurfaceMesh3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  private positionBuffer: WebGLBuffer | null = null;
  private normalBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private wireframeIndexBuffer: WebGLBuffer | null = null;
  
  private vertexCount = 0;
  private indexCount = 0;
  private wireframeIndexCount = 0;
  
  private cols = 0;
  private rows = 0;
  
  constructor(gl: WebGL2RenderingContext, _options: SurfaceMeshOptions = {}) {
    this.gl = gl;
    this.initBuffers();
  }
  
  private initBuffers(): void {
    const { gl } = this;
    
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    
    this.positionBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    this.wireframeIndexBuffer = gl.createBuffer();
    
    gl.bindVertexArray(null);
  }
  
  /**
   * Update mesh data from surface data.
   */
  updateData(data: SurfaceMesh3DData): void {
    const { gl } = this;
    
    this.cols = data.xValues.length;
    this.rows = data.zValues.length;
    this.vertexCount = this.cols * this.rows;
    
    // Generate positions
    const positions = new Float32Array(this.vertexCount * 3);
    const normals = new Float32Array(this.vertexCount * 3);
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const idx = row * this.cols + col;
        const i3 = idx * 3;
        
        positions[i3] = data.xValues[col];
        positions[i3 + 1] = data.yValues[idx];
        positions[i3 + 2] = data.zValues[row];
      }
    }
    
    // Calculate normals
    this.calculateNormals(positions, normals);
    
    // Generate colors from height or provided colors
    const colors = data.colors ?? this.generateHeightColors(data.yValues);
    
    // Generate triangle indices
    const indices = this.generateTriangleIndices();
    this.indexCount = indices.length;
    
    // Generate wireframe indices
    const wireframeIndices = this.generateWireframeIndices();
    this.wireframeIndexCount = wireframeIndices.length;
    
    // Upload to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, wireframeIndices, gl.STATIC_DRAW);
  }
  
  private calculateNormals(positions: Float32Array, normals: Float32Array): void {
    const { cols, rows } = this;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const i3 = idx * 3;
        
        // Get neighboring heights for gradient
        const h = positions[i3 + 1];
        const hL = col > 0 ? positions[(idx - 1) * 3 + 1] : h;
        const hR = col < cols - 1 ? positions[(idx + 1) * 3 + 1] : h;
        const hD = row > 0 ? positions[(idx - cols) * 3 + 1] : h;
        const hU = row < rows - 1 ? positions[(idx + cols) * 3 + 1] : h;
        
        // Calculate normal from gradient
        const dx = (hR - hL) / 2;
        const dz = (hU - hD) / 2;
        
        const nx = -dx;
        const ny = 1;
        const nz = -dz;
        
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        normals[i3] = nx / len;
        normals[i3 + 1] = ny / len;
        normals[i3 + 2] = nz / len;
      }
    }
  }
  
  private generateHeightColors(yValues: Float32Array): Float32Array {
    const colors = new Float32Array(yValues.length * 3);
    
    // Find min/max
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < yValues.length; i++) {
      if (yValues[i] < minY) minY = yValues[i];
      if (yValues[i] > maxY) maxY = yValues[i];
    }
    
    const range = maxY - minY || 1;
    
    // Viridis-like colormap
    for (let i = 0; i < yValues.length; i++) {
      const t = (yValues[i] - minY) / range;
      const i3 = i * 3;
      
      // Simplified viridis
      colors[i3] = 0.267 + t * 0.329;     // R
      colors[i3 + 1] = 0.004 + t * 0.873; // G
      colors[i3 + 2] = 0.329 + t * 0.341; // B
    }
    
    return colors;
  }
  
  private generateTriangleIndices(): Uint32Array {
    const { cols, rows } = this;
    const indices: number[] = [];
    
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const topLeft = row * cols + col;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + cols;
        const bottomRight = bottomLeft + 1;
        
        // Two triangles per quad
        indices.push(topLeft, bottomLeft, topRight);
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }
    
    return new Uint32Array(indices);
  }
  
  private generateWireframeIndices(): Uint32Array {
    const { cols, rows } = this;
    const indices: number[] = [];
    
    // Horizontal lines
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const idx = row * cols + col;
        indices.push(idx, idx + 1);
      }
    }
    
    // Vertical lines
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows - 1; row++) {
        const idx = row * cols + col;
        indices.push(idx, idx + cols);
      }
    }
    
    return new Uint32Array(indices);
  }
  
  /**
   * Render the surface mesh.
   */
  render(program: ShaderProgram3D, wireframe = false): void {
    const { gl } = this;
    
    if (this.vertexCount === 0) return;
    
    gl.bindVertexArray(this.vao);
    
    // Position attribute
    const posLoc = program.attributes['a_position'];
    if (posLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    // Normal attribute
    const normalLoc = program.attributes['a_normal'];
    if (normalLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    // Color attribute
    const colorLoc = program.attributes['a_color'];
    if (colorLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    if (wireframe) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeIndexBuffer);
      gl.drawElements(gl.LINES, this.wireframeIndexCount, gl.UNSIGNED_INT, 0);
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
    }
    
    gl.bindVertexArray(null);
  }
  
  destroy(): void {
    const { gl } = this;
    
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.normalBuffer) gl.deleteBuffer(this.normalBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    if (this.wireframeIndexBuffer) gl.deleteBuffer(this.wireframeIndexBuffer);
  }
}
