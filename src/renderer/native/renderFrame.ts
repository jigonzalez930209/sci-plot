import type {
  NativeRenderOptions,
  NativeSeriesRenderData,
  ProgramBundle,
} from "./types";
import {
  calculateUniforms,
  computeSeriesColor,
  renderBand,
  renderBar,
  renderHeatmap,
  renderLine,
  renderPoints,
  renderErrorBars,
  renderBoxPlot,
} from "./draw";
import { parseColor } from "./utils";

export function renderFrame(
  gl: WebGLRenderingContext,
  canvas: HTMLCanvasElement,
  dpr: number,
  programs: ProgramBundle,
  series: NativeSeriesRenderData[],
  options: NativeRenderOptions
): void {
  const { bounds, backgroundColor = [0.1, 0.1, 0.18, 1], plotArea } = options;

  const canvasHeight = canvas.height;
  const canvasWidth = canvas.width;

  const pa = plotArea
    ? {
        x: plotArea.x * dpr,
        y: canvasHeight - (plotArea.y + plotArea.height) * dpr,
        width: plotArea.width * dpr,
        height: plotArea.height * dpr,
      }
    : {
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
      };

  gl.viewport(0, 0, canvasWidth, canvasHeight);
  gl.disable(gl.SCISSOR_TEST);
  gl.clearColor(
    backgroundColor[0],
    backgroundColor[1],
    backgroundColor[2],
    backgroundColor[3]
  );
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(pa.x, pa.y, pa.width, pa.height);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(pa.x, pa.y, pa.width, pa.height);

  if (options.plotAreaBackground) {
    gl.clearColor(
      options.plotAreaBackground[0],
      options.plotAreaBackground[1],
      options.plotAreaBackground[2],
      options.plotAreaBackground[3]
    );
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  const uniforms = calculateUniforms(bounds);

  for (const s of series) {
    // Skip invisible series or series with no data
    // Exception: boxplot and waterfall use separate buffers, not the main count
    if (!s.visible) continue;
    if (s.count === 0 && s.type !== "boxplot" && s.type !== "waterfall") continue;

    const yMin = s.yBounds ? s.yBounds.min : bounds.yMin;
    const yMax = s.yBounds ? s.yBounds.max : bounds.yMax;
    const yRange = yMax - yMin;

    const yScale = yRange > 0 ? 2 / yRange : 1;
    const yTrans = -1 - yMin * yScale;

    const seriesUniforms = {
      scale: [uniforms.scale[0], yScale] as [number, number],
      translate: [uniforms.translate[0], yTrans] as [number, number],
    };

    const color = computeSeriesColor(s.style);

    if (s.type === "scatter") {
      renderPoints(
        gl,
        programs.pointProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color,
        (s.style.pointSize ?? 4) * dpr,
        s.style.symbol
      );
    } else if (s.type === "line") {
      renderLine(
        gl,
        programs.lineProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color,
        (s.style.width ?? 1) * dpr
      );
    } else if (s.type === "line+scatter") {
      renderLine(
        gl,
        programs.lineProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color,
        (s.style.width ?? 1) * dpr
      );
      renderPoints(
        gl,
        programs.pointProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color,
        (s.style.pointSize ?? 4) * dpr,
        s.style.symbol
      );
    } else if (s.type === "step" || s.type === "step+scatter") {
      if (s.stepBuffer && s.stepCount) {
        renderLine(
          gl,
          programs.lineProgram,
          s.stepBuffer,
          s.stepCount,
          seriesUniforms,
          color,
          (s.style.width ?? 1) * dpr
        );
      } else {
        renderLine(
          gl,
          programs.lineProgram,
          s.buffer,
          s.count,
          seriesUniforms,
          color,
          (s.style.width ?? 1) * dpr
        );
      }

      if (s.type === "step+scatter") {
        renderPoints(
          gl,
          programs.pointProgram,
          s.buffer,
          s.count,
          seriesUniforms,
          color,
          (s.style.pointSize ?? 4) * dpr,
          s.style.symbol
        );
      }
    } else if (s.type === "band") {
      renderBand(
        gl,
        programs.lineProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color
      );
    } else if (s.type === "heatmap") {
      renderHeatmap(
        gl,
        programs.heatmapProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        s.zBounds,
        s.colormapTexture
      );
    } else if (s.type === "bar") {
      renderBar(
        gl,
        programs.lineProgram,
        s.buffer,
        s.count,
        seriesUniforms,
        color
      );
    } else if (s.type === "boxplot") {
      if (s.boxBuffer && s.boxLinesBuffer) {
        renderBoxPlot(
          gl,
          { line: programs.lineProgram, point: programs.pointProgram },
          {
            boxBuffer: s.boxBuffer,
            boxCount: s.boxCount || 0,
            linesBuffer: s.boxLinesBuffer,
            linesCount: s.boxLinesCount || 0,
          },
          seriesUniforms,
          s.style
        );
      }
    } else if (s.type === "waterfall") {
      // Render waterfall bars (positive, negative, subtotal) and connectors
      const positiveColor = parseColor(s.style.positiveColor || '#22c55e');
      const negativeColor = parseColor(s.style.negativeColor || '#ef4444');
      const subtotalColor = parseColor(s.style.subtotalColor || '#3b82f6');
      const connectorColor = parseColor(s.style.connectorColor || '#64748b');
      
      // Render positive bars (triangles)
      if (s.wfPositiveBuffer && s.wfPositiveCount && s.wfPositiveCount > 0) {
        gl.useProgram(programs.lineProgram.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, s.wfPositiveBuffer);
        gl.enableVertexAttribArray(programs.lineProgram.attributes.position);
        gl.vertexAttribPointer(programs.lineProgram.attributes.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(programs.lineProgram.uniforms.uScale, seriesUniforms.scale[0], seriesUniforms.scale[1]);
        gl.uniform2f(programs.lineProgram.uniforms.uTranslate, seriesUniforms.translate[0], seriesUniforms.translate[1]);
        gl.uniform4f(programs.lineProgram.uniforms.uColor!, positiveColor[0], positiveColor[1], positiveColor[2], 0.9);
        gl.drawArrays(gl.TRIANGLES, 0, s.wfPositiveCount);
      }
      
      // Render negative bars
      if (s.wfNegativeBuffer && s.wfNegativeCount && s.wfNegativeCount > 0) {
        gl.useProgram(programs.lineProgram.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, s.wfNegativeBuffer);
        gl.enableVertexAttribArray(programs.lineProgram.attributes.position);
        gl.vertexAttribPointer(programs.lineProgram.attributes.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(programs.lineProgram.uniforms.uScale, seriesUniforms.scale[0], seriesUniforms.scale[1]);
        gl.uniform2f(programs.lineProgram.uniforms.uTranslate, seriesUniforms.translate[0], seriesUniforms.translate[1]);
        gl.uniform4f(programs.lineProgram.uniforms.uColor!, negativeColor[0], negativeColor[1], negativeColor[2], 0.9);
        gl.drawArrays(gl.TRIANGLES, 0, s.wfNegativeCount);
      }
      
      // Render subtotal bars
      if (s.wfSubtotalBuffer && s.wfSubtotalCount && s.wfSubtotalCount > 0) {
        gl.useProgram(programs.lineProgram.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, s.wfSubtotalBuffer);
        gl.enableVertexAttribArray(programs.lineProgram.attributes.position);
        gl.vertexAttribPointer(programs.lineProgram.attributes.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(programs.lineProgram.uniforms.uScale, seriesUniforms.scale[0], seriesUniforms.scale[1]);
        gl.uniform2f(programs.lineProgram.uniforms.uTranslate, seriesUniforms.translate[0], seriesUniforms.translate[1]);
        gl.uniform4f(programs.lineProgram.uniforms.uColor!, subtotalColor[0], subtotalColor[1], subtotalColor[2], 0.9);
        gl.drawArrays(gl.TRIANGLES, 0, s.wfSubtotalCount);
      }
      
      // Render connectors (lines)
      if (s.style.showConnectors !== false && s.wfConnectorBuffer && s.wfConnectorCount && s.wfConnectorCount > 0) {
        gl.useProgram(programs.lineProgram.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, s.wfConnectorBuffer);
        gl.enableVertexAttribArray(programs.lineProgram.attributes.position);
        gl.vertexAttribPointer(programs.lineProgram.attributes.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(programs.lineProgram.uniforms.uScale, seriesUniforms.scale[0], seriesUniforms.scale[1]);
        gl.uniform2f(programs.lineProgram.uniforms.uTranslate, seriesUniforms.translate[0], seriesUniforms.translate[1]);
        gl.uniform4f(programs.lineProgram.uniforms.uColor!, connectorColor[0], connectorColor[1], connectorColor[2], 0.6);
        gl.lineWidth(1);
        gl.drawArrays(gl.LINES, 0, s.wfConnectorCount);
      }
      
      gl.disableVertexAttribArray(programs.lineProgram.attributes.position);
    }

    // Common: Render Error Bars if present
    if (s.errorBuffer && s.errorCount) {
      const errStyle = s.style.errorBars || {};
      const errColor = errStyle.color ? computeSeriesColor({ color: errStyle.color, opacity: errStyle.opacity ?? 0.7 }) : color;
      
      renderErrorBars(
        gl,
        programs.lineProgram,
        s.errorBuffer,
        s.errorCount,
        seriesUniforms,
        errColor as [number, number, number, number],
        errStyle.width ?? 1
      );
    }
  }
}
