/**
 * Series Buffer Management and Stacking Logic
 */
import { Series } from "../../Series";
import {
  interleaveData,
  interleaveStepData,
  interleaveBandData,
  interleaveBarData,
  calculateBarWidth,
  interleaveHeatmapData,
  getColormap,
  interleaveCandlestickData,
  interleavePolarLineData,
  interleavePolarFillData,
  interleaveErrorData,
  interleaveBoxPlotData,
  interleaveWaterfallData,
} from "../../../renderer";

export function updateSeriesBuffer(ctx: any, s: Series): void {
  const stackId = s.getStackId();
  if (stackId) {
    refreshStack(ctx, stackId);
    return;
  }

  const d = s.getData();
  const seriesType = s.getType();
  if (seriesType !== "heatmap" && seriesType !== "polar" && (!d || d.x.length === 0)) return;
  const seriesId = s.getId();

  if (seriesType === "band" || seriesType === "area") {
    const y2 = seriesType === "area" ? new Float32Array(d.x.length).fill(0) : (d.y2 || new Float32Array(d.x.length).fill(0));
    ctx.renderer.createBuffer(seriesId, interleaveBandData(d.x, d.y, y2));
  } else if (seriesType === "bar") {
    const barWidth = (s.getStyle() as any).barWidth ?? calculateBarWidth(d.x);
    ctx.renderer.createBuffer(seriesId, interleaveBarData(d.x, d.y, barWidth));
  } else if (seriesType === "heatmap") {
    updateHeatmapBuffer(ctx, s);
  } else if (seriesType === "candlestick") {
    const d = s.getData();
    if (d.open && d.high && d.low && d.close) {
      const barWidth = (s.getStyle() as any).barWidth ?? calculateBarWidth(d.x);
      const { bullish, bearish } = interleaveCandlestickData(d.x, d.open, d.high, d.low, d.close, barWidth);
      ctx.renderer.createBuffer(`${seriesId}_bullish`, bullish);
      ctx.renderer.createBuffer(`${seriesId}_bearish`, bearish);
      // Store counts for rendering
      s.bullishCount = (bullish.length / 2);
      s.bearishCount = (bearish.length / 2);
    }
  } else if (seriesType === "boxplot") {
    const d = s.getData();
    if (d.low && d.open && d.median && d.close && d.high) {
      const barWidth = (s.getStyle() as any).barWidth ?? calculateBarWidth(d.x);
      const { lines, boxes } = interleaveBoxPlotData(d.x, d.low, d.open, d.median, d.close, d.high, barWidth);
      ctx.renderer.createBuffer(`${seriesId}_box_lines`, lines);
      ctx.renderer.createBuffer(`${seriesId}_box_faces`, boxes);
    }
  } else if (seriesType === "waterfall") {
    const d = s.getData();
    const barWidth = (s.getStyle() as any).barWidth ?? calculateBarWidth(d.x);
    const isSubtotal = (s.getStyle() as any).isSubtotal;
    const wfData = interleaveWaterfallData(d.x, d.y, barWidth, isSubtotal);
    ctx.renderer.createBuffer(`${seriesId}_wf_positive`, wfData.positiveData);
    ctx.renderer.createBuffer(`${seriesId}_wf_negative`, wfData.negativeData);
    ctx.renderer.createBuffer(`${seriesId}_wf_subtotal`, wfData.subtotalData);
    ctx.renderer.createBuffer(`${seriesId}_wf_connectors`, wfData.connectorData);
    // Store counts
    s.waterfallCounts = {
      positive: wfData.positiveCount,
      negative: wfData.negativeCount,
      subtotal: wfData.subtotalCount,
      connectors: wfData.connectorData.length / 2
    };
  } else if (seriesType === "polar") {
    updatePolarBuffer(ctx, s);
  } else {
    ctx.renderer.createBuffer(seriesId, interleaveData(d.x, d.y));
  }

  // Handle Error Bars for any series type that has error data
  if (s.hasErrorData()) {
    const d = s.getData();
    const errData = interleaveErrorData(
      d.x, d.y,
      { yError: d.yError, yErrorMinus: d.yErrorMinus, yErrorPlus: d.yErrorPlus },
      { xError: d.xError, xErrorMinus: d.xErrorMinus, xErrorPlus: d.xErrorPlus }
    );
    ctx.renderer.createBuffer(`${seriesId}_errors`, errData);
  }

  if (seriesType === "step" || seriesType === "step+scatter") {
    const stepMode = s.getStyle().stepMode ?? "after";
    ctx.renderer.createBuffer(`${seriesId}_step`, interleaveStepData(d.x, d.y, stepMode));
  }
  s.resetLastAppendCount();
}

function updatePolarBuffer(ctx: any, s: Series) {
  const polarData = s.getPolarData();
  if (!polarData || polarData.r.length === 0) return;
  
  const style = s.getStyle() as any;
  const angleMode = style.angleMode || 'degrees';
  const closePath = style.closePath !== false;
  const fill = style.fill || false;
  
  if (fill) {
    // Create filled triangles from origin
    const fillData = interleavePolarFillData(polarData, angleMode, closePath);
    ctx.renderer.createBuffer(s.getId(), fillData);
  } else {
    // Create line path
    const lineData = interleavePolarLineData(polarData, angleMode, closePath);
    ctx.renderer.createBuffer(s.getId(), lineData);
  }
}

function updateHeatmapBuffer(ctx: any, s: Series) {
  const hData = s.getHeatmapData();
  const hStyle = s.getHeatmapStyle();
  if (!hData || hData.xValues.length < 2) return;
  ctx.renderer.createBuffer(s.getId(), interleaveHeatmapData(hData.xValues, hData.yValues, hData.zValues));
  const colormapName = hStyle?.colorScale?.name || "viridis";
  ctx.renderer.createColormapTexture(`${s.getId()}_colormap`, getColormap(colormapName));
}

export function refreshStack(ctx: any, stackId: string): void {
  const stackSeries = Array.from(ctx.series.values())
    .filter((s: any) => s.getStackId() === stackId);

  let cumulativeY: Float32Array | null = null;
  for (const s of stackSeries as Series[]) {
    const d = s.getData();
    if (d.x.length === 0) continue;
    if (!cumulativeY) cumulativeY = new Float32Array(d.y.length).fill(0);
    
    const yBaseline = new Float32Array(cumulativeY);
    for (let i = 0; i < d.y.length; i++) cumulativeY[i] += d.y[i];
    
    // Stacked series always rendered as bands (fill between cumulativeY and yBaseline)
    ctx.renderer.createBuffer(s.getId(), interleaveBandData(d.x, cumulativeY, yBaseline));
    s.resetLastAppendCount();
  }
}
