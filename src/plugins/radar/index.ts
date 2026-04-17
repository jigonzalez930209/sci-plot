import type { 
  PluginRadarConfig, 
  RadarAPI, 
  RadarSeriesData, 
  RadarPoint 
} from './types';
import type { 
  PluginManifest, 
  ChartPlugin, 
  PluginContext,
  AfterRenderEvent
} from '../types';

const manifestRadar: PluginManifest = {
  name: "sci-plot-radar",
  version: "1.0.0",
  description: "Advanced Radar/Spider Charts for sci-plot",
  provides: ["radar", "spider-chart"],
  tags: ["radar", "visualization", "comparison"],
};

const DEFAULT_CONFIG: Required<PluginRadarConfig> = {
  categories: [],
  maxValue: 100,
  minValue: 0,
  gridLevels: 5,
  showLabels: true,
  labelStyle: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  gridStyle: {
    color: 'rgba(255, 255, 255, 0.1)',
    width: 1,
    lineDash: []
  }
};

export function PluginRadar(
  userConfig: Partial<PluginRadarConfig> = {}
): ChartPlugin<PluginRadarConfig> {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  let ctx: PluginContext | null = null;
  const radarSeries = new Map<string, RadarSeriesData>();

  // ============================================
  // Drawing Logic
  // ============================================

  function drawRadar(pCtx: PluginContext) {
    const { render } = pCtx;
    const { ctx2d, plotArea } = render;

    if (!ctx2d) return;

    const centerX = plotArea.x + plotArea.width / 2;
    const centerY = plotArea.y + plotArea.height / 2;
    const maxRadiusPixels = Math.min(plotArea.width, plotArea.height) / 2 * 0.8;
    const numCategories = config.categories.length;
    
    if (numCategories === 0) return;
    const angleStep = (2 * Math.PI) / numCategories;

    ctx2d.save();
    
    // 1. Draw Grid (Levels)
    ctx2d.strokeStyle = config.gridStyle?.color || 'rgba(255, 255, 255, 0.1)';
    ctx2d.lineWidth = config.gridStyle?.width || 1;
    if (config.gridStyle?.lineDash && config.gridStyle.lineDash.length > 0) {
        ctx2d.setLineDash(config.gridStyle.lineDash);
    }

    for (let level = 1; level <= config.gridLevels; level++) {
      const radius = (level / config.gridLevels) * maxRadiusPixels;
      ctx2d.beginPath();
      for (let i = 0; i < numCategories; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const px = centerX + radius * Math.cos(angle);
        const py = centerY + radius * Math.sin(angle);
        if (i === 0) ctx2d.moveTo(px, py);
        else ctx2d.lineTo(px, py);
      }
      ctx2d.closePath();
      ctx2d.stroke();
    }

    // 2. Draw Spokes and Labels
    ctx2d.setLineDash([]);
    for (let i = 0; i < numCategories; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const px = centerX + maxRadiusPixels * Math.cos(angle);
      const py = centerY + maxRadiusPixels * Math.sin(angle);
      
      ctx2d.beginPath();
      ctx2d.moveTo(centerX, centerY);
      ctx2d.lineTo(px, py);
      ctx2d.stroke();

      if (config.showLabels) {
        const labelRadius = maxRadiusPixels + 25;
        const lx = centerX + labelRadius * Math.cos(angle);
        const ly = centerY + labelRadius * Math.sin(angle);
        
        ctx2d.fillStyle = config.labelStyle?.color || '#94a3b8';
        ctx2d.font = `${config.labelStyle?.fontSize || 12}px ${config.labelStyle?.fontFamily || 'sans-serif'}`;
        ctx2d.textAlign = Math.abs(Math.cos(angle)) < 0.1 ? "center" : (Math.cos(angle) > 0 ? "left" : "right");
        ctx2d.textBaseline = Math.abs(Math.sin(angle)) < 0.1 ? "middle" : (Math.sin(angle) > 0 ? "top" : "bottom");
        ctx2d.fillText(config.categories[i], lx, ly);
      }
    }

    // 3. Draw Radar Series
    radarSeries.forEach((series) => {
      const { points, style } = series;
      if (points.length === 0) return;

      const pathPoints: { x: number, y: number }[] = [];
      
      config.categories.forEach((cat, idx) => {
        const point = points.find(p => p.category === cat);
        const val = point ? point.value : 0;
        const radius = (val / config.maxValue) * maxRadiusPixels;
        const angle = idx * angleStep - Math.PI / 2;
        
        pathPoints.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      });

      ctx2d.beginPath();
      pathPoints.forEach((p, i) => {
        if (i === 0) ctx2d.moveTo(p.x, p.y);
        else ctx2d.lineTo(p.x, p.y);
      });
      ctx2d.closePath();
      
      ctx2d.fillStyle = style?.fillColor || (style?.color ? `${style.color}33` : 'rgba(0, 242, 255, 0.2)');
      ctx2d.fill();
      
      ctx2d.strokeStyle = style?.color || '#00f2ff';
      ctx2d.lineWidth = style?.width || 2;
      ctx2d.globalAlpha = style?.opacity || 1;
      ctx2d.stroke();

      if ((style?.pointSize || 0) > 0) {
          ctx2d.fillStyle = style?.color || '#00f2ff';
          pathPoints.forEach(p => {
              ctx2d.beginPath();
              ctx2d.arc(p.x, p.y, style!.pointSize! / 2, 0, Math.PI * 2);
              ctx2d.fill();
          });
      }
    });

    ctx2d.restore();
  }

  // ============================================
  // Plugin API
  // ============================================

  const api: RadarAPI & Record<string, unknown> = {
    addSeries(data: RadarSeriesData) {
      radarSeries.set(data.id, data);
      ctx?.requestRender();
      return data.id;
    },
    removeSeries(id: string) {
      const res = radarSeries.delete(id);
      if (res) ctx?.requestRender();
      return res;
    },
    updateSeries(id: string, points: RadarPoint[]) {
      const series = radarSeries.get(id);
      if (series) {
        series.points = points;
        ctx?.requestRender();
        return true;
      }
      return false;
    },
    setCategories(categories: string[]) {
      config.categories = categories;
      ctx?.requestRender();
    },
    setMaxValue(value: number) {
      config.maxValue = value;
      ctx?.requestRender();
    }
  };

  return {
    manifest: manifestRadar,

    onInit(c: PluginContext) {
      ctx = c;
      // Setup the chart for Radar (centered origin, fixed bounds)
      ctx.chart.updateXAxis({ visible: false, min: -1.2, max: 1.2 });
      ctx.chart.updateYAxis('default', { visible: false, min: -1.2, max: 1.2 });
    },

    onRenderOverlay(pCtx: PluginContext, _event: AfterRenderEvent) {
      drawRadar(pCtx);
    },

    api
  };
}

export default PluginRadar;

export type { 
  PluginRadarConfig, 
  RadarAPI, 
  RadarSeriesData, 
  RadarPoint 
} from './types';
