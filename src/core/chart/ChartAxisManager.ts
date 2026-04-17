/**
 * ChartAxisManager - Manages multiple Y-axes and X-axis configuration
 * 
 * Handles adding, removing, and updating axes dynamically.
 */

import { LinearScale, LogScale, type Scale } from "../../scales";
import type { AxisOptions } from "../../types";
import type { Series } from "../Series";

export interface AxisManagerContext {
  xAxisOptions: AxisOptions;
  xScale: Scale;
  yAxisOptionsMap: Map<string, AxisOptions>;
  yScales: Map<string, Scale>;
  primaryYAxisId: string;
  series: Map<string, Series>;
  requestRender: () => void;
}

export class ChartAxisManager {
  constructor(private ctx: AxisManagerContext) {}

  /**
   * Add a new Y axis dynamically
   */
  addYAxis(options: AxisOptions): string {
    const existingIds = Array.from(this.ctx.yAxisOptionsMap.keys());
    const id = options.id || `y${existingIds.length}`;

    if (this.ctx.yAxisOptionsMap.has(id)) {
      console.warn(`[SciPlot] Y axis with id '${id}' already exists`);
      return id;
    }

    const position = options.position || "right";
    const fullOptions: AxisOptions = {
      scale: "linear",
      auto: true,
      position,
      ...options,
      id,
    };

    this.ctx.yAxisOptionsMap.set(id, fullOptions);

    // Create scale for this axis
    const scale =
      fullOptions.scale === "log" ? new LogScale() : new LinearScale();
    this.ctx.yScales.set(id, scale);

    this.ctx.requestRender();
    return id;
  }

  /**
   * Remove a Y axis by ID
   */
  removeYAxis(id: string): boolean {
    if (id === this.ctx.primaryYAxisId) {
      console.warn(`[SciPlot] Cannot remove primary Y axis '${id}'`);
      return false;
    }

    if (!this.ctx.yAxisOptionsMap.has(id)) {
      return false;
    }

    this.ctx.yAxisOptionsMap.delete(id);
    this.ctx.yScales.delete(id);

    // Update any series using this axis
    this.ctx.series.forEach((s) => {
      if (s.getYAxisId() === id) {
        // Move to primary axis
        s.setYAxisId(this.ctx.primaryYAxisId);
      }
    });

    this.ctx.requestRender();
    return true;
  }

  /**
   * Update Y axis configuration
   */
  updateYAxis(id: string, options: Partial<AxisOptions>): void {
    const existing = this.ctx.yAxisOptionsMap.get(id);
    if (!existing) {
      console.warn(`[SciPlot] Y axis '${id}' not found`);
      return;
    }

    const updated: AxisOptions = { ...existing, ...options, id };
    this.ctx.yAxisOptionsMap.set(id, updated);

    // Update scale if scale type changed
    if (options.scale && options.scale !== existing.scale) {
      const newScale =
        options.scale === "log" ? new LogScale() : new LinearScale();
      const oldScale = this.ctx.yScales.get(id);
      if (oldScale) {
        newScale.setDomain(oldScale.domain[0], oldScale.domain[1]);
      }
      this.ctx.yScales.set(id, newScale);
    }

    this.ctx.requestRender();
  }

  /**
   * Update X axis configuration
   */
  updateXAxis(options: Partial<AxisOptions>): void {
    const previousScale = this.ctx.xAxisOptions.scale;
    Object.assign(this.ctx.xAxisOptions, options);

    // Update scale if scale type changed
    if (options.scale && options.scale !== previousScale) {
      const newScale =
        options.scale === "log" ? new LogScale() : new LinearScale();
      newScale.setDomain(this.ctx.xScale.domain[0], this.ctx.xScale.domain[1]);
      Object.setPrototypeOf(this.ctx.xScale, Object.getPrototypeOf(newScale));
      Object.assign(this.ctx.xScale, newScale);
    }

    this.ctx.requestRender();
  }

  /**
   * Get Y axis configuration by ID
   */
  getYAxis(id: string): AxisOptions | undefined {
    return this.ctx.yAxisOptionsMap.get(id);
  }

  /**
   * Get all Y axes configurations
   */
  getAllYAxes(): AxisOptions[] {
    return Array.from(this.ctx.yAxisOptionsMap.values());
  }

  /**
   * Get the primary Y axis ID
   */
  getPrimaryYAxisId(): string {
    return this.ctx.primaryYAxisId;
  }

  /**
   * Get X axis configuration
   */
  getXAxis(): AxisOptions {
    return this.ctx.xAxisOptions;
  }

  /**
   * Get X scale
   */
  getXScale(): Scale {
    return this.ctx.xScale;
  }

  /**
   * Get Y scale by axis ID
   */
  getYScale(axisId?: string): Scale | undefined {
    const id = axisId || this.ctx.primaryYAxisId;
    return this.ctx.yScales.get(id);
  }

  /**
   * Get all Y scales
   */
  getAllYScales(): Map<string, Scale> {
    return this.ctx.yScales;
  }
}
