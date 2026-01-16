/**
 * @fileoverview Types for Broken Axis plugin
 * @module plugins/broken-axis/types
 */

export type AxisBreakSymbol = "diagonal" | "zigzag" | "wave" | "simple";

export interface AxisBreak {
  /** Start value of the break in data units */
  start: number;
  /** End value of the break in data units */
  end: number;
  /** 
   * Ratio of the plot area this break should take (0-1).
   * Usually small (e.g., 0.02 for 2% of the axis length).
   * Default is 0.02.
   */
  visualRatio?: number;
  /** Visual symbol to draw at the break */
  symbol?: AxisBreakSymbol;
}

export interface BrokenAxisOptions {
  /** Array of breaks defined for the axis */
  breaks: AxisBreak[];
  /** Default symbol for all breaks in this axis if not specified */
  defaultSymbol?: AxisBreakSymbol;
  /** Color of the break symbols (defaults to axis color) */
  symbolColor?: string;
  /** Size of the symbol in pixels (width/height depending on orientation) */
  symbolSize?: number;
}

export interface PluginBrokenAxisConfig {
  /** Enable broken axes (default: true) */
  enabled?: boolean;
  /** 
   * Mapping of axis ID to its broken axis configuration.
   * Use 'default' for the main X axis.
   */
  axes: Record<string, BrokenAxisOptions>;
}

export interface BrokenAxisAPI {
  /** Add a break to an axis */
  addBreak(axisId: string, axisBreak: AxisBreak): void;
  /** Remove all breaks from an axis */
  clearBreaks(axisId: string): void;
  /** Enable/disable the plugin */
  setEnabled(enabled: boolean): void;
  /** Get current breaks for an axis */
  getBreaks(axisId: string): AxisBreak[];
  /** Update configuration */
  updateConfig(config: Partial<PluginBrokenAxisConfig>): void;
}
