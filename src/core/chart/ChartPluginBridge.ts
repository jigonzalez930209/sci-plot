/**
 * ChartPluginBridge - Unified access to plugin APIs
 * 
 * Provides type-safe getters for all plugin APIs.
 * This avoids cluttering ChartCore with dozens of plugin accessors.
 */

import type { PluginManagerImpl } from "../../plugins";

export class ChartPluginBridge {
  constructor(private pluginManager: PluginManagerImpl) { }

  private getAPI<T>(name: string): T | null {
    // 1. Try by manifest name
    const plugin = this.pluginManager.get(name) as any;
    if (plugin?.api) return plugin.api;

    // 2. Try by capability (provides)
    const manifests = this.pluginManager.getManifests();
    const manifestWithCapability = manifests.find(m => m.provides?.includes(name));
    if (manifestWithCapability) {
      const p = this.pluginManager.get(manifestWithCapability.name) as any;
      if (p?.api) return p.api;
    }

    // 3. Special case for latex if name is 'latex' but manifest is 'scichart-latex'
    if (name === "latex" || name === "scichart-latex") {
      const latex = this.pluginManager.get("scichart-latex") as any;
      if (latex?.api) return latex.api;
      const providesLatex = manifests.find(m => m.provides?.includes("latex"));
      if (providesLatex) {
        return (this.pluginManager.get(providesLatex.name) as any)?.api || null;
      }
    }

    return null;
  }

  get analysis(): any {
    const api = this.getAPI<any>("scichart-analysis");
    if (api) return api;

    return {
      integrate: () => 0,
      detectPeaks: () => [],
      detectCycles: () => [],
      movingAverage: (data: any) => data,
      sma: () => [],
      ema: () => [],
    };
  }

  get tooltip(): any {
    const manager = this.getAPI<any>("scichart-tools")?.getTooltipManager();
    if (manager) return manager;

    return {
      configure: () => { },
      handleCursorMove: () => { },
      handleCursorLeave: () => { },
      setSuspended: () => { },
      updateChartTheme: () => { },
    };
  }

  get loading(): any {
    const api = this.getAPI<any>("scichart-loading");
    if (api) return api;

    return {
      show: () => { },
      hide: () => { },
      setProgress: () => { },
      setMessage: () => { }
    };
  }

  get deltaTool(): any {
    return this.getAPI<any>("scichart-tools")?.getDeltaTool() ?? null;
  }

  get peakTool(): any {
    return this.getAPI<any>("scichart-tools")?.getPeakTool() ?? null;
  }

  get regression(): any {
    return this.getAPI<any>("regression");
  }

  get radar(): any {
    return this.getAPI<any>("scichart-radar");
  }

  get ml(): any {
    return this.getAPI<any>("scichart-ml-integration");
  }

  get snapshot(): any {
    return this.getAPI<any>("scichart-snapshot");
  }

  get dataExport(): any {
    return this.getAPI<any>("scichart-data-export");
  }

  get roi(): any {
    return this.getAPI<any>("roi");
  }

  get videoRecorder(): any {
    return this.getAPI<any>("scichart-video-recorder");
  }

  get offscreen(): any {
    return this.getAPI<any>("scichart-offscreen");
  }

  get virtualization(): any {
    return this.getAPI<any>("scichart-virtualization");
  }

  get themeEditor(): any {
    return this.getAPI<any>("scichart-theme-editor");
  }

  get sync(): any {
    return this.getAPI<any>("scichart-sync");
  }

  get brokenAxis(): any {
    return this.getAPI<any>("scichart-broken-axis");
  }

  get forecasting(): any {
    return this.getAPI<any>("scichart-forecasting");
  }

  get latex(): any {
    return this.getAPI<any>("scichart-latex");
  }

  /**
   * Get a plugin API by name
   */
  public getPlugin<T = any>(name: string): T | null {
    return this.getAPI<T>(name);
  }

  /**
   * Get all plugin names
   */
  public getPluginNames(): string[] {
    return this.pluginManager.getNames();
  }
}
