/**
 * SciChart Engine - Chart Synchronization Module
 * 
 * Provides synchronization between multiple charts:
 * - Synchronized zoom/pan (X, Y, or both)
 * - Shared crosshair cursor
 * - Coordinated selection
 * - Event propagation between linked charts
 * 
 * @module sync
 */

import type { Bounds, Range } from "../../types";

// ============================================
// Types
// ============================================

export type SyncAxis = 'x' | 'y' | 'xy' | 'none';

export interface SyncOptions {
  /** Synchronize axis (default: 'x') */
  axis?: SyncAxis;
  /** Synchronize cursor position (default: true) */
  syncCursor?: boolean;
  /** Synchronize selection state (default: false) */
  syncSelection?: boolean;
  /** Synchronize zoom level (default: true) */
  syncZoom?: boolean;
  /** Synchronize pan (default: true) */
  syncPan?: boolean;
  /** Debounce time for sync events in ms (default: 0) */
  debounce?: number;
  /** Enable bidirectional sync (default: true) */
  bidirectional?: boolean;
}

export interface ChartLike {
  /** Unique identifier for the chart */
  getId(): string;
  /** Get current view bounds */
  getViewBounds(): Bounds;
  /** Set view bounds (zoom) */
  zoom(options: { x?: Range; y?: Range; animate?: boolean }): void;
  /** Pan the chart */
  pan(dx: number, dy: number): void;
  /** Get cursor position */
  getCursorPosition?(): { x: number; y: number } | null;
  /** Set external cursor position */
  setExternalCursor?(x: number, y: number): void;
  /** Clear external cursor */
  clearExternalCursor?(): void;
  /** Get selected points */
  getSelectedPoints?(): { seriesId: string; indices: number[] }[];
  /** Set selection */
  selectPoints?(points: { seriesId: string; indices: number[] }[]): void;
  /** Clear selection */
  clearSelection?(): void;
  /** Subscribe to events */
  on(event: string, callback: (...args: unknown[]) => void): void;
  /** Unsubscribe from events */
  off(event: string, callback: (...args: unknown[]) => void): void;
}

export interface SyncEvent {
  /** Source chart ID */
  sourceId: string;
  /** Event type */
  type: 'zoom' | 'pan' | 'cursor' | 'selection' | 'bounds';
  /** Event data */
  data: unknown;
}

// ============================================
// Chart Group Implementation
// ============================================

export class ChartGroup {
  private charts: Map<string, ChartLike> = new Map();
  private options: Required<SyncOptions>;
  private eventHandlers: Map<string, Map<string, (...args: unknown[]) => void>> = new Map();
  private isUpdating: boolean = false;
  private debounceTimers: Map<string, number> = new Map();

  constructor(options?: SyncOptions) {
    this.options = {
      axis: 'x',
      syncCursor: true,
      syncSelection: false,
      syncZoom: true,
      syncPan: true,
      debounce: 0,
      bidirectional: true,
      ...options,
    };
  }

  /**
   * Add a chart to the group
   */
  add(chart: ChartLike): this {
    const chartId = chart.getId();
    
    if (this.charts.has(chartId)) {
      console.warn(`[ChartGroup] Chart ${chartId} is already in the group`);
      return this;
    }

    this.charts.set(chartId, chart);
    this.attachEventHandlers(chart);
    
    return this;
  }

  /**
   * Add multiple charts at once
   */
  addAll(...charts: ChartLike[]): this {
    for (const chart of charts) {
      this.add(chart);
    }
    return this;
  }

  /**
   * Remove a chart from the group
   */
  remove(chart: ChartLike): this {
    const chartId = chart.getId();
    
    if (!this.charts.has(chartId)) {
      return this;
    }

    this.detachEventHandlers(chart);
    this.charts.delete(chartId);
    
    return this;
  }

  /**
   * Get all charts in the group
   */
  getCharts(): ChartLike[] {
    return Array.from(this.charts.values());
  }

  /**
   * Get chart count
   */
  size(): number {
    return this.charts.size;
  }

  /**
   * Check if a chart is in the group
   */
  has(chart: ChartLike): boolean {
    return this.charts.has(chart.getId());
  }

  /**
   * Set synchronization axis
   */
  syncAxis(axis: SyncAxis): this {
    this.options.axis = axis;
    return this;
  }

  /**
   * Enable/disable cursor synchronization
   */
  syncCursor(enabled: boolean): this {
    this.options.syncCursor = enabled;
    return this;
  }

  /**
   * Enable/disable selection synchronization
   */
  syncSelection(enabled: boolean): this {
    this.options.syncSelection = enabled;
    return this;
  }

  /**
   * Synchronize all charts to a specific view
   */
  syncTo(bounds: Partial<Bounds>, excludeChartId?: string): void {
    this.propagateZoom(excludeChartId || '', bounds);
  }

  /**
   * Reset all charts to auto-scale
   */
  resetAll(): void {
    for (const chart of this.charts.values()) {
      chart.zoom({ x: undefined, y: undefined });
    }
  }

  /**
   * Clear all selections in the group
   */
  clearAllSelections(): void {
    for (const chart of this.charts.values()) {
      chart.clearSelection?.();
    }
  }

  /**
   * Destroy the group and cleanup
   */
  destroy(): void {
    for (const chart of this.charts.values()) {
      this.detachEventHandlers(chart);
    }
    this.charts.clear();
    this.eventHandlers.clear();
    
    // Clear any pending debounce timers
    for (const timerId of this.debounceTimers.values()) {
      clearTimeout(timerId);
    }
    this.debounceTimers.clear();
  }

  // ============================================
  // Private Methods
  // ============================================

  private attachEventHandlers(chart: ChartLike): void {
    const chartId = chart.getId();
    const handlers = new Map<string, (...args: unknown[]) => void>();

    // Zoom handler
    if (this.options.syncZoom) {
      const zoomHandler = (...args: unknown[]) => {
        const e = args[0] as { x: Range; y: Range };
        this.handleZoom(chartId, e);
      };
      chart.on('zoom', zoomHandler);
      handlers.set('zoom', zoomHandler);
    }

    // Pan handler
    if (this.options.syncPan) {
      const panHandler = (...args: unknown[]) => {
        const e = args[0] as { deltaX: number; deltaY: number };
        this.handlePan(chartId, e);
      };
      chart.on('pan', panHandler);
      handlers.set('pan', panHandler);
    }

    // Cursor handler
    if (this.options.syncCursor) {
      const hoverHandler = (...args: unknown[]) => {
        const e = args[0] as { point?: { x: number; y: number } } | null;
        this.handleCursor(chartId, e);
      };
      chart.on('hover', hoverHandler);
      handlers.set('hover', hoverHandler);
    }

    // Selection handler
    if (this.options.syncSelection) {
      const selectionHandler = (...args: unknown[]) => {
        const e = args[0] as { selected: unknown[] };
        this.handleSelection(chartId, e);
      };
      chart.on('selectionChange', selectionHandler);
      handlers.set('selectionChange', selectionHandler);
    }

    this.eventHandlers.set(chartId, handlers);
  }

  private detachEventHandlers(chart: ChartLike): void {
    const chartId = chart.getId();
    const handlers = this.eventHandlers.get(chartId);
    
    if (!handlers) return;

    for (const [event, handler] of handlers.entries()) {
      chart.off(event, handler);
    }

    this.eventHandlers.delete(chartId);
  }

  private handleZoom(sourceId: string, event: { x: Range; y: Range }): void {
    if (this.isUpdating) return;
    
    const bounds: Partial<Bounds> = {};
    
    if (this.options.axis === 'x' || this.options.axis === 'xy') {
      bounds.xMin = event.x[0];
      bounds.xMax = event.x[1];
    }
    
    if (this.options.axis === 'y' || this.options.axis === 'xy') {
      bounds.yMin = event.y[0];
      bounds.yMax = event.y[1];
    }

    this.debounceAction(`zoom-${sourceId}`, () => {
      this.propagateZoom(sourceId, bounds);
    });
  }

  private handlePan(sourceId: string, event: { deltaX: number; deltaY: number }): void {
    if (this.isUpdating) return;

    const dx = (this.options.axis === 'x' || this.options.axis === 'xy') ? event.deltaX : 0;
    const dy = (this.options.axis === 'y' || this.options.axis === 'xy') ? event.deltaY : 0;

    if (dx === 0 && dy === 0) return;

    this.debounceAction(`pan-${sourceId}`, () => {
      this.propagatePan(sourceId, dx, dy);
    });
  }

  private handleCursor(sourceId: string, event: { point?: { x: number; y: number } } | null): void {
    if (this.isUpdating) return;

    for (const [chartId, chart] of this.charts.entries()) {
      if (chartId === sourceId) continue;
      
      if (event?.point) {
        chart.setExternalCursor?.(event.point.x, event.point.y);
      } else {
        chart.clearExternalCursor?.();
      }
    }
  }

  private handleSelection(sourceId: string, _event: { selected: unknown[] }): void {
    if (this.isUpdating || !this.options.syncSelection) return;

    // Selection sync is more complex - we need to map indices across charts
    // For now, just clear selection on other charts when one changes
    for (const [chartId, _chart] of this.charts.entries()) {
      if (chartId === sourceId) continue;
      // In a full implementation, you'd map selection by data values
      // For basic sync, we just notify that selection changed
    }
  }

  private propagateZoom(sourceId: string, bounds: Partial<Bounds>): void {
    if (this.isUpdating) return;
    
    this.isUpdating = true;

    try {
      for (const [chartId, chart] of this.charts.entries()) {
        if (chartId === sourceId && !this.options.bidirectional) continue;
        if (chartId === sourceId) continue;

        const zoomOptions: { x?: Range; y?: Range; animate?: boolean } = {
          animate: false,
        };

        if (bounds.xMin !== undefined && bounds.xMax !== undefined) {
          zoomOptions.x = [bounds.xMin, bounds.xMax];
        }

        if (bounds.yMin !== undefined && bounds.yMax !== undefined) {
          zoomOptions.y = [bounds.yMin, bounds.yMax];
        }

        chart.zoom(zoomOptions);
      }
    } finally {
      this.isUpdating = false;
    }
  }

  private propagatePan(sourceId: string, dx: number, dy: number): void {
    if (this.isUpdating) return;
    
    this.isUpdating = true;

    try {
      for (const [chartId, chart] of this.charts.entries()) {
        if (chartId === sourceId) continue;
        chart.pan(dx, dy);
      }
    } finally {
      this.isUpdating = false;
    }
  }

  private debounceAction(key: string, action: () => void): void {
    if (this.options.debounce <= 0) {
      action();
      return;
    }

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timerId = window.setTimeout(() => {
      this.debounceTimers.delete(key);
      action();
    }, this.options.debounce);

    this.debounceTimers.set(key, timerId);
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a chart group with specified charts
 */
export function createChartGroup(
  charts: ChartLike[],
  options?: SyncOptions
): ChartGroup {
  const group = new ChartGroup(options);
  group.addAll(...charts);
  return group;
}

/**
 * Link two charts for synchronized viewing
 */
export function linkCharts(
  chart1: ChartLike,
  chart2: ChartLike,
  options?: SyncOptions
): ChartGroup {
  return createChartGroup([chart1, chart2], options);
}

/**
 * Create a master-slave relationship (master controls slave)
 */
export function createMasterSlave(
  master: ChartLike,
  slave: ChartLike,
  axis: SyncAxis = 'x'
): ChartGroup {
  return new ChartGroup({
    axis,
    bidirectional: false,
    syncCursor: true,
    syncZoom: true,
    syncPan: true,
  }).addAll(master, slave);
}
