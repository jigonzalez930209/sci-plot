/**
 * SciChart Engine - Plugin System
 * 
 * Comprehensive plugin architecture for extending chart functionality.
 * 
 * Features:
 * - Complete lifecycle hooks (init, render, data, view, interaction, destroy)
 * - Rich plugin context with access to all chart internals
 * - Plugin storage for persistent state
 * - Dependency management between plugins
 * - Global registry for third-party plugins
 * - Built-in plugins for common use cases
 * 
 * @packageDocumentation
 * @module plugins
 */

// ============================================
// Core Types
// ============================================
export type {
    // Manifest & Metadata
    PluginVersion,
    PluginCapability,
    PluginManifest,

    // Context Types
    PluginContext,
    RenderContext,
    CoordinateContext,
    DataContext,
    UIContext,
    EventContext,
    PluginStorage,
    PluginLogger,
    OverlayOptions,
    NotificationOptions,
    PickResult,

    // Hook Event Types
    BeforeRenderEvent,
    AfterRenderEvent,
    InteractionEvent,
    ViewChangeEvent,
    SeriesChangeEvent,
    DataUpdateEvent,

    // Plugin Types
    ChartPlugin,
    PluginFactory,
    TypedPlugin,

    // Manager Types
    PluginManager,
    PluginRegistry,
    PluginRegistryEntry,
} from "./types";

// ============================================
// Core Implementation
// ============================================
export { createPluginContext } from "./PluginContext";
export type { ContextDependencies } from "./PluginContext";

export { PluginManagerImpl } from "./PluginManager";

// ============================================
// Registry
// ============================================
export {
    getPluginRegistry,
    registerPlugin,
    definePlugin,
    defineAndRegister,
    loadPlugin,
    listPluginsByCategory,
    validateManifest,
    checkPluginCompatibility,
} from "./PluginRegistry";

// ============================================
// Built-in Plugins
// ============================================
export {
    // Individual plugins
    CrosshairPlugin,
    StatsPlugin,
    WatermarkPlugin,
    GridHighlightPlugin,
    DataLoggerPlugin,
    DirectionIndicatorPlugin,

    // Plugin collection
    BuiltinPlugins,

    // Plugin configs
    type CrosshairPluginConfig,
    type StatsPluginConfig,
    type WatermarkPluginConfig,
    type GridHighlightConfig,
    type DataLoggerConfig,
    type DirectionIndicatorConfig,
} from "./builtins";

// ============================================
// Modular Plugins
// ============================================
export { Plugin3D, type Plugin3DConfig } from "./3d";
export { PluginGpu, type PluginGpuConfig } from "./gpu";
export { PluginAnalysis, type PluginAnalysisConfig } from "./analysis";
export { PluginTools, type PluginToolsConfig } from "./tools";
export { PluginAnnotations, type PluginAnnotationsConfig } from "./annotations";
export { PluginStreaming, type PluginStreamingConfig } from "./streaming";
export { PluginThemeEditor, type PluginThemeEditorConfig } from "./theme-editor";
export { PluginI18n, type PluginI18nConfig } from "./i18n";
export { PluginKeyboard, type PluginKeyboardConfig } from "./keyboard";
export { PluginClipboard, type PluginClipboardConfig } from "./clipboard";
export { PluginSync, type PluginSyncConfig } from "./sync";
export { PluginDebug, type PluginDebugConfig } from "./debug";
export { PluginLoading, type PluginLoadingConfig } from "./loading";
export { PluginDataExport, type PluginDataExportConfig } from "./data-export";
export { PluginContextMenu, type PluginContextMenuConfig } from "./context-menu";
export { PluginAnomalyDetection, type PluginAnomalyDetectionConfig, type AnomalyDetectionResult, type AnomalyPoint, type AnomalyMethod } from "./anomaly-detection";
export { PluginMLIntegration, type PluginMLIntegrationConfig, type MLIntegrationAPI, type MLModelAPI, type PredictionResult, type VisualizationConfig } from "./ml-integration";
export { PluginPatternRecognition, type PluginPatternRecognitionConfig, type PatternRecognitionAPI, type PatternMatch, type PatternDetectionResult } from "./pattern-recognition";
export { PluginRegression, type PluginRegressionConfig, type RegressionAPI, type RegressionResult, type RegressionData } from "./regression";
export { PluginRadar, type PluginRadarConfig, type RadarAPI, type RadarSeriesData, type RadarPoint } from "./radar";
export { PluginSnapshot, type PluginSnapshotConfig, type SnapshotExportAPI, type SnapshotExportOptions, type SnapshotResolution, type SnapshotFormat } from "./snapshot";

// ============================================
// Helper for creating typed plugins
// ============================================

/**
 * Helper function to create a plugin with proper typing
 * 
 * @example
 * ```typescript
 * const MyPlugin = createPlugin({
 *   manifest: {
 *     name: 'my-plugin',
 *     version: '1.0.0',
 *     provides: ['analysis'],
 *   },
 *   onInit(ctx) {
 *     ctx.log.info('Plugin initialized!');
 *   },
 *   onAfterRender(ctx, event) {
 *     // Custom rendering
 *   },
 *   api: {
 *     doSomething() { return 'done'; }
 *   }
 * });
 * 
 * chart.use(MyPlugin);
 * ```
 */
export function createPlugin<TConfig = void, TApi extends Record<string, unknown> = {}>(
    definition: import("./types").ChartPlugin<TConfig> & { api?: TApi }
): import("./types").ChartPlugin<TConfig> & { api: TApi } {
    return definition as import("./types").ChartPlugin<TConfig> & { api: TApi };
}

/**
 * Helper function to create a configurable plugin factory
 * 
 * @example
 * ```typescript
 * interface MyConfig {
 *   color: string;
 *   enabled: boolean;
 * }
 * 
 * const MyPlugin = createConfigurablePlugin<MyConfig>(
 *   {
 *     name: 'my-plugin',
 *     version: '1.0.0',
 *   },
 *   (config) => ({
 *     onInit(ctx) {
 *       ctx.log.info(`Color: ${config?.color}`);
 *     }
 *   })
 * );
 * 
 * chart.use(MyPlugin({ color: 'red', enabled: true }));
 * ```
 */
export function createConfigurablePlugin<TConfig = void>(
    manifest: import("./types").PluginManifest,
    factory: (config?: TConfig) => Omit<import("./types").ChartPlugin<TConfig>, "manifest">
): import("./types").PluginFactory<TConfig> {
    return (config?: TConfig) => ({
        ...factory(config),
        manifest,
    });
}
