/**
 * SciChart Engine - Keyboard Shortcuts Plugin
 * 
 * Provides customizable keyboard shortcut management.
 * 
 * @module plugins/keyboard
 */

import { KeyBindingManager, DEFAULT_KEY_BINDINGS } from "../../core/keybindings";
import type { KeyBinding, KeyBindingManagerOptions } from "../../core/keybindings";
import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginKeyboardConfig extends Partial<KeyBindingManagerOptions> {
    /** Additional shortcuts to register */
    extraShortcuts?: KeyBinding[];
}

const manifestKeyboard: PluginManifest = {
    name: "scichart-keyboard",
    version: "1.0.0",
    description: "Keyboard shortcut management for scichart-engine",
    provides: ["interaction"],
    tags: ["keyboard", "shortcuts", "interaction", "accessibility"],
};

/**
 * SciChart Keyboard Plugin
 * 
 * Adds support for keyboard shortcuts and hotkeys.
 */
export function PluginKeyboard(_config: PluginKeyboardConfig = {}): ChartPlugin<PluginKeyboardConfig> {
    let manager: KeyBindingManager | null = null;

    return {
        manifest: manifestKeyboard,

        onInit(ctx: PluginContext) {
            ctx.log.info("SciChart Keyboard Plugin Initialized");

            // In a real implementation, this would attach to the chart
            // manager = new KeyBindingManager(ctx.chart, config);
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChart Keyboard Plugin Destroyed");
            if (manager) {
                // manager.destroy();
            }
        }
    };
}

export { KeyBindingManager, DEFAULT_KEY_BINDINGS };
export default PluginKeyboard;
