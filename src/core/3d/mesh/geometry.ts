/**
 * Procedural geometry generation for 3D primitives.
 * Generates vertex positions and indices for instanced rendering.
 */

export interface GeometryData {
  positions: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  indexCount: number;
}

/**
 * Generate icosphere geometry (subdivided icosahedron).
 * Good for spherical bubbles with uniform vertex distribution.
 */
export function createIcosphere(subdivisions = 1): GeometryData {
  const t = (1 + Math.sqrt(5)) / 2;

  // Initial icosahedron vertices
  const vertices: number[] = [
    -1, t, 0,   1, t, 0,   -1, -t, 0,   1, -t, 0,
    0, -1, t,   0, 1, t,   0, -1, -t,   0, 1, -t,
    t, 0, -1,   t, 0, 1,   -t, 0, -1,   -t, 0, 1,
  ];

  // Initial icosahedron faces (20 triangles)
  let faces: number[][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  // Midpoint cache for subdivision
  const midpointCache = new Map<string, number>();

  function getMidpoint(v1: number, v2: number): number {
    const key = v1 < v2 ? `${v1}_${v2}` : `${v2}_${v1}`;
    if (midpointCache.has(key)) {
      return midpointCache.get(key)!;
    }

    const i1 = v1 * 3;
    const i2 = v2 * 3;
    const mx = (vertices[i1] + vertices[i2]) / 2;
    const my = (vertices[i1 + 1] + vertices[i2 + 1]) / 2;
    const mz = (vertices[i1 + 2] + vertices[i2 + 2]) / 2;

    const idx = vertices.length / 3;
    vertices.push(mx, my, mz);
    midpointCache.set(key, idx);
    return idx;
  }

  // Subdivide
  for (let i = 0; i < subdivisions; i++) {
    const newFaces: number[][] = [];
    for (const [a, b, c] of faces) {
      const ab = getMidpoint(a, b);
      const bc = getMidpoint(b, c);
      const ca = getMidpoint(c, a);
      newFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = newFaces;
    midpointCache.clear();
  }

  // Normalize vertices to unit sphere
  const positions = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i], y = vertices[i + 1], z = vertices[i + 2];
    const len = Math.sqrt(x * x + y * y + z * z);
    positions[i] = x / len;
    positions[i + 1] = y / len;
    positions[i + 2] = z / len;
  }

  // Flatten faces to indices
  const indices = new Uint16Array(faces.length * 3);
  for (let i = 0; i < faces.length; i++) {
    indices[i * 3] = faces[i][0];
    indices[i * 3 + 1] = faces[i][1];
    indices[i * 3 + 2] = faces[i][2];
  }

  return {
    positions,
    indices,
    vertexCount: positions.length / 3,
    indexCount: indices.length,
  };
}

/**
 * Generate UV sphere geometry.
 * Good for textured spheres, less uniform distribution.
 */
export function createUVSphere(segments = 16, rings = 12): GeometryData {
  const positions: number[] = [];
  const indices: number[] = [];

  // Generate vertices
  for (let ring = 0; ring <= rings; ring++) {
    const phi = (ring / rings) * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let seg = 0; seg <= segments; seg++) {
      const theta = (seg / segments) * Math.PI * 2;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      positions.push(
        sinPhi * cosTheta,
        cosPhi,
        sinPhi * sinTheta
      );
    }
  }

  // Generate indices
  for (let ring = 0; ring < rings; ring++) {
    for (let seg = 0; seg < segments; seg++) {
      const curr = ring * (segments + 1) + seg;
      const next = curr + segments + 1;

      indices.push(curr, next, curr + 1);
      indices.push(curr + 1, next, next + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    indices: new Uint16Array(indices),
    vertexCount: positions.length / 3,
    indexCount: indices.length,
  };
}

/**
 * Generate low-poly cube geometry.
 * Fastest option, good for distant/small bubbles.
 */
export function createCube(): GeometryData {
  const positions = new Float32Array([
    // Front
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
    // Back
    -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
    // Top
    -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
    // Bottom
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
    // Right
     1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
    // Left
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1,
  ]);

  // Normalize to unit sphere-ish
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    const len = Math.sqrt(x * x + y * y + z * z);
    positions[i] = x / len;
    positions[i + 1] = y / len;
    positions[i + 2] = z / len;
  }

  const indices = new Uint16Array([
    0, 1, 2,   0, 2, 3,    // Front
    4, 5, 6,   4, 6, 7,    // Back
    8, 9, 10,  8, 10, 11,  // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23, // Left
  ]);

  return {
    positions,
    indices,
    vertexCount: 24,
    indexCount: 36,
  };
}

/**
 * Generate billboard quad (always faces camera).
 * Most efficient for large numbers of small points.
 */
export function createBillboardQuad(): GeometryData {
  const positions = new Float32Array([
    -1, -1, 0,
     1, -1, 0,
     1,  1, 0,
    -1,  1, 0,
  ]);

  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  return {
    positions,
    indices,
    vertexCount: 4,
    indexCount: 6,
  };
}
/**
 * Generate a standard AABB cube for voxels.
 */
export function createVoxelCube(): GeometryData {
  const positions = new Float32Array([
    // Front
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
    // Back
    -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
    // Top
    -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    // Bottom
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
    // Right
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
    // Left
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
  ]);

  const indices = new Uint16Array([
    0, 1, 2,   0, 2, 3,    // Front
    4, 5, 6,   4, 6, 7,    // Back
    8, 9, 10,  8, 10, 11,  // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23, // Left
  ]);

  return {
    positions,
    indices,
    vertexCount: 24,
    indexCount: 36,
  };
}
