/**
 * SciChartEngine Engine - Debug Overlay Plugin
 * 
 * Provides performance metrics and debugging information.
 * 
 * @module plugins/debug
 */

export * from "../../core/debug";
import type { PluginManifest, ChartPlugin, PluginContext, AfterRenderEvent } from "../types";

export interface PluginDebugConfig extends Partial<DebugOverlayOptions> {
    /** Show FPS counter */
    showFPS?: boolean;
    /** Show data stats */
    showDataStats?: boolean;
}

const manifestDebug: PluginManifest = {
    name: "scichart-debug",
    version: "1.0.0",
    description: "Performance monitoring and debugging overlay for scichart-engine",
    provides: ["ui"],
    tags: ["debug", "performance", "fps", "monitoring"],
};

import { DebugOverlay, DebugOverlayOptions } from "../../core/debug";
import { ChartStatistics } from "../../core/ChartStatistics";

/**
 * SciChartEngine Debug Plugin
 * 
 * Adds a useful overlay with real-time performance metrics and debugging info.
 */
export function PluginDebug(config: PluginDebugConfig = {}): ChartPlugin<PluginDebugConfig> {
    let overlay: DebugOverlay | null = null;
    let stats: ChartStatistics | null = null;

    let ctx: PluginContext;

    return {
        manifest: manifestDebug,

        onInit(pCtx: PluginContext) {
            ctx = pCtx;
            ctx.log.info("SciChartEngine Debug Plugin Initialized");

            // Initialize FPS/Performance overlay
            if (config.showFPS !== false) {
                overlay = new DebugOverlay(ctx.ui.container, {
                    showFps: true,
                    showMemory: true,
                    showPointCount: true,
                    updateInterval: 500,
                    ...config
                });
                overlay.show();

                // Set stats provider for more detailed info
                overlay.setStatsProvider(() => {
                    const series = ctx.data.getAllSeries();
                    const pointCount = series.reduce((sum, s) => sum + s.getData().x.length, 0);

                    return {
                        pointCount,
                        seriesCount: series.length,
                        viewBounds: ctx.data.getViewBounds(),
                        devicePixelRatio: (ctx.chart as any).dpr || 1,
                    };
                });
            }

            // Initialize data statistics panel
            if (config.showDataStats) {
                stats = new ChartStatistics(
                    ctx.ui.container,
                    (ctx.chart as any).theme,
                    (ctx.chart as any).series
                );
            }
        },

        onBeforeRender() {
            if (overlay) {
                overlay.recordFrame();
            }
        },

        onAfterRender(_ctx, event: AfterRenderEvent) {
            if (overlay) {
                overlay.update({
                    frameTime: (event as any).frameTime || event.renderTime,
                });
            }
        },

        onRenderOverlay(_ctx) {
            if (stats) {
                stats.update(ctx.data.getViewBounds());
            }
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChartEngine Debug Plugin Destroyed");
            if (overlay) {
                overlay.destroy();
                overlay = null;
            }
            if (stats) {
                stats.destroy();
                stats = null;
            }
        }
    };
}

export { DebugOverlay };
export default PluginDebug;
