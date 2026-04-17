/**
 * Sci Plot - Peak Tool Module
 * 
 * Provides interactive measurement tool for measuring distances,
 * differences, and slopes between two data points on the chart.
 * 
 * Features:
 * - Click to select first point (snaps to nearest data point)
 * - Click to select second point 
 * - Highlight points on hover
 * - Show peak measurements between points
 * 
 * @module peak-tool
 */

import type { PeakMeasurement, Bounds } from '../../../types';
import type { AnimationEngine } from '../../../core/animation';

// ============================================
// Types
// ============================================

export interface PeakToolOptions {
  /** Line color for measurement (default: '#ff6b6b') */
  lineColor?: string;
  /** Line width in pixels (default: 2) */
  lineWidth?: number;
  /** Show labels at measurement points (default: true) */
  showLabels?: boolean;
  /** Label font size (default: 12) */
  labelFontSize?: number;
  /** Label background color (default: 'rgba(0,0,0,0.8)') */
  labelBackground?: string;
  /** Label text color (default: '#ffffff') */
  labelColor?: string;
  /** Show peak values inline (default: true) */
  showPeak?: boolean;
  /** Number precision for values (default: 4) */
  precision?: number;
  /** Custom CSS class for overlay elements */
  className?: string;
  /** Number of points to use for baseline regression (default: 10) */
  baselineWindow?: number;
  /** Area fill color (default: 'rgba(255, 107, 107, 0.3)') */
  areaFill?: string;
  /** Point highlight size when hovering (default: 10) */
  highlightSize?: number;
  /** Point highlight color (default: '#00f2ff') */
  highlightColor?: string;
  /** Snap radius in pixels for detecting nearby points (default: 20) */
  snapRadius?: number;
}

/** Data point with series information */
export interface DataPoint {
  x: number;
  y: number;
  seriesId: string;
  yAxisId?: string;
  index: number;
  pixelX: number;
  pixelY: number;
}

export interface PeakToolState {
  /** Whether the tool is enabled */
  enabled: boolean;
  /** Selection state: 'idle' | 'waitingSecond' | 'complete' */
  selectionState: 'idle' | 'waitingSecond' | 'complete';
  /** First selected point */
  point1: DataPoint | null;
  /** Second selected point */
  point2: DataPoint | null;
  /** Currently hovered point (for highlighting) */
  hoveredPoint: DataPoint | null;
  /** Last completed measurement */
  lastMeasurement: PeakMeasurement | null;
}

export interface SeriesData {
  id: string;
  x: Float32Array | Float64Array | number[];
  y: Float32Array | Float64Array | number[];
  yAxisId?: string;
}

export interface PeakToolContext {
  container: HTMLElement;
  getPlotArea: () => { x: number; y: number; width: number; height: number };
  getViewBounds: () => Bounds;
  getYBounds?: (yAxisId?: string) => { yMin: number; yMax: number };
  requestRender: () => void;
  getSeries?: () => SeriesData[];
  onMeasure?: (measurement: PeakMeasurement) => void;
  animationEngine?: AnimationEngine;
}

// ============================================
// Peak Tool Implementation
// ============================================

export class PeakTool {
  private ctx: PeakToolContext;
  private options: Required<PeakToolOptions>;
  private state: PeakToolState = {
    enabled: false,
    selectionState: 'idle',
    point1: null,
    point2: null,
    hoveredPoint: null,
    lastMeasurement: null,
  };

  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;

  // Label dragging
  private labelOffset: { x: number; y: number } = { x: 15, y: 0 };
  private isDraggingLabel = false;
  private labelBounds: { x: number; y: number; width: number; height: number } | null = null;
  private dragStart: { x: number; y: number } = { x: 0, y: 0 };
  private crosshairPosition: { x: number; y: number } | null = null;

  // Bound handlers
  private boundMouseMove: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundResize: () => void;

  constructor(context: PeakToolContext, options?: PeakToolOptions) {
    this.ctx = context;
    this.options = {
      lineColor: '#ff6b6b',
      lineWidth: 2,
      showLabels: true,
      labelFontSize: 12,
      labelBackground: 'rgba(0, 0, 0, 0.85)',
      labelColor: '#ffffff',
      showPeak: true,
      precision: 4,
      className: 'sci-plot-peak-tool',
      highlightSize: 12,
      highlightColor: '#00f2ff',
      snapRadius: 30,
      baselineWindow: 10,
      areaFill: 'rgba(255, 107, 107, 0.3)',
      ...options,
    };

    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundMouseDown = this.handleLabelMouseDown.bind(this);
    this.boundMouseUp = this.handleLabelMouseUp.bind(this);
    this.boundResize = this.resizeOverlay.bind(this);
  }

  /**
   * Enable the peak measurement tool
   */
  enable(): void {
    if (this.state.enabled) return;

    this.state.enabled = true;
    this.state.selectionState = 'idle';
    this.createOverlay();
    this.attachListeners();
    this.ctx.container.style.cursor = 'crosshair';
  }

  /**
   * Disable the peak measurement tool
   */
  disable(): void {
    if (!this.state.enabled) return;

    this.state.enabled = false;
    this.state.selectionState = 'idle';
    this.state.point1 = null;
    this.state.point2 = null;
    this.state.hoveredPoint = null;

    this.detachListeners();
    this.destroyOverlay();
    this.ctx.container.style.cursor = '';
  }

  /**
   * Toggle the tool on/off
   */
  toggle(): void {
    if (this.state.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Check if tool is enabled
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * Get the current state
   */
  getState(): PeakToolState {
    return { ...this.state };
  }

  /**
   * Get the last completed measurement
   */
  getMeasurement(): PeakMeasurement | null {
    return this.state.lastMeasurement;
  }

  /**
   * Clear the current measurement
   */
  clear(): void {
    this.state.point1 = null;
    this.state.point2 = null;
    this.state.selectionState = 'idle';
    this.state.lastMeasurement = null;
    this.labelBounds = null;
    this.labelOffset = { x: 15, y: 0 };
    this.renderOverlay();
  }

  /**
   * Destroy the tool and cleanup
   */
  destroy(): void {
    this.disable();
    this.state.lastMeasurement = null;
  }

  /**
   * Recalculate measurements (useful if data changes)
   */
  public recalculate(): void {
    if (!this.state.point1 || !this.state.point2) return;

    // Refresh data points from series
    const seriesList = this.ctx.getSeries ? this.ctx.getSeries() : [];

    const updatePoint = (p: DataPoint) => {
      const s = seriesList.find(ser => ser.id === p.seriesId);
      if (s && p.index < s.x.length) {
        p.x = s.x[p.index];
        p.y = s.y[p.index];
        p.yAxisId = s.yAxisId;

        // Update pixel coordinates
        const plotArea = this.ctx.getPlotArea();
        const bounds = this.ctx.getViewBounds();
        const yBounds = this.ctx.getYBounds
          ? this.ctx.getYBounds(s.yAxisId)
          : { yMin: bounds.yMin, yMax: bounds.yMax };
        p.pixelX = plotArea.x + ((p.x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * plotArea.width;
        p.pixelY = plotArea.y + (1 - (p.y - yBounds.yMin) / (yBounds.yMax - yBounds.yMin)) * plotArea.height;
        return true;
      }
      return false;
    };

    const p1Valid = updatePoint(this.state.point1);
    const p2Valid = updatePoint(this.state.point2);

    if (p1Valid && p2Valid) {
      this.state.lastMeasurement = this.calculateMeasurement();
      if (this.ctx.onMeasure) {
        this.ctx.onMeasure(this.state.lastMeasurement);
      }
    } else {
      this.clear();
    }

    this.renderOverlay();
  }

  // ============================================
  // Private Methods
  // ============================================

  private createOverlay(): void {
    if (this.overlayCanvas) return;

    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.className = this.options.className;
    this.overlayCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;

    this.resizeOverlay();
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    this.ctx.container.appendChild(this.overlayCanvas);
  }

  private resizeOverlay(): void {
    if (!this.overlayCanvas) return;
    const rect = this.ctx.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.overlayCanvas.width = rect.width * dpr;
    this.overlayCanvas.height = rect.height * dpr;
    if (this.overlayCtx) {
      this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.overlayCtx.scale(dpr, dpr);
    }
  }

  private destroyOverlay(): void {
    if (this.overlayCanvas && this.overlayCanvas.parentNode) {
      this.overlayCanvas.parentNode.removeChild(this.overlayCanvas);
    }
    this.overlayCanvas = null;
    this.overlayCtx = null;
  }

  private attachListeners(): void {
    // Use capture phase to get events before InteractionManager
    this.ctx.container.addEventListener('mousemove', this.boundMouseMove, true);
    this.ctx.container.addEventListener('mousedown', this.boundClick, true);
    this.ctx.container.addEventListener('mousedown', this.boundMouseDown, true);
    this.ctx.container.addEventListener('mouseup', this.boundMouseUp, true);
    window.addEventListener('resize', this.boundResize);
    document.addEventListener('keydown', this.boundKeyDown);
  }

  private detachListeners(): void {
    this.ctx.container.removeEventListener('mousemove', this.boundMouseMove, true);
    this.ctx.container.removeEventListener('mousedown', this.boundClick, true);
    this.ctx.container.removeEventListener('mousedown', this.boundMouseDown, true);
    this.ctx.container.removeEventListener('mouseup', this.boundMouseUp, true);
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('keydown', this.boundKeyDown);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.state.enabled) return;

    const rect = this.ctx.container.getBoundingClientRect();
    const plotArea = this.ctx.getPlotArea();
    const bounds = this.ctx.getViewBounds();

    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    // Handle label dragging
    if (this.isDraggingLabel) {
      this.labelOffset.x += pixelX - this.dragStart.x;
      this.labelOffset.y += pixelY - this.dragStart.y;
      this.dragStart = { x: pixelX, y: pixelY };
      this.renderOverlay();
      return;
    }

    // Update cursor if over label
    if (this.labelBounds &&
      pixelX >= this.labelBounds.x && pixelX <= this.labelBounds.x + this.labelBounds.width &&
      pixelY >= this.labelBounds.y && pixelY <= this.labelBounds.y + this.labelBounds.height) {
      this.ctx.container.style.cursor = 'move';
    } else {
      this.ctx.container.style.cursor = 'crosshair';
    }

    // Check if inside plot area
    if (
      pixelX < plotArea.x ||
      pixelX > plotArea.x + plotArea.width ||
      pixelY < plotArea.y ||
      pixelY > plotArea.y + plotArea.height
    ) {
      this.state.hoveredPoint = null;
      this.crosshairPosition = null;
      this.renderOverlay();
      return;
    }

    // Store current mouse position for crosshair
    this.crosshairPosition = { x: pixelX, y: pixelY };

    // Find nearest data point
    // When waiting for second point, only show points from the same series
    const seriesFilter = this.state.selectionState === 'waitingSecond' && this.state.point1
      ? this.state.point1.seriesId
      : undefined;
    const nearestPoint = this.findNearestPoint(pixelX, pixelY, plotArea, bounds, seriesFilter);
    this.state.hoveredPoint = nearestPoint;
    this.renderOverlay();
  }

  private handleLabelMouseDown(e: MouseEvent): void {
    if (!this.state.enabled || !this.labelBounds) return;

    const rect = this.ctx.container.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    if (pixelX >= this.labelBounds.x && pixelX <= this.labelBounds.x + this.labelBounds.width &&
      pixelY >= this.labelBounds.y && pixelY <= this.labelBounds.y + this.labelBounds.height) {
      this.isDraggingLabel = true;
      this.dragStart = { x: pixelX, y: pixelY };
      e.stopPropagation();
      e.preventDefault();
    }
  }

  private handleLabelMouseUp(): void {
    this.isDraggingLabel = false;
  }

  private async handleClick(e: MouseEvent): Promise<void> {
    if (!this.state.enabled) return;

    // If chart is animating, wait for it to settle to get accurate coordinates
    if (this.ctx.animationEngine?.isAnimating()) {
      await this.ctx.animationEngine.waitForIdle();
    }

    // Stop propagation to prevent InteractionManager from handling this
    e.stopPropagation();
    e.preventDefault();

    const rect = this.ctx.container.getBoundingClientRect();
    const plotArea = this.ctx.getPlotArea();
    const bounds = this.ctx.getViewBounds();

    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;

    // Check if inside plot area
    if (
      pixelX < plotArea.x ||
      pixelX > plotArea.x + plotArea.width ||
      pixelY < plotArea.y ||
      pixelY > plotArea.y + plotArea.height
    ) {
      return;
    }

    // Find nearest data point
    // When waiting for second point, only look for points from the same series
    const seriesFilter = this.state.selectionState === 'waitingSecond' && this.state.point1
      ? this.state.point1.seriesId
      : undefined;
    const nearestPoint = this.findNearestPoint(pixelX, pixelY, plotArea, bounds, seriesFilter);

    if (!nearestPoint) return;

    e.preventDefault();
    e.stopPropagation();

    if (this.state.selectionState === 'idle' || this.state.selectionState === 'complete') {
      // Select first point
      this.state.point1 = nearestPoint;
      this.state.point2 = null;
      this.state.selectionState = 'waitingSecond';
      this.state.lastMeasurement = null;
    } else if (this.state.selectionState === 'waitingSecond') {
      // For peak integration, both points MUST be on the same series
      if (this.state.point1 && nearestPoint.seriesId !== this.state.point1.seriesId) {
        // Ignore - user clicked on a different series
        return;
      }

      // Select second point
      this.state.point2 = nearestPoint;
      this.state.selectionState = 'complete';

      // Calculate measurement
      const measurement = this.calculateMeasurement();
      this.state.lastMeasurement = measurement;

      if (this.ctx.onMeasure) {
        this.ctx.onMeasure(measurement);
      }
    }

    this.renderOverlay();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.state.enabled) {
      this.clear();
    }
  }

  private findNearestPoint(
    pixelX: number,
    pixelY: number,
    plotArea: { x: number; y: number; width: number; height: number },
    bounds: Bounds,
    seriesIdFilter?: string
  ): DataPoint | null {
    if (!this.ctx.getSeries) return null;

    const series = this.ctx.getSeries();
    let nearestPoint: DataPoint | null = null;
    let minDistance = this.options.snapRadius;

    for (const s of series) {
      // If filtering by series ID, skip other series
      if (seriesIdFilter && s.id !== seriesIdFilter) continue;

      const xData = s.x;
      const yData = s.y;
      const len = Math.min(xData.length, yData.length);

      // Get Y bounds for this series (may be different if using secondary Y axis)
      const yBounds = this.ctx.getYBounds
        ? this.ctx.getYBounds(s.yAxisId)
        : { yMin: bounds.yMin, yMax: bounds.yMax };

      for (let i = 0; i < len; i++) {
        const dataX = xData[i];
        const dataY = yData[i];

        // Convert data to pixel coordinates
        const px = plotArea.x + ((dataX - bounds.xMin) / (bounds.xMax - bounds.xMin)) * plotArea.width;
        const py = plotArea.y + (1 - (dataY - yBounds.yMin) / (yBounds.yMax - yBounds.yMin)) * plotArea.height;

        // Skip if outside visible range
        if (px < plotArea.x || px > plotArea.x + plotArea.width) continue;
        if (py < plotArea.y || py > plotArea.y + plotArea.height) continue;

        const distance = Math.sqrt((pixelX - px) ** 2 + (pixelY - py) ** 2);

        if (distance < minDistance) {
          minDistance = distance;
          nearestPoint = {
            x: dataX,
            y: dataY,
            seriesId: s.id,
            yAxisId: s.yAxisId,
            index: i,
            pixelX: px,
            pixelY: py,
          };
        }
      }
    }

    return nearestPoint;
  }

  private calculateMeasurement(): PeakMeasurement {
    const p1 = this.state.point1!;
    const p2 = this.state.point2!;
    const seriesList = this.ctx.getSeries ? this.ctx.getSeries() : [];
    const series = seriesList.find(s => s.id === p1.seriesId);

    if (!series) {
      return {
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
        area: 0, integral: 0, baselineSlope: 0, baselineIntercept: 0,
        peakHeight: 0, peakX: 0, peakY: 0,
        pixelX1: p1.pixelX, pixelY1: p1.pixelY, pixelX2: p2.pixelX, pixelY2: p2.pixelY
      };
    }

    const xData = series.x;
    const yData = series.y;
    const idx1 = Math.min(p1.index, p2.index);
    const idx2 = Math.max(p1.index, p2.index);

    // Baseline detection using linear regression on windows around p1 and p2 (noise segments)
    const win = this.options.baselineWindow;
    const baselinePointsX: number[] = [];
    const baselinePointsY: number[] = [];

    // Window around idx1
    for (let i = Math.max(0, idx1 - Math.floor(win / 2)); i <= Math.min(xData.length - 1, idx1 + Math.floor(win / 2)); i++) {
      baselinePointsX.push(xData[i]);
      baselinePointsY.push(yData[i]);
    }
    // Window around idx2
    for (let i = Math.max(0, idx2 - Math.floor(win / 2)); i <= Math.min(xData.length - 1, idx2 + Math.floor(win / 2)); i++) {
      baselinePointsX.push(xData[i]);
      baselinePointsY.push(yData[i]);
    }

    // Linear regression: y = mx + b
    const n = baselinePointsX.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += baselinePointsX[i];
      sumY += baselinePointsY[i];
      sumXY += baselinePointsX[i] * baselinePointsY[i];
      sumXX += baselinePointsX[i] * baselinePointsX[i];
    }
    const baselineSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const baselineIntercept = (sumY - baselineSlope * sumX) / n;

    // Numerical integration (trapezoidal rule)
    let area = 0;
    let integral = 0;
    let peakHeight = -Infinity;
    let peakX = 0;
    let peakY = 0;

    for (let i = idx1; i < idx2; i++) {
      const x_a = xData[i];
      const y_a = yData[i];
      const x_b = xData[i + 1];
      const y_b = yData[i + 1];

      const dx = x_b - x_a;
      const avgY = (y_a + y_b) / 2;

      integral += avgY * dx;

      // Baseline value at these points
      const bl_a = baselineSlope * x_a + baselineIntercept;
      const bl_b = baselineSlope * x_b + baselineIntercept;
      const avgBL = (bl_a + bl_b) / 2;

      area += (avgY - avgBL) * dx;

      // Find maximum elevation above baseline
      const h_a = y_a - bl_a;
      if (h_a > peakHeight) {
        peakHeight = h_a;
        peakX = x_a;
        peakY = y_a;
      }
    }

    return {
      x1: p1.x, y1: p1.y,
      x2: p2.x, y2: p2.y,
      area, integral, baselineSlope, baselineIntercept,
      peakHeight, peakX, peakY,
      pixelX1: p1.pixelX, pixelY1: p1.pixelY,
      pixelX2: p2.pixelX, pixelY2: p2.pixelY
    };
  }

  public renderOverlay(): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;

    // Resize if needed
    this.resizeOverlay();

    const rect = this.ctx.container.getBoundingClientRect();
    this.overlayCtx.clearRect(0, 0, rect.width, rect.height);

    const opts = this.options;
    const ctx = this.overlayCtx;
    const plotArea = this.ctx.getPlotArea();
    const bounds = this.ctx.getViewBounds();

    // Update pixel coordinates of selected points to follow zoom/pan
    if (this.state.point1) {
      const p = this.state.point1;
      const yBounds = this.ctx.getYBounds
        ? this.ctx.getYBounds(p.yAxisId)
        : { yMin: bounds.yMin, yMax: bounds.yMax };
      p.pixelX = plotArea.x + ((p.x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * plotArea.width;
      p.pixelY = plotArea.y + (1 - (p.y - yBounds.yMin) / (yBounds.yMax - yBounds.yMin)) * plotArea.height;
    }
    if (this.state.point2) {
      const p = this.state.point2;
      const yBounds = this.ctx.getYBounds
        ? this.ctx.getYBounds(p.yAxisId)
        : { yMin: bounds.yMin, yMax: bounds.yMax };
      p.pixelX = plotArea.x + ((p.x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * plotArea.width;
      p.pixelY = plotArea.y + (1 - (p.y - yBounds.yMin) / (yBounds.yMax - yBounds.yMin)) * plotArea.height;
    }

    // Draw crosshair lines (dotted lines from cursor to axes)
    if (this.crosshairPosition && this.state.selectionState !== 'complete') {
      const cx = this.crosshairPosition.x;
      const cy = this.crosshairPosition.y;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.7)';
      ctx.lineWidth = 1;

      // Vertical line (to X axis)
      ctx.beginPath();
      ctx.moveTo(cx, plotArea.y);
      ctx.lineTo(cx, plotArea.y + plotArea.height);
      ctx.stroke();

      // Horizontal line (to Y axis)
      ctx.beginPath();
      ctx.moveTo(plotArea.x, cy);
      ctx.lineTo(plotArea.x + plotArea.width, cy);
      ctx.stroke();

      ctx.restore();
    }

    // Draw hovered point highlight (pulsing effect)
    if (this.state.hoveredPoint && this.state.selectionState !== 'complete') {
      const hp = this.state.hoveredPoint;

      // Outer glow
      ctx.beginPath();
      ctx.arc(hp.pixelX, hp.pixelY, opts.highlightSize + 4, 0, Math.PI * 2);
      ctx.fillStyle = opts.highlightColor + '30';
      ctx.fill();

      // Main highlight
      ctx.beginPath();
      ctx.arc(hp.pixelX, hp.pixelY, opts.highlightSize, 0, Math.PI * 2);
      ctx.strokeStyle = opts.highlightColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(hp.pixelX, hp.pixelY, 4, 0, Math.PI * 2);
      ctx.fillStyle = opts.highlightColor;
      ctx.fill();

      // Show coordinates tooltip
      this.drawPointTooltip(ctx, hp, 'Hover');
    }

    // Draw selected point 1
    if (this.state.point1) {
      const p1 = this.state.point1;

      // Selected point marker
      ctx.beginPath();
      ctx.arc(p1.pixelX, p1.pixelY, opts.highlightSize, 0, Math.PI * 2);
      ctx.fillStyle = opts.lineColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p1.pixelX, p1.pixelY, opts.highlightSize - 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p1.pixelX, p1.pixelY, 3, 0, Math.PI * 2);
      ctx.fillStyle = opts.lineColor;
      ctx.fill();

      // Label for point 1
      this.drawPointLabel(ctx, p1.pixelX, p1.pixelY - opts.highlightSize - 8, 'P1', opts.lineColor);
    }

    // Draw selected point 2
    if (this.state.point2) {
      const p2 = this.state.point2;

      // Selected point marker
      ctx.beginPath();
      ctx.arc(p2.pixelX, p2.pixelY, opts.highlightSize, 0, Math.PI * 2);
      ctx.fillStyle = '#4ade80';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2.pixelX, p2.pixelY, opts.highlightSize - 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2.pixelX, p2.pixelY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4ade80';
      ctx.fill();

      // Label for point 2
      this.drawPointLabel(ctx, p2.pixelX, p2.pixelY - opts.highlightSize - 8, 'P2', '#4ade80');
    }

    // Draw baseline and area
    if (this.state.point1 && this.state.point2 && this.state.lastMeasurement) {
      const p1 = this.state.point1;
      const p2 = this.state.point2;
      const m = this.state.lastMeasurement;
      const plotArea = this.ctx.getPlotArea();
      const bounds = this.ctx.getViewBounds();

      // Draw area fill
      const seriesList = this.ctx.getSeries ? this.ctx.getSeries() : [];
      const series = seriesList.find(s => s.id === p1.seriesId);
      if (series) {
        const xData = series.x;
        const yData = series.y;
        const idx1 = Math.min(p1.index, p2.index);
        const idx2 = Math.max(p1.index, p2.index);

        // Get correct Y bounds for this series
        const seriesYBounds = this.ctx.getYBounds
          ? this.ctx.getYBounds(series.yAxisId)
          : { yMin: bounds.yMin, yMax: bounds.yMax };

        ctx.beginPath();
        // Start from first point on baseline
        ctx.moveTo(p1.pixelX, p1.pixelY);

        // Trace the peak curve
        for (let i = idx1; i <= idx2; i++) {
          const px = plotArea.x + ((xData[i] - bounds.xMin) / (bounds.xMax - bounds.xMin)) * plotArea.width;
          const py = plotArea.y + (1 - (yData[i] - seriesYBounds.yMin) / (seriesYBounds.yMax - seriesYBounds.yMin)) * plotArea.height;
          ctx.lineTo(px, py);
        }

        // Close back along baseline
        ctx.lineTo(p2.pixelX, p2.pixelY);
        ctx.closePath();

        ctx.fillStyle = opts.areaFill;
        ctx.fill();
      }

      // Draw baseline (straight line from regression)
      ctx.beginPath();
      ctx.moveTo(p1.pixelX, p1.pixelY);
      ctx.lineTo(p2.pixelX, p2.pixelY);
      ctx.strokeStyle = opts.lineColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Peak height indicator - use correct Y bounds
      const peakYBounds = this.ctx.getYBounds
        ? this.ctx.getYBounds(p1.yAxisId)
        : { yMin: bounds.yMin, yMax: bounds.yMax };
      const peakPX = plotArea.x + ((m.peakX - bounds.xMin) / (bounds.xMax - bounds.xMin)) * plotArea.width;
      const peakPY = plotArea.y + (1 - (m.peakY - peakYBounds.yMin) / (peakYBounds.yMax - peakYBounds.yMin)) * plotArea.height;
      const baselineAtPeak = m.baselineSlope * m.peakX + m.baselineIntercept;
      const basePY = plotArea.y + (1 - (baselineAtPeak - peakYBounds.yMin) / (peakYBounds.yMax - peakYBounds.yMin)) * plotArea.height;

      ctx.beginPath();
      ctx.moveTo(peakPX, peakPY);
      ctx.lineTo(peakPX, basePY);
      ctx.strokeStyle = opts.lineColor;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw measurement label
      if (opts.showLabels) {
        this.drawMeasurementLabel(ctx, p1, p2, m);
      }
    }

    // Draw status indicator
    this.drawStatusIndicator(ctx);
  }

  private drawPointTooltip(
    ctx: CanvasRenderingContext2D,
    point: DataPoint,
    label: string
  ): void {
    const opts = this.options;
    const text = `${label}: (${this.formatValue(point.x)}, ${this.formatValue(point.y)})`;

    ctx.font = `${opts.labelFontSize}px system-ui, sans-serif`;
    const metrics = ctx.measureText(text);
    const padding = 6;
    const boxWidth = metrics.width + padding * 2;
    const boxHeight = opts.labelFontSize + padding * 2;

    let boxX = point.pixelX + 15;
    let boxY = point.pixelY - boxHeight / 2;

    // Keep within container
    const rect = this.ctx.container.getBoundingClientRect();
    if (boxX + boxWidth > rect.width) boxX = point.pixelX - boxWidth - 15;
    if (boxY < 0) boxY = 5;
    if (boxY + boxHeight > rect.height) boxY = rect.height - boxHeight - 5;

    // Background
    ctx.fillStyle = opts.labelBackground;
    this.roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 4);
    ctx.fill();

    // Text
    ctx.fillStyle = opts.labelColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, boxX + padding, boxY + boxHeight / 2);
  }

  private drawPointLabel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color: string
  ): void {
    const opts = this.options;
    ctx.font = `bold ${opts.labelFontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Background pill
    const metrics = ctx.measureText(label);
    const padding = 4;
    const pillWidth = metrics.width + padding * 2;
    const pillHeight = opts.labelFontSize + padding;

    ctx.fillStyle = color;
    this.roundRect(ctx, x - pillWidth / 2, y - pillHeight, pillWidth, pillHeight, 3);
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, y - 2);
  }

  private drawMeasurementLabel(
    ctx: CanvasRenderingContext2D,
    p1: DataPoint,
    p2: DataPoint,
    m: PeakMeasurement
  ): void {
    const opts = this.options;
    const midX = (p1.pixelX + p2.pixelX) / 2;
    const midY = (p1.pixelY + p2.pixelY) / 2;

    const lines: string[] = [];
    if (opts.showPeak) {
      lines.push(`Peak Area: ${this.formatValue(m.area)}`);
      lines.push(`Peak Height: ${this.formatValue(m.peakHeight)}`);
      lines.push(`Integral: ${this.formatValue(m.integral)}`);
    }

    const lineHeight = opts.labelFontSize + 4;
    const padding = 10;
    const boxWidth = 170;
    const boxHeight = lines.length * lineHeight + padding * 2;

    // Position box using offset from midpoint
    let boxX = midX + this.labelOffset.x;
    let boxY = midY + this.labelOffset.y;

    // Keep within bounds
    const container = this.ctx.container.getBoundingClientRect();
    if (boxX < 0) boxX = 0;
    if (boxX + boxWidth > container.width) boxX = container.width - boxWidth;
    if (boxY < 0) boxY = 0;
    if (boxY + boxHeight > container.height) boxY = container.height - boxHeight;

    // Store bounds for hit testing
    this.labelBounds = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };

    // Draw box with border
    ctx.fillStyle = opts.labelBackground;
    ctx.strokeStyle = opts.lineColor;
    ctx.lineWidth = 2;
    this.roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = opts.labelColor;
    ctx.font = `${opts.labelFontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      ctx.fillText(line, boxX + padding, boxY + padding + i * lineHeight);
    });
  }

  private drawStatusIndicator(
    ctx: CanvasRenderingContext2D
  ): void {
    const opts = this.options;
    const plotArea = this.ctx.getPlotArea();

    let statusText = '';
    let statusColor = '#666';

    if (this.state.selectionState === 'idle') {
      statusText = '📏 Click a point to start measuring';
      statusColor = opts.highlightColor;
    } else if (this.state.selectionState === 'waitingSecond') {
      statusText = '📏 Click second point to complete';
      statusColor = '#f59e0b';
    } else if (this.state.selectionState === 'complete') {
      statusText = '📏 Measurement complete (ESC to clear)';
      statusColor = '#4ade80';
    }

    if (!statusText) return;

    ctx.font = `12px system-ui, sans-serif`;
    const metrics = ctx.measureText(statusText);
    const padding = 8;
    const boxWidth = metrics.width + padding * 2;
    const boxHeight = 24;
    const boxX = plotArea.x + 10;
    const boxY = plotArea.y + 10;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 4);
    ctx.fill();

    // Status dot
    ctx.beginPath();
    ctx.arc(boxX + 16, boxY + boxHeight / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = statusColor;
    ctx.fill();

    // Text
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusText, boxX + 26, boxY + boxHeight / 2);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private formatValue(val: number): string {
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs >= 1e6 || abs < 0.001) {
      return val.toExponential(this.options.precision - 1);
    }
    return val.toPrecision(this.options.precision);
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a peak tool for a chart context
 */
export function createPeakTool(
  context: PeakToolContext,
  options?: PeakToolOptions
): PeakTool {
  return new PeakTool(context, options);
}
