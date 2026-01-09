/**
 * SciChart Engine - Debug Overlay Plugin
 * 
 * Provides performance metrics and debugging information.
 * 
 * @module plugins/debug
 */

import { DebugOverlay } from "../../core/debug";
import type { DebugOverlayOptions } from "../../core/debug";
import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

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

/**
 * SciChart Debug Plugin
 * 
 * Adds a useful overlay with real-time performance metrics and debugging info.
 */
export function PluginDebug(_config: PluginDebugConfig = {}): ChartPlugin<PluginDebugConfig> {
    let overlay: DebugOverlay | null = null;

    return {
        manifest: manifestDebug,

        onInit(ctx: PluginContext) {
            ctx.log.info("SciChart Debug Plugin Initialized");

            // overlay = new DebugOverlay(ctx.ui.container);
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChart Debug Plugin Destroyed");
            if (overlay) {
                // overlay.destroy();
            }
        }
    };
}

export { DebugOverlay };
export default PluginDebug;
