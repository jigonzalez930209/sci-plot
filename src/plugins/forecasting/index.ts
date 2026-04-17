/**
 * Sci Plot - Forecasting Plugin
 * 
 * Provides time series forecasting capabilities using native statistical models.
 */

import type { 
  PluginForecastingConfig, 
  ForecastingAPI, 
  ForecastingOptions, 
  ForecastingResult, 
  ForecastingVisualizationConfig 
} from './types';
import { calculateForecast } from './algorithms';
import type { 
  PluginManifest, 
  ChartPlugin, 
  PluginContext,
  AfterRenderEvent
} from '../types';

const manifestForecasting: PluginManifest = {
  name: "sci-plot-forecasting",
  version: "1.0.0",
  description: "Time series forecasting for sci-plot",
  provides: ["analysis", "forecasting"],
  tags: ["statistics", "forecasting", "analysis"],
};

/**
 * Forecasting Plugin for Sci Plot
 */
export function PluginForecasting(
  config: Partial<PluginForecastingConfig> = {}
): ChartPlugin<PluginForecastingConfig> {
  let ctx: PluginContext | null = null;
  const activeForecasts = new Map<string, { result: ForecastingResult, config: ForecastingVisualizationConfig }>();

  const api: ForecastingAPI = {
    forecast(data: any, options: ForecastingOptions): ForecastingResult {
      let x: any, y: any;
      
      if (Array.isArray(data)) {
        y = data;
        x = data.map((_, i) => i);
      } else if (data.x && data.y) {
        x = data.x;
        y = data.y;
      } else {
        throw new Error("Invalid data format for forecasting");
      }

      return calculateForecast(x, y, options.method, options.horizon, options.params);
    },

    async forecastSeries(seriesId: string, options: ForecastingOptions): Promise<ForecastingResult> {
      if (!ctx) throw new Error("Plugin not initialized");
      
      const series = ctx.data.getAllSeries().find(s => s.getId() === seriesId);
      if (!series) throw new Error(`Series not found: ${seriesId}`);
      
      const data = series.getData();
      return this.forecast(data, options);
    },

    visualize(result: ForecastingResult, vizConfig: ForecastingVisualizationConfig = {}) {
      const id = `forecast-${Math.random().toString(36).substr(2, 9)}`;
      const mergedConfig = {
        showLine: true,
        showConfidenceInterval: true,
        ...config.defaultVisualization,
        ...vizConfig
      };
      
      activeForecasts.set(id, { result, config: mergedConfig });
      ctx?.requestRender();
      return id;
    },

    clear(id?: string) {
      if (id) {
        activeForecasts.delete(id);
      } else {
        activeForecasts.clear();
      }
      ctx?.requestRender();
    }
  };

  function drawForecasts(pCtx: PluginContext) {
    const { render, coords } = pCtx;
    const { ctx2d } = render;
    if (!ctx2d) return;

    activeForecasts.forEach((viz) => {
      const { result, config: vizConfig } = viz;
      const { xValues, yValues, lowerBound, upperBound } = result;

      ctx2d.save();

      // 1. Draw Confidence Interval
      if (vizConfig.showConfidenceInterval && lowerBound && upperBound) {
        ctx2d.beginPath();
        const opacity = vizConfig.intervalStyle?.opacity ?? 0.15;
        const color = vizConfig.intervalStyle?.fillColor || (vizConfig.lineStyle?.color || '#3b82f6');
        
        ctx2d.fillStyle = color.startsWith('rgba') ? color : color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        
        for (let i = 0; i < xValues.length; i++) {
          const px = coords.dataToPixelX(xValues[i]);
          const py = coords.dataToPixelY(upperBound[i]);
          if (i === 0) ctx2d.moveTo(px, py);
          else ctx2d.lineTo(px, py);
        }
        
        for (let i = xValues.length - 1; i >= 0; i--) {
          const px = coords.dataToPixelX(xValues[i]);
          const py = coords.dataToPixelY(lowerBound[i]);
          ctx2d.lineTo(px, py);
        }
        
        ctx2d.closePath();
        ctx2d.fill();
      }

      // 2. Draw Forecast Line
      if (vizConfig.showLine) {
        ctx2d.beginPath();
        ctx2d.strokeStyle = vizConfig.lineStyle?.color || '#3b82f6';
        ctx2d.lineWidth = vizConfig.lineStyle?.width || 2;
        if (vizConfig.lineStyle?.dash) {
          ctx2d.setLineDash(vizConfig.lineStyle.dash);
        } else {
          ctx2d.setLineDash([5, 5]); // Default dashed for forecast
        }

        for (let i = 0; i < xValues.length; i++) {
          const px = coords.dataToPixelX(xValues[i]);
          const py = coords.dataToPixelY(yValues[i]);
          if (i === 0) ctx2d.moveTo(px, py);
          else ctx2d.lineTo(px, py);
        }
        ctx2d.stroke();
      }

      ctx2d.restore();
    });
  }

  return {
    manifest: manifestForecasting,
    onInit(c: PluginContext) {
      ctx = c;
    },
    onRenderOverlay(pCtx: PluginContext, _event: AfterRenderEvent) {
      drawForecasts(pCtx);
    },
    api
  };
}

// Re-export types and constants
export * from './types';
export * from './algorithms';
export { manifestForecasting };
