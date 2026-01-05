/**
 * Heatmap 3D renderer.
 * Renders a colored grid on the XZ plane based on intensity values.
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { Heatmap3DData } from './types';

export class Heatmap3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  private positionBuffer: WebGLBuffer | null = null;
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
    this.colorBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();
    
    gl.bindVertexArray(null);
  }
  
  updateData(data: Heatmap3DData): void {
    const { gl } = this;
    
    const cols = data.xValues.length;
    const rows = data.zValues.length;
    const vertexCount = cols * rows;
    
    // Find min/max for color mapping
    let minVal = data.minValue ?? Infinity;
    let maxVal = data.maxValue ?? -Infinity;
    
    if (minVal === Infinity || maxVal === -Infinity) {
      for (let i = 0; i < data.values.length; i++) {
        if (data.values[i] < minVal) minVal = data.values[i];
        if (data.values[i] > maxVal) maxVal = data.values[i];
      }
    }
    const range = maxVal - minVal || 1;
    
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const i3 = idx * 3;
        
        positions[i3] = data.xValues[col];
        positions[i3 + 1] = 0; // Flat on XZ plane
        positions[i3 + 2] = data.zValues[row];
        
        const t = (data.values[idx] - minVal) / range;
        this.applyColormap(colors, i3, t, data.colormap);
      }
    }
    
    // Generate indices
    const indices: number[] = [];
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const tl = row * cols + col;
        const tr = tl + 1;
        const bl = tl + cols;
        const br = bl + 1;
        
        indices.push(tl, bl, tr);
        indices.push(tr, bl, br);
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
    t = Math.max(0, Math.min(1, t));
    
    switch (colormap) {
      case 'jet':
        if (t < 0.25) {
          colors[i3] = 0; colors[i3 + 1] = 4 * t; colors[i3 + 2] = 1;
        } else if (t < 0.5) {
          colors[i3] = 0; colors[i3 + 1] = 1; colors[i3 + 2] = 1 - 4 * (t - 0.25);
        } else if (t < 0.75) {
          colors[i3] = 4 * (t - 0.5); colors[i3 + 1] = 1; colors[i3 + 2] = 0;
        } else {
          colors[i3] = 1; colors[i3 + 1] = 1 - 4 * (t - 0.75); colors[i3 + 2] = 0;
        }
        break;
      case 'hot':
        colors[i3] = Math.min(1, t * 3);
        colors[i3 + 1] = Math.max(0, Math.min(1, (t - 0.33) * 3));
        colors[i3 + 2] = Math.max(0, (t - 0.67) * 3);
        break;
      case 'grayscale':
        colors[i3] = t; colors[i3 + 1] = t; colors[i3 + 2] = t;
        break;
      case 'viridis':
      default:
        colors[i3] = 0.267 + t * 0.329 + t * t * 0.2;
        colors[i3 + 1] = 0.004 + t * 0.873;
        colors[i3 + 2] = 0.329 + t * 0.2 - t * t * 0.3;
        break;
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
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
  }
}
