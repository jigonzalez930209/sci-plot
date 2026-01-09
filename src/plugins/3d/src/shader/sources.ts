/**
 * GLSL shader sources for 3D instanced rendering.
 * WebGL2 / GLSL ES 3.00
 */

export const BUBBLE_VERT = `#version 300 es
precision highp float;

// Base geometry vertex
in vec3 a_position;

// Per-instance attributes
in vec3 a_instancePos;
in float a_scale;
in vec3 a_color;

// Uniforms
uniform mat4 u_viewProjection;
uniform float u_opacity;

// Varyings
out vec3 v_color;
out vec3 v_normal;
out vec3 v_worldPos;

void main() {
  // Scale and translate instance
  vec3 worldPos = (a_position * a_scale) + a_instancePos;
  
  gl_Position = u_viewProjection * vec4(worldPos, 1.0);
  
  v_color = a_color;
  v_normal = normalize(a_position); // For sphere, normal = normalized position
  v_worldPos = worldPos;
}
`;

export const BUBBLE_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
in vec3 v_normal;
in vec3 v_worldPos;

uniform float u_opacity;
uniform vec3 u_lightDir;
uniform float u_ambient;

out vec4 fragColor;

void main() {
  // Simple diffuse lighting
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  
  float diff = max(dot(normal, lightDir), 0.0);
  float lighting = u_ambient + (1.0 - u_ambient) * diff;
  
  vec3 color = v_color * lighting;
  fragColor = vec4(color, u_opacity);
}
`;

export const BUBBLE_FLAT_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
in vec3 v_normal;
in vec3 v_worldPos;

uniform float u_opacity;

out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, u_opacity);
}
`;

// WebGL1 fallback shaders (GLSL ES 1.00)
export const BUBBLE_VERT_WEBGL1 = `
precision highp float;

// Base geometry vertex
attribute vec3 a_position;

// Per-instance attributes
attribute vec3 a_instancePos;
attribute float a_scale;
attribute vec3 a_color;

// Uniforms
uniform mat4 u_viewProjection;
uniform float u_opacity;

// Varyings
varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_worldPos;

void main() {
  vec3 worldPos = (a_position * a_scale) + a_instancePos;
  
  gl_Position = u_viewProjection * vec4(worldPos, 1.0);
  
  v_color = a_color;
  v_normal = normalize(a_position);
  v_worldPos = worldPos;
}
`;

export const BUBBLE_FRAG_WEBGL1 = `
precision highp float;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_worldPos;

uniform float u_opacity;
uniform vec3 u_lightDir;
uniform float u_ambient;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  
  float diff = max(dot(normal, lightDir), 0.0);
  float lighting = u_ambient + (1.0 - u_ambient) * diff;
  
  vec3 color = v_color * lighting;
  gl_FragColor = vec4(color, u_opacity);
}
`;

// Axis/grid shaders
export const AXIS_VERT = `#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_color;

uniform mat4 u_viewProjection;

out vec3 v_color;

void main() {
  gl_Position = u_viewProjection * vec4(a_position, 1.0);
  v_color = a_color;
}
`;

export const AXIS_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 1.0);
}
`;

// Surface mesh shader with lighting
export const SURFACE_VERT = `#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_normal;
in vec3 a_color;

uniform mat4 u_viewProjection;

out vec3 v_color;
out vec3 v_normal;
out vec3 v_worldPos;

void main() {
  gl_Position = u_viewProjection * vec4(a_position, 1.0);
  v_color = a_color;
  v_normal = a_normal;
  v_worldPos = a_position;
}
`;

export const SURFACE_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
in vec3 v_normal;
in vec3 v_worldPos;

uniform float u_opacity;
uniform vec3 u_lightDir;
uniform float u_ambient;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  
  float diff = max(dot(normal, lightDir), 0.0);
  float lighting = u_ambient + (1.0 - u_ambient) * diff;
  
  vec3 color = v_color * lighting;
  fragColor = vec4(color, u_opacity);
}
`;

// Line/point shader for PointLine3D, Impulse3D
export const LINE_POINT_VERT = `#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_color;

uniform mat4 u_viewProjection;
uniform float u_pointSize;

out vec3 v_color;

void main() {
  gl_Position = u_viewProjection * vec4(a_position, 1.0);
  gl_PointSize = u_pointSize;
  v_color = a_color;
}
`;

export const LINE_POINT_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
uniform float u_opacity;

out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, u_opacity);
}
`;

// Waterfall shader with gradient coloring and lighting
export const WATERFALL_VERT = `#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;

uniform mat4 u_viewProjection;

out vec3 v_color;
out float v_depth;
out vec3 v_normal;

void main() {
  gl_Position = u_viewProjection * vec4(a_position, 1.0);
  v_color = a_color;
  v_depth = a_position.z;
  v_normal = a_normal;
}
`;

export const WATERFALL_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
in float v_depth;
in vec3 v_normal;

uniform float u_opacity;
uniform float u_fadeStart;
uniform float u_fadeEnd;
uniform vec3 u_lightDir;
uniform float u_ambient;

out vec4 fragColor;

void main() {
  // Lighting
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  float diff = max(dot(normal, lightDir), 0.0);
  float lighting = u_ambient + (1.0 - u_ambient) * diff;
  
  // Fade based on depth (Z position)
  float fade = 1.0;
  if (u_fadeEnd > u_fadeStart) {
    fade = 1.0 - smoothstep(u_fadeStart, u_fadeEnd, v_depth);
  }
  
  fragColor = vec4(v_color * lighting, u_opacity * fade);
}
`;
// Vector Field shader for Quiver plots
export const VECTOR_FIELD_VERT = `#version 300 es
precision highp float;

in vec3 a_position;    // Base geometry (e.g., arrow)
in vec3 a_instancePos; // Origin of the vector
in vec3 a_direction;   // Direction vector [dx, dy, dz]
in vec3 a_color;
in vec3 a_normal;

uniform mat4 u_viewProjection;
uniform float u_scaleMultiplier;

out vec3 v_color;
out vec3 v_normal;

void main() {
  float mag = length(a_direction);
  vec3 dir = normalize(a_direction);
  
  // Construct rotation matrix to align with direction
  vec3 up = abs(dir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 right = normalize(cross(up, dir));
  vec3 actualUp = cross(dir, right);
  mat3 rotation = mat3(right, actualUp, dir);
  
  v_normal = rotation * a_normal;
  
  // Scale based on magnitude
  vec3 scaledPos = a_position * mag * u_scaleMultiplier;
  
  // Rotate and translate
  vec3 worldPos = (rotation * scaledPos) + a_instancePos;
  
  gl_Position = u_viewProjection * vec4(worldPos, 1.0);
  v_color = a_color;
}
`;

export const VECTOR_FIELD_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
in vec3 v_normal;
uniform float u_opacity;
uniform vec3 u_lightDir;
uniform float u_ambient;
out vec4 fragColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  float diff = max(dot(normal, lightDir), 0.0);
  float lighting = u_ambient + (1.0 - u_ambient) * diff;
  fragColor = vec4(v_color * lighting, u_opacity);
}
`;
// Point Cloud shader for massive datasets
export const POINT_CLOUD_VERT = `#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_color;
in float a_size;

uniform mat4 u_viewProjection;
uniform float u_globalSize;

out vec3 v_color;

void main() {
  gl_Position = u_viewProjection * vec4(a_position, 1.0);
  gl_PointSize = a_size * u_globalSize;
  v_color = a_color;
  
  // Basic depth attenuation (points get smaller with distance)
  gl_PointSize /= gl_Position.w * 0.5;
}
`;

export const POINT_CLOUD_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
uniform float u_opacity;
uniform bool u_circular;

out vec4 fragColor;

void main() {
  if (u_circular) {
    vec2 dist = gl_PointCoord - vec2(0.5);
    if (dot(dist, dist) > 0.25) discard;
  }
  
  fragColor = vec4(v_color, u_opacity);
}
`;
// Voxel shader for volumetric data
export const VOXEL_VERT = `#version 300 es
precision highp float;

in vec3 a_position;    // Base cube vertex
in vec3 a_instancePos; // Voxel center
in float a_value;      // Voxel intensity [0, 1]

uniform mat4 u_viewProjection;
uniform float u_voxelSize;
uniform float u_threshold;

out float v_value;
out vec3 v_normal;

void main() {
  if (a_value < u_threshold) {
    // Hide voxel if below threshold
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  
  vec3 worldPos = (a_position * u_voxelSize) + a_instancePos;
  gl_Position = u_viewProjection * vec4(worldPos, 1.0);
  v_value = a_value;
  v_normal = normalize(a_position);
}
`;

export const VOXEL_FRAG = `#version 300 es
precision highp float;

in float v_value;
in vec3 v_normal;

uniform float u_opacity;
uniform vec3 u_lightDir;
uniform float u_ambient;

out vec4 fragColor;

// Simple heatmap coloring
vec3 heatmap(float t) {
    return vec3(t, 1.0 - t, 0.5 + sin(t * 3.14159) * 0.5);
}

void main() {
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  float diff = max(dot(normal, lightDir), 0.0);
  float lighting = u_ambient + (1.0 - u_ambient) * diff;
  
  // Spectral colormap
  vec3 color = vec3(v_value, 0.2, 1.0 - v_value);
  if (v_value > 0.5) color = vec3(1.0, 1.0 - (v_value-0.5)*2.0, 0.0);
  
  fragColor = vec4(color * lighting, u_opacity * v_value);
}
`;
// Ribbon shader for 3D paths with width
export const RIBBON_VERT = `#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_normal;
in vec3 a_color;

uniform mat4 u_viewProjection;

out vec3 v_color;
out vec3 v_normal;

void main() {
  gl_Position = u_viewProjection * vec4(a_position, 1.0);
  v_color = a_color;
  v_normal = a_normal;
}
`;

export const RIBBON_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
in vec3 v_normal;

uniform float u_opacity;
uniform vec3 u_lightDir;
uniform float u_ambient;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  float diff = max(dot(normal, lightDir), 0.0);
  float lighting = u_ambient + (1.0 - u_ambient) * diff;
  fragColor = vec4(v_color * lighting, u_opacity);
}
`;
// Surface Bar (3D Histogram) shader
export const SURFACE_BAR_VERT = `#version 300 es
precision highp float;

in vec3 a_position;    // Base cube vertex [-0.5, 0.5]
in vec3 a_instancePos; // Column base
in float a_height;     // Column height
in vec3 a_color;

uniform mat4 u_viewProjection;
uniform float u_barWidth;
uniform float u_barDepth;

out vec3 v_color;
out vec3 v_normal;

void main() {
  vec3 pos = a_position;
  pos.x *= u_barWidth;
  pos.z *= u_barDepth;
  pos.y = (pos.y + 0.5) * a_height; 
  
  vec3 worldPos = pos + a_instancePos;
  gl_Position = u_viewProjection * vec4(worldPos, 1.0);
  
  v_color = a_color;
  // Normals for a cube are essentially the vertex positions normalized if centered at 0
  // But since we offset Y, we just use the original sign for flat shading or simple lighting
  v_normal = normalize(a_position);
}
`;

export const SURFACE_BAR_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
in vec3 v_normal;

uniform float u_opacity;
uniform vec3 u_lightDir;
uniform float u_ambient;

out vec4 fragColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightDir);
  float diff = max(dot(normal, lightDir), 0.0);
  float lighting = u_ambient + (1.0 - u_ambient) * diff;
  fragColor = vec4(v_color * lighting, u_opacity);
}
`;
