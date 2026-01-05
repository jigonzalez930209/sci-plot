/**
 * Point Line 3D renderer.
 * Renders connected points in 3D space with optional markers.
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { PointLine3DData } from './types';

export class PointLine3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  
  private pointCount = 0;
  private showPoints = true;
  private showLines = true;
  private lineWidth = 2;
  private pointSize = 6;
  
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
  
  updateData(data: PointLine3DData): void {
    const { gl } = this;
    
    this.pointCount = data.positions.length / 3;
    this.showPoints = data.showPoints ?? true;
    this.showLines = data.showLines ?? true;
    this.lineWidth = data.lineWidth ?? 2;
    this.pointSize = data.pointSize ?? 6;
    
    // Default color if not provided
    const colors = data.colors ?? this.generateDefaultColors(this.pointCount);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
  }
  
  private generateDefaultColors(count: number): Float32Array {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1 || 1);
      colors[i * 3] = 0.2 + t * 0.6;
      colors[i * 3 + 1] = 0.6;
      colors[i * 3 + 2] = 1.0 - t * 0.4;
    }
    return colors;
  }
  
  render(program: ShaderProgram3D): void {
    const { gl } = this;
    
    if (this.pointCount === 0) return;
    
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
    
    if (this.showLines) {
      gl.lineWidth(this.lineWidth);
      gl.drawArrays(gl.LINE_STRIP, 0, this.pointCount);
    }
    
    if (this.showPoints) {
      if (program.uniforms['u_pointSize']) {
        gl.uniform1f(program.uniforms['u_pointSize'], this.pointSize);
      }
      gl.drawArrays(gl.POINTS, 0, this.pointCount);
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
