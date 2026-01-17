/**
 * @fileoverview Broken Axis plugin for displaying discontinuous data ranges.
 * @module plugins/broken-axis
 */

import type {
  PluginBrokenAxisConfig,
  BrokenAxisAPI,
  AxisBreak,
} from './types';
import type {
  ChartPlugin,
  PluginContext,
  PluginManifest,
} from '../types';
import { BrokenAxisScale } from './BrokenAxisScale';

const manifest: PluginManifest = {
  name: 'scichart-broken-axis',
  version: '1.0.1',
  description: 'Support for gaps/breaks in axes with visual indicators',
  provides: ['broken-axis', 'coordinate-transform'],
  tags: ['axis', 'layout', 'visualization'],
};

export function PluginBrokenAxis(
  config: PluginBrokenAxisConfig = { axes: {} }
): ChartPlugin<PluginBrokenAxisConfig> {
  // Default enabled to true if not specified
  if (config.enabled === undefined) config.enabled = true;
  
  let ctx: PluginContext | null = null;
  let originalXScale: any = null;
  let brokenXScale: BrokenAxisScale | null = null;
  
  // Storage for raw data of series to allow re-transformation on zoom
  const rawDataStore = new Map<string, { x: Float32Array; y: Float32Array }>();

  function updateScales() {
    if (!ctx || !config.enabled) return;
    
    const options = config.axes.default || config.axes.xAxis;
    if (options && brokenXScale) {
        brokenXScale.updateBreaks(options.breaks);
        // On break change, we must re-transform everything
        applyTransformations();
    }
  }

  function applyTransformations() {
      if (!ctx || !brokenXScale || !config.enabled) return;
      const chart = ctx.chart as any;
      const [min, max] = brokenXScale.domain;
      const range = max - min;

      for (const [id, raw] of rawDataStore.entries()) {
          const transformedX = new Float32Array(raw.x.length);
          for (let i = 0; i < raw.x.length; i++) {
              transformedX[i] = min + brokenXScale.mapToRatio(raw.x[i]) * range;
          }
          // Call the TRUE underlying updateSeries to avoid hijacking loop
          if (chart._originalUpdateSeries) {
              chart._originalUpdateSeries(id, { x: transformedX, y: raw.y });
          }
      }
  }

  function drawBreakSymbols(pCtx: PluginContext) {
    const { render } = pCtx;
    const { ctx2d, plotArea } = render;
    if (!ctx2d || !brokenXScale) return;

    for (const [axisId, options] of Object.entries(config.axes)) {
        const orientation = (axisId === 'default' || axisId === 'xAxis') ? 'horizontal' : 'vertical';
        if (orientation !== 'horizontal') continue;

        options.breaks.forEach(b => {
             const pxStart = brokenXScale!.transform(b.start);
             const pxEnd = brokenXScale!.transform(b.end);
             const midPx = (pxStart + pxEnd) / 2;

             ctx2d.save();
             ctx2d.lineWidth = 1;
             ctx2d.strokeStyle = options.symbolColor || '#ff00ff';

             if (orientation === 'horizontal') {
                drawSymbol(ctx2d, midPx, plotArea.y, options.defaultSymbol || 'diagonal', 'top');
                drawSymbol(ctx2d, midPx, plotArea.y + plotArea.height, options.defaultSymbol || 'diagonal', 'bottom');
             }
             ctx2d.restore();
        });
    }
  }

  function drawSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, type: string, edge: string) {
      const size = 6;
      ctx.beginPath();
      if (type === 'diagonal') {
          ctx.moveTo(x - size, y + size/2);
          ctx.lineTo(x + size, y - size/2);
          ctx.moveTo(x - size + 3, y + size/2);
          ctx.lineTo(x + size + 3, y - size/2);
      } else if (type === 'zigzag') {
          ctx.moveTo(x - size, y);
          ctx.lineTo(x - size/2, y - size/2);
          ctx.lineTo(x + size/2, y + size/2);
          ctx.lineTo(x + size, y);
      } else {
          if (edge === 'top' || edge === 'bottom') {
              ctx.moveTo(x - size, y - 2); ctx.lineTo(x + size, y + 2);
              ctx.moveTo(x - size, y - 6); ctx.lineTo(x + size, y - 2);
          } else {
              ctx.moveTo(x - 2, y - size); ctx.lineTo(x + 2, y + size);
          }
      }
      ctx.stroke();
  }

  const api: BrokenAxisAPI = {
      addBreak(axisId, b) {
          if (!config.axes[axisId]) config.axes[axisId] = { breaks: [] };
          config.axes[axisId].breaks.push(b);
          updateScales();
          ctx?.requestRender();
      },
      clearBreaks(axisId) {
          if (config.axes[axisId]) config.axes[axisId].breaks = [];
          updateScales();
          ctx?.requestRender();
      },
      setEnabled(enabled: boolean) {
          const wasEnabled = config.enabled;
          config.enabled = enabled;
          
          if (ctx && wasEnabled !== enabled) {
              const chart = ctx.chart;
              if (enabled) {
                  originalXScale = (chart as any).xScale;
                  brokenXScale = new BrokenAxisScale(originalXScale, (config.axes.default || config.axes.xAxis)?.breaks || []);
                  chart.setXScale(brokenXScale);
                  applyTransformations();
              } else {
                  if (originalXScale) {
                      chart.setXScale(originalXScale);
                      brokenXScale = null;
                      // Restore original data to series
                      for (const [id, raw] of rawDataStore.entries()) {
                          (chart as any)._originalUpdateSeries(id, raw);
                      }
                  }
              }
          }
          ctx?.requestRender();
      },
      getBreaks(axisId: string): AxisBreak[] {
          return config.axes[axisId]?.breaks || [];
      },
      updateConfig(newConfig: Partial<PluginBrokenAxisConfig>) {
          Object.assign(config, newConfig);
          updateScales();
          ctx?.requestRender();
      }
  };

  const pluginApi: BrokenAxisAPI & Record<string, unknown> = api as any;

  return {
    manifest,
    onInit(pCtx) {
      ctx = pCtx;
      const chart = ctx.chart as any;
      chart.brokenAxis = pluginApi;

      // Hijack and Save original methods
      chart._originalUpdateSeries = chart.updateSeries.bind(chart);
      chart._originalAddSeries = chart.addSeries.bind(chart);
      chart._originalAppendData = chart.appendData.bind(chart);

      chart.updateSeries = (id: string, data: any) => {
          if (data.x && data.y) {
              rawDataStore.set(id, { 
                  x: data.x instanceof Float32Array ? data.x : new Float32Array(data.x), 
                  y: data.y instanceof Float32Array ? data.y : new Float32Array(data.y) 
              });
          }
          
          if (config.enabled && brokenXScale && data.x) {
              const x = data.x;
              const transformedX = new Float32Array(x.length);
              const [min, max] = brokenXScale.domain;
              const range = max - min;
              for (let i = 0; i < x.length; i++) {
                  transformedX[i] = min + brokenXScale.mapToRatio(x[i]) * range;
              }
              chart._originalUpdateSeries(id, { ...data, x: transformedX });
          } else {
              chart._originalUpdateSeries(id, data);
          }
      };

      chart.addSeries = (options: any) => {
          if (options.id && options.data?.x && options.data?.y) {
               rawDataStore.set(options.id, { 
                   x: options.data.x instanceof Float32Array ? options.data.x : new Float32Array(options.data.x), 
                   y: options.data.y instanceof Float32Array ? options.data.y : new Float32Array(options.data.y) 
               });
          }
          
          if (config.enabled && brokenXScale && options.data?.x) {
              const x = options.data.x;
              const transformedX = new Float32Array(x.length);
              const [min, max] = brokenXScale.domain;
              const range = max - min;
              for (let i = 0; i < x.length; i++) {
                  transformedX[i] = min + brokenXScale.mapToRatio(x[i]) * range;
              }
              chart._originalAddSeries({ ...options, data: { ...options.data, x: transformedX } });
          } else {
              chart._originalAddSeries(options);
          }
      };

      chart.appendData = (id: string, x: any, y: any) => {
          const raw = rawDataStore.get(id);
          if (raw) {
              const newX = x instanceof Float32Array ? x : [x];
              const newY = y instanceof Float32Array ? y : [y];
              const combinedX = new Float32Array(raw.x.length + newX.length);
              const combinedY = new Float32Array(raw.y.length + newY.length);
              combinedX.set(raw.x);
              combinedX.set(newX, raw.x.length);
              combinedY.set(raw.y);
              combinedY.set(newY, raw.y.length);
              rawDataStore.set(id, { x: combinedX, y: combinedY });
          }

          if (config.enabled && brokenXScale) {
              const xArr = x instanceof Array ? new Float32Array(x) : (typeof x === 'number' ? new Float32Array([x]) : x);
              const transformedX = new Float32Array(xArr.length);
              const [min, max] = brokenXScale.domain;
              const range = max - min;
              for (let i = 0; i < xArr.length; i++) {
                  transformedX[i] = min + brokenXScale.mapToRatio(xArr[i]) * range;
              }
              chart._originalAppendData(id, transformedX, y);
          } else {
              chart._originalAppendData(id, x, y);
          }
      };

      if (config.enabled) {
          originalXScale = chart.xScale; 
          const options = config.axes.default || config.axes.xAxis;
          brokenXScale = new BrokenAxisScale(originalXScale, options?.breaks || []);
          chart.setXScale(brokenXScale);
      }
    },
    onDestroy() {
        if (ctx) {
            const chart = (ctx.chart as any);
            delete chart.brokenAxis;
            if (originalXScale) {
                chart.setXScale(originalXScale);
            }
            // CLEANUP hijacked methods
            chart.updateSeries = chart._originalUpdateSeries;
            chart.addSeries = chart._originalAddSeries;
            chart.appendData = chart._originalAppendData;
            delete chart._originalUpdateSeries;
            delete chart._originalAddSeries;
            delete chart._originalAppendData;
        }
        ctx = null;
        rawDataStore.clear();
    },
    onRenderOverlay(pCtx) {
        if (config.enabled) drawBreakSymbols(pCtx);
    },
    onViewChange() {
        if (config.enabled && brokenXScale) {
            applyTransformations();
        }
    },
    api: pluginApi
  };
}

export default PluginBrokenAxis;

export type {
  PluginBrokenAxisConfig,
  BrokenAxisAPI,
  AxisBreak,
  BrokenAxisOptions,
} from './types';
