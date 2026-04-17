import type { 
  PluginMLIntegrationConfig, 
  MLIntegrationAPI, 
  MLModelAPI, 
  PredictionResult, 
  VisualizationConfig
} from './types';
import { 
  createNativeModel,
  nativeFFT, 
  nativeMean, 
  nativeStandardDeviation, 
  nativeCorrelation 
} from './native-algorithms';
import type { 
  PluginManifest, 
  ChartPlugin, 
  PluginContext,
  AfterRenderEvent
} from '../types';

const manifestML: PluginManifest = {
  name: "velo-plot-ml-integration",
  version: "1.0.0",
  description: "Machine Learning Integration Bridge for Sci Plot",
  provides: ["ml", "prediction", "inference"],
  tags: ["ml", "ai", "analysis"],
};

export function PluginMLIntegration(
  userConfig: Partial<PluginMLIntegrationConfig> = {}
): ChartPlugin<PluginMLIntegrationConfig> {
  let ctx: PluginContext | null = null;
  const models = new Map<string, MLModelAPI>();
  const activeVisualizations = new Map<string, { result: PredictionResult, config: VisualizationConfig }>();

  // Register initial models from config
  if (userConfig.models) {
    userConfig.models.forEach(m => models.set(m.id, createNativeModel(m)));
  }

  const api: MLIntegrationAPI & Record<string, unknown> = {
    registerModel(model: MLModelAPI) {
      if (!model.id) {
        ctx?.log.error("Cannot register model without id");
        return;
      }
      models.set(model.id, model);
      ctx?.log.info(`Model registered: ${model.name || 'Unnamed'} (${model.id})`);
    },

    async runInference(modelId: string, seriesId: string) {
      const model = models.get(modelId);
      if (!model) throw new Error(`Model not found: ${modelId}`);

      const seriesData = ctx?.data.getSeriesData(seriesId);
      if (!seriesData) throw new Error(`Series not found: ${seriesId}`);

      // Convert to Float32Array for model compatibility
      const data = new Float32Array(seriesData.y);

      const result = await model.predict({ data });
      // Attach X values for visualization
      result.xValues = seriesData.x;
      return result;
    },

    visualizeResults(result: PredictionResult, config: VisualizationConfig = {}) {
      const vizId = `ml-viz-${Math.random().toString(36).substr(2, 9)}`;
      activeVisualizations.set(vizId, { 
        result, 
        config: { ...userConfig.defaultVisualization, ...config } 
      });
      ctx?.requestRender();
      return vizId;
    },

    clearResults(visualizationId?: string) {
      if (visualizationId) {
        activeVisualizations.delete(visualizationId);
      } else {
        activeVisualizations.clear();
      }
      ctx?.requestRender();
    },

    stats: {
      fft: nativeFFT,
      mean: nativeMean,
      standardDeviation: nativeStandardDeviation,
      correlation: nativeCorrelation
    }
  };

  function drawMLVisualizations(pCtx: PluginContext) {
    const { render, coords } = pCtx;
    const { ctx2d } = render;
    if (!ctx2d) return;

    activeVisualizations.forEach((viz) => {
      const { result, config } = viz;
      const { output, xValues, confidence } = result;
      if (!xValues) return;

      const n = Math.min(xValues.length, output.length);

      ctx2d.save();

      // 1. Draw Confidence Interval (as filled area)
      if (config.showConfidenceInterval && confidence && confidence.length === n) {
        ctx2d.beginPath();
        const opacity = config.intervalOpacity ?? 0.2;
        ctx2d.fillStyle = (config.lineStyle?.color || '#3b82f6') + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        
        // Forward: upper bound
        for (let i = 0; i < n; i++) {
          const px = coords.dataToPixelX(xValues[i]);
          const py = coords.dataToPixelY(output[i] + confidence[i]);
          if (i === 0) ctx2d.moveTo(px, py);
          else ctx2d.lineTo(px, py);
        }
        
        // Backward: lower bound
        for (let i = n - 1; i >= 0; i--) {
          const px = coords.dataToPixelX(xValues[i]);
          const py = coords.dataToPixelY(output[i] - confidence[i]);
          ctx2d.lineTo(px, py);
        }
        
        ctx2d.closePath();
        ctx2d.fill();
      }

      // 2. Draw Prediction Line
      ctx2d.beginPath();
      ctx2d.strokeStyle = config.lineStyle?.color || '#3b82f6';
      ctx2d.lineWidth = config.lineStyle?.width || 2;
      if (config.lineStyle?.dash) ctx2d.setLineDash(config.lineStyle.dash);

      for (let i = 0; i < n; i++) {
        const px = coords.dataToPixelX(xValues[i]);
        const py = coords.dataToPixelY(output[i]);
        if (i === 0) ctx2d.moveTo(px, py);
        else ctx2d.lineTo(px, py);
      }
      ctx2d.stroke();

      ctx2d.restore();
    });
  }

  return {
    manifest: manifestML,

    onInit(c: PluginContext) {
      ctx = c;
    },

    onRenderOverlay(pCtx: PluginContext, _event: AfterRenderEvent) {
      drawMLVisualizations(pCtx);
    },

    api
  };
}

export default PluginMLIntegration;

export type { 
  PluginMLIntegrationConfig, 
  MLIntegrationAPI, 
  MLModelAPI, 
  PredictionResult, 
  VisualizationConfig 
} from './types';