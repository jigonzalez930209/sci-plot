import { defineConfig } from "vitepress";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const base = '/scichart-engine/';

export default defineConfig({
  base,
  title: "SciChart Engine | Ultra-fast WebGL Charts",
  description:
    "Open-source high-performance WebGL2 scientific charting engine for real-time visualization of millions of data points at 60 FPS. Supports 2D and 3D charts with zero-copy architecture.",
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.ico` }],
    ['meta', { name: 'theme-color', content: '#00f2ff' }],
  ],
  vite: {
    resolve: {
      alias: {
        "@src": path.resolve(__dirname, "../../src"),
      },
    },
    server: {
      fs: {
        allow: [".."],
      },
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'SciChart Engine',
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "Examples", link: "/examples/" },
      {
        text: "Contributing",
        link: "https://github.com/jigonzalez930209/scichart-engine/blob/main/CONTRIBUTING.md",
      },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Core Architecture",
          items: [
            { text: "Chart Architecture", link: "/guide/concepts" },
            { text: "Series & Data", link: "/guide/series" },
            { text: "Integration Guide", link: "/guide/react" },
          ],
        },
        {
          text: "Visualization & UI",
          items: [
            { text: "Interactions", link: "/guide/interactions" },
            { text: "Theming System", link: "/guide/theming" },
            { text: "Annotations & UI", link: "/api/annotations" },
          ],
        },
        {
          text: "Scientific & Advanced",
          items: [
            { text: "Real-time Data", link: "/guide/realtime" },
            { text: "Large Datasets", link: "/guide/large-datasets" },
            { text: "Scientific Analysis", link: "/guide/analysis" },
            { text: "Plugin System", link: "/guide/plugins" },
            { text: "Utilities & DX", link: "/guide/utilities" },
          ],
        },
        {
          text: "3D Rendering",
          items: [
            { text: "Getting Started 3D", link: "/guide/3d/getting-started" },
            { text: "Specialized Renderers", link: "/guide/3d/advanced-renderers" },
            { text: "Camera & Controls", link: "/guide/3d/camera-controls" },
          ],
        },
      ],
      "/api/": [
        {
          text: "Initialization",
          items: [
            { text: "createChart", link: "/api/chart" },
            { text: "Global Events", link: "/api/events" },
            { text: "Plugin API", link: "/api/plugins" },
          ],
        },
        {
          text: "2D Series Types",
          items: [
            { text: "Basic Series", link: "/api/series" },
            { text: "Band Series", link: "/api/band-series" },
            { text: "Step Charts", link: "/api/step-charts" },
            { text: "Bar Charts", link: "/api/bar-charts" },
            { text: "Heatmaps", link: "/api/heatmap" },
            { text: "Candlestick", link: "/api/candlestick" },
            { text: "Error Bars", link: "/api/error-bars" },
            { text: "Polar Charts", link: "/api/polar-charts" },
            { text: "Gauge Charts", link: "/api/gauge-charts" },
            { text: "Sankey Diagrams", link: "/api/sankey-diagrams" },
          ],
        },
        {
          text: "Visual Elements & UI",
          items: [
            { text: "Tooltip System", link: "/api/tooltips" },
            { text: "Interactive Tools", link: "/api/interactive-tools" },
            { text: "Annotations", link: "/api/annotations" },
            { text: "Statistics Panel", link: "/api/statistics-panel" },
            { text: "Multi-Axis Support", link: "/api/multi-axis" },
            { text: "Selection & Hit-Test", link: "/api/selection" },
            { text: "Animations", link: "/api/animations" },
          ],
        },
        {
          text: "Optimization & State",
          items: [
            { text: "Responsive Design", link: "/api/responsive" },
            { text: "State Persistence", link: "/api/persistence" },
            { text: "Data Export", link: "/api/export" },
          ],
        },
        {
          text: "Data Analysis",
          items: [
            { text: "Analysis Overview", link: "/api/analysis" },
            { text: "Spectral & FFT", link: "/api/analysis-advanced" },
            { text: "Peak Detection", link: "/api/analysis-peaks" },
            { text: "Curve Fitting", link: "/api/fitting" },
            { text: "Cycle Analysis", link: "/api/analysis-cycles" },
            { text: "Financial Indicators", link: "/api/indicators" },
          ],
        },
        {
          text: "3D Engine",
          items: [
            { text: "3D Overview", link: "/api/3d/" },
            { text: "Renderers & Series", link: "/api/3d/series" },
            { text: "3D Axes", link: "/api/3d/axes" },
            { text: "Orbit Controls", link: "/api/3d/controls" },
            { text: "3D Camera", link: "/api/3d/camera" },
          ],
        },
        {
          text: "Ecosystem",
          items: [
            { text: "React Components", link: "/api/react-scichart" },
            { text: "React Hooks", link: "/api/react-hook" },
            { text: "Theming API", link: "/api/themes" },
            { text: "Chart Sync", link: "/api/chart-sync" },
          ],
        },
        {
          text: "Modular Plugins",
          items: [
            { text: "Data Transform", link: "/api/plugin-data-transform" },
            { text: "Data Export", link: "/api/plugin-data-export" },
            { text: "Context Menu", link: "/api/plugin-context-menu" },
            { text: "Anomaly Detection", link: "/api/plugin-anomaly-detection" },
            { text: "Regression Plugin", link: "/api/plugin-regression" },
            { text: "Radar Charts", link: "/api/plugin-radar" },
            { text: "ML Integration", link: "/api/plugin-ml-integration" },
            { text: "Snapshot Export", link: "/api/plugin-snapshot" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Fundamental Charts",
          items: [
            { text: "Basic Chart", link: "/examples/basic" },
            { text: "Area Charts", link: "/examples/area-charts" },
            { text: "Bar Charts", link: "/examples/bar-charts" },
            { text: "Waterfall Charts", link: "/examples/waterfall-chart" },
            { text: "Step Charts", link: "/examples/step-charts" },
            { text: "Stacked Charts", link: "/examples/stacked-charts" },
            { text: "Multiple Y-Axes", link: "/examples/multiple-y-axes" },
          ],
        },
        {
          text: "Scientific & Specialized",
          items: [
            { text: "Heatmaps", link: "/examples/heatmap" },
            { text: "Candlestick", link: "/examples/candlestick" },
            { text: "Error Bars", link: "/examples/error-bars" },
            { text: "Scatter Symbols", link: "/examples/scatter-symbols" },
            { text: "Polar Charts", link: "/examples/polar-charts" },
            { text: "Radar Charts", link: "/examples/radar-charts" },
            { text: "Gauge & Sankey", link: "/examples/gauge-sankey" },
          ],
        },
        {
          text: "Advanced Analysis",
          items: [
            { text: "Math Functions", link: "/examples/analysis-advanced" },
            { text: "FFT Waveforms", link: "/examples/fft-waveforms" },
            { text: "├─ Sine Waves", link: "/examples/sine-waves" },
            { text: "├─ Square Waves", link: "/examples/square-waves" },
            { text: "├─ Triangle Waves", link: "/examples/triangle-waves" },
            { text: "Complex FFT", link: "/examples/complex-fft" },
            { text: "Curve Fitting", link: "/examples/curve-fitting" },
            { text: "Regression Plugin", link: "/examples/regression-plugin" },
            { text: "AI Integration", link: "/examples/ml-integration" },
            { text: "Peak Analysis", link: "/examples/analysis" },
            { text: "Single Frequency Filter", link: "/examples/single-frequency-filter" },
            { text: "Statistics Panel", link: "/examples/statistics" },
            { text: "🔬 Scientific Analysis", link: "/examples/scientific-analysis" },
          ],
        },
        {
          text: "Extreme Performance",
          items: [
            { text: "Real-time Streaming", link: "/examples/realtime" },
            { text: "Cyclic Voltammetry", link: "/examples/cyclic-voltammetry" },
            { text: "Large Datasets (1M)", link: "/examples/large-datasets" },
            { text: "30M Points Challenge", link: "/examples/10m-points" },
          ],
        },
        {
          text: "Interaction & UI",
          items: [
            { text: "Tooltip Showcase", link: "/examples/tooltips" },
            { text: "Annotations", link: "/examples/annotations" },
            { text: "React Integration", link: "/examples/react" },
          ],
        },
        {
          text: "3D Visualization",
          items: [
            { text: "Signal: Waterfall", link: "/examples/3d/waterfall-chart" },
            { text: "Signal: Ribbon", link: "/examples/3d/ribbon-chart" },
            { text: "Field: Quiver (Vector)", link: "/examples/3d/vector-field" },
            { text: "Field: Impulse", link: "/examples/3d/impulse-chart" },
            { text: "Data: 3D Heatmap", link: "/examples/3d/heatmap-chart" },
            { text: "Data: 3D Histogram", link: "/examples/3d/column-chart" },
            { text: "Discrete: Scatter 3D", link: "/examples/3d/scatter-chart" },
            { text: "Discrete: Bubble 3D", link: "/examples/3d/bubble-chart" },
            { text: "Discrete: Point Cloud", link: "/examples/3d/point-cloud" },
            { text: "Trajectories: Point Line 3D", link: "/examples/3d/point-line-chart" },
            { text: "Surface Mesh", link: "/examples/3d/surface-mesh" },
            { text: "Volumetric: Voxel", link: "/examples/3d/voxel-chart" },
          ],
        },
        {
          text: "Developer Experience",
          items: [
            { text: "Financial Indicators", link: "/examples/indicators" },
           // { text: "Chart Synchronization", link: "/examples/chart-sync" },
            { text: "Theme Editor", link: "/examples/theme-editor" },
            { text: "Waveform Generators", link: "/examples/waveforms" },
            { text: "Backpressure Demo", link: "/examples/backpressure" },
            { text: "Internationalization", link: "/examples/i18n" },
            { text: "Data Export", link: "/examples/data-export" },
            { text: "Context Menu", link: "/examples/context-menu" },
            { text: "Anomaly Detection", link: "/examples/anomaly-detection" },
            { text: "Snapshot Export", link: "/examples/snapshot-export" },
          ],
        },
      ],
    },
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/jigonzalez930209/scichart-engine",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025-present SciChart Engine",
    },
  },
});
