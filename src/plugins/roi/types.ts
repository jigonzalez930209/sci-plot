/**
 * @fileoverview Types for ROI (Region of Interest) plugin
 * @module plugins/roi/types
 */

export type RoiTool = "rectangle" | "polygon" | "lasso" | "circle";

export interface RoiPoint {
  x: number;
  y: number;
}

export interface RoiRegion {
  id: string;
  tool: RoiTool;
  points: RoiPoint[];
  createdAt: number;
}

export interface RoiMaskResult {
  seriesId: string;
  indices: number[];
}

export interface PluginRoiConfig {
  /** Enable ROI tools (default: true) */
  enabled?: boolean;
  /** Active tools (default: all) */
  tools?: RoiTool[];
  /** Active tool for creation (default: rectangle) */
  defaultTool?: RoiTool;
  /** Whether to mask (filter) data outside ROI (default: false) */
  mask?: boolean;
  /** Persistent regions (default: true) */
  persistent?: boolean;
  /** Allow additive selection (default: true) */
  additive?: boolean;
  /** Stroke color (default: theme accent) */
  stroke?: string;
  /** Fill color (default: rgba(0, 242, 255, 0.15)) */
  fill?: string;
  /** Line width (default: 1.5) */
  lineWidth?: number;
  /** Debug logging (default: false) */
  debug?: boolean;
}

export interface RoiEvent {
  region: RoiRegion;
  seriesIds: string[];
}

export interface RoiSelectedEvent extends RoiEvent {
  masks: RoiMaskResult[];
}

export interface RoiAPI {
  setTool(tool: RoiTool): void;
  getTool(): RoiTool;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  clear(): void;
  getRegions(): RoiRegion[];
  selectRegion(id: string): RoiMaskResult[];
  maskSeries(seriesId: string, indices: number[]): void;
  updateConfig(config: Partial<PluginRoiConfig>): void;
}
