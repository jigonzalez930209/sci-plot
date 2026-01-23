/**
 * @fileoverview Types for the LaTeX rendering plugin
 * @module plugins/latex/types
 */

/**
 * Configuration for the LaTeX plugin
 */
export interface PluginLaTeXConfig {
  /**
   * Default font size for LaTeX text (in pixels)
   * @default 14
   */
  fontSize?: number;

  /**
   * Default font family
   * @default 'serif'
   */
  fontFamily?: string;

  /**
   * Default text color
   * @default '#000000'
   */
  color?: string;

  /**
   * Enable caching of rendered LaTeX
   * @default true
   */
  enableCache?: boolean;

  /**
   * Custom symbol mappings
   */
  customSymbols?: Record<string, string>;
}

/**
 * LaTeX node types in the abstract syntax tree
 */
export type LaTeXNodeType =
  | 'text'
  | 'textgroup'
  | 'superscript'
  | 'subscript'
  | 'fraction'
  | 'sqrt'
  | 'symbol'
  | 'operator'
  | 'group';

/**
 * Base LaTeX node in the AST
 */
export interface LaTeXNode {
  type: LaTeXNodeType;
  content?: string;
  children?: LaTeXNode[];
  numerator?: LaTeXNode[];
  denominator?: LaTeXNode[];
}

/**
 * Rendering context for LaTeX
 */
export interface LaTeXRenderContext {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  scale: number;
}

/**
 * Measured dimensions of rendered LaTeX
 */
export interface LaTeXDimensions {
  width: number;
  height: number;
  baseline: number;
}

/**
 * API exposed by the LaTeX plugin
 */
export interface LaTeXPluginAPI {
  /**
   * Render LaTeX string to canvas at specified position
   */
  render(
    latex: string,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    options?: Partial<PluginLaTeXConfig>
  ): LaTeXDimensions;

  /**
   * Measure LaTeX string dimensions without rendering
   */
  measure(latex: string, options?: Partial<PluginLaTeXConfig>): LaTeXDimensions;

  /**
   * Clear the rendering cache
   */
  clearCache(): void;

  /**
   * Index signature for compatibility
   */
  [key: string]: any;
}
