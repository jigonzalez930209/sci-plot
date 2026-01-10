/**
 * Scatter 3D renderer.
 * Renders individual points in 3D space with various symbols.
 */

import type { ShaderProgram3D } from '../shader/programs';
import type { Scatter3DData } from './types';
import { createIcosphere, createCube, type GeometryData } from '../mesh/geometry';

export class Scatter3D {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  // Geometry buffers
  private geometryPosBuffer: WebGLBuffer | null = null;
  private geometryIndexBuffer: WebGLBuffer | null = null;
  
  // Instance buffers
  private instancePosBuffer: WebGLBuffer | null = null;
  private instanceColorBuffer: WebGLBuffer | null = null;
  private instanceSizeBuffer: WebGLBuffer | null = null;
  
  private geometry: GeometryData;
  private instanceCount = 0;
  private symbol: 'sphere' | 'cube' | 'diamond' | 'point' = 'sphere';
  
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.geometry = createIcosphere(1);
    this.initBuffers();
  }
  
  private initBuffers(): void {
    const { gl, geometry } = this;
    
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    
    // Geometry position buffer
    this.geometryPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
    
    // Geometry index buffer
    this.geometryIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geometryIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
    
    // Instance buffers
    this.instancePosBuffer = gl.createBuffer();
    this.instanceColorBuffer = gl.createBuffer();
    this.instanceSizeBuffer = gl.createBuffer();
    
    gl.bindVertexArray(null);
  }
  
  updateData(data: Scatter3DData): void {
    const { gl } = this;
    
    this.instanceCount = data.positions.length / 3;
    this.symbol = data.symbol ?? 'sphere';
    
    // Update geometry if symbol changed
    if (this.symbol === 'cube' || this.symbol === 'diamond') {
      this.geometry = createCube();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryPosBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.geometry.positions, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geometryIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.geometry.indices, gl.STATIC_DRAW);
    }
    
    // Default colors
    const colors = data.colors ?? this.generateDefaultColors(this.instanceCount);
    
    // Default sizes
    const sizes = data.sizes ?? new Float32Array(this.instanceCount).fill(0.1);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceSizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
  }
  
  private generateDefaultColors(count: number): Float32Array {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 0.2 + Math.random() * 0.6;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.6 + Math.random() * 0.4;
    }
    return colors;
  }
  
  render(program: ShaderProgram3D): void {
    const { gl, geometry, instanceCount } = this;
    
    if (instanceCount === 0) return;
    
    gl.bindVertexArray(this.vao);
    
    // Geometry position
    const posLoc = program.attributes['a_position'];
    if (posLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryPosBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(posLoc, 0);
    }
    
    // Instance position
    const instancePosLoc = program.attributes['a_instancePos'];
    if (instancePosLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
      gl.enableVertexAttribArray(instancePosLoc);
      gl.vertexAttribPointer(instancePosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(instancePosLoc, 1);
    }
    
    // Instance color
    const colorLoc = program.attributes['a_color'];
    if (colorLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColorBuffer);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(colorLoc, 1);
    }
    
    // Instance size
    const scaleLoc = program.attributes['a_scale'];
    if (scaleLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceSizeBuffer);
      gl.enableVertexAttribArray(scaleLoc);
      gl.vertexAttribPointer(scaleLoc, 1, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(scaleLoc, 1);
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geometryIndexBuffer);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      geometry.indexCount,
      gl.UNSIGNED_SHORT,
      0,
      instanceCount
    );
    
    gl.bindVertexArray(null);
  }
  
  destroy(): void {
    const { gl } = this;
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.geometryPosBuffer) gl.deleteBuffer(this.geometryPosBuffer);
    if (this.geometryIndexBuffer) gl.deleteBuffer(this.geometryIndexBuffer);
    if (this.instancePosBuffer) gl.deleteBuffer(this.instancePosBuffer);
    if (this.instanceColorBuffer) gl.deleteBuffer(this.instanceColorBuffer);
    if (this.instanceSizeBuffer) gl.deleteBuffer(this.instanceSizeBuffer);
  }
}
