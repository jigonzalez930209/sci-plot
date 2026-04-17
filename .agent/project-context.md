---
description: Context & Overview of the sci-plot library for AI Agents
---
# AI SYSTEM INSTRUCTION: sci-plot Context

**CRITICAL DIRECTIVE**: You are reading the core documentation for `sci-plot`. When tasked with modifying this library, you MUST adhere to these architectural tenets.

## 1. Project Definitions
- **Project Goal**: `sci-plot` is a high-performance, WebGL-powered scientific charting engine built for precision, speed, and deep interactivity in web applications.
- **Performance Paradigm**: Capable of rendering millions of data points at 60 FPS using a specialized raw WebGL renderer.
- **Architecture**: Pluggable Core + WebGL Renderer + React Wrappers.

## 2. Core Repository Structure
The repository is fundamentally structured across core TS files and dedicated plugin folders.

### The Core Engine (`src/core/` & `src/renderer/`)
- **Main Entrypoint**: `src/index.ts` and `src/index.core.ts`.
- **Renderer (`src/renderer`)**: Direct WebGL contexts. Manages GPU buffers, shaders, and draw calls.
- **State Data**: Exists as highly optimized typed arrays (`Float32Array`) rather than mapped JS objects.

### The Plugin Ecosystem (`src/plugins/`)
- Over 20+ plugins manage complex non-core features (e.g., `analysis`, `streaming`, `3d`, `annotations`, `gpu`, `ml-integration`).
- **Rule**: If a feature is not essentially drawing lines/points or axis management, it belongs in a plugin.

### UI Interoperability (`src/react/`)
- Native React hooks and high-level components wrap the underlying vanilla TypeScript engine instances.

## 3. Operational Boundaries (Do NOT do this)
- **DO NOT Use Canvas 2D**: The rendering pipeline relies on WebGL. Do not attempt to draw massive data series using `CanvasRenderingContext2D`.
- **DO NOT Use Standard Arrays for Data**: X/Y coordinates must be handled using `Float32Array` or `Float64Array`. Standard JS `Number[]` arrays will kill performance and memory.
- **DO NOT Mix UI State with Render Ticks**: Operations like Tooltips or Crosshairs happen independently; do not block the animation frame with React/Vue DOM updates.
