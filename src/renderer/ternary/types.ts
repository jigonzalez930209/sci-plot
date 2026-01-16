/**
 * @fileoverview Types for ternary plots
 * @module renderer/ternary/types
 */

/**
 * Ternary data structure (3 components that sum to 1)
 */
export interface TernaryData {
  /** Component A values (0-1) */
  a: number[];
  /** Component B values (0-1) */
  b: number[];
  /** Component C values (0-1) */
  c: number[];
}

/**
 * Ternary plot style options
 */
export interface TernaryStyle {
  /** Point size for scatter mode */
  pointSize?: number;
  /** Point color */
  color?: string;
  /** Fill opacity for regions */
  fillOpacity?: number;
  /** Grid line color */
  gridColor?: string;
  /** Grid line width */
  gridWidth?: number;
  /** Number of grid divisions */
  gridDivisions?: number;
}

/**
 * Ternary plot configuration
 */
export interface TernaryOptions {
  /** Label for component A (top vertex) */
  labelA?: string;
  /** Label for component B (bottom-left vertex) */
  labelB?: string;
  /** Label for component C (bottom-right vertex) */
  labelC?: string;
  /** Style options */
  style?: TernaryStyle;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show labels */
  showLabels?: boolean;
}

/**
 * Cartesian coordinates (result of ternary → cartesian conversion)
 */
export interface CartesianPoint {
  x: number;
  y: number;
}
