/**
 * SciChart Engine - Theme Editor Plugin
 * 
 * Provides a visual interface for editing chart themes in real-time.
 * 
 * @module plugins/theme-editor
 */

import { ThemeEditor } from "../../core/theme-editor";
import type { EditorTheme, ThemePreset } from "../../core/theme-editor";
import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginThemeEditorConfig {
    /** Initial theme to edit */
    initialTheme?: string;
    /** Position in the UI */
    position?: "left" | "right";
}

const manifestThemeEditor: PluginManifest = {
    name: "scichart-theme-editor",
    version: "1.0.0",
    description: "Visual theme editor for scichart-engine",
    provides: ["ui", "theme"],
    tags: ["theme", "editor", "styling", "ui"],
};

/**
 * SciChartEngine Theme Editor Plugin
 * 
 * Adds a visual panel to customize chart colors and styles.
 */
export function PluginThemeEditor(_config: PluginThemeEditorConfig = {}): ChartPlugin<PluginThemeEditorConfig> {
    return {
        manifest: manifestThemeEditor,

        onInit(_ctx: PluginContext) {
        },

        onDestroy(_ctx: PluginContext) {
        }
    };
}

export { ThemeEditor };
export type { EditorTheme, ThemePreset };
export default PluginThemeEditor;
