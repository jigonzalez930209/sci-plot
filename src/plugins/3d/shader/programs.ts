/**
 * WebGL shader program compilation and management for 3D rendering.
 */

import {
  BUBBLE_VERT,
  BUBBLE_FRAG,
  BUBBLE_FLAT_FRAG,
  BUBBLE_VERT_WEBGL1,
  BUBBLE_FRAG_WEBGL1,
  AXIS_VERT,
  AXIS_FRAG,
  SURFACE_VERT,
  SURFACE_FRAG,
  LINE_POINT_VERT,
  LINE_POINT_FRAG,
  WATERFALL_VERT,
  WATERFALL_FRAG,
  VECTOR_FIELD_VERT,
  VECTOR_FIELD_FRAG,
  POINT_CLOUD_VERT,
  POINT_CLOUD_FRAG,
  VOXEL_VERT,
  VOXEL_FRAG,
  RIBBON_VERT,
  RIBBON_FRAG,
  SURFACE_BAR_VERT,
  SURFACE_BAR_FRAG,
} from './sources';

export interface ShaderProgram3D {
  program: WebGLProgram;
  attributes: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface ProgramBundle3D {
  bubbleProgram: ShaderProgram3D;
  bubbleFlatProgram: ShaderProgram3D;
  axisProgram: ShaderProgram3D;
  surfaceProgram: ShaderProgram3D;
  linePointProgram: ShaderProgram3D;
  waterfallProgram: ShaderProgram3D;
  vectorFieldProgram: ShaderProgram3D;
  pointCloudProgram: ShaderProgram3D;
  voxelProgram: ShaderProgram3D;
  ribbonProgram: ShaderProgram3D;
  surfaceBarProgram: ShaderProgram3D;
}

function createShader(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  source: string,
  type: number
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation error: ${error}`);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  vertSource: string,
  fragSource: string,
  attributeNames: string[],
  uniformNames: string[]
): ShaderProgram3D {
  const vertShader = createShader(gl, vertSource, gl.VERTEX_SHADER);
  const fragShader = createShader(gl, fragSource, gl.FRAGMENT_SHADER);

  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create program');

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${error}`);
  }

  gl.deleteShader(vertShader);
  gl.deleteShader(fragShader);

  const attributes: Record<string, number> = {};
  for (const name of attributeNames) {
    attributes[name] = gl.getAttribLocation(program, name);
  }

  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  return { program, attributes, uniforms };
}

export function createProgramBundle3D(
  gl: WebGL2RenderingContext,
  useWebGL1Fallback = false
): ProgramBundle3D {
  const bubbleAttribs = ['a_position', 'a_instancePos', 'a_scale', 'a_color'];
  const bubbleUniforms = ['u_viewProjection', 'u_opacity', 'u_lightDir', 'u_ambient'];

  const vertSource = useWebGL1Fallback ? BUBBLE_VERT_WEBGL1 : BUBBLE_VERT;
  const fragSource = useWebGL1Fallback ? BUBBLE_FRAG_WEBGL1 : BUBBLE_FRAG;

  const bubbleProgram = createProgram(
    gl,
    vertSource,
    fragSource,
    bubbleAttribs,
    bubbleUniforms
  );

  const bubbleFlatProgram = createProgram(
    gl,
    vertSource,
    useWebGL1Fallback ? BUBBLE_FRAG_WEBGL1 : BUBBLE_FLAT_FRAG,
    bubbleAttribs,
    ['u_viewProjection', 'u_opacity']
  );

  const axisProgram = createProgram(
    gl,
    AXIS_VERT,
    AXIS_FRAG,
    ['a_position', 'a_color'],
    ['u_viewProjection']
  );

  const surfaceProgram = createProgram(
    gl,
    SURFACE_VERT,
    SURFACE_FRAG,
    ['a_position', 'a_normal', 'a_color'],
    ['u_viewProjection', 'u_opacity', 'u_lightDir', 'u_ambient']
  );

  const linePointProgram = createProgram(
    gl,
    LINE_POINT_VERT,
    LINE_POINT_FRAG,
    ['a_position', 'a_color'],
    ['u_viewProjection', 'u_pointSize', 'u_opacity']
  );

  const waterfallProgram = createProgram(
    gl,
    WATERFALL_VERT,
    WATERFALL_FRAG,
    ['a_position', 'a_color', 'a_normal'],
    ['u_viewProjection', 'u_opacity', 'u_fadeStart', 'u_fadeEnd', 'u_lightDir', 'u_ambient']
  );

  const vectorFieldProgram = createProgram(
    gl,
    VECTOR_FIELD_VERT,
    VECTOR_FIELD_FRAG,
    ['a_position', 'a_normal', 'a_instancePos', 'a_direction', 'a_color'],
    ['u_viewProjection', 'u_opacity', 'u_scaleMultiplier', 'u_lightDir', 'u_ambient']
  );

  const pointCloudProgram = createProgram(
    gl,
    POINT_CLOUD_VERT,
    POINT_CLOUD_FRAG,
    ['a_position', 'a_color', 'a_size'],
    ['u_viewProjection', 'u_opacity', 'u_globalSize', 'u_circular']
  );

  const voxelProgram = createProgram(
    gl,
    VOXEL_VERT,
    VOXEL_FRAG,
    ['a_position', 'a_instancePos', 'a_value'],
    ['u_viewProjection', 'u_opacity', 'u_voxelSize', 'u_threshold', 'u_lightDir', 'u_ambient']
  );

  const ribbonProgram = createProgram(
    gl,
    RIBBON_VERT,
    RIBBON_FRAG,
    ['a_position', 'a_normal', 'a_color'],
    ['u_viewProjection', 'u_opacity', 'u_lightDir', 'u_ambient']
  );

  const surfaceBarProgram = createProgram(
    gl,
    SURFACE_BAR_VERT,
    SURFACE_BAR_FRAG,
    ['a_position', 'a_instancePos', 'a_height', 'a_color'],
    ['u_viewProjection', 'u_opacity', 'u_barWidth', 'u_barDepth', 'u_lightDir', 'u_ambient']
  );

  return {
    bubbleProgram,
    bubbleFlatProgram,
    axisProgram,
    surfaceProgram,
    linePointProgram,
    waterfallProgram,
    vectorFieldProgram,
    pointCloudProgram,
    voxelProgram,
    ribbonProgram,
    surfaceBarProgram,
  };
}

export function deleteProgram(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  program: ShaderProgram3D
): void {
  gl.deleteProgram(program.program);
}

export function deleteProgramBundle(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  bundle: ProgramBundle3D
): void {
  deleteProgram(gl, bundle.bubbleProgram);
  deleteProgram(gl, bundle.bubbleFlatProgram);
  deleteProgram(gl, bundle.axisProgram);
  deleteProgram(gl, bundle.surfaceProgram);
  deleteProgram(gl, bundle.linePointProgram);
  deleteProgram(gl, bundle.waterfallProgram);
  deleteProgram(gl, bundle.vectorFieldProgram);
  deleteProgram(gl, bundle.pointCloudProgram);
  deleteProgram(gl, bundle.voxelProgram);
  deleteProgram(gl, bundle.ribbonProgram);
  deleteProgram(gl, bundle.surfaceBarProgram);
}
