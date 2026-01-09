/**
 * Orbit camera for 3D scene navigation.
 * Uses spherical coordinates (theta, phi, radius) around a target point.
 */

import * as Mat4 from '../math/Mat4';
import type { Vec3 } from '../math/Mat4';

export interface OrbitCameraOptions {
  target?: Vec3;
  radius?: number;
  theta?: number;      // Horizontal angle (radians)
  phi?: number;        // Vertical angle (radians)
  fov?: number;        // Field of view (radians)
  near?: number;
  far?: number;
  minRadius?: number;
  maxRadius?: number;
  minPhi?: number;     // Prevent flipping at poles
  maxPhi?: number;
}

export class OrbitCamera {
  // Target point to orbit around
  target: Vec3 = [0, 0, 0];
  
  // Spherical coordinates
  radius = 5;
  theta = 0;           // Horizontal rotation
  phi = Math.PI / 4;   // Vertical rotation (0 = top, PI = bottom)
  
  // Projection parameters
  fov = Math.PI / 4;   // 45 degrees
  aspect = 1;
  near = 0.1;
  far = 1000;
  
  // Constraints
  minRadius = 0.5;
  maxRadius = 100;
  minPhi = 0.01;
  maxPhi = Math.PI - 0.01;
  
  // Cached matrices
  private viewMatrix: Mat4.Mat4;
  private projMatrix: Mat4.Mat4;
  private viewProjMatrix: Mat4.Mat4;
  private dirty = true;
  
  // Cached eye position
  private eye: Vec3 = [0, 0, 0];
  
  constructor(options: OrbitCameraOptions = {}) {
    this.viewMatrix = Mat4.create();
    this.projMatrix = Mat4.create();
    this.viewProjMatrix = Mat4.create();
    
    if (options.target) this.target = [...options.target];
    if (options.radius !== undefined) this.radius = options.radius;
    if (options.theta !== undefined) this.theta = options.theta;
    if (options.phi !== undefined) this.phi = options.phi;
    if (options.fov !== undefined) this.fov = options.fov;
    if (options.near !== undefined) this.near = options.near;
    if (options.far !== undefined) this.far = options.far;
    if (options.minRadius !== undefined) this.minRadius = options.minRadius;
    if (options.maxRadius !== undefined) this.maxRadius = options.maxRadius;
    if (options.minPhi !== undefined) this.minPhi = options.minPhi;
    if (options.maxPhi !== undefined) this.maxPhi = options.maxPhi;
    
    this.dirty = true;
  }
  
  /**
   * Set aspect ratio (width / height).
   */
  setAspect(aspect: number): void {
    if (this.aspect !== aspect) {
      this.aspect = aspect;
      this.dirty = true;
    }
  }
  
  /**
   * Rotate camera by delta angles.
   */
  rotate(deltaTheta: number, deltaPhi: number): void {
    this.theta += deltaTheta;
    this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi + deltaPhi));
    this.dirty = true;
  }
  
  /**
   * Zoom camera by delta radius (positive = zoom out).
   */
  zoom(delta: number): void {
    this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius + delta));
    this.dirty = true;
  }
  
  /**
   * Zoom by factor (1 = no change, <1 = zoom in, >1 = zoom out).
   */
  zoomFactor(factor: number): void {
    this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius * factor));
    this.dirty = true;
  }
  
  /**
   * Pan camera target by world-space delta.
   */
  pan(deltaX: number, deltaY: number): void {
    // Calculate right and up vectors from current view
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);
    
    // Right vector (perpendicular to view direction in XZ plane)
    const rightX = cosTheta;
    const rightZ = -sinTheta;
    
    // Up vector (world up for simplicity)
    const upY = 1;
    
    this.target[0] += rightX * deltaX;
    this.target[1] += upY * deltaY;
    this.target[2] += rightZ * deltaX;
    
    this.dirty = true;
  }
  
  /**
   * Set target position directly.
   */
  setTarget(x: number, y: number, z: number): void {
    this.target[0] = x;
    this.target[1] = y;
    this.target[2] = z;
    this.dirty = true;
  }
  
  /**
   * Set camera position from spherical coordinates.
   */
  setSpherical(theta: number, phi: number, radius: number): void {
    this.theta = theta;
    this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, phi));
    this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, radius));
    this.dirty = true;
  }
  
  /**
   * Update matrices if dirty.
   */
  private updateMatrices(): void {
    if (!this.dirty) return;
    
    // Calculate eye position from spherical coordinates
    const sinPhi = Math.sin(this.phi);
    const cosPhi = Math.cos(this.phi);
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);
    
    this.eye[0] = this.target[0] + this.radius * sinPhi * sinTheta;
    this.eye[1] = this.target[1] + this.radius * cosPhi;
    this.eye[2] = this.target[2] + this.radius * sinPhi * cosTheta;
    
    // View matrix
    Mat4.lookAt(this.viewMatrix, this.eye, this.target, [0, 1, 0]);
    
    // Projection matrix
    Mat4.perspective(this.projMatrix, this.fov, this.aspect, this.near, this.far);
    
    // Combined view-projection matrix
    Mat4.multiply(this.viewProjMatrix, this.projMatrix, this.viewMatrix);
    
    this.dirty = false;
  }
  
  /**
   * Get view matrix.
   */
  getViewMatrix(): Mat4.Mat4 {
    this.updateMatrices();
    return this.viewMatrix;
  }
  
  /**
   * Get projection matrix.
   */
  getProjectionMatrix(): Mat4.Mat4 {
    this.updateMatrices();
    return this.projMatrix;
  }
  
  /**
   * Get combined view-projection matrix.
   */
  getViewProjectionMatrix(): Mat4.Mat4 {
    this.updateMatrices();
    return this.viewProjMatrix;
  }
  
  /**
   * Get current eye position.
   */
  getEyePosition(): Vec3 {
    this.updateMatrices();
    return [...this.eye] as Vec3;
  }
  
  /**
   * Get forward direction (normalized).
   */
  getForwardDirection(): Vec3 {
    this.updateMatrices();
    const dx = this.target[0] - this.eye[0];
    const dy = this.target[1] - this.eye[1];
    const dz = this.target[2] - this.eye[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return [dx / len, dy / len, dz / len];
  }
  
  /**
   * Reset camera to default position.
   */
  reset(): void {
    this.target = [0, 0, 0];
    this.radius = 5;
    this.theta = 0;
    this.phi = Math.PI / 4;
    this.dirty = true;
  }
  
  /**
   * Fit camera to view a bounding box.
   */
  fitToBounds(
    minX: number, minY: number, minZ: number,
    maxX: number, maxY: number, maxZ: number
  ): void {
    // Center target on bounds center
    this.target[0] = (minX + maxX) / 2;
    this.target[1] = (minY + maxY) / 2;
    this.target[2] = (minZ + maxZ) / 2;
    
    // Calculate radius to fit bounds
    const dx = maxX - minX;
    const dy = maxY - minY;
    const dz = maxZ - minZ;
    const diagonal = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Distance to fit diagonal in view
    this.radius = diagonal / (2 * Math.tan(this.fov / 2));
    this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius));
    
    this.dirty = true;
  }
}
