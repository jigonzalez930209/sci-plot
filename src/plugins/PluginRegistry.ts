/**
 * SciChart Engine - Global Plugin Registry
 * 
 * Provides a global registry for third-party plugins that can be
 * discovered and loaded by name without explicit imports.
 * 
 * @module plugins/PluginRegistry
 */

import type {
    PluginFactory,
    PluginManifest,
    PluginCapability,
    PluginRegistry,
    PluginRegistryEntry,
} from "./types";

// ============================================
// Global Registry Implementation
// ============================================

class PluginRegistryImpl implements PluginRegistry {
    private entries = new Map<string, PluginRegistryEntry>();

    /**
     * Register a plugin globally
     */
    register(entry: PluginRegistryEntry): void {
        const name = entry.manifest.name;

        if (this.entries.has(name)) {
            console.warn(
                `[SciChartEngine Registry] Plugin "${name}" is already registered, overwriting`
            );
        }

        this.entries.set(name, entry);
        console.info(
            `[SciChartEngine Registry] Registered plugin "${name}" v${entry.manifest.version}`
        );
    }

    /**
     * Unregister a plugin
     */
    unregister(name: string): boolean {
        const existed = this.entries.has(name);
        this.entries.delete(name);
        if (existed) {
            console.info(`[SciChartEngine Registry] Unregistered plugin "${name}"`);
        }
        return existed;
    }

    /**
     * Get a registered plugin factory by name
     */
    get(name: string): PluginFactory | undefined {
        return this.entries.get(name)?.factory;
    }

    /**
     * List all registered plugins
     */
    list(): PluginManifest[] {
        return Array.from(this.entries.values()).map((e) => e.manifest);
    }

    /**
     * Search plugins by capability
     */
    findByCapability(capability: PluginCapability): PluginManifest[] {
        const results: PluginManifest[] = [];

        this.entries.forEach((entry) => {
            if (entry.manifest.provides?.includes(capability)) {
                results.push(entry.manifest);
            }
        });

        return results;
    }

    /**
     * Search plugins by tag
     */
    findByTag(tag: string): PluginManifest[] {
        const results: PluginManifest[] = [];
        const lowerTag = tag.toLowerCase();

        this.entries.forEach((entry) => {
            if (entry.manifest.tags?.some((t) => t.toLowerCase().includes(lowerTag))) {
                results.push(entry.manifest);
            }
        });

        return results;
    }

    /**
     * Check if a plugin is registered
     */
    has(name: string): boolean {
        return this.entries.has(name);
    }

    /**
     * Get plugin count
     */
    get size(): number {
        return this.entries.size;
    }

    /**
     * Clear all registrations
     */
    clear(): void {
        this.entries.clear();
    }
}

// ============================================
// Singleton Instance
// ============================================

let registryInstance: PluginRegistryImpl | null = null;

/**
 * Get the global plugin registry singleton
 */
export function getPluginRegistry(): PluginRegistry {
    if (!registryInstance) {
        registryInstance = new PluginRegistryImpl();
    }
    return registryInstance;
}

/**
 * Register a plugin in the global registry
 * Shorthand for getPluginRegistry().register()
 */
export function registerPlugin(entry: PluginRegistryEntry): void {
    getPluginRegistry().register(entry);
}

/**
 * Create a plugin factory with manifest validation
 */
export function definePlugin<TConfig = unknown>(
    manifest: PluginManifest,
    factory: (config?: TConfig) => Omit<import("./types").ChartPlugin<TConfig>, "manifest">
): PluginFactory<TConfig> {
    return (config?: TConfig) => {
        const plugin = factory(config);
        return {
            ...plugin,
            manifest,
        };
    };
}

/**
 * Register a plugin from definition
 */
export function defineAndRegister<TConfig = unknown>(
    manifest: PluginManifest,
    factory: (config?: TConfig) => Omit<import("./types").ChartPlugin<TConfig>, "manifest">
): PluginFactory<TConfig> {
    const pluginFactory = definePlugin(manifest, factory);
    registerPlugin({ manifest, factory: pluginFactory as PluginFactory });
    return pluginFactory;
}

// ============================================
// Plugin Discovery Helpers
// ============================================

/**
 * Load a plugin from the registry by name
 */
export async function loadPlugin<TConfig = unknown>(
    name: string,
    config?: TConfig
): Promise<import("./types").ChartPlugin<TConfig> | undefined> {
    const factory = getPluginRegistry().get(name);
    if (!factory) {
        console.warn(`[SciChartEngine] Plugin "${name}" not found in registry`);
        return undefined;
    }
    return factory(config) as import("./types").ChartPlugin<TConfig>;
}

/**
 * List available plugins by category
 */
export function listPluginsByCategory(): Record<PluginCapability, PluginManifest[]> {
    const registry = getPluginRegistry();
    const categories: PluginCapability[] = [
        "analysis",
        "visualization",
        "interaction",
        "data-source",
        "export",
        "ui",
        "annotation",
        "theme",
    ];

    const result: Record<string, PluginManifest[]> = {};
    categories.forEach((cat) => {
        result[cat] = registry.findByCapability(cat);
    });

    return result as Record<PluginCapability, PluginManifest[]>;
}

// ============================================
// Plugin Validation
// ============================================

/**
 * Validate a plugin manifest
 */
export function validateManifest(manifest: PluginManifest): string[] {
    const errors: string[] = [];

    if (!manifest.name) {
        errors.push("Missing required field: name");
    } else if (!/^[@a-z0-9-]+\/[a-z0-9-]+$|^[a-z0-9-]+$/.test(manifest.name)) {
        errors.push(
            'Invalid name format. Use lowercase with hyphens, optionally scoped (e.g., "@org/name")'
        );
    }

    if (!manifest.version) {
        errors.push("Missing required field: version");
    } else if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        errors.push("Invalid version format. Use semantic versioning (e.g., 1.0.0)");
    }

    if (manifest.dependencies) {
        if (!Array.isArray(manifest.dependencies)) {
            errors.push("dependencies must be an array");
        }
    }

    if (manifest.provides) {
        if (!Array.isArray(manifest.provides)) {
            errors.push("provides must be an array");
        }
    }

    return errors;
}

/**
 * Validate a plugin for compatibility
 */
export function checkPluginCompatibility(
    manifest: PluginManifest,
    engineVersion: string
): { compatible: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (manifest.engineVersion) {
        const [reqMajor] = manifest.engineVersion.split(".").map(Number);
        const [curMajor] = engineVersion.split(".").map(Number);

        if (reqMajor > curMajor) {
            return {
                compatible: false,
                warnings: [
                    `Plugin requires engine v${manifest.engineVersion}, current is v${engineVersion}`,
                ],
            };
        }

        if (reqMajor < curMajor) {
            warnings.push(
                `Plugin was built for engine v${manifest.engineVersion}, may have compatibility issues`
            );
        }
    }

    return { compatible: true, warnings };
}
