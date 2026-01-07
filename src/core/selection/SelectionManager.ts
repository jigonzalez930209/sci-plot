/**
 * SelectionManager - Advanced hit-testing and point selection
 * 
 * Provides:
 * - Hit-testing for data points
 * - Single and multi-selection (Ctrl+click)
 * - Box selection (drag rectangle)
 * - Visual highlighting of selected points
 * - Events for selection changes
 */

import type { Bounds, PlotArea } from "../../types";
import type { Scale } from "../../scales";
import type { Series } from "../series/Series";
import type { EventEmitter } from "../EventEmitter";

// ============================================
// Selection Types
// ============================================

/** Represents a single selected data point */
export interface SelectedPoint {
  seriesId: string;
  index: number;
  x: number;
  y: number;
}

/** Selection mode for multi-select operations */
export type SelectionMode = 'single' | 'add' | 'remove' | 'toggle';

/** Event data for point selection changes */
export interface PointSelectEvent {
  points: SelectedPoint[];
  mode: SelectionMode;
  source: 'click' | 'box' | 'api';
}

/** Event data for region/box selection */
export interface RegionSelectEvent {
  bounds: Bounds;
  containedPoints: SelectedPoint[];
}

/** Selection event map */
export interface SelectionEventMap {
  pointSelect: PointSelectEvent;
  regionSelect: RegionSelectEvent;
  selectionChange: { selected: SelectedPoint[]; previous: SelectedPoint[] };
  selectionClear: undefined;
}

/** Hit-test result for a single point */
export interface HitTestResult {
  seriesId: string;
  index: number;
  x: number;
  y: number;
  distance: number;
  pixelX: number;
  pixelY: number;
}

/** Selection manager configuration */
export interface SelectionConfig {
  /** Enable selection (default: true) */
  enabled?: boolean;
  /** Maximum distance in pixels for hit-testing (default: 20) */
  hitRadius?: number;
  /** Allow multi-selection with Ctrl+click (default: true) */
  multiSelect?: boolean;
  /** Enable box selection with Shift+drag (default: true) */
  boxSelect?: boolean;
  /** Highlight style for selected points */
  highlightStyle?: {
    color?: string;
    size?: number;
    ringWidth?: number;
  };
}

/** Context for selection operations */
export interface SelectionContext {
  getSeries: () => Map<string, Series>;
  getPlotArea: () => PlotArea;
  getXScale: () => Scale;
  getYScales: () => Map<string, Scale>;
  getPrimaryYAxisId: () => string;
  events: EventEmitter<SelectionEventMap>;
  requestRender: () => void;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Required<SelectionConfig> = {
  enabled: true,
  hitRadius: 20,
  multiSelect: true,
  boxSelect: true,
  highlightStyle: {
    color: '#00ffff',
    size: 12,
    ringWidth: 3,
  },
};

// ============================================
// SelectionManager Implementation
// ============================================

export class SelectionManager {
  private ctx: SelectionContext;
  private config: Required<SelectionConfig>;
  private selected: Map<string, Set<number>> = new Map(); // seriesId -> Set of indices
  private isBoxSelecting: boolean = false;
  private boxStart: { x: number; y: number } | null = null;
  private boxEnd: { x: number; y: number } | null = null;

  constructor(ctx: SelectionContext, config?: SelectionConfig) {
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================
  // Configuration
  // ============================================

  configure(config: Partial<SelectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SelectionConfig {
    return { ...this.config };
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.clearSelection();
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  // ============================================
  // Hit Testing
  // ============================================

  /**
   * Hit-test at a pixel coordinate to find the nearest data point
   */
  hitTest(pixelX: number, pixelY: number): HitTestResult | null {
    if (!this.config.enabled) return null;

    const plotArea = this.ctx.getPlotArea();
    
    // Check if within plot area
    if (
      pixelX < plotArea.x ||
      pixelX > plotArea.x + plotArea.width ||
      pixelY < plotArea.y ||
      pixelY > plotArea.y + plotArea.height
    ) {
      return null;
    }

    const xScale = this.ctx.getXScale();
    const yScales = this.ctx.getYScales();
    const series = this.ctx.getSeries();
    const hitRadius = this.config.hitRadius;
    const hitRadiusSq = hitRadius * hitRadius;

    let nearest: HitTestResult | null = null;
    let minDistSq = Infinity;

    series.forEach((s, seriesId) => {
      if (!s.isVisible()) return;

      const data = s.getData();
      if (data.x.length === 0) return;

      const axisId = s.getYAxisId() || this.ctx.getPrimaryYAxisId();
      const yScale = yScales.get(axisId);
      if (!yScale) return;

      // Binary search to find points near the X coordinate
      const dataX = xScale.invert(pixelX);
      const startIdx = this.findNearestIndex(data.x, dataX);
      
      // Check nearby points (search window)
      const searchRadius = 50; // Check points within this many indices
      const startSearch = Math.max(0, startIdx - searchRadius);
      const endSearch = Math.min(data.x.length, startIdx + searchRadius);

      for (let i = startSearch; i < endSearch; i++) {
        const px = xScale.transform(data.x[i]);
        const py = yScale.transform(data.y[i]);

        const dx = px - pixelX;
        const dy = py - pixelY;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistSq && distSq <= hitRadiusSq) {
          minDistSq = distSq;
          nearest = {
            seriesId,
            index: i,
            x: data.x[i],
            y: data.y[i],
            distance: Math.sqrt(distSq),
            pixelX: px,
            pixelY: py,
          };
        }
      }
    });

    return nearest;
  }

  /**
   * Hit-test all points within a rectangular region
   */
  hitTestRegion(bounds: Bounds): HitTestResult[] {
    const results: HitTestResult[] = [];
    if (!this.config.enabled) return results;

    const xScale = this.ctx.getXScale();
    const yScales = this.ctx.getYScales();
    const series = this.ctx.getSeries();

    series.forEach((s, seriesId) => {
      if (!s.isVisible()) return;

      const data = s.getData();
      if (data.x.length === 0) return;

      const axisId = s.getYAxisId() || this.ctx.getPrimaryYAxisId();
      const yScale = yScales.get(axisId);
      if (!yScale) return;

      for (let i = 0; i < data.x.length; i++) {
        const x = data.x[i];
        const y = data.y[i];

        if (x >= bounds.xMin && x <= bounds.xMax && y >= bounds.yMin && y <= bounds.yMax) {
          results.push({
            seriesId,
            index: i,
            x,
            y,
            distance: 0,
            pixelX: xScale.transform(x),
            pixelY: yScale.transform(y),
          });
        }
      }
    });

    return results;
  }

  // ============================================
  // Selection API
  // ============================================

  /**
   * Select specific points programmatically
   */
  selectPoints(
    points: Array<{ seriesId: string; indices: number[] }>,
    mode: SelectionMode = 'single'
  ): void {
    if (!this.config.enabled) return;

    const previous = this.getSelectedPoints();

    if (mode === 'single') {
      this.selected.clear();
    }

    const series = this.ctx.getSeries();
    const newPoints: SelectedPoint[] = [];

    points.forEach(({ seriesId, indices }) => {
      const s = series.get(seriesId);
      if (!s) return;

      const data = s.getData();
      let indexSet = this.selected.get(seriesId);
      
      if (!indexSet) {
        indexSet = new Set();
        this.selected.set(seriesId, indexSet);
      }

      indices.forEach(idx => {
        if (idx < 0 || idx >= data.x.length) return;

        if (mode === 'remove') {
          indexSet!.delete(idx);
        } else if (mode === 'toggle') {
          if (indexSet!.has(idx)) {
            indexSet!.delete(idx);
          } else {
            indexSet!.add(idx);
            newPoints.push({
              seriesId,
              index: idx,
              x: data.x[idx],
              y: data.y[idx],
            });
          }
        } else {
          indexSet!.add(idx);
          newPoints.push({
            seriesId,
            index: idx,
            x: data.x[idx],
            y: data.y[idx],
          });
        }
      });

      // Clean up empty sets
      if (indexSet.size === 0) {
        this.selected.delete(seriesId);
      }
    });

    const current = this.getSelectedPoints();

    this.ctx.events.emit('pointSelect', {
      points: newPoints,
      mode,
      source: 'api',
    });

    this.ctx.events.emit('selectionChange', {
      selected: current,
      previous,
    });

    this.ctx.requestRender();
  }

  /**
   * Get all currently selected points
   */
  getSelectedPoints(): SelectedPoint[] {
    const result: SelectedPoint[] = [];
    const series = this.ctx.getSeries();

    this.selected.forEach((indices, seriesId) => {
      const s = series.get(seriesId);
      if (!s) return;

      const data = s.getData();
      indices.forEach(idx => {
        if (idx < data.x.length) {
          result.push({
            seriesId,
            index: idx,
            x: data.x[idx],
            y: data.y[idx],
          });
        }
      });
    });

    return result;
  }

  /**
   * Check if a specific point is selected
   */
  isPointSelected(seriesId: string, index: number): boolean {
    return this.selected.get(seriesId)?.has(index) ?? false;
  }

  /**
   * Get selected points for a specific series
   */
  getSelectedForSeries(seriesId: string): number[] {
    const indices = this.selected.get(seriesId);
    return indices ? Array.from(indices) : [];
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    if (this.selected.size === 0) return;

    const previous = this.getSelectedPoints();
    this.selected.clear();

    this.ctx.events.emit('selectionClear', undefined);
    this.ctx.events.emit('selectionChange', {
      selected: [],
      previous,
    });

    this.ctx.requestRender();
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    let count = 0;
    this.selected.forEach(indices => {
      count += indices.size;
    });
    return count;
  }

  // ============================================
  // Click Handling
  // ============================================

  /**
   * Handle click event for selection
   */
  handleClick(pixelX: number, pixelY: number, ctrlKey: boolean, shiftKey: boolean): void {
    if (!this.config.enabled) return;

    const hit = this.hitTest(pixelX, pixelY);

    if (!hit) {
      // Click on empty space clears selection (unless Ctrl is held)
      if (!ctrlKey && !shiftKey) {
        this.clearSelection();
      }
      return;
    }

    let mode: SelectionMode = 'single';
    
    if (ctrlKey && this.config.multiSelect) {
      mode = 'toggle';
    } else if (shiftKey && this.config.multiSelect) {
      mode = 'add';
    }

    this.selectPoints(
      [{ seriesId: hit.seriesId, indices: [hit.index] }],
      mode
    );
  }

  // ============================================
  // Box Selection
  // ============================================

  /**
   * Start box selection
   */
  startBoxSelection(pixelX: number, pixelY: number): void {
    if (!this.config.enabled || !this.config.boxSelect) return;

    this.isBoxSelecting = true;
    this.boxStart = { x: pixelX, y: pixelY };
    this.boxEnd = { x: pixelX, y: pixelY };
  }

  /**
   * Update box selection during drag
   */
  updateBoxSelection(pixelX: number, pixelY: number): void {
    if (!this.isBoxSelecting) return;
    this.boxEnd = { x: pixelX, y: pixelY };
    this.ctx.requestRender();
  }

  /**
   * Complete box selection
   */
  completeBoxSelection(additive: boolean = false): void {
    if (!this.isBoxSelecting || !this.boxStart || !this.boxEnd) {
      this.cancelBoxSelection();
      return;
    }

    const plotArea = this.ctx.getPlotArea();
    const xScale = this.ctx.getXScale();
    const yScales = this.ctx.getYScales();
    const primaryYScale = yScales.get(this.ctx.getPrimaryYAxisId());
    
    if (!primaryYScale) {
      this.cancelBoxSelection();
      return;
    }

    // Calculate data bounds from pixel coordinates
    const x1 = Math.min(this.boxStart.x, this.boxEnd.x);
    const x2 = Math.max(this.boxStart.x, this.boxEnd.x);
    const y1 = Math.min(this.boxStart.y, this.boxEnd.y);
    const y2 = Math.max(this.boxStart.y, this.boxEnd.y);

    // Clamp to plot area
    const clampedX1 = Math.max(x1, plotArea.x);
    const clampedX2 = Math.min(x2, plotArea.x + plotArea.width);
    const clampedY1 = Math.max(y1, plotArea.y);
    const clampedY2 = Math.min(y2, plotArea.y + plotArea.height);

    // Convert to data coordinates
    const dataBounds: Bounds = {
      xMin: xScale.invert(clampedX1),
      xMax: xScale.invert(clampedX2),
      yMin: primaryYScale.invert(clampedY2), // Y is inverted
      yMax: primaryYScale.invert(clampedY1),
    };

    // Hit test all points in the region
    const hits = this.hitTestRegion(dataBounds);
    
    if (hits.length > 0) {
      // Group hits by series
      const bySeriesMap = new Map<string, number[]>();
      hits.forEach(hit => {
        let arr = bySeriesMap.get(hit.seriesId);
        if (!arr) {
          arr = [];
          bySeriesMap.set(hit.seriesId, arr);
        }
        arr.push(hit.index);
      });

      const pointsToSelect = Array.from(bySeriesMap.entries()).map(([seriesId, indices]) => ({
        seriesId,
        indices,
      }));

      this.selectPoints(pointsToSelect, additive ? 'add' : 'single');

      // Emit region select event
      const containedPoints = this.getSelectedPoints();
      this.ctx.events.emit('regionSelect', {
        bounds: dataBounds,
        containedPoints,
      });
    } else if (!additive) {
      this.clearSelection();
    }

    this.cancelBoxSelection();
  }

  /**
   * Cancel box selection
   */
  cancelBoxSelection(): void {
    this.isBoxSelecting = false;
    this.boxStart = null;
    this.boxEnd = null;
    this.ctx.requestRender();
  }

  /**
   * Check if box selection is active
   */
  isBoxSelectActive(): boolean {
    return this.isBoxSelecting;
  }

  /**
   * Get current box selection rectangle (for rendering)
   */
  getBoxSelectionRect(): { x: number; y: number; width: number; height: number } | null {
    if (!this.isBoxSelecting || !this.boxStart || !this.boxEnd) {
      return null;
    }

    return {
      x: Math.min(this.boxStart.x, this.boxEnd.x),
      y: Math.min(this.boxStart.y, this.boxEnd.y),
      width: Math.abs(this.boxEnd.x - this.boxStart.x),
      height: Math.abs(this.boxEnd.y - this.boxStart.y),
    };
  }

  // ============================================
  // Rendering
  // ============================================

  /**
   * Render selected point highlights
   */
  render(ctx: CanvasRenderingContext2D, plotArea: PlotArea): void {
    if (this.selected.size === 0 && !this.isBoxSelecting) return;

    const xScale = this.ctx.getXScale();
    const yScales = this.ctx.getYScales();
    const seriesMap = this.ctx.getSeries();
    const style = this.config.highlightStyle;

    ctx.save();

    // Clip to plot area
    ctx.beginPath();
    ctx.rect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
    ctx.clip();

    // Draw selection highlights
    this.selected.forEach((indices, seriesId) => {
      const s = seriesMap.get(seriesId);
      if (!s || !s.isVisible()) return;

      const data = s.getData();
      const axisId = s.getYAxisId() || this.ctx.getPrimaryYAxisId();
      const yScale = yScales.get(axisId);
      if (!yScale) return;

      const seriesColor = s.getStyle().color || '#ff0055';

      indices.forEach(idx => {
        if (idx >= data.x.length) return;

        const px = xScale.transform(data.x[idx]);
        const py = yScale.transform(data.y[idx]);

        // Skip if outside plot area
        if (px < plotArea.x || px > plotArea.x + plotArea.width) return;
        if (py < plotArea.y || py > plotArea.y + plotArea.height) return;

        // Outer ring (highlight color)
        ctx.beginPath();
        ctx.arc(px, py, style.size! / 2, 0, Math.PI * 2);
        ctx.strokeStyle = style.color!;
        ctx.lineWidth = style.ringWidth!;
        ctx.stroke();

        // Inner fill (series color)
        ctx.beginPath();
        ctx.arc(px, py, style.size! / 2 - style.ringWidth!, 0, Math.PI * 2);
        ctx.fillStyle = seriesColor;
        ctx.fill();
      });
    });

    // Draw box selection rectangle
    const boxRect = this.getBoxSelectionRect();
    if (boxRect) {
      ctx.fillStyle = 'rgba(0, 170, 255, 0.2)';
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.fillRect(boxRect.x, boxRect.y, boxRect.width, boxRect.height);
      ctx.strokeRect(boxRect.x, boxRect.y, boxRect.width, boxRect.height);
    }

    ctx.restore();
  }

  // ============================================
  // Helpers
  // ============================================

  /**
   * Binary search to find nearest index in sorted array
   */
  private findNearestIndex(arr: Float32Array | Float64Array, target: number): number {
    if (arr.length === 0) return 0;
    if (arr.length === 1) return 0;

    let left = 0;
    let right = arr.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid] < target) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    // Check if left-1 is closer
    if (left > 0 && Math.abs(arr[left - 1] - target) < Math.abs(arr[left] - target)) {
      return left - 1;
    }

    return left;
  }

  /**
   * Destroy the selection manager
   */
  destroy(): void {
    this.selected.clear();
    this.cancelBoxSelection();
  }
}
