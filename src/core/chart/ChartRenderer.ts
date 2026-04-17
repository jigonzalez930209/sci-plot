/**
 * Chart Renderer
 *
 * Core rendering logic for the chart (WebGL + Overlay).
 */

import type { Bounds, CursorOptions, AxisOptions } from "../../types";
import type { Series } from "../Series";
import type { Scale } from "../../scales";
import type {
  NativeWebGLRenderer,
  NativeSeriesRenderData as SeriesRenderData,
} from "../../renderer/NativeWebGLRenderer";
import type { OverlayRenderer } from "../OverlayRenderer";
import type { PlotArea, CursorState, ChartEventMap } from "../../types";
import type { EventEmitter } from "../EventEmitter";
import type { SelectionManager } from "../selection";
import { drawGauge } from "../../renderer/GaugeRenderer";
import { drawSankey } from "../../renderer/SankeyRenderer";

export interface RenderContext {
  webglCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  overlayCtx: CanvasRenderingContext2D;
  container: HTMLDivElement;
  series: Map<string, Series>;
  viewBounds: Bounds;
  xScale: Scale;
  yScales: Map<string, Scale>;
  yAxisOptionsMap: Map<string, AxisOptions>;
  xAxisOptions: AxisOptions;
  primaryYAxisId: string;
  renderer: NativeWebGLRenderer;
  overlay: OverlayRenderer;
  backgroundColor: [number, number, number, number];
  cursorOptions: CursorOptions | null;
  cursorPosition: { x: number; y: number } | null;
  selectionRect: { x: number; y: number; width: number; height: number } | null;
  events: EventEmitter<ChartEventMap>;
  updateSeriesBuffer: (s: Series) => void;
  getPlotArea: () => PlotArea;
  pixelToDataX: (px: number) => number;
  pixelToDataY: (py: number) => number;
  selectionManager: SelectionManager;
  hoveredSeriesId: string | null;
  layout: import("../layout").LayoutOptions;
  latexAPI?: any;
}

function setAxisRangeForRender(
  scale: Scale,
  plotArea: PlotArea,
  options: AxisOptions | undefined,
  orientation: 'x' | 'y',
  padding?: { left?: number; right?: number; top?: number; bottom?: number }
): void {
  const padLeft = padding?.left ?? 0;
  const padRight = padding?.right ?? 0;
  const padTop = padding?.top ?? 0;
  const padBottom = padding?.bottom ?? 0;

  if (orientation === 'x') {
    const left = plotArea.x + padLeft;
    const right = plotArea.x + plotArea.width - padRight;
    const invertAxis = options?.invertAxis ?? false;
    scale.setRange(invertAxis ? right : left, invertAxis ? left : right);
    return;
  }

  const top = plotArea.y + padTop;
  const bottom = plotArea.y + plotArea.height - padBottom;
  const invertAxis = options?.invertAxis ?? false;
  scale.setRange(invertAxis ? top : bottom, invertAxis ? bottom : top);
}

/**
 * Prepare series data for WebGL rendering
 */
export function prepareSeriesData(
  ctx: RenderContext,
  plotArea: PlotArea
): SeriesRenderData[] {
  const seriesData: SeriesRenderData[] = [];

  const padding = ctx.layout.plotPadding;

  setAxisRangeForRender(
    ctx.xScale,
    plotArea,
    ctx.xAxisOptions,
    'x',
    padding
  );
  ctx.xScale.setDomain(ctx.viewBounds.xMin, ctx.viewBounds.xMax);

  ctx.yScales.forEach((scale, id) => {
    const axisOptions = ctx.yAxisOptionsMap.get(id);
    setAxisRangeForRender(scale, plotArea, axisOptions, 'y', padding);
    if (id === ctx.primaryYAxisId) {
      scale.setDomain(ctx.viewBounds.yMin, ctx.viewBounds.yMax);
    }
  });

  ctx.series.forEach((s) => {
    if (s.needsBufferUpdate) {
      ctx.updateSeriesBuffer(s);
      s.needsBufferUpdate = false;
    }

    const buf = ctx.renderer.getBuffer(s.getId());
    const seriesType = s.getType();

    // Candlesticks, boxplots and waterfall use sub-buffers, so main buffer might be missing
    if (buf || seriesType === "candlestick" || seriesType === "boxplot" || seriesType === "waterfall") {
      // Determine Y-bounds for this series
      const axisId = s.getYAxisId() || ctx.primaryYAxisId;
      const scale = ctx.yScales.get(axisId);
      let yBounds: { min: number; max: number } | undefined;

      if (scale) {
        yBounds = { min: scale.domain[0], max: scale.domain[1] };
      }

      // Map area type to band for rendering (area fills to y=0)
      // Polar charts render as lines (or filled triangles if fill is enabled)
      let renderType = seriesType;
      if (seriesType === "area") {
        renderType = "band";
      } else if (seriesType === "polar") {
        // Polar renders as line by default, or triangles if filled
        const polarStyle = s.getStyle() as any;
        renderType = polarStyle?.fill ? "band" : "line";
      }

      // Base render data (only if buffer exists)
      let renderData: SeriesRenderData | null = null;

      if (buf) {
        renderData = {
          id: s.getId(),
          buffer: buf,
          count: s.getPointCount(),
          style: s.getStyle(),
          visible: s.isVisible(),
          type: renderType as any,
          yBounds,
        };
      }

      // Special count multipliers for geometry-heavy types
      if (renderData) {
        if (seriesType === "band" || seriesType === "area") {
          renderData.count = s.getPointCount() * 2;
        } else if (seriesType === "bar") {
          renderData.count = s.getPointCount() * 6;
        } else if (seriesType === "polar") {
          const polarStyle = s.getStyle() as any;
          if (polarStyle?.fill) {
            // Filled polar: triangles from origin
            const closePath = polarStyle?.closePath !== false;
            renderData.count = closePath ? s.getPointCount() * 3 : (s.getPointCount() - 1) * 3;
          } else if (polarStyle?.closePath) {
            // Line with closed path
            renderData.count = s.getPointCount() + 1;
          }
        }

        // Add step buffer for step types
        if (seriesType === "step" || seriesType === "step+scatter") {
          const stepBuf = ctx.renderer.getBuffer(`${s.getId()}_step`);
          if (stepBuf) {
            renderData.stepBuffer = stepBuf;
            // Calculate step count based on mode
            const stepMode = s.getStyle().stepMode ?? "after";
            const pointCount = s.getPointCount();
            if (stepMode === "center") {
              renderData.stepCount = 1 + (pointCount - 1) * 3;
            } else {
              renderData.stepCount = pointCount * 2 - 1;
            }
          }
        }

        // Handle Boxplot (extract both buffers)
        if (seriesType === "boxplot") {
          const linesBuf = ctx.renderer.getBuffer(`${s.getId()}_box_lines`);
          const facesBuf = ctx.renderer.getBuffer(`${s.getId()}_box_faces`);
          if (linesBuf && facesBuf) {
            renderData.boxLinesBuffer = linesBuf;
            renderData.boxLinesCount = s.getPointCount() * 10;
            renderData.boxBuffer = facesBuf;
            renderData.boxCount = s.getPointCount() * 6;
          }
        }
      }

      // For boxplot without main buffer, create renderData with sub-buffers
      if (seriesType === "boxplot" && !renderData) {
        const linesBuf = ctx.renderer.getBuffer(`${s.getId()}_box_lines`);
        const facesBuf = ctx.renderer.getBuffer(`${s.getId()}_box_faces`);
        if (linesBuf && facesBuf) {
          const axisId = s.getYAxisId() || ctx.primaryYAxisId;
          const scale = ctx.yScales.get(axisId);
          let yBounds: { min: number; max: number } | undefined;
          if (scale) {
            yBounds = { min: scale.domain[0], max: scale.domain[1] };
          }

          renderData = {
            id: s.getId(),
            buffer: linesBuf, // Use lines buffer as main buffer for reference
            count: 0, // No main buffer rendering
            style: s.getStyle(),
            visible: s.isVisible(),
            type: "boxplot" as any,
            yBounds,
            boxLinesBuffer: linesBuf,
            boxLinesCount: s.getPointCount() * 10,
            boxBuffer: facesBuf,
            boxCount: s.getPointCount() * 6,
          };
        }
      }

      // For waterfall without main buffer, create renderData with sub-buffers
      if (seriesType === "waterfall" && !renderData) {
        const positiveBuf = ctx.renderer.getBuffer(`${s.getId()}_wf_positive`);
        const negativeBuf = ctx.renderer.getBuffer(`${s.getId()}_wf_negative`);
        const subtotalBuf = ctx.renderer.getBuffer(`${s.getId()}_wf_subtotal`);
        const connectorBuf = ctx.renderer.getBuffer(`${s.getId()}_wf_connectors`);

        if (positiveBuf || negativeBuf || subtotalBuf) {
          const axisId = s.getYAxisId() || ctx.primaryYAxisId;
          const scale = ctx.yScales.get(axisId);
          let yBounds: { min: number; max: number } | undefined;
          if (scale) {
            yBounds = { min: scale.domain[0], max: scale.domain[1] };
          }

          const wfCounts = s.waterfallCounts || { positive: 0, negative: 0, subtotal: 0, connectors: 0 };

          renderData = {
            id: s.getId(),
            buffer: positiveBuf || negativeBuf || subtotalBuf!, // Use any available buffer as reference
            count: 0, // No main buffer rendering
            style: s.getStyle(),
            visible: s.isVisible(),
            type: "waterfall" as any,
            yBounds,
            wfPositiveBuffer: positiveBuf,
            wfPositiveCount: wfCounts.positive,
            wfNegativeBuffer: negativeBuf,
            wfNegativeCount: wfCounts.negative,
            wfSubtotalBuffer: subtotalBuf,
            wfSubtotalCount: wfCounts.subtotal,
            wfConnectorBuffer: connectorBuf,
            wfConnectorCount: wfCounts.connectors,
          };
        }
      }

      // Add error buffer if present (for any series type with renderData)
      if (renderData) {
        const errBuf = ctx.renderer.getBuffer(`${s.getId()}_errors`);
        if (errBuf) {
          renderData.errorBuffer = errBuf;
          // Count depends on how many segments were interleaved
          // Each segment is 2 points. interleaveErrorData handles this.
          const d = s.getData();
          let segmentsPerPoint = 0;
          if (d.yError || d.yErrorMinus || d.yErrorPlus) segmentsPerPoint++;
          if (d.xError || d.xErrorMinus || d.xErrorPlus) segmentsPerPoint++;
          renderData.errorCount = s.getPointCount() * segmentsPerPoint * 2;
        }

        if (seriesType === "heatmap") {
          const hData = s.getHeatmapData();
          const hStyle = s.getHeatmapStyle();
          if (hData) {
            // Heatmap count is 6 vertices per cell (2 triangles)
            const w = hData.xValues.length;
            const h = hData.yValues.length;
            renderData.count = (w - 1) * (h - 1) * 6;

            // Calculate Z-bounds if not provided
            let zMin = Infinity,
              zMax = -Infinity;
            for (let i = 0; i < hData.zValues.length; i++) {
              const v = hData.zValues[i];
              if (v < zMin) zMin = v;
              if (v > zMax) zMax = v;
            }
            if (zMin === zMax) {
              zMin -= 1;
              zMax += 1;
            }

            renderData.zBounds = {
              min: hStyle?.colorScale?.min ?? (zMin === Infinity ? 0 : zMin),
              max: hStyle?.colorScale?.max ?? (zMax === -Infinity ? 1 : zMax),
            };

            if (renderData.zBounds.min === renderData.zBounds.max) {
              renderData.zBounds.max = renderData.zBounds.min + 1;
            }

            // Attach texture
            const colormapId = `${s.getId()}_colormap`;
            renderData.colormapTexture = ctx.renderer.getTexture(colormapId);
          }
        }
      }

      if (seriesType === "candlestick") {
        const bullishBuf = ctx.renderer.getBuffer(`${s.getId()}_bullish`);
        if (bullishBuf) {
          seriesData.push({
            id: `${s.getId()}_bullish`,
            buffer: bullishBuf,
            count: s.bullishCount || 0,
            style: {
              ...s.getStyle(),
              color: (s.getStyle() as any).bullishColor || "#26a69a",
            },
            visible: s.isVisible(),
            type: "bar", // Using bar renderer (triangles)
            yBounds,
          });
        }
        const bearishBuf = ctx.renderer.getBuffer(`${s.getId()}_bearish`);
        if (bearishBuf) {
          seriesData.push({
            id: `${s.getId()}_bearish`,
            buffer: bearishBuf,
            count: s.bearishCount || 0,
            style: {
              ...s.getStyle(),
              color: (s.getStyle() as any).bearishColor || "#ef5350",
            },
            visible: s.isVisible(),
            type: "bar", // Using bar renderer (triangles)
            yBounds,
          });
        }
      } else if (renderData) {
        seriesData.push(renderData);
      }
    }
  });

  // Bring-to-front: If a series is hovered, move it to the end of the array
  // so it renders last (on top of all other series)
  if (ctx.hoveredSeriesId) {
    const hoveredIndex = seriesData.findIndex(sd => sd.id === ctx.hoveredSeriesId || sd.id.startsWith(ctx.hoveredSeriesId + '_'));
    if (hoveredIndex !== -1) {
      // Find all render data items related to the hovered series (including bullish/bearish for candlesticks)
      const hoveredItems: SeriesRenderData[] = [];
      for (let i = seriesData.length - 1; i >= 0; i--) {
        const item = seriesData[i];
        if (item.id === ctx.hoveredSeriesId || item.id.startsWith(ctx.hoveredSeriesId + '_')) {
          hoveredItems.unshift(seriesData.splice(i, 1)[0]);
        }
      }
      // Add hovered items at the end to render on top
      seriesData.push(...hoveredItems);
    }
  }

  return seriesData;
}

/**
 * Render overlay elements (axes, grid, annotations, etc.)
 */
export function renderOverlay(
  ctx: RenderContext,
  plotArea: PlotArea,
  primaryYScale: Scale
): void {
  const rect = ctx.container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn(
      "[SciPlot] Container has zero size in render, skipping overlay"
    );
    return;
  }

  ctx.overlay.clear();
  ctx.overlay.setLatexAPI(ctx.latexAPI);

  // Draw Title if configured
  if (ctx.layout.title?.visible && ctx.layout.title.text) {
    ctx.overlay.drawChartTitle(plotArea, ctx.layout.title);
  }

  // Detect special series types
  let hasPolarSeries = false;
  let hasGaugeSeries = false;
  let hasSankeySeries = false;

  let maxRadius = 0;
  let polarAngleMode: 'degrees' | 'radians' = 'degrees';
  let polarRadialDivisions = 5;
  let polarAngularDivisions = 12;

  ctx.series.forEach((s) => {
    const type = s.getType();
    if (!s.isVisible()) return;

    if (type === 'polar') {
      hasPolarSeries = true;
      const polarData = s.getPolarData();
      if (polarData) {
        for (let i = 0; i < polarData.r.length; i++) {
          maxRadius = Math.max(maxRadius, Math.abs(polarData.r[i]));
        }
        const style = s.getStyle() as any;
        if (style.angleMode) polarAngleMode = style.angleMode;
        if (style.radialDivisions) polarRadialDivisions = style.radialDivisions;
        if (style.angularDivisions) polarAngularDivisions = style.angularDivisions;
      }
    } else if (type === 'gauge') {
      hasGaugeSeries = true;
    } else if (type === 'sankey') {
      hasSankeySeries = true;
    }
  });

  const isSpecialChart = hasPolarSeries || hasGaugeSeries || hasSankeySeries;

  // Draw appropriate grid
  if (hasPolarSeries && maxRadius > 0) {
    ctx.overlay.drawPolarGrid(
      plotArea,
      ctx.xScale,
      primaryYScale,
      polarRadialDivisions,
      polarAngularDivisions,
      polarAngleMode
    );
  } else if (!hasGaugeSeries && !hasSankeySeries) {
    ctx.overlay.drawGrid(plotArea, ctx.xScale, primaryYScale);
  }

  // Draw series-specific overlay elements (Gauge, Sankey)
  ctx.series.forEach((s) => {
    if (!s.isVisible()) return;
    const type = s.getType();

    if (type === 'gauge') {
      const gData = s.getGaugeData();
      const gStyle = s.getGaugeStyle();
      if (gData && gStyle) {
        drawGauge(ctx.overlayCtx, gData, gStyle, plotArea);
      }
    } else if (type === 'sankey') {
      const sData = s.getSankeyData();
      const sStyle = s.getSankeyStyle();
      if (sData && sStyle) {
        drawSankey(ctx.overlayCtx, sData, sStyle, plotArea);
      }
    }
  });

  // Only draw cartesian axes if not special
  if (!isSpecialChart) {
    ctx.overlay.drawXAxis(plotArea, ctx.xScale, ctx.xAxisOptions, ctx.layout.xAxisLayout);
  }

  // Group axes by position
  const leftAxes: string[] = [];
  const rightAxes: string[] = [];

  ctx.yAxisOptionsMap.forEach((opts, id) => {
    if (opts.position === "right") rightAxes.push(id);
    else leftAxes.push(id);
  });

  // Only draw Y axes if not special
  if (!isSpecialChart) {
    // Draw Left Axes (stacked outwards)
    leftAxes.forEach((id, index) => {
      const scale = ctx.yScales.get(id);
      const opts = ctx.yAxisOptionsMap.get(id);
      if (scale && opts) {
        const offset = index * 65;
        ctx.overlay.drawYAxis(plotArea, scale, opts, "left", offset, ctx.layout.yAxisLayout);
      }
    });

    // Draw Right Axes (stacked outwards)
    rightAxes.forEach((id, index) => {
      const scale = ctx.yScales.get(id);
      const opts = ctx.yAxisOptionsMap.get(id);
      if (scale && opts) {
        const offset = index * 65;
        ctx.overlay.drawYAxis(plotArea, scale, opts, "right", offset, ctx.layout.yAxisLayout);
      }
    });
  }

  ctx.overlay.drawPlotBorder(plotArea);

  // Draw Error Bars for all series with error data
  ctx.series.forEach((s) => {
    if (s.isVisible() && s.hasErrorData()) {
      const axisId = s.getYAxisId() || ctx.primaryYAxisId;
      const scale = ctx.yScales.get(axisId);
      const yScale = scale || primaryYScale;

      ctx.overlay.drawErrorBars(plotArea, s, ctx.xScale, yScale);
    }
  });

  // Draw Selection Box
  if (ctx.selectionRect) {
    ctx.overlay.drawSelectionRect(ctx.selectionRect);
  }

  // Draw Selection Highlights
  ctx.selectionManager.render(ctx.overlayCtx, plotArea);

  // Cursor
  if (ctx.cursorOptions?.enabled && ctx.cursorPosition) {
    const valueDisplayMode = ctx.cursorOptions.valueDisplayMode ?? 'floating';

    // Only generate tooltipText if not disabled
    let tooltipText: string | undefined;
    if (valueDisplayMode !== 'disabled') {
      tooltipText = ctx.cursorOptions.formatter
        ? ctx.cursorOptions.formatter(
          ctx.pixelToDataX(ctx.cursorPosition.x),
          ctx.pixelToDataY(ctx.cursorPosition.y),
          ""
        )
        : `X: ${ctx.pixelToDataX(ctx.cursorPosition.x).toFixed(3)}\nY: ${ctx
          .pixelToDataY(ctx.cursorPosition.y)
          .toExponential(2)}`;
    }

    const cursor: CursorState = {
      enabled: true,
      x: ctx.cursorPosition.x,
      y: ctx.cursorPosition.y,
      crosshair: ctx.cursorOptions.crosshair ?? false,
      tooltipText,
      valueDisplayMode,
      cornerPosition: ctx.cursorOptions.cornerPosition ?? 'top-left',
    };
    ctx.overlay.drawCursor(plotArea, cursor, ctx.cursorOptions.lineStyle);
  }
}
