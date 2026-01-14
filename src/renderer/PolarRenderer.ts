/**
 * Polar Chart Renderer
 * 
 * Converts polar coordinates (r, theta) to Cartesian (x, y) for WebGL rendering.
 * Supports both degrees and radians, with optional fill and path closing.
 * 
 * @module renderer/PolarRenderer
 */

import type { PolarData, PolarMode } from "../types";

/**
 * Convert polar coordinates to Cartesian coordinates
 * 
 * @param r - Radial values (distance from origin)
 * @param theta - Angular values
 * @param angleMode - 'degrees' or 'radians'
 * @returns Interleaved [x, y] vertex data
 */
export function polarToCartesian(
  r: Float32Array | Float64Array | number[],
  theta: Float32Array | Float64Array | number[],
  angleMode: PolarMode = 'degrees'
): Float32Array {
  const n = Math.min(r.length, theta.length);
  const result = new Float32Array(n * 2);
  
  const toRadians = angleMode === 'degrees' ? Math.PI / 180 : 1;
  
  for (let i = 0; i < n; i++) {
    const radius = r[i];
    const angle = theta[i] * toRadians;
    
    // Convert to Cartesian: x = r * cos(θ), y = r * sin(θ)
    result[i * 2] = radius * Math.cos(angle);
    result[i * 2 + 1] = radius * Math.sin(angle);
  }
  
  return result;
}

/**
 * Prepare polar data for line rendering with optional path closing
 * 
 * @param data - Polar coordinate data
 * @param angleMode - Angular unit mode
 * @param closePath - Whether to connect last point to first
 * @returns Cartesian vertex data
 */
export function interleavePolarLineData(
  data: PolarData,
  angleMode: PolarMode = 'degrees',
  closePath: boolean = false
): Float32Array {
  const cartesian = polarToCartesian(data.r, data.theta, angleMode);
  
  if (!closePath) {
    return cartesian;
  }
  
  // Add first point at the end to close the path
  const n = cartesian.length / 2;
  const result = new Float32Array((n + 1) * 2);
  result.set(cartesian);
  result[n * 2] = cartesian[0];
  result[n * 2 + 1] = cartesian[1];
  
  return result;
}

/**
 * Prepare polar data for filled area rendering
 * Creates triangles from origin to each line segment
 * 
 * @param data - Polar coordinate data
 * @param angleMode - Angular unit mode
 * @param closePath - Whether to close the path
 * @returns Triangle vertex data for gl.TRIANGLES
 */
export function interleavePolarFillData(
  data: PolarData,
  angleMode: PolarMode = 'degrees',
  closePath: boolean = true
): Float32Array {
  const cartesian = polarToCartesian(data.r, data.theta, angleMode);
  const n = cartesian.length / 2;
  
  // Each segment creates a triangle from origin (0,0) to two consecutive points
  const numTriangles = closePath ? n : n - 1;
  const result = new Float32Array(numTriangles * 3 * 2); // 3 vertices per triangle, 2 floats per vertex
  
  for (let i = 0; i < numTriangles; i++) {
    const base = i * 6;
    const i1 = i;
    const i2 = (i + 1) % n; // Wrap around if closePath
    
    // Triangle: origin, point i, point i+1
    result[base + 0] = 0; // Origin x
    result[base + 1] = 0; // Origin y
    result[base + 2] = cartesian[i1 * 2]; // Point i x
    result[base + 3] = cartesian[i1 * 2 + 1]; // Point i y
    result[base + 4] = cartesian[i2 * 2]; // Point i+1 x
    result[base + 5] = cartesian[i2 * 2 + 1]; // Point i+1 y
  }
  
  return result;
}

/**
 * Generate polar grid lines (radial and angular)
 * 
 * @param maxRadius - Maximum radial value
 * @param radialDivisions - Number of concentric circles
 * @param angularDivisions - Number of radial lines (spokes)
 * @param angleMode - Angular unit mode
 * @returns Object with radial and angular grid line data
 */
export function generatePolarGrid(
  maxRadius: number,
  radialDivisions: number = 5,
  angularDivisions: number = 12,
  angleMode: PolarMode = 'degrees'
): {
  radialLines: Float32Array;
  angularLines: Float32Array;
} {
  // Radial grid (concentric circles)
  const pointsPerCircle = 64; // Smooth circles
  const radialLines = new Float32Array(radialDivisions * pointsPerCircle * 2);
  
  for (let i = 0; i < radialDivisions; i++) {
    const radius = ((i + 1) / radialDivisions) * maxRadius;
    
    for (let j = 0; j < pointsPerCircle; j++) {
      const angle = (j / pointsPerCircle) * 2 * Math.PI;
      const idx = (i * pointsPerCircle + j) * 2;
      radialLines[idx] = radius * Math.cos(angle);
      radialLines[idx + 1] = radius * Math.sin(angle);
    }
  }
  
  // Angular grid (radial spokes from origin)
  const angularLines = new Float32Array(angularDivisions * 2 * 2); // 2 points per line, 2 floats per point
  const angleStep = angleMode === 'degrees' ? 360 / angularDivisions : (2 * Math.PI) / angularDivisions;
  const toRadians = angleMode === 'degrees' ? Math.PI / 180 : 1;
  
  for (let i = 0; i < angularDivisions; i++) {
    const angle = i * angleStep * toRadians;
    const idx = i * 4;
    
    // Line from origin to max radius
    angularLines[idx] = 0; // Origin x
    angularLines[idx + 1] = 0; // Origin y
    angularLines[idx + 2] = maxRadius * Math.cos(angle); // Outer point x
    angularLines[idx + 3] = maxRadius * Math.sin(angle); // Outer point y
  }
  
  return { radialLines, angularLines };
}

/**
 * Calculate bounds for polar data
 * 
 * @param data - Polar coordinate data
 * @returns Cartesian bounds {xMin, xMax, yMin, yMax}
 */
export function calculatePolarBounds(data: PolarData): {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  maxRadius: number;
} {
  const n = Math.min(data.r.length, data.theta.length);
  
  // Find max radius for symmetric bounds
  let maxRadius = 0;
  for (let i = 0; i < n; i++) {
    maxRadius = Math.max(maxRadius, Math.abs(data.r[i]));
  }
  
  // Polar charts are typically centered at origin with symmetric bounds
  return {
    xMin: -maxRadius,
    xMax: maxRadius,
    yMin: -maxRadius,
    yMax: maxRadius,
    maxRadius
  };
}

/**
 * Normalize angular values to [0, 360) degrees or [0, 2π) radians
 * 
 * @param theta - Angular values
 * @param angleMode - Angular unit mode
 * @returns Normalized angles
 */
export function normalizeAngles(
  theta: Float32Array | Float64Array | number[],
  angleMode: PolarMode = 'degrees'
): Float32Array {
  const result = new Float32Array(theta.length);
  const period = angleMode === 'degrees' ? 360 : 2 * Math.PI;
  
  for (let i = 0; i < theta.length; i++) {
    let angle = theta[i] % period;
    if (angle < 0) angle += period;
    result[i] = angle;
  }
  
  return result;
}
