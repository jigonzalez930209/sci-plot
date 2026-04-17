/**
 * SciPlot Engine - GPU Abstraction Plugin
 * 
 * Provides WebGPU and WebGL2 backend support, GPU compute capabilities,
 * and performance benchmarking tools.
 * 
 * @module plugins/gpu
 */

export {
    // Backends
    WebGPUBackend,
    WebGLBackend,

    // Renderer facade
    GpuRenderer,
    createGpuRenderer,

    // Adapter
    SeriesAdapter,
    parseColorToRGBA,

    // Resource management
    PipelineCache,
    BaseBufferStore,
    BaseTextureStore,

    // Benchmark
    GpuBenchmark,

    // GPU Compute
    GpuCompute,
} from "../../gpu";

export * from "../../gpu/types";

import type { PluginManifest, ChartPlugin, PluginContext } from "../types";

export interface PluginGpuConfig {
    /** Preferred backend: 'webgpu' | 'webgl2' | 'webgl1' */
    preferredBackend?: string;
    /** Enable hardware acceleration for compute tasks */
    enableCompute?: boolean;
}

const manifestGpu: PluginManifest = {
    name: "velo-plot-gpu",
    version: "1.0.0",
    description: "GPU acceleration and WebGPU support for velo-plot",
    provides: ["renderer", "compute"],
    tags: ["gpu", "webgpu", "webgl2", "performance"],
};

/**
 * SciPlot GPU Plugin
 * 
 * Enables high-performance GPU-accelerated rendering and compute.
 */
export function PluginGpu(_config: PluginGpuConfig = {}): ChartPlugin<PluginGpuConfig> {
    return {
        manifest: manifestGpu,

        onInit(_ctx: PluginContext) {
        },

        onDestroy(_ctx: PluginContext) {
        }
    };
}

export default PluginGpu;
