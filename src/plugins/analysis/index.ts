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
} from "./src";

export * from "./src/indicators";
export * from "./src/fft";
export * from "./src/filters";
export * from "./src/fitting";
export * from "./src/contours";
export * from "./src/statistics";
export * from "./src/math";

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

import { addFitLine } from "../../core/chart/series/SeriesFit";

/**
 * SciChart Analysis Plugin
 * 
 * Adds comprehensive data analysis capabilities to the chart.
 */
export function PluginAnalysis(_config: PluginAnalysisConfig = {}): ChartPlugin<PluginAnalysisConfig> {
    let _ctx: PluginContext;

    return {
        manifest: manifestAnalysis,

        onInit(ctx: PluginContext) {
            _ctx = ctx;
            ctx.log.info("SciChart Analysis Plugin Initialized");
        },

        onDestroy(ctx: PluginContext) {
            ctx.log.info("SciChart Analysis Plugin Destroyed");
        },

        api: {
            addFitLine(seriesId: string, type: any, options?: any) {
                // Bridge between PluginContext and the internal context addFitLine expects
                return addFitLine(_ctx.chart, seriesId, type, options);
            },
            // Re-export other utilities for programmatic access
            fft: (data: any) => {
                const { fft } = require("./src/fft");
                return fft(data);
            },
        }
    };
}

export default PluginAnalysis;
