/**
 * Sci Plot - Built-in Plugins
 * 
 * Collection of official plugins that demonstrate the plugin system
 * capabilities and provide common functionality.
 * 
 * @module plugins/builtins
 */

export * from "./crosshair";
export * from "./stats";
export * from "./watermark";
export * from "./grid-highlight";
export * from "./data-logger";
export * from "./direction-indicator";

import { CrosshairPlugin } from "./crosshair";
import { StatsPlugin } from "./stats";
import { WatermarkPlugin } from "./watermark";
import { GridHighlightPlugin } from "./grid-highlight";
import { DataLoggerPlugin } from "./data-logger";
import { DirectionIndicatorPlugin } from "./direction-indicator";

/**
 * Plugin collection for easy registration
 */
export const BuiltinPlugins = {
    Crosshair: CrosshairPlugin,
    Statistics: StatsPlugin,
    Watermark: WatermarkPlugin,
    GridHighlight: GridHighlightPlugin,
    DataLogger: DataLoggerPlugin,
    DirectionIndicator: DirectionIndicatorPlugin,
};
