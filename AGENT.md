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

## 🚀 FASE 2: Análisis Extendido (v1.8.x) - INICIADA 2026-01-14

### Feature 1: Polar Grid Enhancement ✅ COMPLETADO

**Objetivo**: Implementar grilla polar personalizada con divisiones configurables

**Implementación**:
- ✅ Agregado método `drawPolarGrid` en OverlayRenderer
- ✅ Detección automática de series polares en ChartRenderer
- ✅ Renderizado de círculos radiales concéntricos
- ✅ Renderizado de líneas angulares (spokes)
- ✅ Ocultación de ejes cartesianos cuando hay series polares
- ✅ Controles de grilla habilitados en PolarChartDemo (angularDivisions, radialDivisions)

**Archivos Modificados**:
- `src/core/OverlayRenderer.ts` - Método `drawPolarGrid`
- `src/core/chart/ChartRenderer.ts` - Detección polar y renderizado condicional
- `docs/.vitepress/theme/demos/PolarChartDemo.vue` - Controles habilitados

**Progreso**: 100% ✅ COMPLETO

### Feature 2: Single Frequency Filter ✅ COMPLETADO

**Objetivo**: Implementar un filtro de frecuencia única (Notch) para eliminar interferencias periódicas.

**Implementación**:
- ✅ Implementado `singleFrequencyFilter` en `src/plugins/analysis/filters.ts` usando un filtro Notch IIR de 2do orden.
- ✅ Aplicación con técnica `filtfilt` para respuesta de fase cero.
- ✅ Expuesto en `PluginAnalysis` API.
- ✅ **NUEVO**: Agregado método `updateXAxis` a `ChartCore` y a la interfaz `Chart` para permitir cambios dinámicos en el eje X (etiquetas, rangos, etc.).
- ✅ Documentación completa en `docs/api/analysis-advanced.md` y `docs/examples/single-frequency-filter.md`.
- ✅ Demo interactiva robustecida en `docs/.vitepress/theme/demos/2d/SingleFreqFilterDemo.vue` con vista de tiempo/frecuencia conmutable.

**Archivos Modificados**:
- `src/core/chart/ChartCore.ts` - Implementación de `updateXAxis`.
- `src/core/chart/types.ts` - Actualización de la interfaz `Chart`.
- `src/plugins/analysis/filters.ts` - Implementación core y opciones.
- `src/plugins/analysis/index.ts` - Exportación y API del plugin.
- `src/index.ts` - Exportación pública.
- `docs/.vitepress/theme/demos/2d/SingleFreqFilterDemo.vue` - Nueva demo estabilizada.
- `docs/examples/single-frequency-filter.md` - Nueva página de ejemplo.
- `docs/api/analysis-advanced.md` - Actualización de API.
- `docs/.vitepress/config.ts` - Configuración de sidebar.
- `docs/.vitepress/theme/index.ts` - Registro de componente.

**Progreso**: 100% ✅ COMPLETO

### Feature 3: PluginRegression ✅ COMPLETADO

**Objetivo**: Implementar un sistema de regresión científica avanzada con selección automática de modelos.

**Implementación**:
- ✅ Corregido algoritmo de **Mínimos Cuadrados** usando Eliminación Gaussiana con pivoteo parcial.
- ✅ Implementados modelos: Lineal, Polinómico, Exponencial, Gaussiano, Logarítmico y Potencia.
- ✅ Sistema de **Auto-Selección** basado en criterios estadísticos (AIC/BIC).
- ✅ Visualización automática de curvas de ajuste y etiquetas de ecuación.
- ✅ Exportación de resultados a JSON, CSV y MATLAB.
- ✅ Documentación API completa en `docs/api/plugin-regression.md`.
- ✅ Demo interactiva en `docs/.vitepress/theme/demos/RegressionDemo.vue`.

**Archivos Modificados**:
- `src/plugins/regression/algorithms.ts` - Corrección de álgebra lineal.
- `docs/api/plugin-regression.md` - Nueva documentación.
- `docs/.vitepress/theme/demos/RegressionDemo.vue` - Nueva demo.
- `docs/examples/regression-plugin.md` - Nueva página de ejemplo.
- `docs/.vitepress/config.ts` - Configuración de sidebar.
- `docs/.vitepress/theme/index.ts` - Registro de componente.

**Progreso**: 100% ✅ COMPLETO

### Feature 4: Radar Charts ✅ COMPLETADO

**Objetivo**: Implementar soporte para gráficos de radar (Spider Charts) mediante un plugin dedicado.

**Implementación**:
- ✅ Añadido método `drawRadarGrid` en `OverlayRenderer` para dibujar la "telaraña" del gráfico.
- ✅ Implementado `PluginRadar` con soporte para múltiples series, relleno de área y puntos de datos.
- ✅ Sistema de mapeo automático de categorías a ángulos.
- ✅ API para añadir, actualizar y eliminar series de radar dinámicamente.
- ✅ Soporte para temas (claro/oscuro) y personalización de estilos de línea/relleno.
- ✅ Documentación API completa en `docs/api/plugin-radar.md`.
- ✅ Demo interactiva en `docs/.vitepress/theme/demos/RadarDemo.vue`.

**Archivos Modificados**:
- `src/core/OverlayRenderer.ts` - Primitivas de dibujo para radar.
- `src/plugins/radar/` - Implementación completa del plugin.
- `src/plugins/index.ts` - Exportación del plugin.
- `docs/api/plugin-radar.md` - Documentación API.
- `docs/examples/radar-charts.md` - Página de ejemplo.
- `docs/.vitepress/theme/demos/RadarDemo.vue` - Nueva demo.
- `docs/.vitepress/config.ts` - Configuración de sidebar.
- `docs/.vitepress/theme/index.ts` - Registro de componente.

**Progreso**: 100% ✅ COMPLETO

### Feature 5: ML Integration ✅ COMPLETADO

**Objetivo**: Implementar una capa de integración para modelos de Machine Learning (ML) y visualización de predicciones.

**Implementación**:
- ✅ Implementado `PluginMLIntegration` como puente agnóstico para bibliotecas como Tensorflow.js u ONNX.
- ✅ Sistema de **Inferencia Asíncrona** aplicado a series de datos del gráfico.
- ✅ Visualización de **Intervalos de Confianza** (bandas de incertidumbre) mediante renderizado en overlay.
- ✅ Soporte para múltiples modelos registrados simultáneamente.
- ✅ API para visualizar resultados de predicción sin necesidad de crear nuevas series pesadas.
- ✅ Documentación API completa en `docs/api/plugin-ml-integration.md`.
- ✅ Demo interactiva en `docs/.vitepress/theme/demos/MLIntegrationDemo.vue` simulando predicción LSTM.

**Archivos Modificados**:
- `src/plugins/ml-integration/` - Implementación completa (Abstracción de modelos y visualización).
- `src/plugins/index.ts` - Exportación del plugin.
- `docs/api/plugin-ml-integration.md` - Documentación API.
- `docs/examples/ml-integration.md` - Página de ejemplo.
- `docs/.vitepress/theme/demos/MLIntegrationDemo.vue` - Nueva demo.
- `docs/.vitepress/config.ts` - Configuración de sidebar.
- `docs/.vitepress/theme/index.ts` - Registro de componente.

**Progreso**: 100% ✅ COMPLETO

### Feature 6: PluginSnapshot ✅ COMPLETADO (2026-01-14)

**Objetivo**: Implementar un sistema de exportación de imágenes de alta resolución (4K, 8K) para publicaciones científicas.

**Implementación**:
- ✅ Agregados métodos `getDPR` y `setDPR` a `ChartCore` para permitir re-renderizado a resoluciones escaladas.
- ✅ Implementada composición de capas (WebGL + Overlay) en un único canvas de salida.
- ✅ Soporte para formatos: PNG, JPEG (con calidad ajustable) y WebP.
- ✅ Resoluciones preestablecidas: Standard, 2K, 4K y 8K.
- ✅ Sistema de **Marca de Agua** profesional con escalado automático de fuente según resolución.
- ✅ Opción de fondo transparente para integración en presentaciones.
- ✅ Documentación API completa en `docs/api/plugin-snapshot.md`.
- ✅ Demo interactiva en `docs/.vitepress/theme/demos/SnapshotDemo.vue`.

**Archivos Modificados**:
- `src/core/chart/ChartCore.ts`, `src/core/chart/types.ts` - Soporte para DPR dinámico.
- `src/plugins/snapshot/` - Implementación completa del plugin.
- `src/index.ts`, `src/plugins/index.ts` - Exportaciones globales.
- `docs/api/plugin-snapshot.md`, `docs/examples/snapshot-export.md` - Documentación y ejemplo.
- `docs/.vitepress/theme/demos/SnapshotDemo.vue`, `docs/.vitepress/config.ts`, `docs/.vitepress/theme/index.ts` - Demo e integración.

**Progreso**: 100% ✅ COMPLETO

---

### Bug Fixes & Refinements ✅ COMPLETADO

**Objetivo**: Resolver problemas de inicialización en demos y mejorar la integración de tipos.

**Correcciones**:
- ✅ **Radar Demo Loading**: Corregido problema donde el indicador de carga no se ocultaba en el gráfico de Radar (al no usar series estándar, el plugin de carga no detectaba el fin de la inicialización).
- ✅ **ML Integration Predictor**: Renombrado "Mock LSTM" a **Scientific Trend Predictor**. Ahora utiliza las funciones reales de regresión lineal y estadísticas del motor para realizar predicciones basadas en datos.
- ✅ **Exportación de Plugins**: Los plugins `Regression`, `MLIntegration` y `Radar` ahora se exportan correctamente desde el punto de entrada principal del motor, evitando errores de "not a function".
- ✅ **TSConfig Alias**: Añadido alias `@src` a la configuración de TypeScript para validación correcta de rutas en demos.

**Archivos Modificados**:
- `src/index.ts` - Exportaciones globales añadidas.
- `docs/.vitepress/theme/demos/RadarDemo.vue` - Deshabilitado loader y corregidas rutas.
- `docs/.vitepress/theme/demos/MLIntegrationDemo.vue` - Implementado predictor real y corregidas rutas.
- `docs/.vitepress/theme/demos/RegressionDemo.vue` - Corregida importación de tipos.
- `tsconfig.json` - Añadido soporte para alias `@src`.

**Progreso**: 100% ✅ COMPLETO

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

---

## 2026-01-14 (Scientific Visualization Enhancement)

### Phase 2: Scientific & Financial Charts ✅ COMPLETADO

**Objetivo**: Añadir tipos de gráficos científicos avanzados para análisis estadístico y financiero.

#### Feature 1: Error Bars (Barras de Error) ✅

**Implementación**:
- ✅ Añadido soporte para `yError`, `yErrorMinus`, `yErrorPlus` en SeriesData
- ✅ Añadido soporte para `xError`, `xErrorMinus`, `xErrorPlus` para errores horizontales
- ✅ Implementado `interleaveErrorData` en `renderer/native/utils.ts` para WebGL
- ✅ Implementado `renderErrorBars` en `renderer/native/draw.ts`
- ✅ Integrado en `renderFrame.ts` para renderizado automático
- ✅ Añadido método `drawErrorBars` en `OverlayRenderer.ts` para Canvas 2D

**APIs**:
```typescript
chart.addSeries({
  type: 'scatter',
  data: { x, y, yError: stdDeviations },
  style: {
    errorBars: {
      visible: true,
      color: '#ff6b6b',
      width: 1.5,
      capWidth: 6,
      direction: 'both', // 'both' | 'positive' | 'negative'
      opacity: 0.7
    }
  }
})
```

**Archivos Modificados**:
- `src/types.ts` - Tipos de datos de error
- `src/renderer/native/utils.ts` - Función de entrelazado
- `src/renderer/native/draw.ts` - Función de renderizado
- `src/renderer/native/renderFrame.ts` - Integración
- `src/renderer/native/types.ts` - Tipos de buffer
- `src/core/chart/series/SeriesBuffer.ts` - Creación de buffers
- `src/core/OverlayRenderer.ts` - Renderizado Canvas 2D

#### Feature 2: Box Plot (Diagrama de Caja) ✅

**Implementación**:
- ✅ Añadido tipo de serie `boxplot` a SeriesType
- ✅ Implementado `interleaveBoxPlotData` en `renderer/native/utils.ts`
- ✅ Implementado `renderBoxPlot` en `renderer/native/draw.ts`
- ✅ Soporte para datos: min (low), Q1 (open), median, Q3 (close), max (high)
- ✅ Renderizado híbrido: cajas con transparencia + líneas de bigotes

**APIs**:
```typescript
chart.addSeries({
  type: 'boxplot',
  data: {
    x: [1, 2, 3, 4],
    low: minValues,
    open: q1Values,
    median: medianValues,
    close: q3Values,
    high: maxValues
  },
  style: { barWidth: 0.6, color: '#00f2ff' }
})
```

**Archivos Modificados**:
- `src/types.ts` - Tipo boxplot y campo median en SeriesData
- `src/renderer/native/types.ts` - Tipo boxplot en NativeSeriesRenderData
- `src/renderer/native/utils.ts` - Función de entrelazado
- `src/renderer/native/draw.ts` - Función de renderizado
- `src/renderer/native/renderFrame.ts` - Caso boxplot
- `src/core/series/Series.ts` - Inicialización de median
- `src/core/chart/series/SeriesBuffer.ts` - Creación de buffers
- `src/core/chart/ChartRenderer.ts` - Preparación de datos

#### Feature 3: Waterfall Charts ✅

**Implementación**:
- ✅ Añadido tipo de serie `waterfall` a SeriesType
- ✅ Implementado `interleaveWaterfallData` con soporte para:
  - Barras positivas (verde)
  - Barras negativas (rojo)
  - Subtotales (azul)
  - Líneas conectoras
- ✅ Sistema de acumulación running total automático
- ✅ Arrays separados para cada tipo de barra (optimización de color)

**APIs**:
```typescript
chart.addSeries({
  type: 'waterfall',
  data: { x, y },
  style: {
    barWidth: 0.6,
    positiveColor: '#22c55e',
    negativeColor: '#ef4444',
    subtotalColor: '#3b82f6',
    connectorColor: '#64748b',
    showConnectors: true,
    isSubtotal: [false, false, true, false, true] // Marcar subtotales
  }
})
```

**Archivos Modificados**:
- `src/types.ts` - Tipo waterfall
- `src/renderer/native/types.ts` - Tipo waterfall
- `src/renderer/native/utils.ts` - Función de entrelazado
- `src/renderer/NativeWebGLRenderer.ts` - Exportación
- `src/renderer/index.ts` - Exportación
- `src/core/series/Series.ts` - waterfallCounts property
- `src/core/chart/series/SeriesBuffer.ts` - Creación de buffers

#### Feature 4: ML Integration Refinement ✅

**Correcciones**:
- ✅ Reconstruido sistema de tipos en `ml-integration/types.ts`
- ✅ Añadidos getters `id`, `name`, `type` a clases de modelos nativos
- ✅ Corregido `PredictionResult` para incluir `xValues` para visualización
- ✅ Añadido `NativeStatsAPI` con funciones estadísticas expuestas
- ✅ Corregida visualización de predicciones en overlay

**APIs Estadísticas Nativas**:
```typescript
chart.ml.stats.fft(data)           // Fast Fourier Transform
chart.ml.stats.mean(data)          // Media aritmética
chart.ml.stats.standardDeviation(data) // Desviación estándar
chart.ml.stats.correlation(x, y)   // Correlación de Pearson
```

**Archivos Modificados**:
- `src/plugins/ml-integration/types.ts` - Tipos reconstruidos
- `src/plugins/ml-integration/native-algorithms.ts` - Getters de interfaz
- `src/plugins/ml-integration/index.ts` - API stats y fixes

#### Demos Creadas ✅

1. **ScientificDemo.vue**: Demo completa con 3 tabs:
   - BoxPlot: Distribución estadística de tratamientos
   - Error Bars: 3 datasets científicos (Enzyme Kinetics, Clinical Trial, Sensor)
   - ML Analysis: Filtrado de señales con estadísticas nativas

2. **WaterfallDemo.vue**: Demo con 3 escenarios:
   - Revenue Analysis: Análisis de ingresos Q4
   - Project Budget: Flujo de presupuesto por fases
   - Inventory Movement: Movimiento de inventario

**Documentación Creada**:
- `docs/examples/scientific-analysis.md` - Guía completa de análisis científico
- `docs/examples/waterfall-chart.md` - Guía de gráficos waterfall
- Actualizaciones en `docs/.vitepress/config.ts` - Sidebar links

---

### [2026-01-15] Finalización de Features v1.8.0 (Cat 1 & 2) ✅

Se han completado los pendientes de las Categorías 1 y 2 del Roadmap para cerrar la versión 1.8.0.

#### 1. PluginDataTransform (#5)
Implementación de un sistema de pipeline para transformaciones de datos encadenadas.
- **Normalize**: Normalización a rangos personalizados.
- **Smooth / Moving Average**: Suavizado de señales.
- **Derivative / Integral**: Cálculo numérico de primera y segunda derivada, e integral acumulativa.
- **Resample**: Remuestreo lineal para uniformidad de datos.
- **Baseline Removal**: Eliminación de línea base lineal.

#### 2. Gauge/Dial Charts (#9)
Nuevo tipo de visualización de tablero para métricas críticas.
- Renderizado en 2D Overlay para máxima calidad visual.
- Soporte para rangos de colores (semáforos) y agujas personalizables.
- Animación suave de valores.

#### 3. Sankey/Flow Diagrams (#10)
Visualización de flujos y balances.
- Layout automático de nodos por capas.
- Curvas de Bézier con grosor proporcional al flujo.
- Gradientes y efectos de brillo premium.

**Archivos Modificados/Creados**:
- `src/plugins/data-transform/index.ts` - Implementación del plugin.
- `src/renderer/GaugeRenderer.ts` - Renderizado de diales.
- `src/renderer/SankeyRenderer.ts` - Renderizado de flujos.
- `src/core/chart/ChartRenderer.ts` - Integración en el loop de overlay.
- `src/core/series/Series.ts` - Soporte para nuevos tipos de datos.
- `src/types.ts` - Definiciones de tipos para Gauge y Sankey.

**Roadmap**: Marcados como **COMPLETADO**.
- PluginDataTransform (#5)
- Gauge/Dial Charts (#9)
- Sankey/Flow Diagrams (#10)

---

### [2026-01-15] PluginLaTeX - Renderizado Matemático Nativo ✅

**Objetivo**: Implementar renderizado de expresiones LaTeX sin dependencias externas (cumpliendo con la política de 0 dependencias).

#### Implementación Comprimida y Escalable

Se creó un plugin **100% nativo** que usa Canvas 2D API para renderizar notación matemática común:

**Características Core (v1.0)**:
- ✅ **Símbolos Griegos**: Todas las letras griegas (α, β, γ, Δ, Σ, Ω, etc.)
- ✅ **Operadores Matemáticos**: ∑, ∫, ∂, ±, ×, ÷, ∞, ≤, ≥, ≠, ≈, →, ⇒
- ✅ **Superíndices/Subíndices**: `x^2`, `H_2O`, `x_i^2`
- ✅ **Fracciones**: `\frac{a}{b}` con renderizado vertical
- ✅ **Raíces Cuadradas**: `\sqrt{x}` con símbolo radical
- ✅ **Caché Inteligente**: Parseo y medición cacheados para performance
- ✅ **Personalizable**: fontSize, fontFamily, color

**Arquitectura (Pipeline de 3 Etapas)**:
1. **Tokenizer** (`parser.ts`) - Convierte string LaTeX en tokens
2. **Parser** (`parser.ts`) - Construye Abstract Syntax Tree (AST)
3. **Renderer** (`renderer.ts`) - Traversa AST y dibuja en Canvas 2D

**Mapeo de Símbolos**:
- Usa caracteres Unicode nativos (no requiere fuentes externas)
- 120+ símbolos matemáticos mapeados en `symbols.ts`

**Archivos Creados**:
- `src/plugins/latex/index.ts` - Plugin principal (167 líneas)
- `src/plugins/latex/parser.ts` - Tokenizer y Parser (212 líneas)
- `src/plugins/latex/renderer.ts` - Renderizador Canvas 2D (253 líneas)
- `src/plugins/latex/symbols.ts` - Mapeo Unicode (139 líneas)
- `src/plugins/latex/types.ts` - Definiciones TypeScript (80 líneas)
- `src/plugins/latex/exports.ts` - Exports del módulo

**Documentación**:
- `docs/api/plugin-latex.md` - API Reference completa (290 líneas)
- `docs/examples/latex-rendering.md` - Guía de uso y ejemplos (170 líneas)

**Demo Interactivo**:
- `docs/.vitepress/theme/demos/LaTeXDemo.vue` - Editor en vivo con:
  - Input de expresión LaTeX en tiempo real
  - 8 presets rápidos (Einstein, Heisenberg, Summation, etc.)
  - Controles de fontSize y color
  - Medición de dimensiones (width, height, baseline)
  - Grid de comandos soportados
  - Diseño glassmorphism premium

**API Expuesta**:
```typescript
chart.latex.render(latex, ctx, x, y, options)  // Renderizar
chart.latex.measure(latex, options)             // Medir sin renderizar
chart.latex.clearCache()                        // Limpiar caché
```

**Uso en Charts**:
```typescript
// Ejes
chart.xAxis.label = '\\Delta E (eV)';
chart.yAxis.label = '\\frac{\\partial^2 y}{\\partial x^2}';

// Anotaciones
chart.addAnnotation({
  type: 'text',
  text: 'E = mc^2',
  latex: true
});
```

**Limitaciones Actuales** (por diseño compacto):
- No soporta matrices (`\begin{matrix}`)
- No soporta ecuaciones multi-línea
- No soporta todos los 1000+ comandos LaTeX (solo los ~100 más comunes)

**Futuras Expansiones** (sin romper compatibilidad):
- Límites en integrales (`\int_0^\infty`)
- Comandos de color (`\color{red}`)
- Matrices básicas
- Más símbolos especializados

**Bundle Size**: ~850 líneas total (muy compacto)

**Progreso Phase 2**: 87.5% (7/8 features completos)
- Solo falta: **Gráficos Ternarios** (3 semanas estimadas)

**Actualizado**: `docs/ROADMAP.md` - Marcado como ✅ COMPLETO (2026-01-15)

---

### [2026-01-15] PluginLaTeX - Renderizado Matemático Nativo ✅

**Objetivo**: Implementar renderizado de expresiones LaTeX sin dependencias externas (cumpliendo con la política de 0 dependencias).

#### Implementación Comprimida y Escalable

Se creó un plugin **100% nativo** que usa Canvas 2D API para renderizar notación matemática común:

**Características Core (v1.0)**:
- ✅ **Símbolos Griegos**: Todas las letras griegas (α, β, γ, Δ, Σ, Ω, etc.) + ℏ (hbar)
- ✅ **Operadores Matemáticos**: ∑, ∫, ∂, ±, ×, ÷, ∞, ≤, ≥, ≠, ≈, →, ⇒
- ✅ **Superíndices/Subíndices**: `x^2`, `H_2O`, `x_i^2`
- ✅ **Fracciones**: `\frac{a}{b}` con renderizado vertical
- ✅ **Raíces Cuadradas**: `\sqrt{x}` con símbolo radical
- ✅ **Caché Inteligente**: Parseo y medición cacheados para performance
- ✅ **Personalizable**: fontSize, fontFamily, color

**Arquitectura (Pipeline de 3 Etapas)**:
1. **Tokenizer** (`parser.ts`) - Convierte string LaTeX en tokens individuales
2. **Parser** (`parser.ts`) - Construye Abstract Syntax Tree (AST)
3. **Renderer** (`renderer.ts`) - Traversa AST y dibuja en Canvas 2D

**Corrección Crítica del Tokenizer**:
- **Problema Original**: Agrupaba caracteres, causando que `x^2 + y^2` se parseara como `x^(2 + y^2)`
- **Solución**: Tokenización carácter por carácter (excepto comandos LaTeX)
- **Resultado**: `x^2 + y^2` → `['x', '^', '2', '+', 'y', '^', '2']` ✅

**Mapeo de Símbolos**:
- Usa caracteres Unicode nativos (no requiere fuentes externas)
- 120+ símbolos matemáticos mapeados en `symbols.ts`

**Archivos Creados**:
- `src/plugins/latex/index.ts` - Plugin principal con API (211 líneas)
- `src/plugins/latex/parser.ts` - Tokenizer y Parser (174 líneas)
- `src/plugins/latex/renderer.ts` - Renderizador Canvas 2D (237 líneas)
- `src/plugins/latex/symbols.ts` - Mapeo Unicode (142 líneas, incluye ℏ)
- `src/plugins/latex/types.ts` - Definiciones TypeScript (84 líneas)
- `src/plugins/latex/exports.ts` - Exports del módulo

**Documentación**:
- `docs/api/plugin-latex.md` - API Reference completa
- `docs/examples/latex-rendering.md` - Guía de uso y ejemplos

**Demo Interactivo**:
- `docs/.vitepress/theme/demos/LaTeXDemo.vue` - Editor en vivo con:
  - Input de expresión LaTeX en tiempo real
  - 8 presets rápidos (Einstein, Heisenberg, Pythagorean, Chemistry, etc.)
  - Controles de fontSize y color
  - Medición de dimensiones (width, height, baseline)
  - Grid de comandos soportados
  - Canvas dedicado (no usa overlay del chart)

**API Expuesta**:
```typescript
chart.latex.render(latex, ctx, x, y, options)  // Renderizar
chart.latex.measure(latex, options)             // Medir sin renderizar
chart.latex.clearCache()                        // Limpiar caché
```

**Exportaciones**:
- Agregado a `src/index.ts`: `PluginLaTeX`, `PluginLaTeXConfig`, `LaTeXPluginAPI`
- Agregado a `src/plugins/index.ts`

**Bundle Size**: ~850 líneas total (muy compacto)

---

### [2026-01-15] Gráficos Ternarios - Última Feature de Phase 2 ✅

**Objetivo**: Implementar visualizaciones triangulares para datos composicionales de 3 componentes.

#### Implementación Completa

Se implementó un renderer completo para gráficos ternarios (diagramas triangulares) usado en:
- **Clasificación de suelos** (arena, limo, arcilla)
- **Diagramas de fase** (metalurgia, composiciones de aleaciones)
- **Composiciones químicas** (3 componentes que suman 100%)
- **Análisis geológico** (contenido mineral de rocas)
- **Datos económicos** (asignación de presupuesto entre 3 categorías)

**Características Implementadas**:
- ✅ **Conversión de Coordenadas**: Ternario (a, b, c) → Cartesiano (x, y)
- ✅ **Grid Triangular**: Líneas paralelas a cada lado del triángulo
- ✅ **Outline del Triángulo**: Contorno del triángulo equilátero
- ✅ **Labels de Componentes**: Etiquetas en cada vértice
- ✅ **Scatter Points**: Renderizado de puntos de datos
- ✅ **Normalización Automática**: Si a+b+c ≠ 1, se normaliza automáticamente
- ✅ **Grid Configurable**: 5-20 divisiones (intervalos de porcentaje)

**Fórmula de Conversión**:
```
x = c + b/2
y = b × √3/2
```

Donde a, b, c están normalizados (a + b + c = 1)

**Archivos Creados**:
- `src/renderer/ternary/TernaryRenderer.ts` - Renderer completo (223 líneas)
  - `ternaryToCartesian()` - Conversión de coordenadas
  - `convertTernaryData()` - Conversión de arrays
  - `drawTernaryGrid()` - Grid triangular con divisiones configurables
  - `drawTernaryOutline()` - Contorno del triángulo
  - `drawTernaryLabels()` - Labels de componentes
  - `renderTernaryPoints()` - Puntos scatter
  - `renderTernaryPlot()` - Función all-in-one
- `src/renderer/ternary/types.ts` - Tipos TypeScript
- `src/renderer/ternary/index.ts` - Exports del módulo

**Tipos Agregados**:
- `TernaryData` - Estructura de datos (a[], b[], c[])
- `TernaryStyle` - Opciones de estilo
- `TernaryOptions` - Configuración completa
- Agregado "ternary" a `SeriesType` en `src/types.ts`

**Documentación**:
- `docs/api/ternary-charts.md` - API Reference completa con:
  - Guía de uso básico
  - Explicación del sistema de coordenadas
  - 5 casos de uso comunes (suelos, fases, geología, presupuesto, química)
  - Guía de lectura del gráfico
  - Mejores prácticas
  - Background matemático
- `docs/examples/ternary-charts.md` - Guía de implementación con ejemplos

**Demo Interactivo**:
- `docs/.vitepress/theme/demos/TernaryDemo.vue` - Demo completo con:
  - 4 datasets precargados:
    - Soil Classification (7 puntos)
    - Phase Diagram (6 puntos)
    - Budget Allocation (5 puntos)
    - Random Points (generador)
  - Controles interactivos:
    - Selector de dataset
    - Point size slider (3-15px)
    - Grid divisions slider (5-20)
    - Color picker
    - Toggles para grid y labels
  - Botón "Generate Random Data" (20 puntos aleatorios)
  - Info panel con labels de componentes y contador de puntos
  - Canvas responsive con DPR support

**Exportaciones**:
- Agregado a `src/renderer/index.ts`: `export * from './ternary'`
- Agregado a `src/index.ts`: `TernaryData`, `TernaryStyle`, `TernaryOptions`

**Integración VitePress**:
- Registrado `TernaryDemo` component
- Links agregados al sidebar:
  - API: `/api/ternary-charts`
  - Examples: `/examples/ternary-charts`

**Progreso Phase 2**: **100% COMPLETO** 🎉  
- 8/8 features implementados
- TODAS las features documentadas con demos interactivos

**Actualizado**: `docs/ROADMAP.md` - Phase 2 marcada como 100% COMPLETA (2026-01-15)

---

### [2026-01-15] PluginDragEdit - Edición Interactiva de Datos ✅

**Objetivo**: Permitir edición interactiva de puntos de datos mediante drag & drop para corrección manual, ajuste de curvas y exploración de datos.

#### Implementación Completa

Se implementó un plugin  robusto que permite arrastrar puntos con el mouse para modificar sus valores:

**Características Implementadas**:
- ✅ **Hit Detection Inteligente**: Usa `ctx.coords.pickPoint()` para detectar puntos cercanos
- ✅ **Constraints Configurables**: Editar solo X, solo Y, ambos, o ninguno
- ✅ **Grid Snapping**: Alinear puntos a intervalos de grid configurables
- ✅ **Validación Personalizada**: Función validator con capacidad de snap sugerido
- ✅ **Preview Visual**: Línea de preview durante drag con highlight del punto
- ✅ **Event Callbacks**: onDragStart, onDrag, onDragEnd para reaccionar a cambios
- ✅ **Edición Selectiva**: Configurar qué series son editables
- ✅ **Drag Threshold**: Evitar ediciones accidentales con distancia mínima
- ✅ **Hit Radius Configurable**: Ajustar área de detección según densidad de datos

**Arquitectura**:
1. **Detección**: `findNearestPoint()` usa `ctx.coords.pickPoint()` - hit detection nativo
2. **Conversión**: `pixelToData()` usa `ctx.coords.pixelToDataX/Y()` para precisión
3. **Validación**: `validateAndSnap()` aplica snapping y valida con función custom
4. **Actualización**: `updatePointData()` modifica arrays y dispara re-render
5. **Preview**: `drawPreview()` usa `ctx.coords.dataToPixelX/Y()` para overlay

**Correcciones Técnicas Importantes**:
- Inicialmente intenté usar `render.bounds` (no existe en RenderContext)
- **Solución**: Uso completo de `PluginContext.coords` API:
  - `pickPoint(x, y, radius)` - detección automática
  - `pixelToDataX/Y()` - conversión píxel → data
  - `dataToPixelX/Y()` - conversión data → píxel
- **Resultado**: Código más limpio y correcto usando APIs oficiales

**Archivos Creados**:
- `src/plugins/drag-edit/types.ts` - Tipos (142 líneas)
- `src/plugins/drag-edit/index.ts` - Plugin principal (415 líneas)
- `src/plugins/drag-edit/exports.ts` - Exports

**Documentación**:
- `docs/api/plugin-drag-edit.md` - API Reference completa
- `docs/examples/drag-edit.md` - Guía con 3 casos de uso

**Demo Interactivo**:
- `docs/.vitepress/theme/demos/DragEditDemo.vue` - Demo completo con:
  - Toggle enable/disable
  - Selector de constraint mode (both, x, y, none)
  - Grid snapping configurable
  - Color picker para highlight
  - Botón reset data
  - Feedback de última edición (ΔX, ΔY)

**API Expuesta**:
```typescript
chart.dragEdit.enable()
chart.dragEdit.disable()
chart.dragEdit.isEnabled()
chart.dragEdit.setEditableSeries(ids)
chart.dragEdit.getDraggedPoint()
chart.dragEdit.cancelDrag()
chart.dragEdit.updateConfig(config)
```

**Configuración**:
```typescript
PluginDragEdit({
  enabled: true,
  constraint: 'both' | 'x' | 'y' | 'none',
  snapToGrid: boolean,
  snapIntervalX: number,
  snapIntervalY: number,
  dragThreshold: number,  // pixels
  hitRadius: number,      // pixels
  editableSeries: string[],
  validator: (point) => DragValidation | boolean,
  onDragStart/onDrag/onDragEnd: (event) => void,
  highlightColor: string,
  showPreview: boolean,
  previewStyle: { color,  width, dash, opacity }
})
```

**Exportaciones**:
- Agregado a `src/index.ts`: `PluginDragEdit`, `PluginDragEditConfig`, `DragEditAPI`
- Agregado a `src/plugins/index.ts`

**Bundle Size**: ~560 líneas total (muy compacto considerando funcionalidad)

**Integración VitePress**:
- Registrado `DragEditDemo` component
- Links agregados al sidebar:
  - API: `/api/plugin-drag-edit`
  - Examples: `/examples/drag-edit`

**Casos de Uso Principales**:
1. Corrección manual de outliers
2. Ajuste de líneas base (constraint: 'y')
3. Modificación de puntos de control para curve fitting
4. Marcado interactivo de peaks

**Actualizado**: `docs/ROADMAP.md` - Marcado como ✅ COMPLETO (202-01-15)

---

### [2026-01-15] PluginCaching - Sistema de Caché Avanzado ✅

**Objetivo**: Implementar sistema de caché configurable para optimizar performance mediante almacenamiento de datos procesados y cálculos costosos.

#### Implementación Completa

Se implementó un plugin de caching robusto con múltiples estrategias y gestión automática de memoria:

**Características Implementadas**:
- ✅ **Estrategias Múltiples**: LRU (Least Recently Used), LFU (Least Frequently Used), FIFO
- ✅ **Gestión de Memoria**: Eviction automática cuando se alcanza el límite
- ✅ **TTL (Time To Live)**: Expiración automática configurable por entrada
- ✅ **Tag-based Invalidation**: Invalidación masiva por tags
- ✅ **Size Estimation**: Cálculo automático de tamaño en bytes
- ✅ **Estadísticas**: Hit/miss ratio, evictions, current size
- ✅ **Periodic Cleanup**: Limpieza automática cada 60 segundos
- ✅ **Type-Safe API**: API completa con TypeScript generics

**Arquitectura**:
1. **Storage**: Map<string, CacheEntry> con metadata (timestamp, hits, size, tags, ttl)
2. **Eviction**: Implementaciones de LRU/LFU/FIFO con sorting eficiente
3. **Size Tracking**: Estimación de tamaño para tipos primitivos, arrays, objetos, TypedArrays
4. **Cleanup**: setInterval para prune automático de entradas expiradas

**Estrategias de Eviction**:
- **LRU**: Ordena por `lastAccess`, remueve menos recientes
- **LFU**: Ordena por `hits`, remueve menos frecuentes  
- **FIFO**: Map preserva orden de inserción, remueve primeros

**Archivos Creados**:
- `src/plugins/caching/types.ts` - Tipos (133 líneas)
- `src/plugins/caching/index.ts` - Plugin principal (427 líneas)
- `src/plugins/caching/exports.ts` - Exports

**Documentación**:
- `docs/api/plugin-caching.md` - API Reference

**API Expuesta**:
```typescript
chart.cache.get<T>(key): T | undefined
chart.cache.set<T>(key, value, { ttl, tags, size })
chart.cache.has(key): boolean
chart.cache.delete(key): boolean
chart.cache.clear()
chart.cache.invalidateByTags(tags): number
chart.cache.getStats(): CacheStats
chart.cache.resetStats()
chart.cache.keys(): string[]
chart.cache.size(): number
chart.cache.prune(): number
chart.cache.updateConfig(config)
```

**Configuración**:
```typescript
PluginCaching({
  enabled: true,
  maxSize: 50 * 1024 * 1024,  // 50MB
  strategy: 'lru' | 'lfu' | 'fifo',
  defaultTTL: number,  // ms
  autoInvalidate: boolean,
  cacheTypes: {
    transforms: boolean,
    analysis: boolean,
    frames: boolean,
    bounds: boolean
  },
  onInvalidate: (event) => void,
  debug: boolean
})
```

**Estadísticas**:
```typescript
{
  hits: number,
  misses: number,
  hitRatio: 0-1,
  currentSize: bytes,
  maxSize: bytes,
  entryCount: number,
  evictions: number
}
```

**Exportaciones**:
- Agregado a `src/index.ts`: `PluginCaching`, `PluginCachingConfig`, `CachingAPI`
- Agregado a `src/plugins/index.ts`

**Bundle Size**: ~560 líneas total (muy eficiente)

**Casos de Uso Principales**:
1. Cache de transformaciones de datos costosas
2. Cache de resultados de análisis (FFT, filtering)
3. Cache de bounds calculados
4. Cache de renders parciales (frames)

**Optimizaciones**:
- Size estimation optimizado para TypedArrays (usa byteLength directo)
- Periodic cleanup cada 60s (configurable)
- Eviction lazy: solo cuando necesario
- Tag-based invalidation para bulk operations

**Actualizado**: `docs/ROADMAP.md` - Marcado como ✅ COMPLETO (2026-01-15)

---

### [2026-01-15] PluginBrokenAxis - Ejes Rotos ✅

**Objetivo**: Permitir la visualización de datos con grandes vacíos mediante la implementación de ejes discontinuos con indicadores visuales.

#### Implementación Completa

Se implementó un plugin que transforma el espacio de coordenadas para saltar rangos de datos definidos como brechas:

**Características Implementadas**:
- ✅ **Mapeo No Lineal**: Interceptación de `dataToPixelX` para manejar múltiples segmentos visibles y brechas.
- ✅ **Indicadores Visuales**: Dibujo automático de símbolos (diagonal, zigzag, wave) en los puntos de ruptura.
- ✅ **Configuración por Eje**: Soporte para configurar brechas específicas en cualquier eje.
- ✅ **Visual Ratio**: Control preciso del espacio visual que ocupa la brecha.
- ✅ **Runtime API**: Posibilidad de añadir o limpiar brechas dinámicamente.

**Detalles Técnicos**:
1. **BrokenScale Class**: Gestiona el mapeo entre unidades de datos y ratio visual (0-1).
2. **Coordinate Interception**: El plugin envuelve los métodos originales de `PluginContext.coords` para aplicar la transformación.
3. **Overlay Rendering**: Los símbolos se dibujan en el overlay para no interferir con la serie de datos.

**Archivos Creados**:
- `src/plugins/broken-axis/types.ts` - Tipos (56 líneas)
- `src/plugins/broken-axis/index.ts` - Plugin principal (296 líneas)
- `src/plugins/broken-axis/exports.ts` - Exports

**Documentación**:
- `docs/api/plugin-broken-axis.md` - API Reference completa con ejemplos de uso.

**API Expuesta**:
```typescript
chart.brokenAxis.addBreak(axisId, { start, end, symbol, visualRatio })
chart.brokenAxis.clearBreaks(axisId)
chart.brokenAxis.setEnabled(boolean)
chart.brokenAxis.getBreaks(axisId)
chart.brokenAxis.updateConfig(config)
```

**Exportaciones**:
- Agregado a `src/index.ts`: `PluginBrokenAxis`, `PluginBrokenAxisConfig`, `BrokenAxisAPI`, `AxisBreak`.
- Agregado a `src/plugins/index.ts`.

**Actualizado**: `docs/ROADMAP.md` - Marcado como ✅ COMPLETO (2026-01-16)

---

### [2026-01-16] PluginVideoRecorder - Grabación de Video Nativa ✅

**Objetivo**: Permitir la exportación de animaciones del gráfico directamente a archivos de video de alta calidad.

#### Implementación Completa

Se implementó un plugin de captura de medios que utiliza `MediaRecorder` y técnicas de composición de canvas:

**Características Implementadas**:
- ✅ **Composición en Tiempo Real**: Crea un canvas oculto que combina todas las capas del gráfico (WebGL, Overlay) en cada frame.
- ✅ **MediaRecorder Integration**: Captura el stream del canvas compuesto con FPS y bitrate configurables.
- ✅ **Fondo Sólido**: Opción para rellenar fondos transparentes, asegurando visibilidad en reproductores de video estándar.
- ✅ **Runtime Control**: API para iniciar, detener, pausar y reanudar la grabación.
- ✅ **Auto-Download**: Descarga automática del archivo resultante (.webm o .mp4).
- ✅ **Format Fallback**: Detección automática de soporte de codecs del navegador.

**Detalles Técnicos**:
1. **Composite Loop**: Utiliza `requestAnimationFrame` para sincronizar la captura con el ciclo de renderizado del navegador.
2. **Blob Management**: Acumula trozos de datos (`ondataavailable`) para generar un `Blob` final de video.
3. **MimeType Detection**: Prefiere `video/webm` por su amplia compatibilidad para captura de canvas.

**Archivos Creados**:
- `src/plugins/video-recorder/types.ts` - Tipos (60 líneas)
- `src/plugins/video-recorder/index.ts` - Plugin principal (220 líneas)
- `src/plugins/video-recorder/exports.ts` - Exports

**Documentación**:
- `docs/api/plugin-video-recorder.md` - API Reference completa con parámetros de configuración.

**API Expuesta**:
```typescript
chart.videoRecorder.start()
chart.videoRecorder.stop(): Promise<Blob>
chart.videoRecorder.pause()
chart.videoRecorder.resume()
chart.videoRecorder.isRecording(): boolean
chart.videoRecorder.updateConfig(config)
```

**Exportaciones**:
- Agregado a `src/index.ts`: `PluginVideoRecorder`, `PluginVideoRecorderConfig`, `VideoRecorderAPI`.
- Agregado a `src/plugins/index.ts`.

**Finalización de Fase**: Con la entrega de este plugin, se han completado las **5 características interactivas** planeadas para esta sesión, alcanzando el **100%** de los objetivos de desarrollo intermedio.

**Actualizado**: `docs/ROADMAP.md` (2026-01-16)

---

### Feature 4: PluginBrokenAxis v1.1 (Arquitectura de Re-proyección)
Se ha rediseñado completamente la lógica del plugin para que sea reactivo al zoom y pan.

**Mejoras Técnicas**:
- **Escala No Lineal**: Implementación de `BrokenAxisScale` que intercepta las transformaciones de coordenadas de forma global mediante `setXScale`.
- **Motor de Re-proyección**: El plugin ahora mantiene copias de los datos originales y los proyecta automáticamente a coordenadas "linealizadas" para WebGL cada vez que cambia la vista (`onViewChange`).
- **Estado Actual**: Código base robusto e implementado. El componente de demostración ha sido **desactivado temporalmente** en la documentación para una sesión de depuración intensiva en el futuro.

---

### Feature 5: Export & Media Suite (Consolidación)
Unificación de todas las herramientas de salida de datos y medios en una experiencia coherente.

**Cambios Realizados**:
- **Consolidación de Demos**: Se creó una página única `export-utilities.md` que renderiza las demos de Snapshot, Video y Export de forma secuencial.
- **Referencia Técnica Unificada**: Nueva página de API `plugin-export.md` que agrupa la documentación técnica para desarrolladores.
- **Simplificación del Sidebar**: Reducción de 6 entradas a 2 en la barra lateral para mejorar la DX.
- **Reutilización de Componentes**: Se optó por mantener los componentes de demo originales (`SnapshotDemo`, etc.) por su estabilidad comprobada.

**Progreso**: 
- Fase 2 funcionalmente completa al 100%. 
- Plugin de Ejes Rotos en fase de "Revisión/Debug".
- Documentación de Exportación simplificada y mejorada.

---

## 🚀 FASE 4: Nueva Generación (v1.10.x) - INICIADA 2026-01-17

### Feature 1: PluginForecasting ✅ COMPLETADO

**Objetivo**: Implementar una suite de predicción de series temporales nativa para análisis prospectivo.

**Implementación**:
- ✅ **Algoritmos Nativos**: Implementaciones de SMA, EMA, Regresión Lineal, Holt (Doble) y Holt-Winters (Triple).
- ✅ **Soporte Estacional**: Triple Smoothing capaz de modelar ciclos periódicos complejos.
- ✅ **Capa de Visualización**: Renderizado automático en overlay con líneas discontinuas y bandas de confianza sombreadas.
- ✅ **API Fluida**: Integración con `chart.forecasting.forecastSeries()` para uso inmediato sobre series existentes.
- ✅ **Caché de Fit**: Optimización de cálculos para parámetros α, β, γ.
- ✅ **Corrección de Inicialización**: Se añadió el getter `forecasting` a `ChartCore` y se actualizó la interfaz `Chart` para permitir el acceso directo a la API del plugin.
- ✅ **Soporte Async**: Se actualizó `chart.use()` para ser asíncrono, asegurando que la API esté disponible inmediatamente después de `await chart.use()`.

**Archivos Creados/Modificados**:
- `src/plugins/forecasting/` - Implementación completa (Types, Algorithms, Plugin).
- `src/plugins/index.ts` - Exportación global y registro de tipos.
- `docs/api/plugin-forecasting.md` - Referenecia técnica de la API.
- `docs/examples/forecasting.md` - Guía de implementación con ejemplos de código.
- `docs/.vitepress/theme/demos/ForecastingDemo.vue` - Demo interactiva con controles deslizantes para parámetros y horizonte.

**Progreso Phase 4**: 25% (1/4 features principales)
- ✅ PluginForecasting
- 🔄 PluginCollaboration (PENDIENTE)
- 🔄 PluginVoice (PENDIENTE)
- 🔄 Bindings para Python (PENDIENTE)

**Actualizado**: `docs/ROADMAP.md` - Phase 4 iniciada y marcada como en progreso.
