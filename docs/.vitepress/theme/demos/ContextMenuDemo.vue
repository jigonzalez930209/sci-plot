<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;

const eventLog = ref<string[]>([]);

// Generate sample data
function generateData() {
  const points = 300;
  const x = new Float32Array(points);
  const y = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    const t = (i / points) * 10;
    x[i] = t;
    y[i] = Math.sin(t) * 2 + Math.cos(t * 0.5) + Math.random() * 0.3;
  }
  
  return { x, y };
}

function logEvent(msg: string) {
  eventLog.value.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (eventLog.value.length > 10) {
    eventLog.value.pop();
  }
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return;
  
  const { createChart } = await import('@src/index');
  const { PluginTools } = await import('@src/plugins/tools');
  const { PluginDataExport } = await import('@src/plugins/data-export');
  const { PluginContextMenu } = await import('@src/plugins/context-menu');
  
  chart = createChart({
    container: chartContainer.value,
    title: 'Right-Click for Context Menu',
    xAxis: { label: 'Time (s)' },
    yAxis: { label: 'Amplitude' },
    theme: 'midnight',
    showLegend: true,
    showControls: true,
    plugins: [
      PluginTools({ useEnhancedTooltips: true }),
      PluginDataExport({ defaultFormat: 'csv' }),
      PluginContextMenu({
        useDefaults: true,
        items: [
          { type: 'separator' },
          {
            label: 'Custom Actions',
            icon: '⚡',
            type: 'submenu',
            items: [
              { 
                label: 'Generate New Data', 
                icon: '🔄',
                onClick: () => {
                  if (!chart) return;
                  chart.updateSeries('wave', generateData());
                  logEvent('Generated new data');
                }
              },
              { 
                label: 'Toggle Points',
                icon: '●',
                onClick: () => {
                  if (!chart) return;
                  const series = chart.getSeries('wave');
                  if (series) {
                    const style = series.getStyle();
                    const newSize = (style.pointSize || 0) > 0 ? 0 : 4;
                    chart.updateSeries('wave', undefined, { pointSize: newSize });
                    logEvent(`Points ${newSize > 0 ? 'enabled' : 'disabled'}`);
                  }
                }
              },
              {
                label: 'Change Color',
                icon: '🎨',
                type: 'submenu',
                items: [
                  { label: 'Cyan', icon: '🔵', onClick: () => { chart?.updateSeries('wave', undefined, { color: '#00f2ff' }); logEvent('Color: Cyan'); } },
                  { label: 'Orange', icon: '🟠', onClick: () => { chart?.updateSeries('wave', undefined, { color: '#ff9f43' }); logEvent('Color: Orange'); } },
                  { label: 'Pink', icon: '🩷', onClick: () => { chart?.updateSeries('wave', undefined, { color: '#ff6b9d' }); logEvent('Color: Pink'); } },
                ]
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Log Click Position',
            icon: '📍',
            onClick: (ctx: any) => {
              if (ctx.dataPosition) {
                logEvent(`Clicked at X: ${ctx.dataPosition.x.toFixed(2)}, Y: ${ctx.dataPosition.y.toFixed(2)}`);
              }
            }
          }
        ],
        afterHide: () => {
          logEvent('Menu closed');
        }
      })
    ]
  });
  
  // Add data
  const data = generateData();
  chart.addSeries({
    id: 'wave',
    name: 'Wave Signal',
    type: 'line',
    data,
    style: { color: '#00f2ff', width: 2 }
  });
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="context-menu-demo">
    <div ref="chartContainer" class="chart-container"></div>
    
    <div class="info-panel">
      <h4>💡 Try These:</h4>
      <ul>
        <li><strong>Right-click</strong> anywhere on the chart</li>
        <li>Use <strong>Zoom to Fit</strong> to reset view</li>
        <li>Try <strong>Custom Actions</strong> submenu</li>
        <li>Add annotations with <strong>Annotations</strong> menu</li>
        <li>Export data via <strong>Export</strong> submenu</li>
      </ul>
    </div>
    
    <div v-if="eventLog.length > 0" class="event-log">
      <h4>📋 Event Log:</h4>
      <div class="log-entries">
        <div v-for="(log, i) in eventLog" :key="i" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-menu-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.info-panel {
  background: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #00f2ff;
}

.info-panel h4 {
  margin: 0 0 0.75rem 0;
  color: #00f2ff;
}

.info-panel ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-panel li {
  margin: 0.25rem 0;
}

.event-log {
  background: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 8px;
}

.event-log h4 {
  margin: 0 0 0.75rem 0;
  color: var(--vp-c-text-1);
}

.log-entries {
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  padding: 0.25rem 0.5rem;
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}

.log-entry:first-child {
  color: #00f2ff;
  font-weight: 500;
}
</style>
