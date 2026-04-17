---
title: GPU & WebGPU Plugin
description: Leverage the power of modern GPUs with WebGPU support and GPGPU compute for heavy data pre-processing.
---

# GPU & WebGPU Plugin

The GPU plugin allows you to unlock specialized hardware acceleration features. Sci Plot is built on a multi-backend architecture, and this plugin provides the tools to select backends, manage GPU resources, and perform high-performance computing directly on the graphics card.

## Features

- ✅ **WebGPU Support**: Enable the latest graphics API for reduced CPU overhead and better power efficiency.
- ✅ **GPGPU Compute**: Run general-purpose calculations (like FFTs or Signal Filtering) on the GPU using `GpuCompute`.
- ✅ **Cross-Backend Facade**: Unified API for interacting with WebGL1, WebGL2, and WebGPU.
- ✅ **GPU Benchmarking**: Built-in tools to measure GPU performance and memory throughput.
- ✅ **Shared Buffer Memory**: Optimize data transfers between CPU and GPU.

## Basic Usage

```typescript
import { createChart, PluginGpu } from 'sci-plot';

const chart = createChart({
  container: document.getElementById('chart')!
});

// Prefer WebGPU if available
await chart.use(PluginGpu({ 
  preferredBackend: 'webgpu',
  enableCompute: true
}));
```

## GPU Compute (GPGPU)

Perform heavy processing without blocking the UI thread.

```typescript
const gpu = chart.getPlugin('gpu');
const compute = gpu.createCompute({
  shader: `
    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      // Custom signal processing logic here
    }
  `
});

const result = await compute.run(inputData);
```

## Performance Benchmarking

Test the hardware capabilities of the user's device.

```typescript
const benchmark = gpu.createBenchmark();
const results = await benchmark.runAll();

console.log(`GPU Model: ${results.gpuVendor}`);
console.log(`Triangle Throughput: ${results.trianglesPerSecond} M/s`);
```

## Configuration Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `preferredBackend` | `string` | `'webgl2'` | Preferred backend: `'webgpu'`, `'webgl2'`, or `'webgl1'`. |
| `enableCompute` | `boolean` | `false` | Enable support for GPU Compute shaders. |
| `debug` | `boolean` | `false` | Enable GPU resource tracking and logging. |

## Important Notes

### WebGPU Availability
WebGPU is currently available in Chrome (Windows, macOS, ChromeOS) and is coming soon to Firefox and Safari. The plugin will automatically fall back to WebGL if WebGPU is unavailable.

### Security Context
Some GPU features (like `SharedArrayBuffer` or certain WebGPU extensions) require a **Secure Context** (HTTPS) and specific Cross-Origin Isolation headers.

## See Also
- [Offscreen Rendering](/api/plugin-offscreen) - Combine with GPU workers for maximum performance.
- [Data Virtualization](/api/plugin-virtualization) - Manage GPU memory for large datasets.
