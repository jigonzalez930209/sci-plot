/**
 * SciChart Engine - Core Bundle
 * 
 * Minimal bundle containing only the essential features for 2D charts.
 * Achieve ~60KB gzipped by excluding optional plugins.
 */

// ============================================
// Core exports
// ============================================
export { createChart } from "./core/Chart";
export { Series } from "./core/Series";
export { EventEmitter } from "./core/EventEmitter";
export type { Chart, ChartOptions, ExportOptions } from "./core/Chart";

// ============================================
// Basic Types
// ============================================
export type {
    AxisOptions,
    SeriesOptions,
    SeriesData,
    SeriesStyle,
    ZoomOptions,
    Point,
    Bounds,
    Range,
    ScaleType,
    SeriesType,
} from "./types";

// ============================================
// Essential Scales
// ============================================
export { LinearScale, LogScale, createScale } from "./scales";
export type { Scale } from "./scales";

// ============================================
// Principal Renderer
// ============================================
export {
    NativeWebGLRenderer,
    parseColor,
    createRenderer,
    createNativeRenderer,
} from "./renderer";
export type { IWebGLRenderer, SeriesRenderData, RenderOptions } from "./renderer";

// ============================================
// Core Themes
// ============================================
export {
    DARK_THEME,
    LIGHT_THEME,
    DEFAULT_THEME,
    createTheme,
    getThemeByName,
} from "./theme";
export type { ChartTheme, GridTheme, AxisTheme } from "./theme";

// ============================================
// Basic Animation
// ============================================
export {
    AnimationEngine,
    easings,
    DEFAULT_ANIMATION_CONFIG,
    getSharedAnimationEngine,
} from "./core/animation";

// ============================================
// Plugin System (Lightweight)
// ============================================
export {
    createPluginContext,
    PluginManagerImpl,
    getPluginRegistry,
    registerPlugin,
    definePlugin,
    createPlugin,
    createConfigurablePlugin,
} from "./plugins";

export type {
    PluginManifest,
    PluginContext,
    ChartPlugin,
    PluginFactory,
    PluginManager,
} from "./plugins";
