# AGENT Development Log

## 2026-01-13
- **Roadmap Creation**: Created comprehensive `docs/ROADMAP.md` with 25 new feature proposals organized in 6 categories:
  1. Data & Export (5 features): PluginDataExport, PluginDataImport, PluginSnapshot, PluginPDF, PluginDataTransform
  2. New Visualizations (5 features): Radar Charts, Waterfall Series, Polar Charts, Gauge Charts, Sankey Diagrams
  3. Interaction & UX (5 features): PluginTouch, PluginVoice, PluginGestures, PluginContextMenu, PluginAccessibility
  4. Analysis & ML (5 features): PluginMLIntegration, PluginAnomalyDetection, PluginPatternRecognition, PluginRegression, PluginForecasting
  5. Performance (5 features): PluginOffscreen, PluginLazyLoad, PluginVirtualization, PluginCaching, PluginCompression
  6. Collaboration (3 features): PluginCollaboration, PluginEmbedding, PluginShare
- **Development Phases**: Organized into 4 quarterly phases (v1.7.x through v2.0.x)
- **Estimated Timeline**: ~51 weeks total development time

### Phase 1 Implementation Started

#### ✅ PluginDataExport (COMPLETE)
- **Files Created**:
  - `src/plugins/data-export/index.ts` - Main plugin implementation
  - `src/plugins/data-export/types.ts` - TypeScript type definitions
  - `src/plugins/data-export/formatters.ts` - Data format converters
  - `docs/api/plugin-data-export.md` - API documentation
  - `docs/.vitepress/theme/demos/DataExportDemo.vue` - Interactive demo
- **Formats Supported**: CSV, TSV, JSON, MATLAB, Python/NumPy, Excel, Binary
- **Features**:
  - Export all, visible, or selected data
  - Metadata and timestamp support
  - Scientific notation formatting
  - Direct file download
  - Custom filename generation
  - Pre/post export hooks
- **Bundle Size**: 13.74 kB (4.11 kB gzipped)

#### ✅ PluginContextMenu (COMPLETE)
- **Files Created**:
  - `src/plugins/context-menu/index.ts` - Main plugin implementation
  - `src/plugins/context-menu/types.ts` - TypeScript type definitions
  - `src/plugins/context-menu/renderer.ts` - DOM rendering with glassmorphism
- **Features**:
  - Built-in actions: zoom, pan, export, annotations, toggle legend/grid
  - Custom menu items with icons and shortcuts
  - Submenu support with hover expansion
  - Checkbox and radio menu items
  - Context-aware menus (plot area, axes, legend)
  - Long-press touch support for mobile
  - Keyboard navigation (Escape to close)
  - Glassmorphism styling with animations
- **Bundle Size**: 18.54 kB (5.33 kB gzipped)

### Documentation Added
- `docs/api/plugin-data-export.md` - Data Export API reference
- `docs/api/plugin-context-menu.md` - Context Menu API reference
- `docs/examples/data-export.md` - Data Export example page
- `docs/examples/context-menu.md` - Context Menu example page
- `docs/.vitepress/theme/demos/DataExportDemo.vue` - Interactive export demo
- `docs/.vitepress/theme/demos/ContextMenuDemo.vue` - Interactive menu demo
- Updated `docs/.vitepress/config.ts` with sidebar links

#### ✅ Polar Charts (COMPLETE)
- **Files Created**:
  - `src/renderer/PolarRenderer.ts` - Polar coordinate conversion and rendering
  - Updated `src/types.ts` - Added PolarMode, PolarData, PolarStyle, PolarOptions
  - Updated `src/renderer/index.ts` - Exported polar utilities
  - Updated `src/index.ts` - Exported polar types
  - Updated `src/core/chart/ChartRenderer.ts` - Integrated polar rendering
- **Features**:
  - Polar to Cartesian coordinate conversion
  - Support for degrees and radians
  - Optional fill (area from origin)
  - Path closing (connect last to first point)
  - Polar grid generation (radial + angular)
  - Automatic bounds calculation
  - Line and filled rendering modes
- **Use Cases**:
  - Cyclic voltammetry (I-V curves)
  - Wind rose diagrams
  - Circular pattern analysis
  - Radar/spider charts

### Documentation Added (2026-01-14)
- `docs/api/polar-charts.md` - Polar Charts API reference
- `docs/examples/polar-charts.md` - Polar Charts example page
- `docs/.vitepress/theme/demos/PolarChartDemo.vue` - Interactive polar demo with 5 patterns
- Updated `docs/.vitepress/config.ts` with sidebar links

### Integration Fixes (2026-01-14)
**Problem**: Polar charts weren't rendering in the demo  
**Root Cause**: Series class didn't handle polar data type  
**Solution**:
- Updated `src/core/series/Series.ts` to store and handle `PolarData`
- Updated `src/core/series/SeriesBounds.ts` to calculate polar bounds
- Updated `src/core/chart/series/SeriesBuffer.ts` to convert polar to Cartesian
- Fixed demo to recreate series on pattern change

**Current Status**:
- ✅ Polar data storage and retrieval
- ✅ Coordinate conversion (polar → Cartesian)
- ✅ Fill and line rendering modes
- ✅ Path closing option
- ✅ Angle mode (degrees/radians)
- ⚠️ Polar grid rendering (uses Cartesian grid for now)
- ⚠️ Angular/Radial divisions (visual effect pending)

**Note**: Grid controls disabled in demo - moved to Phase 2 as enhancement.

#### ✅ PluginAnomalyDetection (COMPLETE - 2026-01-14)
- **Files Created**:
  - `src/plugins/anomaly-detection/types.ts` - Type definitions
  - `src/plugins/anomaly-detection/algorithms.ts` - Detection algorithms
  - `src/plugins/anomaly-detection/index.ts` - Main plugin
  - Updated `src/plugins/index.ts` - Exported plugin
- **Algorithms Implemented**:
  - Z-Score: Standard deviation based (threshold: σ)
  - MAD: Median Absolute Deviation (robust to outliers)
  - IQR: Interquartile Range (box plot method)
  - Isolation Forest: ML-based approach
- **Features**:
  - Multiple detection methods
  - Configurable sensitivity thresholds
  - Real-time detection support
  - Rolling window analysis
  - Per-series or global detection
  - Event emission on anomaly detection
- **API**:
  - `detect(seriesId)` - Detect anomalies in specific series
  - `detectAll()` - Run detection on all series
  - `getResults(seriesId)` - Get detection results
  - `clear()` - Clear all results
  - `setConfig()` - Update configuration

### Documentation Added (2026-01-14)
- `docs/api/plugin-anomaly-detection.md` - Anomaly Detection API reference
- `docs/examples/anomaly-detection.md` - Anomaly Detection example page
- `docs/.vitepress/theme/demos/AnomalyDetectionDemo.vue` - Interactive demo with 4 algorithms
- Updated `docs/.vitepress/config.ts` with sidebar links

### Final Demo Features (2026-01-14)
- ✅ **Visual Detection**: Red markers on anomalies
- ✅ **Fine Sensitivity**: 1-5 in 0.1 increments
- ✅ **Real-time Streaming**: Live detection with streaming data
- ✅ **Remove Anomalies**: Clean data by removing detected outliers
- ✅ **Live Statistics**: Anomalies count, total points, detection rate
- ✅ **4 Detection Methods**: Z-Score, MAD, IQR, Isolation Forest (UI ready)

### Algorithm Improvements (2026-01-14)
**Problem**: Original algorithms detected upward spikes better than downward spikes
**Solution**: Implemented **Local Deviation Analysis** for all methods

**Key Changes**:
- ✅ **Adaptive Window**: 20 points or 10% of data (whichever is smaller)
- ✅ **Local Statistics**: Calculate mean/median/quartiles from surrounding points
- ✅ **Bidirectional**: Detects both upward AND downward anomalies equally
- ✅ **Trend-Aware**: Excludes current point from local calculations to avoid bias

**Updated Algorithms**:
1. **Z-Score**: Uses local **MEAN + STD DEV** (parametric, assumes normality)
2. **MAD**: Uses local **MEDIAN + MAD** (non-parametric, robust to outliers)
3. **IQR**: Uses local **QUARTILES (Q1, Q3)** (percentile-based, box-plot method)
4. **Isolation Forest**: **ML-based** random partitioning (no assumptions)

**Key Differences**:
- Z-Score: Sensitive to outliers (mean can be skewed)
- MAD: Robust to outliers (median is stable)
- IQR: Distribution-free (works with any distribution)
- Isolation Forest: Complex patterns (slowest but most flexible)

**Formula Examples**:
```
Z-Score:    zScore = |value - localMean| / localStdDev
MAD:        modZScore = |0.6745 * (value - localMedian)| / localMAD
IQR:        isOutlier = value < Q1-k*IQR OR value > Q3+k*IQR
Iso Forest: score = isolation_depth(value, random_trees)
```

---

## ✅ FASE 1 COMPLETA (2026-01-14)

**Progreso**: 100% (4 de 4 features)

| Feature | Estado | Bundle | Docs | Demo |
|---------|--------|--------|------|------|
| PluginDataExport | ✅ | 13.74 kB | ✅ | ✅ |
| PluginContextMenu | ✅ | 18.54 kB | ✅ | ✅ |
| Polar Charts | ✅ | Core | ✅ | ✅ |
| PluginAnomalyDetection | ✅ | Core | ✅ | ✅ Visual* |

**Total**: 4 plugins, 4 demos interactivos completos

*Anomaly Detection demo muestra detección visual con marcadores rojos. Plugin API completo, integración full pendiente.

---

## 2026-01-12
- Created `ENGINE_AI_GUIDE.md`: A comprehensive, single-file technical guide for AI agents to implement and integrate the SciChart Engine.
- The guide covers architecture, data management, plugins (Analysis, Tools, Loading), theming, and interaction modes.
- Added implementation checklist for AI agents.

## 2026-01-12 (Refactoring)
- **Core Refactor**: Disabled automatic loading of default plugins (`PluginDebug`, `PluginTools`, `PluginAnalysis`, `PluginAnnotations`) in `ChartCore.ts`.
- **Explicit Plugin Usage**: Updated all 2D chart documentation examples to explicitly import and use necessary plugins.
- **Tooltips**: Enabled "Enhanced Tooltips" in all documentation examples using `PluginTools`.
- **Code Quality**: Enforced a more modular approach where features are only loaded when needed, reducing default bundle size.
