/**
 * SciChartEngine Engine - Loading Indicator Plugin
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
 * SciChartEngine Loading Plugin
 * 
 * Adds sleek loading indicators and progress trackers to the chart.
 */
export function PluginLoading(_config: PluginLoadingConfig = {}): ChartPlugin<PluginLoadingConfig> {
    return {
        manifest: manifestLoading,

        onInit(_ctx: PluginContext) {   
        },

        onDestroy(_ctx: PluginContext) {
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
