# SciChart Engine - Bundle Size Optimization Plan

## Current State
- **ES Bundle**: ~521 KB (minified) → ~120 KB gzipped
- **Target**: ~60 KB gzipped

## Analysis Summary

Based on file analysis, here are the modules by estimated bundle contribution:

| Module | Lines | Est. Size | Priority |
|--------|-------|-----------|----------|
| `core/chart/ChartCore.ts` | 1506 | ~40KB | Core (keep) |
| `core/tooltip/TooltipManager.ts` | 1106 | ~30KB | **Plugin** |
| `core/peak-tool/index.ts` | 1062 | ~28KB | **Plugin** |
| `core/delta-tool/index.ts` | 945 | ~25KB | **Plugin** |
| `core/OverlayRenderer.ts` | 800 | ~22KB | Core (keep) |
| `core/3d/*` (All 3D renderers) | ~4500 | ~120KB | **Plugin** |
| `core/annotations/AnnotationManager.ts` | 708 | ~19KB | **Plugin** |
| `core/selection/SelectionManager.ts` | 698 | ~18KB | Core (keep) |
| `core/theme-editor/index.ts` | 657 | ~17KB | **Plugin** |
| `core/keybindings/index.ts` | 509 | ~13KB | **Plugin** |
| `core/clipboard/index.ts` | 486 | ~13KB | **Plugin** |
| `core/locale/index.ts` | 467 | ~12KB | **Plugin** |
| `core/sync/index.ts` | 459 | ~12KB | **Plugin** |
| `core/loading/index.ts` | 453 | ~12KB | **Plugin** |
| `core/debug/index.ts` | 415 | ~11KB | **Plugin** |
| `analysis/indicators.ts` | 738 | ~20KB | **Plugin** |
| `analysis/fft.ts` | 594 | ~16KB | **Plugin** |
| `analysis/filters.ts` | 543 | ~14KB | **Plugin** |
| `analysis/statistics.ts` | 515 | ~14KB | **Plugin** |
| `analysis/fitting.ts` | 227 | ~6KB | **Plugin** |
| `analysis/contours.ts` | 128 | ~3KB | **Plugin** |
| `streaming/backpressure.ts` | 614 | ~16KB | **Plugin** |
| `streaming/websocket.ts` | 173 | ~5KB | **Plugin** |
| `gpu/*` (entire module) | ~1500 | ~40KB | **Plugin** |
| `testing/*` | 675 | ~18KB | **Separate pkg** |
| `plugins/builtins/*` | 700 | ~18KB | **Plugin** |

---

## Recommended Plugin Extraction (Priority Order)

### Tier 1: High Impact (Est. ~80KB saved)

1. **`scichart-engine/plugins/3d`** (120KB)
   - All 3D renderers (Impulse3D, Bubble3D, Area3D, Line3D, etc.)
   - 3D axes, raycaster
   - Surface mesh renderer
   
2. **`scichart-engine/plugins/gpu`** (40KB)
   - WebGPU/WebGL2 abstraction layer
   - GPU compute
   - Benchmarking tools

3. **`scichart-engine/plugins/analysis`** (55KB)
   - FFT analysis
   - Filters (Kalman, moving average, etc.)
   - Statistics
   - Curve fitting
   - Financial indicators (SMA, EMA, RSI, MACD, etc.)
   - Contour detection

### Tier 2: Medium Impact (Est. ~50KB saved)

4. **`scichart-engine/plugins/tools`** (53KB)
   - Delta Tool
   - Peak Tool
   - Tooltip Manager

5. **`scichart-engine/plugins/annotations`** (19KB)
   - Annotation Manager
   - All annotation types

6. **`scichart-engine/plugins/streaming`** (21KB)
   - WebSocket streaming
   - Backpressure manager
   - Mock stream

7. **`scichart-engine/plugins/theme-editor`** (17KB)
   - Visual theme editor
   - Color pickers
   - Export/import

### Tier 3: Low Impact (Est. ~35KB saved)

8. **`scichart-engine/plugins/i18n`** (12KB)
   - All locale configurations
   - Number/date formatters

9. **`scichart-engine/plugins/keyboard`** (13KB)
   - Keyboard bindings manager
   - Default shortcuts

10. **`scichart-engine/plugins/clipboard`** (13KB)
    - Copy/paste functions
    - Data formatters

11. **`scichart-engine/plugins/sync`** (12KB)
    - Chart group synchronization
    - Master-slave linking

12. **`scichart-engine/plugins/debug`** (11KB)
    - Debug overlay
    - Performance metrics

13. **`scichart-engine/plugins/loading`** (12KB)
    - Loading indicators
    - Progress bars

---

## Core Bundle (Keep ~60KB)

The minimal core should contain only:

```
src/
├── core/
│   ├── chart/
│   │   ├── ChartCore.ts          # Main chart logic
│   │   ├── types.ts              # Core types
│   │   └── ChartUI.ts            # Basic UI
│   ├── Series.ts                 # Series management
│   ├── EventEmitter.ts           # Event system
│   ├── InteractionManager.ts     # Pan/zoom (basic)
│   ├── OverlayRenderer.ts        # 2D canvas overlay
│   ├── ChartLegend.ts            # Basic legend
│   ├── ChartControls.ts          # Basic controls
│   └── selection/                # Point selection
├── renderer/
│   ├── NativeWebGLRenderer.ts    # WebGL 1.0 renderer
│   └── shaders.ts                # Basic shaders
├── scales/
│   └── index.ts                  # Linear/Log scales
├── theme/
│   └── index.ts                  # Built-in themes
├── types.ts                      # Core types
├── plugins/
│   ├── types.ts                  # Plugin system types
│   ├── PluginContext.ts          # Minimal context
│   ├── PluginManager.ts          # Plugin manager
│   ├── PluginRegistry.ts         # Global registry
│   └── index.ts                  # Exports (no builtins!)
└── index.ts                      # Minimal exports
```

---

## Implementation Strategy

### Phase 1: Create Separate Entry Points
```typescript
// src/index.ts - Core only (~60KB)
export { createChart, Series, EventEmitter } from "./core";
export { NativeWebGLRenderer } from "./renderer";
export { LinearScale, LogScale } from "./scales";
export { DARK_THEME, LIGHT_THEME } from "./theme";
export { createPlugin, definePlugin } from "./plugins";
// Types only for extensions

// src/full.ts - Everything (for backwards compatibility)
export * from "./index";
export * from "./plugins/builtins";
export * from "./analysis";
export * from "./streaming";
// etc.
```

### Phase 2: Lazy Loading Support
```typescript
// Users import what they need
import { createChart } from 'scichart-engine';
import { DeltaToolPlugin } from 'scichart-engine/plugins/tools';
import { FFTPlugin } from 'scichart-engine/plugins/analysis';

const chart = createChart({ container });
await chart.use(DeltaToolPlugin());
await chart.use(FFTPlugin());
```

### Phase 3: Tree-Shaking Optimization
- Mark all plugin exports as side-effect free
- Use dynamic imports in build
- Configure Rollup/Vite for optimal code-splitting

---

## Estimated Final Sizes

| Entry Point | ES (min) | Gzip |
|-------------|----------|------|
| `scichart-engine` (core) | ~180KB | ~55KB |
| `scichart-engine/full` | ~520KB | ~120KB |
| `scichart-engine/plugins/3d` | ~120KB | ~30KB |
| `scichart-engine/plugins/analysis` | ~55KB | ~14KB |
| `scichart-engine/plugins/tools` | ~53KB | ~13KB |
| Other plugins | ~5-20KB each | ~1-5KB |

---

## Action Items

1. [ ] Create `src/index.core.ts` with minimal exports
2. [ ] Move 3D renderers to `src/plugins/3d/`
3. [ ] Move analysis to `src/plugins/analysis/`  
4. [ ] Move tools (delta, peak, tooltip) to `src/plugins/tools/`
5. [ ] Move streaming to `src/plugins/streaming/`
6. [ ] Update vite.config for multiple entry points
7. [ ] Add package.json exports for subpaths
8. [ ] Update documentation for modular imports
9. [ ] Maintain `src/full.ts` for backwards compatibility
