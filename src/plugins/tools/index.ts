/**
 * SciChart Engine - Interactive Tools Plugin
 * 
 * Provides specialized interaction tools:
 * - Delta Tool: Measurement between two points
 * - Peak Tool: Peak detection and area under curve
 * - Enhanced Tooltips: Point and crosshair tooltips
 * 
 * @module plugins/tools
 */

import { DeltaTool } from "./delta-tool";
import { PeakTool } from "./peak-tool";
import { TooltipManager } from "./tooltip";
import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginToolsConfig {
    /** Enable Delta measurement tool */
    enableDeltaTool?: boolean;
    /** Enable Peak detection tool */
    enablePeakTool?: boolean;
    /** Use advanced tooltip manager */
    useEnhancedTooltips?: boolean;
}

const manifestTools: PluginManifest = {
    name: "scichart-tools",
    version: "1.0.0",
    description: "Advanced interaction and measurement tools for scichart-engine",
    provides: ["interaction"],
    tags: ["delta-tool", "peak-tool", "tooltip"],
};

/**
 * SciChart Tools Plugin
 * 
 * Adds specialized tools for scientific data analysis and interaction.
 */
export function PluginTools(_config: PluginToolsConfig = {}): ChartPlugin<PluginToolsConfig> {
    let deltaTool: DeltaTool | null = null;
    let peakTool: PeakTool | null = null;
    let tooltipManager: TooltipManager | null = null;

    return {
        manifest: manifestTools,

        onInit(ctx: PluginContext) {
            ctx.log.info("SciChart Tools Plugin Initialized");

            // Bridge between PluginContext and DeltaTool/PeakTool context
            const toolContext = {
                container: ctx.ui.container,
                getPlotArea: () => ctx.render.plotArea,
                getViewBounds: () => ctx.data.getViewBounds(),
                getYBounds: (id?: string) => ctx.data.getYAxisBounds(id),
                requestRender: () => ctx.requestRender(),
                getSeries: () => ctx.data.getAllSeries() as any,
                onMeasure: (m: any) => ctx.events.emit('measure', m)
            };

            if (_config.enableDeltaTool ?? true) {
                deltaTool = new DeltaTool(toolContext);
            }
            if (_config.enablePeakTool ?? true) {
                peakTool = new PeakTool(toolContext);
            }
            if (_config.useEnhancedTooltips ?? true) {
                // Safely access internal properties for bridge
                const chart = ctx.chart as any;
                tooltipManager = new TooltipManager({
                    overlayCtx: ctx.render.ctx2d!,
                    chartTheme: ctx.ui.theme,
                    getPlotArea: () => ctx.render.plotArea,
                    getSeries: () => ctx.data.getAllSeries() as any,
                    pixelToDataX: (px) => ctx.coords.pixelToDataX(px),
                    pixelToDataY: (py) => ctx.coords.pixelToDataY(py),
                    getXScale: () => chart.xScale,
                    getYScales: () => chart.yScales,
                    getViewBounds: () => ctx.data.getViewBounds(),
                    options: chart.initialOptions?.tooltip,
                });
            }
        },

        onInteraction(_ctx, event) {
            // Forward relevant events to tools if they don't have their own listeners
            if (event.type === 'mousemove') {
                tooltipManager?.handleCursorMove(event.pixelX, event.pixelY);
            }
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChart Tools Plugin Destroyed");
            deltaTool?.destroy();
            peakTool?.destroy();
            tooltipManager?.destroy();
            deltaTool = null;
            peakTool = null;
            tooltipManager = null;
        },

        api: {
            setMode(mode: 'delta' | 'peak' | 'none') {
                deltaTool?.disable();
                peakTool?.disable();

                if (mode === 'delta') deltaTool?.enable();
                if (mode === 'peak') peakTool?.enable();
            },
            getDeltaTool: () => deltaTool,
            getPeakTool: () => peakTool,
            getTooltipManager: () => tooltipManager
        }
    };
}

export { DeltaTool, PeakTool, TooltipManager };
export default PluginTools;
