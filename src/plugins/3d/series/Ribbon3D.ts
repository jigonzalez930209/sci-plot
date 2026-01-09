/**
 * Ribbon 3D renderer.
 * Renders an extruded line with variable width in 3D space.
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { Ribbon3DData } from './types';

export class Ribbon3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  private positionBuffer: WebGLBuffer | null = null;
  private normalBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  
  private indexCount = 0;
  
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
  
  updateData(data: Ribbon3DData): void {
    const { gl } = this;
    
    const pointCount = data.positions.length / 3;
    if (pointCount < 2) return;
    
    const defaultWidth = data.defaultWidth ?? 0.5;
    const widths = data.widths ?? new Float32Array(pointCount).fill(defaultWidth);
    
    // Generate ribbon mesh - 2 vertices per point (left and right edge)
    const vertexCount = pointCount * 2;
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    
    // Calculate tangent and perpendicular at each point
    for (let i = 0; i < pointCount; i++) {
      const i3 = i * 3;
      const x = data.positions[i3];
      const y = data.positions[i3 + 1];
      const z = data.positions[i3 + 2];
      
      // Calculate tangent direction
      let tx = 0, ty = 0, tz = 0;
      
      if (i === 0) {
        tx = data.positions[3] - x;
        ty = data.positions[4] - y;
        tz = data.positions[5] - z;
      } else if (i === pointCount - 1) {
        tx = x - data.positions[i3 - 3];
        ty = y - data.positions[i3 - 2];
        tz = z - data.positions[i3 - 1];
      } else {
        tx = data.positions[i3 + 3] - data.positions[i3 - 3];
        ty = data.positions[i3 + 4] - data.positions[i3 - 2];
        tz = data.positions[i3 + 5] - data.positions[i3 - 1];
      }
      
      // Normalize tangent
      const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      tx /= tLen; ty /= tLen; tz /= tLen;
      
      // Calculate perpendicular (cross with up vector)
      const upX = 0, upY = 1, upZ = 0;
      let px = upY * tz - upZ * ty;
      let py = upZ * tx - upX * tz;
      let pz = upX * ty - upY * tx;
      
      const pLen = Math.sqrt(px * px + py * py + pz * pz) || 1;
      px /= pLen; py /= pLen; pz /= pLen;
      
      const hw = widths[i] / 2;
      
      // Left vertex
      const li = i * 2;
      const li3 = li * 3;
      positions[li3] = x - px * hw;
      positions[li3 + 1] = y - py * hw;
      positions[li3 + 2] = z - pz * hw;
      
      // Right vertex
      const ri = i * 2 + 1;
      const ri3 = ri * 3;
      positions[ri3] = x + px * hw;
      positions[ri3 + 1] = y + py * hw;
      positions[ri3 + 2] = z + pz * hw;
      
      // Normal (up)
      normals[li3] = upX; normals[li3 + 1] = upY; normals[li3 + 2] = upZ;
      normals[ri3] = upX; normals[ri3 + 1] = upY; normals[ri3 + 2] = upZ;
      
      // Colors
      if (data.colors) {
        colors[li3] = data.colors[i3];
        colors[li3 + 1] = data.colors[i3 + 1];
        colors[li3 + 2] = data.colors[i3 + 2];
        colors[ri3] = data.colors[i3];
        colors[ri3 + 1] = data.colors[i3 + 1];
        colors[ri3 + 2] = data.colors[i3 + 2];
      } else {
        const t = i / (pointCount - 1);
        colors[li3] = 0.2 + t * 0.6;
        colors[li3 + 1] = 0.5;
        colors[li3 + 2] = 0.8 - t * 0.3;
        colors[ri3] = colors[li3];
        colors[ri3 + 1] = colors[li3 + 1];
        colors[ri3 + 2] = colors[li3 + 2];
      }
    }
    
    // Generate triangle indices
    const indices: number[] = [];
    for (let i = 0; i < pointCount - 1; i++) {
      const bl = i * 2;
      const br = i * 2 + 1;
      const tl = (i + 1) * 2;
      const tr = (i + 1) * 2 + 1;
      
      indices.push(bl, br, tl);
      indices.push(tl, br, tr);
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
