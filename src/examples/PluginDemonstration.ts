/**
 * SciChart Engine - Plugin Demonstration Examples
 * 
 * This file contains 3 comprehensive examples of how to use the mới modular plugin architecture.
 */

import { createChart } from "../index.core";
import { PluginAnalysis } from "../plugins/analysis";
import { PluginDebug } from "../plugins/debug";
import { PluginStreaming } from "../plugins/streaming";
import { PluginI18n } from "../plugins/i18n";
import { PluginThemeEditor } from "../plugins/theme-editor";
import { PluginAnnotations } from "../plugins/annotations";

// =========================================================================
// EXAMPLE 1: Performance Monitoring & Real-time Analysis
// =========================================================================
/**
 * Demonstrates how to combine the Debug plugin for performance metrics
 * and the Analysis plugin for real-time signal processing.
 */
export async function examplePerformanceAndAnalysis(container: HTMLDivElement) {
    const chart = createChart({
        container,
        theme: "dark",
        animations: true
    });

    // 1. Load the Debug plugin to see FPS and performance stats
    await chart.use(PluginDebug({
        showFPS: true,
        showDataStats: true
    }));

    // 2. Load the Analysis plugin for signal processing
    await chart.use(PluginAnalysis());

    // 3. Add a series and some data
    chart.addSeries({
        id: "raw-signal",
        name: "Raw Signal",
        type: "line",
        style: { color: "#00ff00" },
        data: { x: new Float32Array(), y: new Float32Array() }
    });

    // 4. Use the analysis API via the plugin context
    const analysisPlugin = (chart as any).getPlugin("scichart-analysis");

    // Simulate real-time data update
    setInterval(() => {
        const x = Array.from({ length: 100 }, (_, i) => Date.now() + i);
        const y = Array.from({ length: 100 }, () => Math.sin(Date.now() / 1000) + Math.random() * 0.5);

        chart.appendData("raw-signal", x, y);

        // Perform FFT analysis if needed
        if (analysisPlugin) {
            // plugin logic...
        }
    }, 100);

    return chart;
}

// =========================================================================
// EXAMPLE 2: Advanced Streaming with Backpressure
// =========================================================================
/**
 * Demonstrates the Streaming plugin capabilities, including WebSocket 
 * integration and backpressure management for high-frequency data.
 */
export async function exampleAdvancedStreaming(container: HTMLDivElement) {
    const chart = createChart({ container });

    // 1. Load the Streaming plugin
    await chart.use(PluginStreaming({
        backpressure: {
            maxBufferSize: 10000,
            overflowStrategy: "drop-oldest"
        }
    }));

    // 2. Configure a WebSocket stream (Mocked here)
    const streaming = (chart as any).getPlugin("scichart-streaming");

    if (streaming) {
        // Prepare chart for incoming data
        chart.addSeries({
            id: "fast-data",
            type: "line",
            data: { x: new Float32Array(), y: new Float32Array() }
        });
    }

    return chart;
}

// =========================================================================
// EXAMPLE 3: Localization and Dynamic Customization
// =========================================================================
/**
 * Demonstrates how to use the i18n plugin for multiple languages
 * and the ThemeEditor for visual customization.
 */
export async function exampleCustomization(container: HTMLDivElement) {
    const chart = createChart({ container });

    // 1. Load i18n for Spanish support
    await chart.use(PluginI18n({
        locale: "es-ES"
    }));

    // 2. Load the Theme Editor for interactive styling
    await chart.use(PluginThemeEditor({
        initialTheme: "dark",
        position: "right"
    }));

    // 3. Add some annotations to show localized dates/numbers
    await chart.use(PluginAnnotations());

    chart.addSeries({
        id: "main",
        type: "line",
        data: { x: new Float32Array(), y: new Float32Array() }
    });

    return chart;
}
