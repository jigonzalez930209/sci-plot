/**
 * @fileoverview LaTeX rendering plugin for Sci Plot
 * @module plugins/latex
 *
 * This plugin provides native LaTeX rendering without external dependencies.
 * It supports common mathematical notation including:
 * - Greek letters (\alpha, \beta, \gamma, etc.)
 * - Superscripts and subscripts (x^2, H_2O)
 * - Fractions (\frac{a}{b})
 * - Square roots (\sqrt{x})
 * - Mathematical operators (\sum, \int, \partial, etc.)
 *
 * @example
 * ```typescript
 * import { PluginLaTeX } from 'sci-plot/plugins';
 *
 * const latex = PluginLaTeX({
 *   fontSize: 16,
 *   fontFamily: 'serif',
 *   color: '#000000'
 * });
 *
 * await chart.use(latex);
 *
 * // Use with axis labels
 * chart.xAxis.label = '\\Delta E = mc^2';
 * chart.yAxis.label = '\\frac{\\partial^2 y}{\\partial x^2}';
 *
 * // Use with annotations
 * chart.addAnnotation({
 *   type: 'text',
 *   text: '\\sum_{i=1}^{n} x_i',
 *   latex: true
 * });
 * ```
 */

import type { ChartPlugin, PluginContext } from '../types';
import type {
  PluginLaTeXConfig,
  LaTeXPluginAPI,
  LaTeXDimensions,
} from './types';
import { parseLaTeX } from './parser';
import { renderNodes } from './renderer';

/**
 * LaTeX rendering plugin
 */
export function PluginLaTeX(config: PluginLaTeXConfig = {}): ChartPlugin<PluginLaTeXConfig> {
  const defaultConfig: Required<PluginLaTeXConfig> = {
    fontSize: 14,
    fontFamily: 'serif',
    color: '#000000',
    enableCache: true,
    customSymbols: {},
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Cache for parsed LaTeX
  const parseCache = new Map<string, ReturnType<typeof parseLaTeX>>();
  // Cache for measured dimensions
  const measureCache = new Map<string, LaTeXDimensions>();

  /**
   * Clear all caches
   */
  function clearCache(): void {
    parseCache.clear();
    measureCache.clear();
  }

  /**
   * Get parsed AST for LaTeX string (with caching)
   */
  function getParsed(latex: string): ReturnType<typeof parseLaTeX> {
    if (!finalConfig.enableCache) {
      return parseLaTeX(latex);
    }

    let parsed = parseCache.get(latex);
    if (!parsed) {
      parsed = parseLaTeX(latex);
      parseCache.set(latex, parsed);
    }
    return parsed;
  }

  /**
   * Render LaTeX to canvas
   */
  function render(
    latex: string,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    options: Partial<PluginLaTeXConfig> = {}
  ): LaTeXDimensions {
    const renderConfig = { ...finalConfig, ...options };
    const nodes = getParsed(latex);

    const dims = renderNodes(nodes, {
      ctx,
      x,
      y,
      fontSize: renderConfig.fontSize,
      fontFamily: renderConfig.fontFamily,
      color: renderConfig.color,
      scale: 1,
    });

    return dims;
  }

  /**
   * Measure LaTeX dimensions without rendering
   */
  function measure(
    latex: string,
    options: Partial<PluginLaTeXConfig> = {}
  ): LaTeXDimensions {
    const cacheKey = `${latex}:${options.fontSize || finalConfig.fontSize}`;

    if (finalConfig.enableCache && measureCache.has(cacheKey)) {
      return measureCache.get(cacheKey)!;
    }

    const renderConfig = { ...finalConfig, ...options };
    const nodes = getParsed(latex);

    // Create offscreen canvas for measurement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { width: 0, height: 0, baseline: 0 };
    }

    const dims = renderNodes(nodes, {
      ctx,
      x: 0,
      y: 0,
      fontSize: renderConfig.fontSize,
      fontFamily: renderConfig.fontFamily,
      color: renderConfig.color,
      scale: 1,
    });

    if (finalConfig.enableCache) {
      measureCache.set(cacheKey, dims);
    }

    return dims;
  }

  // API exposed to chart
  const api: LaTeXPluginAPI = {
    render,
    measure,
    clearCache,
  };

  return {
    manifest: {
      name: 'sci-plot-latex',
      version: '1.0.0',
      description: 'Native LaTeX rendering for mathematical expressions',
      provides: ['latex'],
      tags: ['latex', 'math', 'typography'],
    },

    onInit(ctx: PluginContext) {
      // API is accessed via plugin bridge, no need to set property on chart which has only a getter
      ctx.log.info('LaTeX plugin initialized');
    },

    onDestroy(ctx: PluginContext) {
      clearCache();
      ctx.log.info('LaTeX plugin destroyed');
    },

    api,
  };
}

// Type exports
export type { PluginLaTeXConfig, LaTeXPluginAPI, LaTeXDimensions };

