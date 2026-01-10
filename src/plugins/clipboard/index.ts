/**
 * SciChartEngine Engine - Clipboard Plugin
 * 
 * Provides clipboard integration for copying chart data and images.
 * 
 * @module plugins/clipboard
 */

export * from "../../core/clipboard";

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginClipboardConfig {
    /** Default format for copied data: 'csv' | 'json' | 'image' */
    defaultFormat?: string;
}

const manifestClipboard: PluginManifest = {
    name: "scichart-clipboard",
    version: "1.0.0",
    description: "Clipboard integration for scichart-engine",
    provides: ["interaction"],
    tags: ["clipboard", "copy", "paste", "export"],
};

/**
 * SciChartEngine Clipboard Plugin
 * 
 * Adds support for copying data and screenshots to the clipboard.
 */
export function PluginClipboard(_config: PluginClipboardConfig = {}): ChartPlugin<PluginClipboardConfig> {
    return {
        manifest: manifestClipboard,

        onInit(_ctx: PluginContext) {
        },

        onDestroy(_ctx: PluginContext) {
        },

        api: {
            copyCurrentView() {
                // Implementation would call copyToClipboard with data from current view
            }
        }
    };
}

export default PluginClipboard;
