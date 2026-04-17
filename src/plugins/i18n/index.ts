/**
 * SciPlot Engine - Internationalization (i18n) Plugin
 * 
 * Provides localization support for dates, numbers, and strings.
 * 
 * @module plugins/i18n
 */

export * from "../../core/locale";

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";
import { setGlobalLocale } from "../../core/locale";

export interface PluginI18nConfig {
    /** Default locale to use */
    locale?: string;
    /** Custom locale definitions */
    customLocales?: Record<string, any>;
}

const manifestI18n: PluginManifest = {
    name: "sci-plot-i18n",
    version: "1.0.0",
    description: "Internationalization and localization for sci-plot",
    provides: ["ui"],
    tags: ["i18n", "l10n", "locale", "language"],
};

/**
 * SciPlot i18n Plugin
 * 
 * Adds support for multiple languages and local data formatting.
 */
export function PluginI18n(config: PluginI18nConfig = {}): ChartPlugin<PluginI18nConfig> {
    return {
        manifest: manifestI18n,

        onInit(_ctx: PluginContext) {
            if (config.locale) {
                setGlobalLocale(config.locale);
            }
        },

        onDestroy(_ctx: PluginContext) {
        }
    };
}

export default PluginI18n;
