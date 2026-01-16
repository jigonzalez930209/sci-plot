/**
 * PluginDataTransform - Implementation
 * 
 * Provides a pipeline-based data transformation system for SciChart Engine.
 */

import type { 
  PluginManifest, 
  ChartPlugin, 
  PluginContext,
} from '../types';

import type {
  PluginDataTransformConfig,
  DataTransformAPI,
  TransformOp
} from './types';

// Import algorithms from analysis plugin where available
import { 
  movingAverage, 
  derivative as calcDerivative, 
  cumulativeIntegral as calcIntegral,
  subtractBaseline
} from '../analysis';

import { Series } from '../../core/series/Series';

const manifest: PluginManifest = {
  name: 'data-transform',
  version: '1.0.0',
  description: 'Advanced data transformation pipeline',
  provides: ['data-transform', 'processing'],
  author: 'SciChart Engine Team'
};

export function PluginDataTransform(
  userConfig: Partial<PluginDataTransformConfig> = {}
): ChartPlugin<PluginDataTransformConfig> {
  const _config: Required<PluginDataTransformConfig> = {
    autoApply: false,
    createDerivativeSeries: false,
    precision: 6,
    ...userConfig
  };

  let ctx: PluginContext | null = null;
  const originalDataStore = new Map<string, { x: Float32Array; y: Float32Array }>();

  /**
   * Core transformation logic
   */
  async function applyTransform(
    seriesId: string, 
    pipeline: TransformOp[]
  ): Promise<void> {
    if (!ctx) return;
    
    const chart = ctx.chart;
    const series = chart.getSeries(seriesId) as unknown as Series;
    if (!series) {
      throw new Error(`Series ${seriesId} not found`);
    }

    // Capture original data if not already captured
    if (!originalDataStore.has(seriesId)) {
      const currentData = series.getData();
      originalDataStore.set(seriesId, {
        x: new Float32Array(currentData.x.buffer.slice(0)),
        y: new Float32Array(currentData.y.buffer.slice(0))
      });
    }

    const original = originalDataStore.get(seriesId)!;
    let x = new Float32Array(original.x.buffer.slice(0));
    let y = new Float32Array(original.y.buffer.slice(0));

    // Apply pipeline
    for (const op of pipeline) {
      const result = await executeOp(x, y, op);
      x = result.x;
      y = result.y;
    }

    // Update series with transformed data
    chart.updateSeries(seriesId, { x, y });
  }

  async function executeOp(
    x: Float32Array, 
    y: Float32Array, 
    op: TransformOp
  ): Promise<{ x: Float32Array; y: Float32Array }> {
    const params = op.parameters || (op as any);

    switch (op.type) {
      case 'normalize': {
        const range = params.range || [0, 1];
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < y.length; i++) {
          if (y[i] < min) min = y[i];
          if (y[i] > max) max = y[i];
        }
        const rangeWidth = max - min;
        const targetRange = range[1] - range[0];
        const newY = new Float32Array(y.length);
        if (rangeWidth === 0) {
          newY.fill(range[0]);
        } else {
          for (let i = 0; i < y.length; i++) {
            newY[i] = range[0] + ((y[i] - min) / rangeWidth) * targetRange;
          }
        }
        return { x, y: newY };
      }

      case 'smooth':
      case 'moving-average': {
        const window = params.window || 5;
        const smoothedY = movingAverage(y, window);
        return { x, y: smoothedY };
      }

      case 'derivative': {
        const order = params.order || 1;
        let dy = y;
        for (let i = 0; i < order; i++) {
          dy = calcDerivative(x, dy);
        }
        return { x, y: dy };
      }

      case 'integral': {
        const iy = calcIntegral(x, y);
        return { x, y: iy };
      }

      case 'scale-offset': {
        const scale = params.scale ?? 1;
        const offset = params.offset ?? 0;
        const newY = new Float32Array(y.length);
        for (let i = 0; i < y.length; i++) {
          newY[i] = y[i] * scale + offset;
        }
        return { x, y: newY };
      }

      case 'resample': {
        const points = params.points || 1000;
        return resample(x, y, points);
      }

      case 'baseline-removal': {
        const x1 = params.x1 ?? x[0];
        const x2 = params.x2 ?? x[x.length - 1];
        const result = subtractBaseline(x, y, x1, x2);
        return { x, y: result };
      }

      case 'abs': {
        const newY = y.map(v => Math.abs(v));
        return { x, y: newY };
      }

      case 'log': {
        const base = params.base || Math.E;
        const logBase = Math.log(base);
        const newY = y.map(v => v > 0 ? Math.log(v) / logBase : 0);
        return { x, y: newY };
      }

      case 'power': {
        const exp = params.exponent || 2;
        const newY = y.map(v => Math.pow(v, exp));
        return { x, y: newY };
      }

      default:
        console.warn(`Unknown transform type: ${op.type}`);
        return { x, y };
    }
  }

  function resample(
    x: Float32Array, 
    y: Float32Array, 
    numPoints: number
  ): { x: Float32Array; y: Float32Array } {
    if (x.length <= 1 || numPoints <= 1) return { x, y };
    
    const newX = new Float32Array(numPoints);
    const newY = new Float32Array(numPoints);
    
    const xMin = x[0];
    const xMax = x[x.length - 1];
    const dx = (xMax - xMin) / (numPoints - 1);
    
    for (let i = 0; i < numPoints; i++) {
      const targetX = xMin + i * dx;
      newX[i] = targetX;
      
      let low = 0;
      let high = x.length - 2;
      let found = 0;
      
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (x[mid] <= targetX && targetX <= x[mid + 1]) {
          found = mid;
          break;
        }
        if (x[mid] < targetX) low = mid + 1;
        else high = mid - 1;
      }
      
      const x0 = x[found];
      const x1 = x[found + 1];
      const y0 = y[found];
      const y1 = y[found + 1];
      const t = (targetX - x0) / (x1 - x0);
      newY[i] = y0 + t * (y1 - y0);
    }
    
    return { x: newX, y: newY };
  }

  const api: DataTransformAPI & Record<string, unknown> = {
    transform: applyTransform,
    
    resetTransform(seriesId: string) {
      if (originalDataStore.has(seriesId) && ctx) {
        const original = originalDataStore.get(seriesId)!;
        ctx.chart.updateSeries(seriesId, { x: original.x, y: original.y });
        originalDataStore.delete(seriesId);
      }
    },
    
    getOriginalData(seriesId: string) {
      return originalDataStore.get(seriesId) || null;
    }
  };

  return {
    manifest,
    onInit(context: PluginContext) {
      ctx = context;
      ctx.log?.info(`DataTransform plugin initialized (precision: ${_config.precision})`);
    },
    onDestroy() {
      originalDataStore.clear();
      ctx = null;
    },
    api
  };
}

export default PluginDataTransform;

export type {
  TransformType,
  TransformOp,
  PluginDataTransformConfig,
  DataTransformAPI
} from './types';
