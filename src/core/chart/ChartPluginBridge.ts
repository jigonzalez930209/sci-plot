/**
 * ChartPluginBridge - Unified access to plugin APIs
 * 
 * Provides type-safe getters for all plugin APIs.
 * This avoids cluttering ChartCore with dozens of plugin accessors.
 */

import type { PluginManagerImpl } from "../../plugins";

export class ChartPluginBridge {
  constructor(private pluginManager: PluginManagerImpl) {}

  private getAPI<T>(name: string): T | null {
    const plugin = this.pluginManager.get(name) as any;
    return plugin ? plugin.api : null;
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
      configure: () => {},
      handleCursorMove: () => {},
      handleCursorLeave: () => {},
      setSuspended: () => {},
      updateChartTheme: () => {},
    };
  }

  get loading(): any {
    const api = this.getAPI<any>("scichart-loading");
    if (api) return api;
    
    return {
      show: () => {},
      hide: () => {},
      setProgress: () => {},
      setMessage: () => {}
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
