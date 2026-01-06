/**
 * 3D Raycasting utilities for picking/selection.
 * Implements ray-sphere intersection for bubble selection.
 */

import { Mat4 } from './math';

export interface Ray3D {
  origin: [number, number, number];
  direction: [number, number, number];
}

export interface HitResult {
  index: number;
  distance: number;
  point: [number, number, number];
}

/**
 * Creates a ray from screen coordinates through the scene.
 * @param screenX Screen X coordinate (pixels from left)
 * @param screenY Screen Y coordinate (pixels from top)
 * @param canvasWidth Canvas width in pixels
 * @param canvasHeight Canvas height in pixels
 * @param viewProjectionMatrix Combined view-projection matrix
 * @returns Ray in world space
 */
export function createRayFromScreen(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  viewProjectionMatrix: Float32Array
): Ray3D {
  // Convert screen coordinates to NDC (-1 to 1)
  const ndcX = (screenX / canvasWidth) * 2 - 1;
  const ndcY = -((screenY / canvasHeight) * 2 - 1); // Flip Y
  
  // Invert the view-projection matrix
  const invViewProj = Mat4.create();
  Mat4.invert(invViewProj, viewProjectionMatrix);
  
  // Create near and far points in NDC
  const nearPoint = [ndcX, ndcY, -1, 1] as const;
  const farPoint = [ndcX, ndcY, 1, 1] as const;
  
  // Transform to world space
  const nearWorld = transformPoint4(invViewProj, nearPoint);
  const farWorld = transformPoint4(invViewProj, farPoint);
  
  // Perspective divide
  const origin: [number, number, number] = [
    nearWorld[0] / nearWorld[3],
    nearWorld[1] / nearWorld[3],
    nearWorld[2] / nearWorld[3],
  ];
  
  const far: [number, number, number] = [
    farWorld[0] / farWorld[3],
    farWorld[1] / farWorld[3],
    farWorld[2] / farWorld[3],
  ];
  
  // Direction is far - near, normalized
  const direction: [number, number, number] = [
    far[0] - origin[0],
    far[1] - origin[1],
    far[2] - origin[2],
  ];
  
  const len = Math.sqrt(
    direction[0] * direction[0] +
    direction[1] * direction[1] +
    direction[2] * direction[2]
  );
  
  direction[0] /= len;
  direction[1] /= len;
  direction[2] /= len;
  
  return { origin, direction };
}

/**
 * Transform a 4D point by a 4x4 matrix.
 */
function transformPoint4(
  m: Float32Array,
  p: readonly [number, number, number, number]
): [number, number, number, number] {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12] * p[3],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13] * p[3],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14] * p[3],
    m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15] * p[3],
  ];
}

/**
 * Test ray-sphere intersection.
 * @param ray The ray to test
 * @param center Sphere center
 * @param radius Sphere radius
 * @returns Distance to intersection, or null if no hit
 */
export function raySphereIntersection(
  ray: Ray3D,
  center: [number, number, number],
  radius: number
): number | null {
  // Vector from ray origin to sphere center
  const oc: [number, number, number] = [
    ray.origin[0] - center[0],
    ray.origin[1] - center[1],
    ray.origin[2] - center[2],
  ];
  
  // Coefficients for quadratic equation
  // a = 1 (direction is normalized)
  const a = 1;
  const b = 2 * (
    oc[0] * ray.direction[0] +
    oc[1] * ray.direction[1] +
    oc[2] * ray.direction[2]
  );
  const c = (
    oc[0] * oc[0] +
    oc[1] * oc[1] +
    oc[2] * oc[2]
  ) - radius * radius;
  
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    return null; // No intersection
  }
  
  // Find the nearest positive root
  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);
  
  if (t1 > 0) return t1;
  if (t2 > 0) return t2;
  
  return null; // Intersection is behind ray origin
}

/**
 * Find the closest bubble hit by a ray.
 * @param ray The ray to test
 * @param positions Float32Array of positions (x,y,z interleaved)
 * @param scales Float32Array of scales (radii)
 * @param baseRadius Base radius multiplier
 * @returns Hit result or null if no hit
 */
export function pickBubble(
  ray: Ray3D,
  positions: Float32Array,
  scales: Float32Array,
  baseRadius = 1
): HitResult | null {
  const count = scales.length;
  let closestHit: HitResult | null = null;
  
  for (let i = 0; i < count; i++) {
    const center: [number, number, number] = [
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2],
    ];
    const radius = scales[i] * baseRadius;
    
    const distance = raySphereIntersection(ray, center, radius);
    
    if (distance !== null) {
      if (closestHit === null || distance < closestHit.distance) {
        // Calculate hit point
        const point: [number, number, number] = [
          ray.origin[0] + ray.direction[0] * distance,
          ray.origin[1] + ray.direction[1] * distance,
          ray.origin[2] + ray.direction[2] * distance,
        ];
        
        closestHit = {
          index: i,
          distance,
          point,
        };
      }
    }
  }
  
  return closestHit;
}

/**
 * Batch pick bubbles - returns all bubbles within a tolerance of the ray.
 * More efficient for hover detection.
 */
export function pickBubblesInRange(
  ray: Ray3D,
  positions: Float32Array,
  scales: Float32Array,
  baseRadius = 1,
  maxResults = 10
): HitResult[] {
  const count = scales.length;
  const hits: HitResult[] = [];
  
  for (let i = 0; i < count; i++) {
    const center: [number, number, number] = [
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2],
    ];
    const radius = scales[i] * baseRadius;
    
    const distance = raySphereIntersection(ray, center, radius);
    
    if (distance !== null) {
      const point: [number, number, number] = [
        ray.origin[0] + ray.direction[0] * distance,
        ray.origin[1] + ray.direction[1] * distance,
        ray.origin[2] + ray.direction[2] * distance,
      ];
      
      hits.push({ index: i, distance, point });
      
      if (hits.length >= maxResults) break;
    }
  }
  
  // Sort by distance
  hits.sort((a, b) => a.distance - b.distance);
  
  return hits;
}

/**
 * Calculate distance from a point to a ray (for approximate/fast picking).
 */
export function pointToRayDistance(
  ray: Ray3D,
  point: [number, number, number]
): number {
  // Vector from ray origin to point
  const v: [number, number, number] = [
    point[0] - ray.origin[0],
    point[1] - ray.origin[1],
    point[2] - ray.origin[2],
  ];
  
  // Project onto ray direction
  const t = (
    v[0] * ray.direction[0] +
    v[1] * ray.direction[1] +
    v[2] * ray.direction[2]
  );
  
  // Closest point on ray
  const closest: [number, number, number] = [
    ray.origin[0] + ray.direction[0] * t,
    ray.origin[1] + ray.direction[1] * t,
    ray.origin[2] + ray.direction[2] * t,
  ];
  
  // Distance from point to closest point on ray
  const dx = point[0] - closest[0];
  const dy = point[1] - closest[1];
  const dz = point[2] - closest[2];
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Result of a surface mesh hit test
 */
export interface SurfaceHitResult {
  /** Distance from ray origin to hit point */
  distance: number;
  /** Hit point in world coordinates */
  point: [number, number, number];
  /** Grid row and column indices */
  row: number;
  col: number;
  /** Interpolated Y value at hit point */
  yValue: number;
  /** Barycentric coordinates for interpolation */
  baryU: number;
  baryV: number;
}

/**
 * Ray-triangle intersection using Möller-Trumbore algorithm.
 * Returns distance to intersection or null if no hit.
 */
export function rayTriangleIntersection(
  ray: Ray3D,
  v0: [number, number, number],
  v1: [number, number, number],
  v2: [number, number, number]
): { distance: number; u: number; v: number } | null {
  const EPSILON = 0.000001;
  
  // Edge vectors
  const e1: [number, number, number] = [
    v1[0] - v0[0],
    v1[1] - v0[1],
    v1[2] - v0[2],
  ];
  const e2: [number, number, number] = [
    v2[0] - v0[0],
    v2[1] - v0[1],
    v2[2] - v0[2],
  ];
  
  // Cross product: ray.direction x e2
  const h: [number, number, number] = [
    ray.direction[1] * e2[2] - ray.direction[2] * e2[1],
    ray.direction[2] * e2[0] - ray.direction[0] * e2[2],
    ray.direction[0] * e2[1] - ray.direction[1] * e2[0],
  ];
  
  // Dot product: e1 . h
  const a = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
  
  // Ray parallel to triangle
  if (a > -EPSILON && a < EPSILON) {
    return null;
  }
  
  const f = 1.0 / a;
  
  // Vector from v0 to ray origin
  const s: [number, number, number] = [
    ray.origin[0] - v0[0],
    ray.origin[1] - v0[1],
    ray.origin[2] - v0[2],
  ];
  
  // First barycentric coordinate
  const u = f * (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]);
  
  if (u < 0.0 || u > 1.0) {
    return null;
  }
  
  // Cross product: s x e1
  const q: [number, number, number] = [
    s[1] * e1[2] - s[2] * e1[1],
    s[2] * e1[0] - s[0] * e1[2],
    s[0] * e1[1] - s[1] * e1[0],
  ];
  
  // Second barycentric coordinate
  const v = f * (ray.direction[0] * q[0] + ray.direction[1] * q[1] + ray.direction[2] * q[2]);
  
  if (v < 0.0 || u + v > 1.0) {
    return null;
  }
  
  // Distance to intersection
  const t = f * (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]);
  
  if (t > EPSILON) {
    return { distance: t, u, v };
  }
  
  return null;
}

/**
 * Pick a point on a surface mesh grid.
 * Tests ray against all triangles in the grid.
 * 
 * @param ray The picking ray
 * @param xValues X coordinates array (columns)
 * @param zValues Z coordinates array (rows)
 * @param yValues Y values array (row-major: row * cols + col)
 * @returns Hit result or null if no intersection
 */
export function pickSurfaceMesh(
  ray: Ray3D,
  xValues: Float32Array,
  zValues: Float32Array,
  yValues: Float32Array
): SurfaceHitResult | null {
  const cols = xValues.length;
  const rows = zValues.length;
  
  let closestHit: SurfaceHitResult | null = null;
  
  // Iterate through all quads (each quad = 2 triangles)
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      // Get the 4 corners of the quad
      const i00 = row * cols + col;
      const i10 = row * cols + col + 1;
      const i01 = (row + 1) * cols + col;
      const i11 = (row + 1) * cols + col + 1;
      
      const v00: [number, number, number] = [xValues[col], yValues[i00], zValues[row]];
      const v10: [number, number, number] = [xValues[col + 1], yValues[i10], zValues[row]];
      const v01: [number, number, number] = [xValues[col], yValues[i01], zValues[row + 1]];
      const v11: [number, number, number] = [xValues[col + 1], yValues[i11], zValues[row + 1]];
      
      // Triangle 1: v00, v01, v10
      const hit1 = rayTriangleIntersection(ray, v00, v01, v10);
      if (hit1 && (closestHit === null || hit1.distance < closestHit.distance)) {
        const point: [number, number, number] = [
          ray.origin[0] + ray.direction[0] * hit1.distance,
          ray.origin[1] + ray.direction[1] * hit1.distance,
          ray.origin[2] + ray.direction[2] * hit1.distance,
        ];
        
        // Interpolate Y value using barycentric coordinates
        const w = 1 - hit1.u - hit1.v;
        const yInterp = w * yValues[i00] + hit1.u * yValues[i01] + hit1.v * yValues[i10];
        
        closestHit = {
          distance: hit1.distance,
          point,
          row,
          col,
          yValue: yInterp,
          baryU: hit1.u,
          baryV: hit1.v,
        };
      }
      
      // Triangle 2: v10, v01, v11
      const hit2 = rayTriangleIntersection(ray, v10, v01, v11);
      if (hit2 && (closestHit === null || hit2.distance < closestHit.distance)) {
        const point: [number, number, number] = [
          ray.origin[0] + ray.direction[0] * hit2.distance,
          ray.origin[1] + ray.direction[1] * hit2.distance,
          ray.origin[2] + ray.direction[2] * hit2.distance,
        ];
        
        const w = 1 - hit2.u - hit2.v;
        const yInterp = w * yValues[i10] + hit2.u * yValues[i01] + hit2.v * yValues[i11];
        
        closestHit = {
          distance: hit2.distance,
          point,
          row,
          col: col + 1,
          yValue: yInterp,
          baryU: hit2.u,
          baryV: hit2.v,
        };
      }
    }
  }
  
  return closestHit;
}

/**
 * Calculate the shortest distance between a ray and a line segment.
 * Useful for picking lines and thin tubes.
 */
export function raySegmentDistance(
  ray: Ray3D,
  p0: [number, number, number],
  p1: [number, number, number]
): { distance: number; pointOnRay: [number, number, number]; pointOnSegment: [number, number, number]; t: number } {
  const v = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const u = ray.direction;
  const w = [ray.origin[0] - p0[0], ray.origin[1] - p0[1], ray.origin[2] - p0[2]];

  const a = u[0] * u[0] + u[1] * u[1] + u[2] * u[2];
  const b = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const c = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  const d = u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
  const e = v[0] * w[0] + v[1] * w[1] + v[2] * w[2];

  const D = a * c - b * b;
  let sc, tc;

  if (D < 0.0001) {
    sc = 0.0;
    tc = (b > c ? d / b : e / c);
  } else {
    sc = (b * e - c * d) / D;
    tc = (a * e - b * d) / D;
  }

  // Clamp tc to [0, 1] segment range
  tc = Math.max(0, Math.min(1, tc));
  
  // Point on ray P(sc) = origin + sc * direction (only if sc > 0)
  sc = Math.max(0, sc);

  const closestOnRay: [number, number, number] = [
    ray.origin[0] + sc * u[0],
    ray.origin[1] + sc * u[1],
    ray.origin[2] + sc * u[2]
  ];

  const closestOnSegment: [number, number, number] = [
    p0[0] + tc * v[0],
    p0[1] + tc * v[1],
    p0[2] + tc * v[2]
  ];

  const dx = closestOnRay[0] - closestOnSegment[0];
  const dy = closestOnRay[1] - closestOnSegment[1];
  const dz = closestOnRay[2] - closestOnSegment[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    distance: dist,
    pointOnRay: closestOnRay,
    pointOnSegment: closestOnSegment,
    t: tc
  };
}

/**
 * Pick a series index and point index from a 3D line.
 */
export function pickLine(
  ray: Ray3D,
  lines: { x: Float32Array; y: Float32Array; z: Float32Array }[],
  threshold: number = 0.5
): { seriesIndex: number; pointIndex: number; distance: number; point: [number, number, number] } | null {
  let closest: { seriesIndex: number; pointIndex: number; distance: number; point: [number, number, number] } | null = null;
  let minDist = threshold;

  for (let s = 0; s < lines.length; s++) {
    const line = lines[s];
    for (let i = 0; i < line.x.length - 1; i++) {
      const p0: [number, number, number] = [line.x[i], line.y[i], line.z[i]];
      const p1: [number, number, number] = [line.x[i+1], line.y[i+1], line.z[i+1]];
      
      const res = raySegmentDistance(ray, p0, p1);
      if (res.distance < minDist) {
        minDist = res.distance;
        closest = {
          seriesIndex: s,
          pointIndex: i + (res.t > 0.5 ? 1 : 0),
          distance: res.distance,
          point: res.pointOnSegment
        };
      }
    }
  }

  return closest;
}

/**
 * Pick a point from an impulse/stem series.
 */
export function pickImpulse(
  ray: Ray3D,
  data: { x: Float32Array; y: Float32Array; z: Float32Array; baseY?: number },
  threshold: number = 0.3
): { index: number; distance: number; point: [number, number, number] } | null {
  let closest: { index: number; distance: number; point: [number, number, number] } | null = null;
  let minDist = threshold;
  const baseY = data.baseY ?? 0;

  for (let i = 0; i < data.x.length; i++) {
    const p0: [number, number, number] = [data.x[i], baseY, data.z[i]];
    const p1: [number, number, number] = [data.x[i], data.y[i], data.z[i]];

    const res = raySegmentDistance(ray, p0, p1);
    if (res.distance < minDist) {
      minDist = res.distance;
      closest = {
        index: i,
        distance: res.distance,
        point: [data.x[i], data.y[i], data.z[i]]
      };
    }
  }

  return closest;
}

/**
 * Pick a series index and point index from a 3D area (curtain).
 * Checks the top line of the area.
 */
export function pickArea(
  ray: Ray3D,
  areas: { x: Float32Array; y: Float32Array; z: Float32Array; baseY?: number }[],
  threshold: number = 0.5
): { seriesIndex: number; pointIndex: number; distance: number; point: [number, number, number] } | null {
  return pickLine(ray, areas, threshold);
}



