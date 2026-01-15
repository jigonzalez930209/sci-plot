/**
 * Gauge Chart Renderer
 * 
 * Renders a dial/gauge with ranges and a needle.
 * Uses Canvas 2D for high-quality decorative elements.
 */

import type { GaugeData, GaugeStyle, PlotArea } from "../types";

export function drawGauge(
  ctx: CanvasRenderingContext2D,
  data: GaugeData,
  style: GaugeStyle,
  plotArea: PlotArea
): void {
  const { value, min, max } = data;
  const {
    needleColor = "#333",
    needleWidth = 3,
    ranges = [],
    radius: radiusScale = 0.8,
    startAngle = 135,
    endAngle = 405,
    showValue = true,
    valueColor = "#fff",
    valueSize = 24,
    label
  } = style;

  const centerX = plotArea.x + plotArea.width / 2;
  const centerY = plotArea.y + plotArea.height / 2;
  const maxRadius = (Math.min(plotArea.width, plotArea.height) / 2) * radiusScale;

  const totalAngle = endAngle - startAngle;
  const valueRatio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const currentAngle = (startAngle + valueRatio * totalAngle) * (Math.PI / 180);

  ctx.save();
  
  // Draw background arc
  ctx.beginPath();
  ctx.arc(centerX, centerY, maxRadius, startAngle * (Math.PI / 180), endAngle * (Math.PI / 180));
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = maxRadius * 0.2;
  ctx.lineCap = "round";
  ctx.stroke();

  // Draw defined ranges
  for (const range of ranges) {
    const rStart = Math.max(0, Math.min(1, (range.from - min) / (max - min)));
    const rEnd = Math.max(0, Math.min(1, (range.to - min) / (max - min)));
    
    ctx.beginPath();
    ctx.arc(
      centerX, 
      centerY, 
      maxRadius, 
      (startAngle + rStart * totalAngle) * (Math.PI / 180), 
      (startAngle + rEnd * totalAngle) * (Math.PI / 180)
    );
    ctx.strokeStyle = range.color;
    ctx.lineWidth = maxRadius * 0.2;
    ctx.stroke();
  }

  // Draw Ticks
  const numTicks = 11;
  for (let i = 0; i < numTicks; i++) {
    const angle = (startAngle + (i / (numTicks - 1)) * totalAngle) * (Math.PI / 180);
    const innerR = maxRadius * 0.85;
    const outerR = maxRadius * 0.95;
    
    ctx.beginPath();
    ctx.moveTo(centerX + innerR * Math.cos(angle), centerY + innerR * Math.sin(angle));
    ctx.lineTo(centerX + outerR * Math.cos(angle), centerY + outerR * Math.sin(angle));
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw Needle
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + maxRadius * 0.9 * Math.cos(currentAngle), centerY + maxRadius * 0.9 * Math.sin(currentAngle));
  ctx.strokeStyle = needleColor;
  ctx.lineWidth = needleWidth;
  ctx.lineCap = "round";
  
  // Needle shadow/glow
  ctx.shadowColor = needleColor;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Center hub
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fillStyle = needleColor;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Value text
  if (showValue) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${valueSize}px Inter, sans-serif`;
    ctx.fillStyle = valueColor;
    ctx.fillText(value.toFixed(1), centerX, centerY + maxRadius * 0.4);
    
    if (label) {
      ctx.font = `${valueSize * 0.5}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(label, centerX, centerY + maxRadius * 0.6);
    }
  }

  ctx.restore();
}
