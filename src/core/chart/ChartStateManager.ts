/**
 * ChartStateManager - Handles serialization, deserialization, and state persistence
 * 
 * Manages chart state export/import, URL hash conversion, and plugin data persistence.
 */

import type { Annotation } from "../annotations";
import type { Series } from "../Series";
import type { AxisOptions } from "../../types";
import type { Scale } from "../../scales";
import type { PluginManagerImpl } from "../../plugins";
import {
  SERIALIZATION_VERSION,
  encodeFloat32Array,
  decodeFloat32Array,
  stateToUrlHash,
  urlHashToState,
  type ChartState,
  type SerializeOptions,
  type DeserializeOptions,
} from "../../serialization";

export interface StateManagerContext {
  viewBounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  xAxisOptions: AxisOptions;
  xScale: Scale;
  yScales: Map<string, Scale>;
  primaryYAxisId: string;
  series: Map<string, Series>;
  pluginManager: PluginManagerImpl;
  showLegend: boolean;
  showControls: boolean;
  showStatistics: boolean;
  autoScroll: boolean;
  
  // Methods needed
  getAnnotations: () => Annotation[];
  clearAnnotations: () => void;
  addAnnotation: (annotation: Annotation) => void;
  updateYAxis: (id: string, options: Partial<AxisOptions>) => void;
  removeSeries: (id: string) => void;
  addSeries: (options: any) => void;
  requestRender: () => void;
}

export class ChartStateManager {
  constructor(private ctx: StateManagerContext) {}

  /**
   * Export complete chart state
   */
  serialize(options: SerializeOptions = {}): ChartState {
    const { includeData = true, includeAnnotations = true } = options;

    const state: ChartState = {
      version: SERIALIZATION_VERSION,
      timestamp: Date.now(),
      viewBounds: { ...this.ctx.viewBounds },
      xAxis: {
        id: "primary-x",
        position: this.ctx.xAxisOptions.position,
        label: this.ctx.xAxisOptions.label,
        scale: this.ctx.xScale.type,
        min: this.ctx.xScale.domain[0],
        max: this.ctx.xScale.domain[1],
        auto:
          (this.ctx.xScale as any).auto !== undefined
            ? (this.ctx.xScale as any).auto
            : true,
      },
      yAxes: Array.from(this.ctx.yScales.values()).map((s: any) => ({
        id: s.id || "y",
        position: s.position || "left",
        label: s.label || "",
        scale: s.type,
        min: s.domain[0],
        max: s.domain[1],
        auto: s.auto !== undefined ? s.auto : true,
      })),
      primaryYAxisId: this.ctx.primaryYAxisId,
      series: Array.from(this.ctx.series.values()).map((s) => ({
        id: s.getId(),
        name: s.getName(),
        type: s.getType(),
        yAxisId: s.getYAxisId(),
        style: s.getStyle(),
        visible: s.isVisible(),
        data: includeData
          ? {
              x: encodeFloat32Array(s.getData().x),
              y: encodeFloat32Array(s.getData().y),
            }
          : { x: "", y: "" },
      })),
      annotations: includeAnnotations ? this.ctx.getAnnotations() : [],
      options: {
        showLegend: this.ctx.showLegend,
        showControls: this.ctx.showControls,
        showStatistics: this.ctx.showStatistics,
        autoScroll: this.ctx.autoScroll,
      },
      plugins: this.ctx.pluginManager.collectSerializationData(),
    };

    return state;
  }

  /**
   * Restore chart from saved state
   */
  deserialize(state: ChartState, options: DeserializeOptions = {}): void {
    const { skipData = false, skipAnnotations = false } = options;

    // Restore view/axis settings
    this.ctx.viewBounds = { ...state.viewBounds };
    this.ctx.primaryYAxisId = state.primaryYAxisId;

    // Restore Y axes
    state.yAxes.forEach((ax) => {
      this.ctx.updateYAxis(ax.id, {
        label: ax.label,
        scale: ax.scale,
        min: ax.min,
        max: ax.max,
        auto: ax.auto,
      });
    });

    // Restore series
    if (!skipData) {
      // Clear existing first
      const seriesIds = Array.from(this.ctx.series.keys());
      seriesIds.forEach((id) => this.ctx.removeSeries(id));

      state.series.forEach((s) => {
        this.ctx.addSeries({
          id: s.id,
          name: s.name,
          type: s.type,
          yAxisId: s.yAxisId,
          data: {
            x: decodeFloat32Array(s.data.x),
            y: decodeFloat32Array(s.data.y),
          },
          style: s.style as any,
        });
      });
    }

    // Restore annotations
    if (!skipAnnotations && state.annotations) {
      this.ctx.clearAnnotations();
      state.annotations.forEach((a) => this.ctx.addAnnotation(a));
    }

    // Restore UI options
    if (state.options) {
      this.ctx.showLegend = state.options.showLegend ?? this.ctx.showLegend;
      this.ctx.showControls = state.options.showControls ?? this.ctx.showControls;
      this.ctx.showStatistics =
        state.options.showStatistics ?? this.ctx.showStatistics;
      this.ctx.autoScroll = state.options.autoScroll ?? this.ctx.autoScroll;
    }

    // Restore plugin data
    if (state.plugins) {
      this.ctx.pluginManager.restoreSerializationData(state.plugins);
    }

    this.ctx.requestRender();
  }

  /**
   * Convert current state to URL-safe hash
   */
  toUrlHash(compress: boolean = true): string {
    return stateToUrlHash(this.serialize({ includeData: true }), compress);
  }

  /**
   * Load state from URL hash
   */
  fromUrlHash(hash: string, compressed: boolean = true): void {
    const state = urlHashToState(hash, compressed);
    if (state) {
      this.deserialize(state);
    }
  }
}
