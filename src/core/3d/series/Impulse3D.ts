/**
 * Impulse/Stem 3D renderer.
 * Renders vertical lines from a base plane to data points.
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { Impulse3DData } from './types';

export class Impulse3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  
  private vertexCount = 0;
  private showMarkers = true;
  
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
    
    gl.bindVertexArray(null);
  }
  
  updateData(data: Impulse3DData): void {
    const { gl } = this;
    
    const pointCount = data.positions.length / 3;
    const baseY = data.baseY ?? 0;
    this.showMarkers = data.showMarkers ?? true;
    
    // 2 vertices per impulse (base and tip)
    this.vertexCount = pointCount * 2;
    
    const positions = new Float32Array(this.vertexCount * 3);
    const colors = new Float32Array(this.vertexCount * 3);
    
    for (let i = 0; i < pointCount; i++) {
      const i3 = i * 3;
      const x = data.positions[i3];
      const y = data.positions[i3 + 1];
      const z = data.positions[i3 + 2];
      
      // Base vertex
      const bi = i * 2;
      const bi3 = bi * 3;
      positions[bi3] = x;
      positions[bi3 + 1] = baseY;
      positions[bi3 + 2] = z;
      
      // Tip vertex
      const ti = i * 2 + 1;
      const ti3 = ti * 3;
      positions[ti3] = x;
      positions[ti3 + 1] = y;
      positions[ti3 + 2] = z;
      
      // Colors
      if (data.colors) {
        colors[bi3] = data.colors[i3] * 0.5;
        colors[bi3 + 1] = data.colors[i3 + 1] * 0.5;
        colors[bi3 + 2] = data.colors[i3 + 2] * 0.5;
        colors[ti3] = data.colors[i3];
        colors[ti3 + 1] = data.colors[i3 + 1];
        colors[ti3 + 2] = data.colors[i3 + 2];
      } else {
        const t = i / (pointCount - 1 || 1);
        colors[bi3] = 0.1; colors[bi3 + 1] = 0.3; colors[bi3 + 2] = 0.5;
        colors[ti3] = 0.2 + t * 0.6;
        colors[ti3 + 1] = 0.5 + t * 0.3;
        colors[ti3 + 2] = 0.9;
      }
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
  }
  
  render(program: ShaderProgram3D): void {
    const { gl } = this;
    
    if (this.vertexCount === 0) return;
    
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
    
    // Draw lines
    gl.drawArrays(gl.LINES, 0, this.vertexCount);
    
    // Draw markers at tips
    if (this.showMarkers) {
      if (program.uniforms['u_pointSize']) {
        gl.uniform1f(program.uniforms['u_pointSize'], 8);
      }
      // Draw only tip vertices (odd indices)
      for (let i = 1; i < this.vertexCount; i += 2) {
        gl.drawArrays(gl.POINTS, i, 1);
      }
    }
    
    gl.bindVertexArray(null);
  }
  
  destroy(): void {
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
  }
}
