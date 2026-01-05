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

// Waterfall shader with gradient coloring
export const WATERFALL_VERT = `#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_color;

uniform mat4 u_viewProjection;

out vec3 v_color;
out float v_depth;

void main() {
  gl_Position = u_viewProjection * vec4(a_position, 1.0);
  v_color = a_color;
  v_depth = a_position.z;
}
`;

export const WATERFALL_FRAG = `#version 300 es
precision highp float;

in vec3 v_color;
in float v_depth;

uniform float u_opacity;
uniform float u_fadeStart;
uniform float u_fadeEnd;

out vec4 fragColor;

void main() {
  // Fade based on depth (Z position)
  float fade = 1.0;
  if (u_fadeEnd > u_fadeStart) {
    fade = 1.0 - smoothstep(u_fadeStart, u_fadeEnd, v_depth);
  }
  
  fragColor = vec4(v_color, u_opacity * fade);
}
`;
