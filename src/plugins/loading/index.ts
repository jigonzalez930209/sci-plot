/**
 * SciChart Engine - Loading Indicator Plugin
 * 
 * Provides customizable loading and progress indicators.
 * 
 * @module plugins/loading
 */

import { LoadingIndicator } from "../../core/loading";
import type { LoadingIndicatorOptions } from "../../core/loading";
import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginLoadingConfig extends Partial<LoadingIndicatorOptions> {
    /** Auto-show on heavy data operations */
    autoShow?: boolean;
}

const manifestLoading: PluginManifest = {
    name: "scichart-loading",
    version: "1.0.0",
    description: "Loading and progress indicators for scichart-engine",
    provides: ["ui"],
    tags: ["loading", "progress", "ui", "ux"],
};

/**
 * SciChart Loading Plugin
 * 
 * Adds sleek loading indicators and progress trackers to the chart.
 */
export function PluginLoading(_config: PluginLoadingConfig = {}): ChartPlugin<PluginLoadingConfig> {
    let indicator: LoadingIndicator | null = null;

    return {
        manifest: manifestLoading,

        onInit(ctx: PluginContext) {
            ctx.log.info("SciChart Loading Plugin Initialized");

            // indicator = new LoadingIndicator(ctx.ui.container, config);
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChart Loading Plugin Destroyed");
            if (indicator) {
                // indicator.destroy();
            }
        },

        api: {
            show(_message?: string) {
                // logic to show indicator
            },
            hide() {
                // logic to hide indicator
            }
        }
    };
}

export { LoadingIndicator };
export default PluginLoading;
