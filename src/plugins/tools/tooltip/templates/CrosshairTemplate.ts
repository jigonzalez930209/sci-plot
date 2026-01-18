/**
 * Crosshair Tooltip Template
 *
 * Multi-series template for crosshair tooltips showing
 * interpolated values for all visible series at cursor position.
 *
 * @module tooltip/templates/CrosshairTemplate
 */

import type {
  CrosshairTooltip,
  TooltipTemplate,
  TooltipMeasurement,
  TooltipPosition,
  TooltipTheme,
  TooltipType,
} from "../types";

// Constants for spacing and layout
const SPACING = {
  INDICATOR_MARGIN: 8,
  MIN_LABEL_WIDTH: 60,
  LINE_SPACING: 2,
  SAFETY_BUFFER: 4,
  HEADER_SPACING: 2,
  GAP_SPACING: 2,
} as const;

/**
 * Format a number for display
 */
function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }

  const absVal = Math.abs(value);

  if (absVal === 0) return "0";
  if (absVal < 0.0001 || absVal >= 10000) {
    return value.toExponential(2);
  }
  if (absVal < 0.01) return value.toPrecision(3);
  if (absVal < 1) return value.toFixed(4);
  if (absVal < 100) return value.toFixed(3);
  return value.toFixed(1);
}

/**
 * Formatted series data for caching
 */
interface FormattedSeriesData {
  name: string;
  value: string;
  color: string;
  isInterpolated: boolean;
}

/**
 * Crosshair Multi-Series Template
 *
 * Visual layout:
 * ┌──────────────────────────────────╮
 * │  ⌖ X = 0.234                     │
 * ├──────────────────────────────────┤
 * │  ● Forward:   45.67 µA           │
 * │  ● Reverse:  -32.10 µA           │
 * │  ○ Baseline:   0.05 µA           │
 * ╰──────────────────────────────────╯
 */
export class CrosshairTooltipTemplate implements TooltipTemplate<CrosshairTooltip> {
  readonly id = "crosshair";
  readonly name = "Multi-Series Crosshair";
  readonly supportedTypes: TooltipType[] = ["crosshair"];

  // Cached measurements
  private cachedKey: string = "";
  private cachedMeasurement: TooltipMeasurement | null = null;
  private formattedData: {
    header: string;
    series: FormattedSeriesData[];
  } | null = null;

  /**
   * Generate cache key from data and theme
   */
  private getCacheKey(data: CrosshairTooltip, theme: TooltipTheme): string {
    const seriesHash = data.interpolatedValues
      .map((s) => `${s.seriesName}-${s.y}`)
      .join("|");
    
    return [
      data.dataX,
      seriesHash,
      theme.fontFamily,
      theme.titleFontSize,
      theme.contentFontSize,
      theme.showSeriesIndicator,
      theme.seriesIndicatorSize,
      `${theme.padding.top}-${theme.padding.right}-${theme.padding.bottom}-${theme.padding.left}`,
    ].join(":");
  }

  /**
   * Format data for rendering
   */
  private formatData(data: CrosshairTooltip): {
    header: string;
    series: FormattedSeriesData[];
  } {
    return {
      header: `⌖ X = ${formatValue(data.dataX)}`,
      series: data.interpolatedValues.map((s) => ({
        name: s.seriesName,
        value: formatValue(s.y),
        color: s.seriesColor,
        isInterpolated: s.isInterpolated,
      })),
    };
  }

  /**
   * Measure tooltip dimensions
   */
  measure(
    ctx: CanvasRenderingContext2D,
    data: CrosshairTooltip,
    theme: TooltipTheme,
  ): TooltipMeasurement {
    // Validate input
    if (!data.interpolatedValues || data.interpolatedValues.length === 0) {
      return {
        width: 100,
        height: theme.titleFontSize * theme.lineHeight,
        padding: theme.padding,
      };
    }

    // Check cache
    const cacheKey = this.getCacheKey(data, theme);
    if (cacheKey === this.cachedKey && this.cachedMeasurement) {
      return this.cachedMeasurement;
    }

    // Format data once
    this.formattedData = this.formatData(data);

    // Set title font
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;

    // Measure header
    let maxWidth = ctx.measureText(this.formattedData.header).width;

    // Content font
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;

    // Measure each series line
    const indicatorWidth = theme.showSeriesIndicator
      ? theme.seriesIndicatorSize + SPACING.INDICATOR_MARGIN
      : 0;

    for (const series of this.formattedData.series) {
      const nameWidth = ctx.measureText(`${series.name}:`).width;
      const valWidth = ctx.measureText(series.value).width;
      const lineWidth =
        indicatorWidth + Math.max(nameWidth, SPACING.MIN_LABEL_WIDTH) + valWidth;
      maxWidth = Math.max(maxWidth, lineWidth);
    }

    // Calculate height
    const headerHeight = theme.titleFontSize * theme.lineHeight;
    const seriesCount = this.formattedData.series.length;
    const contentHeight =
      seriesCount * (theme.contentFontSize * theme.lineHeight + SPACING.LINE_SPACING);

    this.cachedMeasurement = {
      width: maxWidth + SPACING.SAFETY_BUFFER,
      height: headerHeight + theme.headerGap + contentHeight,
      padding: theme.padding,
    };
    this.cachedKey = cacheKey;

    return this.cachedMeasurement;
  }

  /**
   * Render the tooltip
   */
  render(
    ctx: CanvasRenderingContext2D,
    data: CrosshairTooltip,
    position: TooltipPosition,
    measurement: TooltipMeasurement,
    theme: TooltipTheme,
  ): void {
    // Validate input
    if (!data.interpolatedValues || data.interpolatedValues.length === 0) {
      return;
    }

    // Use cached formatted data if available
    const formatted = this.formattedData || this.formatData(data);

    const { x, y } = position;
    const { padding } = theme;

    let currentY = y + padding.top;
    const contentX = x + padding.left;

    // Draw header: "⌖ X = value"
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `${theme.titleFontWeight} ${theme.titleFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textColor;

    ctx.fillText(formatted.header, contentX, currentY);

    currentY += theme.titleFontSize * theme.lineHeight + SPACING.HEADER_SPACING;

    // Draw separator
    if (theme.showHeaderSeparator) {
      ctx.strokeStyle = theme.separatorColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(contentX, currentY + theme.headerGap / 2);
      ctx.lineTo(contentX + measurement.width, currentY + theme.headerGap / 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    currentY += theme.headerGap + SPACING.GAP_SPACING;

    // Draw each series
    ctx.font = `400 ${theme.contentFontSize}px ${theme.fontFamily}`;

    for (const series of formatted.series) {
      let itemX = contentX;

      // Series indicator
      if (theme.showSeriesIndicator && theme.seriesIndicatorSize > 0) {
        const indicatorY = currentY + theme.contentFontSize / 2;
        const radius = theme.seriesIndicatorSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(itemX + radius, indicatorY, radius, 0, Math.PI * 2);

        if (series.isInterpolated) {
          ctx.strokeStyle = series.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = series.color;
          ctx.fill();
        }
        ctx.restore();

        itemX += theme.seriesIndicatorSize + SPACING.INDICATOR_MARGIN;
      }

      // Series name
      ctx.fillStyle = theme.textSecondaryColor;
      ctx.fillText(`${series.name}:`, itemX, currentY);

      const nameWidth = ctx.measureText(`${series.name}: `).width;
      const labelOffset = Math.max(nameWidth, SPACING.MIN_LABEL_WIDTH);

      // Series value
      ctx.fillStyle = theme.textColor;
      ctx.fillText(series.value, itemX + labelOffset, currentY);

      currentY += theme.contentFontSize * theme.lineHeight + SPACING.LINE_SPACING;
    }

    ctx.restore();
  }
}

// Export singleton instance
export const crosshairTooltipTemplate = new CrosshairTooltipTemplate();
