# AGENT Development Log

## 2026-01-12
- Created `ENGINE_AI_GUIDE.md`: A comprehensive, single-file technical guide for AI agents to implement and integrate the SciChart Engine.
- The guide covers architecture, data management, plugins (Analysis, Tools, Loading), theming, and interaction modes.
- Added implementation checklist for AI agents.

## 2026-01-12 (Refactoring)
- **Core Refactor**: Disabled automatic loading of default plugins (`PluginDebug`, `PluginTools`, `PluginAnalysis`, `PluginAnnotations`) in `ChartCore.ts`.
- **Explicit Plugin Usage**: Updated all 2D chart documentation examples to explicitly import and use necessary plugins.
- **Tooltips**: Enabled "Enhanced Tooltips" in all documentation examples using `PluginTools`.
- **Code Quality**: Enforced a more modular approach where features are only loaded when needed, reducing default bundle size.
