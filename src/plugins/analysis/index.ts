/**
 * SciChart Engine - Data Analysis Plugin
 * 
 * Provides mathematical and statistical tools including:
 * - FFT (Fast Fourier Transform)
 * - Digital Filters (Kalman, Low-pass, etc.)
 * - Curve Fitting and Regression
 * - Peak and Contour Detection
 * - Financial Indicators (SMA, EMA, RSI, etc.)
 * 
 * @module plugins/analysis
 */

export {
    formatWithPrefix,
    formatValue,
    formatScientific,
    getBestPrefix,
    detectCycles,
    generateCycleColors,
    detectPeaks,
    validateData,
    calculateStats,
    movingAverage,
    downsampleLTTB,
} from "../../analysis";

export * from "../../analysis/indicators";
export * from "../../analysis/fft";
export * from "../../analysis/filters";
export * from "../../analysis/fitting";
export * from "../../analysis/contours";
export * from "../../analysis/statistics";
export * from "../../analysis/math";

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginAnalysisConfig {
    /** Enable worker-based off-main-thread processing */
    useWorkers?: boolean;
    /** Precision for statistical calculations */
    precision?: number;
}

const manifestAnalysis: PluginManifest = {
    name: "scichart-analysis",
    version: "1.0.0",
    description: "Data analysis and signal processing for scichart-engine",
    provides: ["analysis"],
    tags: ["fft", "filters", "statistics", "math"],
};

/**
 * SciChart Analysis Plugin
 * 
 * Adds comprehensive data analysis capabilities to the chart.
 */
export function PluginAnalysis(_config: PluginAnalysisConfig = {}): ChartPlugin<PluginAnalysisConfig> {
    return {
        manifest: manifestAnalysis,

        onInit(ctx: PluginContext) {
            ctx.log.info("SciChart Analysis Plugin Initialized");
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChart Analysis Plugin Destroyed");
        }
    };
}

export default PluginAnalysis;
