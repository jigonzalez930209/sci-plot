/**
 * Sci Plot - Streaming Plugin
 * 
 * Provides real-time data streaming capabilities including:
 * - WebSocket connections
 * - Backpressure management
 * - Mock data streaming for testing
 * 
 * @module plugins/streaming
 */

export {
    createWebSocketStream,
} from "../../streaming/websocket";

export {
    connectStreamToChart,
    createMessageParser,
} from "../../streaming/utils";

export {
    BackpressureManager,
    CircularBuffer,
    createBackpressureManager,
} from "../../streaming/backpressure";

export { createMockStream } from "../../streaming/mock";

export * from "../../streaming/types";

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginStreamingConfig {
    /** Default WebSocket URL */
    url?: string;
    /** Backpressure strategy */
    backpressure?: {
        maxBufferSize?: number;
        overflowStrategy?: "drop-oldest" | "drop-newest" | "error";
    };
}

const manifestStreaming: PluginManifest = {
    name: "sci-plot-streaming",
    version: "1.0.0",
    description: "Real-time data streaming support for sci-plot",
    provides: ["data-source"],
    tags: ["websocket", "real-time", "streaming", "backpressure"],
};

/**
 * SciPlot Streaming Plugin
 * 
 * Enables seamless integration with real-time data sources.
 */
export function PluginStreaming(_config: PluginStreamingConfig = {}): ChartPlugin<PluginStreamingConfig> {
    return {
        manifest: manifestStreaming,

        onInit(_ctx: PluginContext) {
        },

        onDestroy(_ctx: PluginContext) {
        }
    };
}

export default PluginStreaming;
