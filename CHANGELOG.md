# Changelog

All notable changes to this project will be documented in this file.

## [1.10.0] - 2026-01-17

### Added
- **PluginForecasting**: Native time-series prediction suite featuring Holt-Winters (Triple Exponential Smoothing), Holt (Double), Linear Trend, and Moving Averages.
- **Improved Forecasting Visuals**: Automatic rendering of forecast projections with dashed lines and shaded confidence intervals.
- **Seasonal Analysis**: Built-in support for modeling periodic cycles in data for more accurate long-term predictions.

### Improved
- **Roadmap Phase 4**: Commenced the 'New Generation' phase with advanced analytical capabilities.

## [1.9.0] - 2026-01-16

### Added
- **PluginOffscreen**: High-performance multi-threaded rendering using Worker Pool and OffscreenCanvas.
- **PluginVirtualization**: Modern data virtualization for 1M+ points using LTTB and Min-Max downsampling.
- **PluginROI**: Region of Interest selection tools (Lasso, Circle, Polygon, Rectangle) with data masking capabilities.
- **PluginBrokenAxis**: Specialized axis rendering for datasets with significant gaps.
- **PluginSnapshot**: Professional high-resolution image export (up to 8K) with custom watermarks.
- **Unified Plugin Discovery**: Direct API access on the chart instance (e.g., `chart.snapshot`, `chart.dataExport`, `chart.roi`, `chart.videoRecorder`).
- **Plugin Discovery API**: New `chart.getPluginNames()` method to introspect loaded plugins.

### Improved
- **Interaction Engine**: Robust `onInteraction` hook allowing plugins to capture, transform, or block native gestures.
- **Automatic Framing**: Improved `autoScale` logic for animated series and dynamically generated data in demos.
- **TypeScript Experience**: Complete `Chart` interface with all plugin properties for full IntelliSense support.
- **Data Integrity**: New `invalidateBuffers()` method on Series to force cached data refreshes.

### Fixed
- Initialization crash in `PluginSnapshot` when attempting to overwrite read-only getters.
- Interaction blocking bug in `PluginDragEdit` during point manipulation.
- Rendering inconsistencies in the 2D Overlay for polygon and lasso tools.
- Visibility issues in `ChartImpl` for the `events` property.

## [1.8.1] - 2026-01-16

### Added
- **PluginLaTeX**: Integrated LaTeX rendering for chart labels, titles, and annotations using a compressed math engine.
- **Ternary Charts**: Support for three-variable data visualization (A+B+C=100%) with ternary coordinate helpers.

## [1.8.0] - 2026-01-14

### Added
- **Sankey Diagrams**: Specialized high-performance renderer for visualizing flows, energy distribution, and process monitoring.
- **Gauge Charts**: Support for linear and radial needle-based gauges with customizable ranges and bands.
- **Data Transform Plugin**: Real-time signal processing pipeline support for Detrending, Baseline Correction, and Calibration.
- **PluginML**: Initial machine learning integration suite for time-series forecasting and classification.
- **PluginRadar**: Multi-variable radar/spider charts for comparative analysis.

## [1.7.2] - 2026-01-14

### Improved
- **Polar Grids**: Enhanced grid generation with support for angular subdivisions and radial scaling.

## [1.7.1] - 2026-01-14

### Added
- **Anomaly Detection Plugin**: Real-time outlier detection using Z-score, IQR, and adaptive thresholding.

## [1.7.0] - 2026-01-14

### Added
- **Polar Chart Core**: Native high-performance polar coordinate system with support for standard scientific series.

## [1.6.0] - 2026-01-12

### Added
- **Directional Indicators**: Real-time trend arrows and direction highlights for cyclic data (e.g., Cyclic Voltammetry).
- **Serialization API**: New hooks for plugins to participate in chart state save/load cycles.

## [1.5.3] - 2026-01-12

### Fixed
- **Streaming Axis Switching**: Resolved visual jump/flicker when switching axes during high-frequency data updates.

## [1.5.1] - 2026-01-10

### Added
- **Default Loading Chart**: Improved UX with a built-in loading state during initial rendering.
- **Selection through Legend**: Ability to highlight and select series directly from the legend items.
- **Favicon Support**: Custom favicon for documentation and web applications.

### Improved
- **Visualization**: Enhanced overall chart rendering quality and series visibility.
- **Usability**: Refined legend and settings button interactions for better accessibility.

### Fixed
- Resolved minor bugs and UI inconsistencies across the library.

## [1.4.0] - 2026-01-09

### Added
- **Plugin System Architecture**: Completely new modular plugin-based core allowing for better extensibility and tree-shaking.
- **Integral and Measurement Tools**: New plugins for precise data analysis and interactive measurements on the chart.
- **Background Customization**: Support for dynamic background colors and enhanced styling options.

### Changed
- **Modular Refactor**: Migrated core functionalities to dedicated plugins (Analysis, Tools, Annotations, etc.).
- **Import Structure**: Updated export paths to support scoped plugin imports.

## [1.3.0] - 2026-01-08

### Added
- **Theme Editor Plugin**: Interactive tool for real-time chart theme customization.
- **Financial Indicators**: Support for specialized scientific and financial data visualization.
- **Streaming Backpressure**: Robust handling of high-frequency data streams to ensure UI responsiveness.
- **Internationalization (i18n)**: Support for multiple languages in UI components.
- **Hotkeys and Shortcuts**: Enhanced keyboard navigation and chart control.
- **Debug Mode**: Built-in developer tools for performance monitoring and troubleshooting.

## [1.2.0] - 2026-01-08

### Added
- **Sequential Chart Rendering**: Implementation of a Queue system for smoother data updates and rendering performance.
- **FFT Complex Analyzer**: New utility for complex Fast Fourier Transform analysis of scientific data.

### Fixed
- **Tooltip Performance**: Resolved lag issues during tooltip rendering on large datasets.

## [0.4.2] - 2026-01-02

### Added
- **10M Points Challenge**: Specialized demo showcasing extreme performance capabilities (30 million points support).

### Improved
- **Rendering Performance**: Optimized data processing pipelines for high-density datasets.

## [0.4.0] - 2026-01-02

### Added
- **Comprehensive Tooltip System**: New tooltip module featuring customizable templates, smart positioning, and multi-series support.

### Changed
- **Package Renaming**: Transitioned to `@jigonzalez930209/scichart-engine` for better package management.

## [0.3.0] - 2026-01-01

### Added
- **New Series Types**: Support for Candlestick and Stacked series.
- **WebSocket Streaming**: Native support for real-time data streaming over WebSockets.
- **Plugin Manager**: Initial introduction of the internal plugin management system.

### Changed
- **Native WebGL Refactor**: Significant performance improvements to the core WebGL renderer.

## [0.2.0] - 2025-12-31

### Added
- **Band Series Support**: New `band` series type for rendering filled areas between two curves (high-performance `TRIANGLE_STRIP` rendering).
- **Area Charts**: New `area` series type for solid fills from a curve to the baseline (y=0).
- **Statistics Panel**: Built-in collapsible overlay showing real-time Min, Max, Mean, Count, and Integrated Area for visible data.
- **Peak Analysis**:
  - Interactive example showing baseline subtraction, peak integration, and automatic peak labeling.
  - New analysis utilities for numerical integration and background correction.
- **Annotation System**: Complete support for Horizontal/Vertical lines, Rectangles, Bands, Text, and Arrows.
- **Step Charts**: New series types `step` and `step+scatter` with `before`, `after`, and `center` modes.
- **Data Export**: Export chart data to CSV and JSON formats with customizable precision.
- **Error Bars**: Support for symmetric/asymmetric Y error bars and horizontal X error bars.
- **Scatter Symbols**: 8 high-performance shapes (circle, square, diamond, triangle, etc.) using GPU-accelerated SDF rendering.
- **Enhanced Multi-Axis**: Independent scroll-zoom per axis, automatic stacking, and right-hand axis support.

### Changed
- **Modular Architecture (The Great Refactor)**: Rebuilt `Chart.ts` from a monolith into 8 specialized, maintainable modules (<250 LOC each).
- **Enhanced Data Analysis**: Improved `fitData` utility with better numerical stability for high-order polynomials.
- **Real-time Rolling Windows**: Improved `appendData` with circular buffer logic and selectable window sizes in demos.

### Fixed
- **Empty Legend Regression**: Resolved issue where legend didn't sync after series additions.
- **Secondary Axis Wheel Zoom**: Corrected hit-testing for right-positioned Y-axes.
- **Theme Transitions**: Improved resizing logic during dynamic theme switching.
- **Documentation**: Fixed asset paths and deployment URLs for GitHub Pages.

## [0.1.1] - 2025-12-30

### Fixed
- Documentation URL updates

## [0.1.0] - 2025-12-30

### Added
- Initial standalone release of scichart-engine.
- WebGL specialized renderer for scientific data.
- React components and hooks support.
- Support for Panning and Box Zoom.
- Axis-specific zooming capabilities.
- Documentation site base with VitePress.
- CI/CD workflows for NPM and GitHub Pages.
