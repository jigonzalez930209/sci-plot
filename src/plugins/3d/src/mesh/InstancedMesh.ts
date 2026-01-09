/**
 * Instanced mesh for efficient rendering of many identical geometries.
 * Uses WebGL2 instanced rendering for single draw call performance.
 */

import type { GeometryData } from './geometry';
import type { ShaderProgram3D } from '../shader/programs';

export interface InstanceData {
  positions: Float32Array;  // xyz per instance (length = instanceCount * 3)
  scales: Float32Array;     // scale per instance (length = instanceCount)
  colors: Float32Array;     // rgb per instance (length = instanceCount * 3)
}

export interface InstancedMeshOptions {
  geometry: GeometryData;
  maxInstances?: number;
}

export class InstancedMesh {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  
  // Geometry buffers
  private positionBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  
  // Instance buffers
  private instancePosBuffer: WebGLBuffer | null = null;
  private instanceScaleBuffer: WebGLBuffer | null = null;
  private instanceColorBuffer: WebGLBuffer | null = null;
  
  private geometry: GeometryData;
  private maxInstances: number;
  private instanceCount = 0;
  
  constructor(gl: WebGL2RenderingContext, options: InstancedMeshOptions) {
    this.gl = gl;
    this.geometry = options.geometry;
    this.maxInstances = options.maxInstances ?? 100000;
    
    this.initBuffers();
  }
  
  private initBuffers(): void {
    const { gl, geometry, maxInstances } = this;
    
    // Create VAO
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    
    // Geometry position buffer
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
    
    // Index buffer
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
    
    // Instance position buffer (vec3 per instance)
    this.instancePosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxInstances * 3 * 4, gl.DYNAMIC_DRAW);
    
    // Instance scale buffer (float per instance)
    this.instanceScaleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceScaleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxInstances * 4, gl.DYNAMIC_DRAW);
    
    // Instance color buffer (vec3 per instance)
    this.instanceColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxInstances * 3 * 4, gl.DYNAMIC_DRAW);
    
    gl.bindVertexArray(null);
  }
  
  /**
   * Update instance data. Call before render.
   */
  updateInstances(data: InstanceData): void {
    const { gl, maxInstances } = this;
    
    this.instanceCount = Math.min(data.positions.length / 3, maxInstances);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.positions);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceScaleBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.scales);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.colors);
  }
  
  /**
   * Render all instances with given shader program.
   */
  render(program: ShaderProgram3D): void {
    const { gl, geometry, instanceCount } = this;
    
    if (instanceCount === 0) return;
    
    gl.bindVertexArray(this.vao);
    
    // Setup geometry position attribute
    const posLoc = program.attributes['a_position'];
    if (posLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(posLoc, 0); // Per vertex
    }
    
    // Setup instance position attribute
    const instancePosLoc = program.attributes['a_instancePos'];
    if (instancePosLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuffer);
      gl.enableVertexAttribArray(instancePosLoc);
      gl.vertexAttribPointer(instancePosLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(instancePosLoc, 1); // Per instance
    }
    
    // Setup instance scale attribute
    const scaleLoc = program.attributes['a_scale'];
    if (scaleLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceScaleBuffer);
      gl.enableVertexAttribArray(scaleLoc);
      gl.vertexAttribPointer(scaleLoc, 1, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(scaleLoc, 1); // Per instance
    }
    
    // Setup instance color attribute
    const colorLoc = program.attributes['a_color'];
    if (colorLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColorBuffer);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(colorLoc, 1); // Per instance
    }
    
    // Bind index buffer and draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      geometry.indexCount,
      gl.UNSIGNED_SHORT,
      0,
      instanceCount
    );
    
    gl.bindVertexArray(null);
  }
  
  /**
   * Get current instance count.
   */
  getInstanceCount(): number {
    return this.instanceCount;
  }
  
  /**
   * Clean up WebGL resources.
   */
  destroy(): void {
    const { gl } = this;
    
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    if (this.instancePosBuffer) gl.deleteBuffer(this.instancePosBuffer);
    if (this.instanceScaleBuffer) gl.deleteBuffer(this.instanceScaleBuffer);
    if (this.instanceColorBuffer) gl.deleteBuffer(this.instanceColorBuffer);
    
    this.vao = null;
    this.positionBuffer = null;
    this.indexBuffer = null;
    this.instancePosBuffer = null;
    this.instanceScaleBuffer = null;
    this.instanceColorBuffer = null;
  }
}
