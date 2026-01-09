/**
 * Column/Bar 3D renderer.
 * Renders 3D columns/bars at specified positions.
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { Column3DData } from './types';

export class Column3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  private positionBuffer: WebGLBuffer | null = null;
  private normalBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  
  private indexCount = 0;
  private columnCount = 0;
  
  constructor(gl: WebGL2RenderingContext) {
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
    
    gl.bindVertexArray(null);
  }
  
  updateData(data: Column3DData): void {
    const { gl } = this;
    
    this.columnCount = data.xValues.length;
    const columnWidth = data.columnWidth ?? 0.8;
    const columnDepth = data.columnDepth ?? 0.8;
    
    // 24 vertices per column (6 faces * 4 vertices)
    const vertexCount = this.columnCount * 24;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    
    // 36 indices per column (6 faces * 2 triangles * 3 vertices)
    const indices: number[] = [];
    
    const hw = columnWidth / 2;
    const hd = columnDepth / 2;
    
    // Find min/max for color mapping
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < this.columnCount; i++) {
      if (data.yValues[i] < minY) minY = data.yValues[i];
      if (data.yValues[i] > maxY) maxY = data.yValues[i];
    }
    const yRange = maxY - minY || 1;
    
    for (let i = 0; i < this.columnCount; i++) {
      const x = data.xValues[i];
      const z = data.zValues[i];
      const h = data.yValues[i];
      const baseIdx = i * 24;
      
      // Generate box vertices
      const box = this.generateBoxVertices(x, 0, z, hw, h, hd);
      
      for (let v = 0; v < 24; v++) {
        const vi = (baseIdx + v) * 3;
        positions[vi] = box.positions[v * 3];
        positions[vi + 1] = box.positions[v * 3 + 1];
        positions[vi + 2] = box.positions[v * 3 + 2];
        normals[vi] = box.normals[v * 3];
        normals[vi + 1] = box.normals[v * 3 + 1];
        normals[vi + 2] = box.normals[v * 3 + 2];
        
        // Color based on height or provided
        if (data.colors) {
          colors[vi] = data.colors[i * 3];
          colors[vi + 1] = data.colors[i * 3 + 1];
          colors[vi + 2] = data.colors[i * 3 + 2];
        } else {
          const t = (h - minY) / yRange;
          colors[vi] = 0.2 + t * 0.6;
          colors[vi + 1] = 0.4 + t * 0.4;
          colors[vi + 2] = 0.8;
        }
      }
      
      // Generate indices for this column
      for (let f = 0; f < 6; f++) {
        const faceBase = baseIdx + f * 4;
        indices.push(
          faceBase, faceBase + 1, faceBase + 2,
          faceBase, faceBase + 2, faceBase + 3
        );
      }
    }
    
    this.indexCount = indices.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
  }
  
  private generateBoxVertices(
    cx: number, cy: number, cz: number,
    hw: number, h: number, hd: number
  ): { positions: Float32Array; normals: Float32Array } {
    const positions = new Float32Array(24 * 3);
    const normals = new Float32Array(24 * 3);
    
    const x0 = cx - hw, x1 = cx + hw;
    const y0 = cy, y1 = cy + h;
    const z0 = cz - hd, z1 = cz + hd;
    
    // Front face (z+)
    this.setQuad(positions, normals, 0,
      x0, y0, z1,  x1, y0, z1,  x1, y1, z1,  x0, y1, z1,
      0, 0, 1);
    
    // Back face (z-)
    this.setQuad(positions, normals, 4,
      x1, y0, z0,  x0, y0, z0,  x0, y1, z0,  x1, y1, z0,
      0, 0, -1);
    
    // Top face (y+)
    this.setQuad(positions, normals, 8,
      x0, y1, z1,  x1, y1, z1,  x1, y1, z0,  x0, y1, z0,
      0, 1, 0);
    
    // Bottom face (y-)
    this.setQuad(positions, normals, 12,
      x0, y0, z0,  x1, y0, z0,  x1, y0, z1,  x0, y0, z1,
      0, -1, 0);
    
    // Right face (x+)
    this.setQuad(positions, normals, 16,
      x1, y0, z1,  x1, y0, z0,  x1, y1, z0,  x1, y1, z1,
      1, 0, 0);
    
    // Left face (x-)
    this.setQuad(positions, normals, 20,
      x0, y0, z0,  x0, y0, z1,  x0, y1, z1,  x0, y1, z0,
      -1, 0, 0);
    
    return { positions, normals };
  }
  
  private setQuad(
    positions: Float32Array, normals: Float32Array, offset: number,
    x0: number, y0: number, z0: number,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    x3: number, y3: number, z3: number,
    nx: number, ny: number, nz: number
  ): void {
    const pi = offset * 3;
    positions[pi] = x0; positions[pi + 1] = y0; positions[pi + 2] = z0;
    positions[pi + 3] = x1; positions[pi + 4] = y1; positions[pi + 5] = z1;
    positions[pi + 6] = x2; positions[pi + 7] = y2; positions[pi + 8] = z2;
    positions[pi + 9] = x3; positions[pi + 10] = y3; positions[pi + 11] = z3;
    
    for (let i = 0; i < 4; i++) {
      normals[pi + i * 3] = nx;
      normals[pi + i * 3 + 1] = ny;
      normals[pi + i * 3 + 2] = nz;
    }
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
    
    const normalLoc = program.attributes['a_normal'];
    if (normalLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.enableVertexAttribArray(normalLoc);
      gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
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
  
  destroy(): void {
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.normalBuffer) gl.deleteBuffer(this.normalBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
  }
}
