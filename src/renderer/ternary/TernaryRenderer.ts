/**
 * @fileoverview Ternary plot renderer (triangular diagrams for 3-component data)
 * @module renderer/ternary
 */

import type { TernaryData, TernaryOptions, CartesianPoint } from './types';

/**
 * Convert ternary coordinates (a, b, c) to Cartesian (x, y)
 * 
 * The triangle is positioned with:
 * - A (top vertex) at (0.5, sqrt(3)/2)
 * - B (bottom-left) at (0, 0)
 * - C (bottom-right) at (1, 0)
 * 
 * Formula:
 * x = c + b/2
 * y = b * sqrt(3)/2
 */
export function ternaryToCartesian(a: number, b: number, c: number): CartesianPoint {
  // Normalize to ensure a + b + c = 1
  const sum = a + b + c;
  const bN = b / sum;
  const cN = c / sum;

  const x = cN + bN / 2;
  const y = bN * Math.sqrt(3) / 2;

  return { x, y };
}

/**
 * Convert arrays of ternary coordinates to Cartesian
 */
export function convertTernaryData(data: TernaryData): CartesianPoint[] {
  const points: CartesianPoint[] = [];
  const length = Math.min(data.a.length, data.b.length, data.c.length);

  for (let i = 0; i < length; i++) {
    points.push(ternaryToCartesian(data.a[i], data.b[i], data.c[i]));
  }

  return points;
}

/**
 * Draw ternary grid lines
 */
export function drawTernaryGrid(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  divisions: number = 10,
  gridColor: string = 'rgba(255, 255, 255, 0.2)',
  gridWidth: number = 1
): void {
  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = gridWidth;

  // Helper to convert normalized ternary to canvas coordinates
  const toCanvas = (a: number, b: number, c: number): { x: number; y: number } => {
    const pt = ternaryToCartesian(a, b, c);
    return {
      x: centerX + (pt.x - 0.5) * size,
      y: centerY - (pt.y - Math.sqrt(3) / 6) * size
    };
  };

  // Draw grid lines parallel to each side
  for (let i = 0; i <= divisions; i++) {
    const value = i / divisions;

    // Lines parallel to BC (bottom) - constant A
    if (i < divisions) {
      ctx.beginPath();
      const start = toCanvas(value, 0, 1 - value);
      const end = toCanvas(value, 1 - value, 0);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // Lines parallel to AC (right) - constant B
    if (i < divisions) {
      ctx.beginPath();
      const start = toCanvas(0, value, 1 - value);
      const end = toCanvas(1 - value, value, 0);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }

    // Lines parallel to AB (left) - constant C
    if (i < divisions) {
      ctx.beginPath();
      const start = toCanvas(0, 1 - value, value);
      const end = toCanvas(1 - value, 0, value);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draw ternary triangle outline
 */
export function drawTernaryOutline(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  color: string = '#ffffff',
  lineWidth: number = 2
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // Triangle vertices in canvas coordinates
  const height = size * Math.sqrt(3) / 2;
  const topX = centerX;
  const topY = centerY - height * (2/3);
  const bottomLeftX = centerX - size / 2;
  const bottomLeftY = centerY + height * (1/3);
  const bottomRightX = centerX + size / 2;
  const bottomRightY = centerY + height * (1/3);

  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.lineTo(bottomLeftX, bottomLeftY);
  ctx.lineTo(bottomRightX, bottomRightY);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw ternary component labels
 */
export function drawTernaryLabels(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  labelA: string = 'A',
  labelB: string = 'B',
  labelC: string = 'C',
  fontSize: number = 16,
  color: string = '#ffffff'
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const height = size * Math.sqrt(3) / 2;
  const offset = fontSize + 10;

  // Label A (top)
  ctx.fillText(labelA, centerX, centerY - height * (2/3) - offset);

  // Label B (bottom-left)
  ctx.textAlign = 'right';
  ctx.fillText(labelB, centerX - size / 2 - offset, centerY + height * (1/3));

  // Label C (bottom-right)
  ctx.textAlign = 'left';
  ctx.fillText(labelC, centerX + size / 2 + offset, centerY + height * (1/3));

  ctx.restore();
}

/**
 * Render ternary scatter points
 */
export function renderTernaryPoints(
  ctx: CanvasRenderingContext2D,
  data: TernaryData,
  centerX: number,
  centerY: number,
  size: number,
  pointSize: number = 6,
  color: string = '#00f2ff'
): void {
  ctx.save();
  ctx.fillStyle = color;

  const points = convertTernaryData(data);

  for (const pt of points) {
    const canvasX = centerX + (pt.x - 0.5) * size;
    const canvasY = centerY - (pt.y - Math.sqrt(3) / 6) * size;

    ctx.beginPath();
    ctx.arc(canvasX, canvasY, pointSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Complete ternary plot renderer
 */
export function renderTernaryPlot(
  ctx: CanvasRenderingContext2D,
  data: TernaryData,
  options: TernaryOptions = {}
): void {
  const {
    labelA = 'A',
    labelB = 'B',
    labelC = 'C',
    showGrid = true,
    showLabels = true,
    style = {}
  } = options;

  const {
    pointSize = 6,
    color = '#00f2ff',
    gridColor = 'rgba(255, 255, 255, 0.2)',
    gridWidth = 1,
    gridDivisions = 10
  } = style;

  // Calculate plot area
  const canvas = ctx.canvas;
  const padding = 80;
  const availableSize = Math.min(canvas.width, canvas.height) - padding * 2;
  const size = availableSize * 0.8;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Draw components
  if (showGrid) {
    drawTernaryGrid(ctx, centerX, centerY, size, gridDivisions, gridColor, gridWidth);
  }

  drawTernaryOutline(ctx, centerX, centerY, size);

  if (showLabels) {
    drawTernaryLabels(ctx, centerX, centerY, size, labelA, labelB, labelC);
  }

  renderTernaryPoints(ctx, data, centerX, centerY, size, pointSize, color);
}
