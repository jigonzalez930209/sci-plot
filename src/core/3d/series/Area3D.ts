/**
 * Area 3D renderer.
 * Renders filled area under a 3D line (like a curtain).
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { Area3DData } from './types';

export class Area3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  
  private indexCount = 0;
  private fillOpacity = 0.6;
  
  constructor(gl: WebGL2RenderingContext) {
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
  
  updateData(data: Area3DData): void {
    const { gl } = this;
    
    const pointCount = data.positions.length / 3;
    if (pointCount < 2) return;
    
    const baseY = data.baseY ?? 0;
    this.fillOpacity = data.fillOpacity ?? 0.6;
    
    // 2 vertices per point (top and bottom)
    const vertexCount = pointCount * 2;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    
    for (let i = 0; i < pointCount; i++) {
      const i3 = i * 3;
      const x = data.positions[i3];
      const y = data.positions[i3 + 1];
      const z = data.positions[i3 + 2];
      
      // Top vertex (actual data point)
      const ti = i * 2;
      const ti3 = ti * 3;
      positions[ti3] = x;
      positions[ti3 + 1] = y;
      positions[ti3 + 2] = z;
      
      // Bottom vertex (at baseY)
      const bi = i * 2 + 1;
      const bi3 = bi * 3;
      positions[bi3] = x;
      positions[bi3 + 1] = baseY;
      positions[bi3 + 2] = z;
      
      // Colors
      if (data.colors) {
        colors[ti3] = data.colors[i3];
        colors[ti3 + 1] = data.colors[i3 + 1];
        colors[ti3 + 2] = data.colors[i3 + 2];
        colors[bi3] = data.colors[i3] * 0.7;
        colors[bi3 + 1] = data.colors[i3 + 1] * 0.7;
        colors[bi3 + 2] = data.colors[i3 + 2] * 0.7;
      } else {
        const t = i / (pointCount - 1);
        colors[ti3] = 0.2 + t * 0.6;
        colors[ti3 + 1] = 0.6;
        colors[ti3 + 2] = 0.9;
        colors[bi3] = colors[ti3] * 0.7;
        colors[bi3 + 1] = colors[ti3 + 1] * 0.7;
        colors[bi3 + 2] = colors[ti3 + 2] * 0.7;
      }
    }
    
    // Generate triangle indices
    const indices: number[] = [];
    for (let i = 0; i < pointCount - 1; i++) {
      const tl = i * 2;
      const bl = i * 2 + 1;
      const tr = (i + 1) * 2;
      const br = (i + 1) * 2 + 1;
      
      indices.push(tl, bl, tr);
      indices.push(tr, bl, br);
    }
    
    this.indexCount = indices.length;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
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
    
    const colorLoc = program.attributes['a_color'];
    if (colorLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    }
    
    if (program.uniforms['u_opacity']) {
      gl.uniform1f(program.uniforms['u_opacity'], this.fillOpacity);
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
    
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
