/**
 * SciPlot Engine - Loading Indicator Plugin
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
    name: "sci-plot-loading",
    version: "1.0.0",
    description: "Loading and progress indicators for sci-plot",
    provides: ["ui"],
    tags: ["loading", "progress", "ui", "ux"],
};

/**
 * SciPlot Loading Plugin
 * 
 * Adds sleek loading indicators and progress trackers to the chart.
 */
export function PluginLoading(_config: PluginLoadingConfig = {}): ChartPlugin<PluginLoadingConfig> {
    let indicator: LoadingIndicator | null = null;

    return {
        manifest: manifestLoading,

        onInit(ctx: PluginContext) {   
            // Create the indicator using the container from the UI context
            indicator = new LoadingIndicator(ctx.ui.container, {
                ..._config,
                // Inherit theme colors if not explicitly provided
                accentColor: _config.accentColor || (ctx.ui.theme.isDark ? '#00f2ff' : '#00b4d8'),
            });

            // If autoShow is enabled (or by default during init), show it
            if (_config.autoShow !== false) {
                indicator.show(_config.message || 'Initializing Chart...');
            }

            // Optional: Auto-hide on first successful render WITH data
            if (_config.autoHide !== false) {
                const off = ctx.events.on('render', () => {
                   const hasData = ctx.data.getAllSeries().some(s => s.getPointCount() > 0);
                   if (hasData) {
                       indicator?.hide();
                       off();
                   }
                });
            }
        },

        onDestroy(_ctx: PluginContext) {
            indicator?.destroy();
            indicator = null;
        },

        api: {
            show(message?: string) {
                indicator?.show(message);
            },
            hide() {
                indicator?.hide();
            },
            setProgress(progress: number, message?: string) {
                indicator?.setProgress(progress, message);
            },
            setMessage(message: string) {
                indicator?.setMessage(message);
            },
            getIndicator: () => indicator
        }
    };
}

export { LoadingIndicator };
export default PluginLoading;
