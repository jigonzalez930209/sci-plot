/**
 * Radar Chart Renderer
 * 
 * Renders radar/spider charts with multiple axes and values.
 * Supports filled areas, grid lines, and axis labels.
 * 
 * @packageDocumentation
 * @module renderer/radar
 */

import type { RadarData, RadarStyle } from '../../types';

// ============================================
// Radar Chart Utilities
// ============================================

export interface RadarPoint {
  x: number;
  y: number;
  axisIndex: number;
  value: number;
}

export interface RadarGrid {
  levels: number;
  maxRadius: number;
  center: { x: number; y: number };
  startAngle: number;
  angleStep: number;
}

export class RadarRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private grid: RadarGrid;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    
    // Initialize grid configuration
    this.grid = {
      levels: 5,
      maxRadius: Math.min(width, height) * 0.4,
      center: { x: width / 2, y: height / 2 },
      startAngle: -90, // Start from top
      angleStep: 0
    };
  }

  /**
   * Convert radar data to screen coordinates
   */
  private dataToPoints(data: RadarData, style: RadarStyle): RadarPoint[] {
    const { axes, values } = data;
    const numAxes = axes.length;
    
    // Calculate angle step
    this.grid.angleStep = (2 * Math.PI) / numAxes;
    
    // Convert start angle from degrees to radians
    const startAngleRad = (style?.startAngle || this.grid.startAngle) * Math.PI / 180;
    
    const points: RadarPoint[] = [];
    
    for (let i = 0; i < numAxes; i++) {
      const value = values[i] || 0;
      const angle = startAngleRad + (i * this.grid.angleStep);
      
      // Calculate radius (normalized value * max radius)
      const radius = value * this.grid.maxRadius;
      
      // Convert to Cartesian coordinates
      const x = this.grid.center.x + radius * Math.cos(angle);
      const y = this.grid.center.y + radius * Math.sin(angle);
      
      points.push({
        x,
        y,
        axisIndex: i,
        value
      });
    }
    
    return points;
  }

  /**
   * Draw radar grid (background circles and radial lines)
   */
  drawGrid(data: RadarData, style: RadarStyle): void {
    const { axes } = data;
    const numAxes = axes.length;
    const levels = style?.levels || this.grid.levels;
    const showGrid = style?.showGrid !== false;
    const gridColor = style?.gridColor || '#e0e0e0';
    const gridOpacity = style?.gridOpacity || 0.5;
    
    if (!showGrid) return;
    
    this.ctx.save();
    this.ctx.strokeStyle = gridColor;
    this.ctx.globalAlpha = gridOpacity;
    this.ctx.lineWidth = 1;
    
    // Draw concentric circles (levels)
    for (let level = 1; level <= levels; level++) {
      const radius = (level / levels) * this.grid.maxRadius;
      
      this.ctx.beginPath();
      this.ctx.arc(this.grid.center.x, this.grid.center.y, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
    
    // Draw radial lines (spokes)
    const startAngleRad = (style?.startAngle || this.grid.startAngle) * Math.PI / 180;
    
    for (let i = 0; i < numAxes; i++) {
      const angle = startAngleRad + (i * this.grid.angleStep);
      const endX = this.grid.center.x + this.grid.maxRadius * Math.cos(angle);
      const endY = this.grid.center.y + this.grid.maxRadius * Math.sin(angle);
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.grid.center.x, this.grid.center.y);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  /**
   * Draw axis labels
   */
  drawLabels(data: RadarData, style: RadarStyle): void {
    const { axes } = data;
    const showLabels = style?.showLabels !== false;
    const labelSize = style?.labelSize || 12;
    
    if (!showLabels) return;
    
    this.ctx.save();
    this.ctx.font = `${labelSize}px Arial`;
    this.ctx.fillStyle = '#333333';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const startAngleRad = (style?.startAngle || this.grid.startAngle) * Math.PI / 180;
    const labelRadius = this.grid.maxRadius + 20;
    
    for (let i = 0; i < axes.length; i++) {
      const angle = startAngleRad + (i * this.grid.angleStep);
      const x = this.grid.center.x + labelRadius * Math.cos(angle);
      const y = this.grid.center.y + labelRadius * Math.sin(angle);
      
      this.ctx.fillText(axes[i], x, y);
    }
    
    this.ctx.restore();
  }

  /**
   * Draw radar chart
   */
  drawRadar(data: RadarData, style: RadarStyle): void {
    const points = this.dataToPoints(data, style);
    
    if (points.length === 0) return;
    
    this.ctx.save();
    
    // Set line style
    this.ctx.strokeStyle = style?.color || '#0066cc';
    this.ctx.lineWidth = style?.width || 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Draw filled area if enabled
    const fill = style?.fill !== false;
    const fillColor = style?.fillColor || style?.color || '#0066cc';
    const fillOpacity = style?.fillOpacity || 0.3;
    
    if (fill) {
      this.ctx.fillStyle = fillColor;
      this.ctx.globalAlpha = fillOpacity;
      
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      
      this.ctx.closePath();
      this.ctx.fill();
      
      // Reset opacity for line
      this.ctx.globalAlpha = 1;
    }
    
    // Draw radar line
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Draw points at each axis
    const pointSize = style?.pointSize || 4;
    
    this.ctx.fillStyle = style?.color || '#0066cc';
    for (const point of points) {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  /**
   * Render complete radar chart
   */
  render(data: RadarData, style: RadarStyle): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw components in order
    this.drawGrid(data, style);
    this.drawLabels(data, style);
    this.drawRadar(data, style);
  }

  /**
   * Render multiple radar charts (for comparison)
   */
  renderMultiple(datasets: { data: RadarData; style: RadarStyle }[]): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    if (datasets.length === 0) return;
    
    // Draw grid and labels from first dataset
    const firstDataset = datasets[0];
    this.drawGrid(firstDataset.data, firstDataset.style);
    this.drawLabels(firstDataset.data, firstDataset.style);
    
    // Draw each radar chart
    for (const dataset of datasets) {
      this.drawRadar(dataset.data, dataset.style);
    }
  }

  /**
   * Get screen coordinates for a specific axis
   */
  getAxisCoordinates(axisIndex: number, value: number, style: RadarStyle): { x: number; y: number } {
    const startAngleRad = (style?.startAngle || this.grid.startAngle) * Math.PI / 180;
    const angle = startAngleRad + (axisIndex * this.grid.angleStep);
    const radius = value * this.grid.maxRadius;
    
    return {
      x: this.grid.center.x + radius * Math.cos(angle),
      y: this.grid.center.y + radius * Math.sin(angle)
    };
  }

  /**
   * Update canvas dimensions
   */
  updateDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.grid.center = { x: width / 2, y: height / 2 };
    this.grid.maxRadius = Math.min(width, height) * 0.4;
  }

  /**
   * Get grid configuration
   */
  getGrid(): RadarGrid {
    return { ...this.grid };
  }

  /**
   * Set grid configuration
   */
  setGrid(grid: Partial<RadarGrid>): void {
    this.grid = { ...this.grid, ...grid };
  }
}