/**
 * Sci Plot - Plugin Manager Implementation
 * 
 * Manages the lifecycle of plugins including:
 * - Loading and unloading plugins
 * - Dependency resolution
 * - Hook notification
 * - Configuration management
 * 
 * @module plugins/PluginManager
 */

import type { ChartTheme } from "../theme";
import type {
    ChartPlugin,
    PluginFactory,
    PluginManager,
    PluginManifest,
    PluginContext,
    BeforeRenderEvent,
    AfterRenderEvent,
    ViewChangeEvent,
    SeriesChangeEvent,
    DataUpdateEvent,
    InteractionEvent,
} from "./types";
import { createPluginContext, ContextDependencies } from "./PluginContext";

// ============================================
// Plugin Instance Wrapper
// ============================================

interface PluginInstance {
    plugin: ChartPlugin;
    context: PluginContext & { _cleanup: () => void; _getStorage: () => any };
    config: unknown;
    initialized: boolean;
}

// ============================================
// Plugin Manager Implementation
// ============================================

export class PluginManagerImpl implements PluginManager {
    private plugins = new Map<string, PluginInstance>();
    private deps: ContextDependencies;
    private destroyed = false;

    // Hook caches for performance
    private hooksBeforeRender: PluginInstance[] = [];
    private hooksAfterRender: PluginInstance[] = [];
    private hooksRenderWebGL: PluginInstance[] = [];
    private hooksRenderOverlay: PluginInstance[] = [];
    private hooksInteraction: PluginInstance[] = [];
    private hooksViewChange: PluginInstance[] = [];
    private hooksDataUpdate: PluginInstance[] = [];
    private hooksSeriesAdd: PluginInstance[] = [];
    private hooksSeriesRemove: PluginInstance[] = [];
    private hooksSeriesChange: PluginInstance[] = [];
    private hooksResize: PluginInstance[] = [];
    private hooksThemeChange: PluginInstance[] = [];
    private hooksSelectionChange: PluginInstance[] = [];
    private hooksSerialize: PluginInstance[] = [];

    constructor(dependencies: ContextDependencies) {
        this.deps = dependencies;
    }

    /**
     * Register and initialize a plugin
     */
    async use<TConfig>(
        pluginOrFactory: ChartPlugin<TConfig> | PluginFactory<TConfig>,
        config?: TConfig
    ): Promise<void> {
        if (this.destroyed) {
            console.warn("[SciPlot] Cannot add plugin to destroyed manager");
            return;
        }

        // Resolve factory to plugin instance
        const plugin = typeof pluginOrFactory === "function"
            ? pluginOrFactory(config)
            : pluginOrFactory;

        const name = plugin.manifest.name;

        // Check if already registered
        if (this.plugins.has(name)) {
            console.warn(`[SciPlot] Plugin "${name}" is already registered`);
            return;
        }

        // Validate dependencies
        const missing = await this.checkDependencies(plugin.manifest);
        if (missing.length > 0) {
            console.error(
                `[SciPlot] Plugin "${name}" requires plugins: ${missing.join(", ")}`
            );
            return;
        }

        // Create context for this plugin
        const context = createPluginContext(name, {
            ...this.deps,
            getPlugin: (n) => this.get(n),
        });

        const instance: PluginInstance = {
            plugin,
            context,
            config,
            initialized: false,
        };

        this.plugins.set(name, instance);

        // Initialize plugin
        try {
            const initResult = plugin.onInit?.(context, config);
            if (initResult instanceof Promise) {
                await initResult;
            }
            instance.initialized = true;
        } catch (e) {
            console.error(`[SciPlot] Failed to initialize plugin "${name}":`, e);
            this.plugins.delete(name);
            context._cleanup();
            return;
        }

        // Update hook caches
        this.rebuildHookCaches();
    }

    /**
     * Remove a plugin
     */
    async remove(name: string): Promise<boolean> {
        const instance = this.plugins.get(name);
        if (!instance) {
            return false;
        }

        // Check if other plugins depend on this one
        const dependents = this.findDependents(name);
        if (dependents.length > 0) {
            console.warn(
                `[SciPlot] Cannot remove plugin "${name}", required by: ${dependents.join(", ")}`
            );
            return false;
        }

        try {
            instance.plugin.onDestroy?.(instance.context);
        } catch (e) {
            console.error(`[SciPlot] Error destroying plugin "${name}":`, e);
        }

        instance.context._cleanup();
        this.plugins.delete(name);
        this.rebuildHookCaches();

        return true;
    }

    /**
     * Get a plugin instance
     */
    get<T extends ChartPlugin = ChartPlugin>(name: string): T | undefined {
        const instance = this.plugins.get(name);
        return instance?.plugin as T | undefined;
    }

    /**
     * Check if a plugin is loaded
     */
    has(name: string): boolean {
        return this.plugins.has(name);
    }

    /**
     * Get all loaded plugin names
     */
    getNames(): string[] {
        return Array.from(this.plugins.keys());
    }

    /**
     * Get all loaded plugin manifests
     */
    getManifests(): PluginManifest[] {
        return Array.from(this.plugins.values()).map((i) => i.plugin.manifest);
    }

    /**
     * Update plugin configuration
     */
    configure<TConfig>(name: string, config: TConfig): void {
        const instance = this.plugins.get(name);
        if (!instance) {
            console.warn(`[SciPlot] Plugin "${name}" not found`);
            return;
        }

        const oldConfig = instance.config;
        instance.config = config;

        try {
            (instance.plugin as ChartPlugin<TConfig>).onConfigChange?.(
                instance.context,
                config,
                oldConfig as TConfig
            );
        } catch (e) {
            console.error(`[SciPlot] Error in plugin "${name}" config change:`, e);
        }
    }

    /**
     * Notify all plugins of a hook event
     */
    notify(hook: string, ...args: unknown[]): void {
        // This is a generic notifier for non-optimized hooks
        this.plugins.forEach((instance) => {
            const handler = (instance.plugin as unknown as Record<string, unknown>)[hook];
            if (typeof handler === "function" && instance.initialized) {
                try {
                    handler.call(instance.plugin, instance.context, ...args);
                } catch (e) {
                    console.error(
                        `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" hook "${hook}":`,
                        e
                    );
                }
            }
        });
    }

    // ============================================
    // Optimized Hook Notifications
    // ============================================

    /**
     * Notify beforeRender hooks
     * Returns false if any plugin wants to skip rendering
     */
    notifyBeforeRender(event: BeforeRenderEvent): boolean {
        for (const instance of this.hooksBeforeRender) {
            try {
                const result = instance.plugin.onBeforeRender!(instance.context, event);
                if (result === false) {
                    return false;
                }
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" beforeRender:`,
                    e
                );
            }
        }
        return true;
    }

    /**
     * Notify afterRender hooks
     */
    notifyAfterRender(event: AfterRenderEvent): void {
        for (const instance of this.hooksAfterRender) {
            try {
                instance.plugin.onAfterRender!(instance.context, event);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" afterRender:`,
                    e
                );
            }
        }
    }

    /**
     * Notify WebGL render hooks
     */
    notifyRenderWebGL(event: AfterRenderEvent): void {
        for (const instance of this.hooksRenderWebGL) {
            try {
                instance.plugin.onRenderWebGL!(instance.context, event);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" renderWebGL:`,
                    e
                );
            }
        }
    }

    /**
     * Notify overlay render hooks
     */
    notifyRenderOverlay(event: AfterRenderEvent): void {
        for (const instance of this.hooksRenderOverlay) {
            try {
                instance.plugin.onRenderOverlay!(instance.context, event);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" renderOverlay:`,
                    e
                );
            }
        }
    }

    /**
     * Notify interaction hooks
     * Returns false if any plugin prevents default
     */
    notifyInteraction(event: InteractionEvent): boolean {
        for (const instance of this.hooksInteraction) {
            try {
                const result = instance.plugin.onInteraction!(instance.context, event);
                if (result === false || event.defaultPrevented) {
                    return false;
                }
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" interaction:`,
                    e
                );
            }
        }
        return true;
    }

    /**
     * Notify view change hooks
     */
    notifyViewChange(event: ViewChangeEvent): void {
        for (const instance of this.hooksViewChange) {
            try {
                instance.plugin.onViewChange!(instance.context, event);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" viewChange:`,
                    e
                );
            }
        }
    }

    /**
     * Notify data update hooks
     */
    notifyDataUpdate(event: DataUpdateEvent): void {
        for (const instance of this.hooksDataUpdate) {
            try {
                instance.plugin.onDataUpdate!(instance.context, event);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" dataUpdate:`,
                    e
                );
            }
        }
    }

    /**
     * Notify series add hooks
     */
    notifySeriesAdd(event: SeriesChangeEvent): void {
        for (const instance of this.hooksSeriesAdd) {
            try {
                instance.plugin.onSeriesAdd!(instance.context, event);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" seriesAdd:`,
                    e
                );
            }
        }
    }

    /**
     * Notify series remove hooks
     */
    notifySeriesRemove(event: SeriesChangeEvent): void {
        for (const instance of this.hooksSeriesRemove) {
            try {
                instance.plugin.onSeriesRemove!(instance.context, event);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" seriesRemove:`,
                    e
                );
            }
        }
    }

    /**
     * Notify series change hooks
     */
    notifySeriesChange(event: SeriesChangeEvent): void {
        for (const instance of this.hooksSeriesChange) {
            try {
                instance.plugin.onSeriesChange!(instance.context, event);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" seriesChange:`,
                    e
                );
            }
        }
    }

    /**
     * Notify resize hooks
     */
    notifyResize(size: { width: number; height: number }): void {
        for (const instance of this.hooksResize) {
            try {
                instance.plugin.onResize!(instance.context, size);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" resize:`,
                    e
                );
            }
        }
    }

    /**
     * Notify theme change hooks
     */
    notifyThemeChange(theme: ChartTheme): void {
        // Update UI context theme
        for (const instance of this.plugins.values()) {
            (instance.context.ui as any).updateTheme?.(theme);
        }

        for (const instance of this.hooksThemeChange) {
            try {
                instance.plugin.onThemeChange!(instance.context, theme);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" themeChange:`,
                    e
                );
            }
        }
    }

    /**
     * Notify selection change hooks
     */
    notifySelectionChange(points: readonly import("../core/selection").SelectedPoint[]): void {
        for (const instance of this.hooksSelectionChange) {
            try {
                instance.plugin.onSelectionChange!(instance.context, points);
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" selectionChange:`,
                    e
                );
            }
        }
    }

    /**
     * Collect serialization data from plugins
     */
    collectSerializationData(): Record<string, unknown> {
        const data: Record<string, unknown> = {};

        for (const instance of this.hooksSerialize) {
            try {
                const pluginData = instance.plugin.onSerialize!(instance.context);
                if (pluginData !== undefined) {
                    data[instance.plugin.manifest.name] = {
                        data: pluginData,
                        storage: instance.context._getStorage()._serialize(),
                    };
                }
            } catch (e) {
                console.error(
                    `[SciPlot] Error in plugin "${instance.plugin.manifest.name}" serialize:`,
                    e
                );
            }
        }

        return data;
    }

    /**
     * Restore plugin data from serialization
     */
    restoreSerializationData(data: Record<string, unknown>): void {
        for (const [name, pluginData] of Object.entries(data)) {
            const instance = this.plugins.get(name);
            if (!instance) continue;

            const { data: customData, storage } = pluginData as {
                data: unknown;
                storage: Record<string, unknown>;
            };

            // Restore storage
            if (storage) {
                instance.context._getStorage()._deserialize(storage);
            }

            // Call deserialize hook
            if (instance.plugin.onDeserialize) {
                try {
                    instance.plugin.onDeserialize(instance.context, customData);
                } catch (e) {
                    console.error(
                        `[SciPlot] Error in plugin "${name}" deserialize:`,
                        e
                    );
                }
            }
        }
    }

    /**
     * Destroy all plugins and cleanup
     */
    destroy(): void {
        if (this.destroyed) return;

        // Destroy in reverse order (LIFO)
        const names = Array.from(this.plugins.keys()).reverse();
        for (const name of names) {
            const instance = this.plugins.get(name)!;
            try {
                instance.plugin.onDestroy?.(instance.context);
            } catch (e) {
                console.error(`[SciPlot] Error destroying plugin "${name}":`, e);
            }
            instance.context._cleanup();
        }

        this.plugins.clear();
        this.clearHookCaches();
        this.destroyed = true;
    }

    // ============================================
    // Private Methods
    // ============================================

    private async checkDependencies(manifest: PluginManifest): Promise<string[]> {
        const missing: string[] = [];

        if (manifest.dependencies) {
            for (const dep of manifest.dependencies) {
                if (!this.plugins.has(dep)) {
                    missing.push(dep);
                }
            }
        }

        return missing;
    }

    private findDependents(name: string): string[] {
        const dependents: string[] = [];

        this.plugins.forEach((instance, pluginName) => {
            const deps = instance.plugin.manifest.dependencies || [];
            if (deps.includes(name)) {
                dependents.push(pluginName);
            }
        });

        return dependents;
    }

    private rebuildHookCaches(): void {
        const instances = Array.from(this.plugins.values()).filter((i) => i.initialized);

        this.hooksBeforeRender = instances.filter((i) => i.plugin.onBeforeRender);
        this.hooksAfterRender = instances.filter((i) => i.plugin.onAfterRender);
        this.hooksRenderWebGL = instances.filter((i) => i.plugin.onRenderWebGL);
        this.hooksRenderOverlay = instances.filter((i) => i.plugin.onRenderOverlay);
        this.hooksInteraction = instances.filter((i) => i.plugin.onInteraction);
        this.hooksViewChange = instances.filter((i) => i.plugin.onViewChange);
        this.hooksDataUpdate = instances.filter((i) => i.plugin.onDataUpdate);
        this.hooksSeriesAdd = instances.filter((i) => i.plugin.onSeriesAdd);
        this.hooksSeriesRemove = instances.filter((i) => i.plugin.onSeriesRemove);
        this.hooksSeriesChange = instances.filter((i) => i.plugin.onSeriesChange);
        this.hooksResize = instances.filter((i) => i.plugin.onResize);
        this.hooksThemeChange = instances.filter((i) => i.plugin.onThemeChange);
        this.hooksSelectionChange = instances.filter((i) => i.plugin.onSelectionChange);
        this.hooksSerialize = instances.filter((i) => i.plugin.onSerialize);
    }

    private clearHookCaches(): void {
        this.hooksBeforeRender = [];
        this.hooksAfterRender = [];
        this.hooksRenderWebGL = [];
        this.hooksRenderOverlay = [];
        this.hooksInteraction = [];
        this.hooksViewChange = [];
        this.hooksDataUpdate = [];
        this.hooksSeriesAdd = [];
        this.hooksSeriesRemove = [];
        this.hooksSeriesChange = [];
        this.hooksResize = [];
        this.hooksThemeChange = [];
        this.hooksSelectionChange = [];
        this.hooksSerialize = [];
    }
}
