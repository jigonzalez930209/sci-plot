/**
 * Animated Chart Navigation
 * 
 * Provides animated versions of zoom, pan, and auto-scale operations.
 */

import type { Bounds, ZoomOptions, AxisOptions } from "../../types";
import type { Scale } from "../../scales";
import type { EventEmitter } from "../EventEmitter";
import type { ChartEventMap } from "../../types";
import {
  AnimationEngine,
  type ChartAnimationConfig,
  type AnimationHandle,
} from "../animation";

export interface AnimatedNavigationContext {
  viewBounds: Bounds;
  yScales: Map<string, Scale>;
  yAxisOptionsMap: Map<string, AxisOptions>;
  xAxisOptions: AxisOptions;
  primaryYAxisId: string;
  getPlotArea: () => { x: number; y: number; width: number; height: number };
  events: EventEmitter<ChartEventMap>;
  requestRender: () => void;
  series: Map<string, { 
    isVisible(): boolean; 
    getBounds(): Bounds | null; 
    getYAxisId(): string | undefined;
    getType(): string;
  }>;
  animationEngine: AnimationEngine;
  animationConfig: ChartAnimationConfig;
}

// Track active animation handles
let currentZoomAnimation: AnimationHandle | null = null;
let currentAutoScaleAnimation: AnimationHandle | null = null;

/**
 * Apply animated zoom to the chart
 */
export function applyAnimatedZoom(
  ctx: AnimatedNavigationContext,
  options: ZoomOptions & { animate?: boolean }
): AnimationHandle | null {
  const shouldAnimate = 
    options.animate !== false && 
    ctx.animationConfig.enabled && 
    ctx.animationConfig.zoom.enabled;

  // Cancel any existing zoom animation
  if (currentZoomAnimation?.isRunning()) {
    currentZoomAnimation.cancel();
  }

  const hasBars = Array.from(ctx.series.values()).some(s => s.isVisible() && s.getType() === 'bar');
  
  // Calculate target bounds
  const targetXMin = options.x ? options.x[0] : ctx.viewBounds.xMin;
  const targetXMax = options.x ? options.x[1] : ctx.viewBounds.xMax;
  let targetYMin = options.y ? options.y[0] : ctx.viewBounds.yMin;
  let targetYMax = options.y ? options.y[1] : ctx.viewBounds.yMax;

  if (hasBars && options.y) {
    targetYMin = 0;
  }

  // Determine target axis for Y zoom
  const targetAxisId = options.axisId;

  if (!shouldAnimate) {
    // Immediate application
    if (options.x) {
      ctx.viewBounds.xMin = targetXMin;
      ctx.viewBounds.xMax = targetXMax;
    }

    // Update Y scales based on target axis
    if (options.y) {
      if (targetAxisId) {
        // Zoom specific axis only
        const scale = ctx.yScales.get(targetAxisId);
        if (scale) {
          scale.setDomain(targetYMin, targetYMax);
          // Sync primary viewBounds if this is the primary axis
          if (targetAxisId === ctx.primaryYAxisId) {
            ctx.viewBounds.yMin = targetYMin;
            ctx.viewBounds.yMax = targetYMax;
          }
        }
      } else {
        // Global zoom: apply to all axes proportionally
        const oldRange = ctx.viewBounds.yMax - ctx.viewBounds.yMin;
        const newRange = targetYMax - targetYMin;
        const factor = oldRange > 0 ? newRange / oldRange : 1;
        const offsetPct = oldRange > 0 ? (targetYMin - ctx.viewBounds.yMin) / oldRange : 0;

        ctx.yScales.forEach((scale, id) => {
          if (id === ctx.primaryYAxisId) return; // Will sync with viewBounds later
          const sRange = scale.domain[1] - scale.domain[0];
          const sNewMin = hasBars ? 0 : (scale.domain[0] + offsetPct * sRange);
          const sNewMax = hasBars 
            ? (scale.domain[0] + factor * sRange)
            : (sNewMin + factor * sRange);
          scale.setDomain(sNewMin, sNewMax);
        });

        ctx.viewBounds.yMin = targetYMin;
        ctx.viewBounds.yMax = targetYMax;
        
        // Update primary scale
        const primaryScale = ctx.yScales.get(ctx.primaryYAxisId);
        if (primaryScale) {
          primaryScale.setDomain(targetYMin, targetYMax);
        }
      }
    }

    ctx.events.emit("zoom", {
      x: [ctx.viewBounds.xMin, ctx.viewBounds.xMax],
      y: [ctx.viewBounds.yMin, ctx.viewBounds.yMax],
    });
    ctx.requestRender();
    return null;
  }

  // Animated zoom
  const startBounds = { ...ctx.viewBounds };
  const startScaleDomains = new Map<string, [number, number]>();
  ctx.yScales.forEach((scale, id) => {
    startScaleDomains.set(id, [...scale.domain] as [number, number]);
  });

  currentZoomAnimation = ctx.animationEngine.animate({
    duration: ctx.animationConfig.zoom.duration,
    easing: ctx.animationConfig.zoom.easing,
    onUpdate: (progress) => {
      if (options.x) {
        ctx.viewBounds.xMin = startBounds.xMin + (targetXMin - startBounds.xMin) * progress;
        ctx.viewBounds.xMax = startBounds.xMax + (targetXMax - startBounds.xMax) * progress;
      }

      // Update Y scales based on target axis
      if (options.y) {
        if (targetAxisId) {
          // Animate specific axis only
          const scale = ctx.yScales.get(targetAxisId);
          const startDomain = startScaleDomains.get(targetAxisId);
          if (scale && startDomain) {
            const newMin = startDomain[0] + (targetYMin - startDomain[0]) * progress;
            const newMax = startDomain[1] + (targetYMax - startDomain[1]) * progress;
            scale.setDomain(newMin, newMax);
            
            // Sync primary viewBounds if this is the primary axis
            if (targetAxisId === ctx.primaryYAxisId) {
              ctx.viewBounds.yMin = newMin;
              ctx.viewBounds.yMax = newMax;
            }
          }
        } else {
          // Animate all axes proportionally
          ctx.viewBounds.yMin = startBounds.yMin + (targetYMin - startBounds.yMin) * progress;
          ctx.viewBounds.yMax = startBounds.yMax + (targetYMax - startBounds.yMax) * progress;

          ctx.yScales.forEach((scale, id) => {
            if (id === ctx.primaryYAxisId) {
              scale.setDomain(ctx.viewBounds.yMin, ctx.viewBounds.yMax);
            } else {
              // Non-primary axes follow proportionally
              const start = startScaleDomains.get(id)!;
              const oldRange = startBounds.yMax - startBounds.yMin;
              const newRange = ctx.viewBounds.yMax - ctx.viewBounds.yMin;
              const factor = oldRange > 0 ? newRange / oldRange : 1;
              const offsetPct = oldRange > 0 ? (ctx.viewBounds.yMin - startBounds.yMin) / oldRange : 0;
              const sRange = start[1] - start[0];
              const newMin = start[0] + offsetPct * sRange;
              const newMax = newMin + factor * sRange;
              scale.setDomain(newMin, newMax);
            }
          });
        }
      }

      ctx.requestRender();
    },
    onComplete: () => {
      ctx.events.emit("zoom", {
        x: [ctx.viewBounds.xMin, ctx.viewBounds.xMax],
        y: [ctx.viewBounds.yMin, ctx.viewBounds.yMax],
      });
      currentZoomAnimation = null;
    },
  });

  return currentZoomAnimation;
}

/**
 * Apply animated auto-scale to fit all data
 */
export function applyAnimatedAutoScale(
  ctx: AnimatedNavigationContext,
  animate: boolean = true
): AnimationHandle | null {
  if (ctx.series.size === 0) return null;

  // Calculate target bounds
  let xMin = Infinity;
  let xMax = -Infinity;
  
  const yAxisBounds = new Map<string, { min: number, max: number }>();
  ctx.yScales.forEach((_, id) => {
    yAxisBounds.set(id, { min: Infinity, max: -Infinity });
  });

  let hasValidData = false;

  ctx.series.forEach((s) => {
    if (!s.isVisible()) return;

    const b = s.getBounds();
    if (
      b &&
      isFinite(b.xMin) &&
      isFinite(b.xMax) &&
      isFinite(b.yMin) &&
      isFinite(b.yMax)
    ) {
      xMin = Math.min(xMin, b.xMin);
      xMax = Math.max(xMax, b.xMax);
      
      const axisId = s.getYAxisId() || ctx.primaryYAxisId;
      const yBounds = yAxisBounds.get(axisId);
      if (yBounds) {
        yBounds.min = Math.min(yBounds.min, b.yMin);
        yBounds.max = Math.max(yBounds.max, b.yMax);
      }
      
      hasValidData = true;
    }
  });

  if (!hasValidData) return null;

  // Calculate targets with padding
  const MAX_VAL = 1e15;
  const MIN_VAL = -1e15;

  let targetXMin = ctx.viewBounds.xMin;
  let targetXMax = ctx.viewBounds.xMax;
  let targetYMin = ctx.viewBounds.yMin;
  let targetYMax = ctx.viewBounds.yMax;

  if (ctx.xAxisOptions.auto) {
    let xRange = xMax - xMin;
    if (xRange <= 0 || !isFinite(xRange)) xRange = Math.abs(xMin) * 0.1 || 1;
    const xPad = Math.min(xRange * 0.05, 1e10);
    targetXMin = Math.max(MIN_VAL, xMin - xPad);
    targetXMax = Math.min(MAX_VAL, xMax + xPad);
  }

  const primaryBounds = yAxisBounds.get(ctx.primaryYAxisId);
  const primaryOpts = ctx.yAxisOptionsMap.get(ctx.primaryYAxisId);
  
  if (primaryBounds && primaryOpts?.auto && primaryBounds.min !== Infinity) {
    let yRange = primaryBounds.max - primaryBounds.min;
    if (yRange <= 0 || !isFinite(yRange)) yRange = Math.abs(primaryBounds.min) * 0.1 || 1;
    const yPad = Math.min(yRange * 0.05, 1e10);
    targetYMin = Math.max(MIN_VAL, primaryBounds.min - yPad);
    targetYMax = Math.min(MAX_VAL, primaryBounds.max + yPad);
  }

  const shouldAnimate = 
    animate && 
    ctx.animationConfig.enabled && 
    ctx.animationConfig.autoScale.enabled;

  // Cancel any existing auto-scale animation
  if (currentAutoScaleAnimation?.isRunning()) {
    currentAutoScaleAnimation.cancel();
  }

  if (!shouldAnimate) {
    // Immediate application
    ctx.viewBounds.xMin = targetXMin;
    ctx.viewBounds.xMax = targetXMax;
    ctx.viewBounds.yMin = targetYMin;
    ctx.viewBounds.yMax = targetYMax;

    ctx.yScales.forEach((scale, id) => {
      const bounds = yAxisBounds.get(id);
      const opts = ctx.yAxisOptionsMap.get(id);
      if (bounds && opts?.auto && bounds.min !== Infinity) {
        let yRange = bounds.max - bounds.min;
        if (yRange <= 0 || !isFinite(yRange)) yRange = Math.abs(bounds.min) * 0.1 || 1;
        const yPad = Math.min(yRange * 0.05, 1e10);
        scale.setDomain(
          Math.max(MIN_VAL, bounds.min - yPad),
          Math.min(MAX_VAL, bounds.max + yPad)
        );
      }
    });

    ctx.events.emit("autoScale", undefined);
    ctx.requestRender();
    return null;
  }

  // Animated auto-scale
  const startBounds = { ...ctx.viewBounds };
  const startScaleDomains = new Map<string, [number, number]>();
  ctx.yScales.forEach((scale, id) => {
    startScaleDomains.set(id, [...scale.domain] as [number, number]);
  });

  // Calculate target domains for all scales
  const targetScaleDomains = new Map<string, [number, number]>();
  ctx.yScales.forEach((scale, id) => {
    const bounds = yAxisBounds.get(id);
    const opts = ctx.yAxisOptionsMap.get(id);
    if (bounds && opts?.auto && bounds.min !== Infinity) {
      let yRange = bounds.max - bounds.min;
      if (yRange <= 0 || !isFinite(yRange)) yRange = Math.abs(bounds.min) * 0.1 || 1;
      const yPad = Math.min(yRange * 0.05, 1e10);
      targetScaleDomains.set(id, [
        Math.max(MIN_VAL, bounds.min - yPad),
        Math.min(MAX_VAL, bounds.max + yPad)
      ]);
    } else {
      targetScaleDomains.set(id, [...scale.domain] as [number, number]);
    }
  });

  currentAutoScaleAnimation = ctx.animationEngine.animate({
    duration: ctx.animationConfig.autoScale.duration,
    easing: ctx.animationConfig.autoScale.easing,
    onUpdate: (progress) => {
      ctx.viewBounds.xMin = startBounds.xMin + (targetXMin - startBounds.xMin) * progress;
      ctx.viewBounds.xMax = startBounds.xMax + (targetXMax - startBounds.xMax) * progress;
      ctx.viewBounds.yMin = startBounds.yMin + (targetYMin - startBounds.yMin) * progress;
      ctx.viewBounds.yMax = startBounds.yMax + (targetYMax - startBounds.yMax) * progress;

      // Update all Y scales
      ctx.yScales.forEach((scale, id) => {
        const start = startScaleDomains.get(id)!;
        const target = targetScaleDomains.get(id)!;
        scale.setDomain(
          start[0] + (target[0] - start[0]) * progress,
          start[1] + (target[1] - start[1]) * progress
        );
      });

      ctx.requestRender();
    },
    onComplete: () => {
      ctx.events.emit("autoScale", undefined);
      currentAutoScaleAnimation = null;
    },
  });

  return currentAutoScaleAnimation;
}

/**
 * Animate to specific bounds
 */
export function animateToBounds(
  ctx: AnimatedNavigationContext,
  targetBounds: Partial<Bounds>,
  options?: {
    duration?: number;
    easing?: string;
  }
): AnimationHandle {
  const startBounds = { ...ctx.viewBounds };
  const finalBounds = {
    xMin: targetBounds.xMin ?? ctx.viewBounds.xMin,
    xMax: targetBounds.xMax ?? ctx.viewBounds.xMax,
    yMin: targetBounds.yMin ?? ctx.viewBounds.yMin,
    yMax: targetBounds.yMax ?? ctx.viewBounds.yMax,
  };

  return ctx.animationEngine.animate({
    duration: options?.duration ?? ctx.animationConfig.zoom.duration,
    easing: (options?.easing as any) ?? ctx.animationConfig.zoom.easing,
    onUpdate: (progress) => {
      ctx.viewBounds.xMin = startBounds.xMin + (finalBounds.xMin - startBounds.xMin) * progress;
      ctx.viewBounds.xMax = startBounds.xMax + (finalBounds.xMax - startBounds.xMax) * progress;
      ctx.viewBounds.yMin = startBounds.yMin + (finalBounds.yMin - startBounds.yMin) * progress;
      ctx.viewBounds.yMax = startBounds.yMax + (finalBounds.yMax - startBounds.yMax) * progress;

      // Sync primary Y scale
      const primaryScale = ctx.yScales.get(ctx.primaryYAxisId);
      if (primaryScale) {
        primaryScale.setDomain(ctx.viewBounds.yMin, ctx.viewBounds.yMax);
      }

      ctx.requestRender();
    },
    onComplete: () => {
      ctx.events.emit("zoom", {
        x: [ctx.viewBounds.xMin, ctx.viewBounds.xMax],
        y: [ctx.viewBounds.yMin, ctx.viewBounds.yMax],
      });
    },
  });
}

/**
 * Check if any navigation animation is running
 */
export function isNavigationAnimating(): boolean {
  return (
    (currentZoomAnimation?.isRunning() ?? false) ||
    (currentAutoScaleAnimation?.isRunning() ?? false)
  );
}

/**
 * Cancel all navigation animations
 */
export function cancelNavigationAnimations(): void {
  currentZoomAnimation?.cancel();
  currentAutoScaleAnimation?.cancel();
  currentZoomAnimation = null;
  currentAutoScaleAnimation = null;
}
