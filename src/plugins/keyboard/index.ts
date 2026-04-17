/**
 * Sci Plot - Keyboard Shortcuts Plugin
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
    name: "velo-plot-keyboard",
    version: "1.0.0",
    description: "Keyboard shortcut management for velo-plot",
    provides: ["interaction"],
    tags: ["keyboard", "shortcuts", "interaction", "accessibility"],
};

/**
 * SciPlot Keyboard Plugin
 * 
 * Adds support for keyboard shortcuts and hotkeys.
 */
export function PluginKeyboard(_config: PluginKeyboardConfig = {}): ChartPlugin<PluginKeyboardConfig> {
    return {
        manifest: manifestKeyboard,

        onInit(_ctx: PluginContext) {
        },

        onDestroy(_ctx: PluginContext) {
        }
    };
}

export { KeyBindingManager, DEFAULT_KEY_BINDINGS };
export default PluginKeyboard;
