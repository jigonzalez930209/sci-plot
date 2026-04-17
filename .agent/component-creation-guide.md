---
description: Guide on how to create custom Plugins and Render Series in velo-plot for AI Agents
---
# AI SYSTEM INSTRUCTION: Component Creation Guide

**CRITICAL DIRECTIVE**: Follow these exact steps when expanding `velo-plot`. Because this is a WebGL engine, you do not "create a React component" to draw a line; you create a Renderer or a Plugin.

---

## TASK A: Creating a New Chart Series Type (e.g., Candlestick)

If the user wants a new way to draw data (e.g., Candlesticks, Heatmaps, Spider web), you must write a WebGL renderer.

### Step 1: Define the Data Structure
Standard Line series require `x` and `y`. A Candlestick requires `time`, `open`, `high`, `low`, `close`.
```typescript
export interface CandlestickData {
    time: Float64Array;
    open: Float32Array;
    high: Float32Array;
    low: Float32Array;
    close: Float32Array;
}
```

### Step 2: Implement the WebGL Renderer (`src/renderer/`)
You must write the vertex and fragment shaders. Add the draw logic into a new renderer class extending the base renderer pattern.
- The `draw()` function will be called on every frame.
- It must push the custom `Float32Array` buffers to the GPU (`gl.bindBuffer`, `gl.bufferData`).
- It must apply the matrices correctly (`uProjectionMatrix`, `uViewMatrix`).

### Step 3: Engine Factory
You must expose this new series type in the main `createChart` signature so users can add it (e.g., `chart.addCandlestickSeries()`).

---

## TASK B: Creating a Custom Engine Plugin

Most logical functionality (e.g., Analysis, Exporting data, Animations, Custom tooltips) goes into `src/plugins/`.

### Step 1: Plugin Definition
A Plugin is a class that implements hooks invoked by the main `ChartEngine`.

**Reference Implementation:**
```typescript
import { Plugin } from '../core/types';

export class CustomAnalysisPlugin implements Plugin {
    id = 'custom-analysis';

    /**
     * Hook called right before WebGL `drawArrays`
     * You can mutate the arrays or compute logic here.
     */
    beforeDraw(engine: ChartEngine) {
        // e.g., Filter out NaNs right before rendering
    }
    
    /**
     * Hook called after the data has been rendered
     * Used for drawing Canvas2D overlays (like annotations over WebGL)
     */
    afterDraw(engine: ChartEngine, ctx2D: CanvasRenderingContext2D) {
        // e.g., draw custom textual statistics
    }

    /**
     * Custom method exposed to the user
     */
    calculateMean(seriesId: string) {
       const series = engine.getSeries(seriesId);
       const yData = series.data.y;
       // High performance tight loop
       let sum = 0;
       for (let i = 0; i < yData.length; i++) { sum += yData[i]; }
       return sum / yData.length;
    }
}
```

### Step 2: Register the Plugin
The core engine accepts plugins on instantiation:
```typescript
import { CustomAnalysisPlugin } from './plugins/custom';

const chart = createChart({
  container: div,
  plugins: [new CustomAnalysisPlugin()]
});

// Calling a custom method:
chart.getPlugin('custom-analysis').calculateMean('signal1');
```

---

## TASK C: React Wrapper Integrations

If you added a new WebGL series type or Plugin, you must expose it in `/src/react/SciPlot.tsx` if it requires a UI lifecycle wrapper (e.g., a React prop that feeds data into the plugin on change).

**Rule**: The React component handles the DOM and `ResizeObserver`. The React hooks (`useSciPlot`) manage syncing `props.series` into internal WebGL series (`engine.updateSeries(id, newData)`).
