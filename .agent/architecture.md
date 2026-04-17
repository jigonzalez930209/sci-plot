---
description: Architecture of sci-plot for AI Agents
---
# AI SYSTEM INSTRUCTION: sci-plot Architecture

**CRITICAL DIRECTIVE**: This document defines the engine's architecture. No external AI agent should attempt to rewrite the WebGL buffers or the core charting math unless explicitly instructed.

## 1. The Rendering Pipeline

`sci-plot` relies on a pure WebGL rendering pipeline designed for raw data throughput.

- **Data Buffers**: Data pushed to a series is transferred to the GPU via WebGL Buffers (`gl.bufferData`). 
- **Shaders**: Fragment and Vertex shaders are heavily optimized. Avoid modifying GLSL files unless you are solving an explicit graphical issue.
- **Draw Loop**: The chart does not use DOM reconciliation. It uses `requestAnimationFrame` strictly syncing buffer changes to screen draws.

## 2. Series Ecosystem

A "Chart" manages multiple "Series" (e.g., LineSeries, ScatterSeries, CandlestickSeries).
- **Independence**: Series draw independently from one another using depth buffers and stencil masks (if needed).
- **Colors & Themes**: The engine features dynamic theming (`colorScheme`). If a series isn't assigned a color, the `ThemeManager` dynamically cycles through categorized palettes (e.g., 'vibrant', 'neon', 'ocean').

## 3. The Plugin Architecture

Extensions connect to the core `createChart` instance via lifecycle hooks:
- **Hook points**: `beforeDraw`, `afterDraw`, `onDataUpdate`, `onZoom`, etc.
- **Examples**: The `analysis` plugin reads the current visible `Float32Array` data and calculates Peak Detection or Integrals; the `streaming` plugin manages pushing real-time socket data into rolling buffers.

## 4. React Integration

When modifying `/src/react/`:
- The React wrapper (`<SciPlot />`) instantiates the vanilla `createChart` engine.
- A `useRef` binds the engine instance to a DOM element.
- Updates to `props.series` or `props.options` trigger engine delta-updates. **Do not unmount and remount the canvas** on prop changes; use the engine's `.updateSeries()` techniques.
