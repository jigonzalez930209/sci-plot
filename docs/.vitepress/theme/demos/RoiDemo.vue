<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const selectedRegion = ref<any>(null)
const activeTool = ref('rectangle')
const isMasking = ref(false)
let chart: any = null

function toggleMasking() {
  if (chart && chart.roi) {
    chart.roi.setMasking(isMasking.value)
  }
}

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart, PluginROI, PluginTools } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true
  })

  await chart.use(PluginTools({ useEnhancedTooltips: true }))
  await chart.use(PluginROI({
    defaultTool: 'rectangle',
    fill: 'rgba(0, 242, 255, 0.15)',
    stroke: '#00f2ff'
  }))

  const n = 1000
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = i * 0.1
    y[i] = Math.sin(i * 0.1) + Math.random() * 0.5
  }

  chart.addSeries({
    id: 'data-1',
    type: 'line',
    data: { x, y },
    style: { color: isDark.value ? '#00f2ff' : '#04d9ff', width: 2 }
  })

  // Ensure proper rendering and bounds
  setTimeout(() => {
    if (chart) {
      chart.resize()
      chart.autoScale(false)
      chart.render()
    }
  }, 150)

  chart.events.on('roi:selected', (event: any) => {
    selectedRegion.value = event.region
  })

  chart.events.on('roi:cleared', () => {
    selectedRegion.value = null
  })
})

function setTool(tool: string) {
  activeTool.value = tool
  if (chart && chart.roi) {
    chart.roi.setTool(tool)
  }
}

function clearRoi() {
  if (chart && chart.roi) {
    chart.roi.clear()
  }
}

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="tool-selector">
        <button v-for="t in ['rectangle', 'circle', 'polygon', 'lasso']" 
                :key="t" 
                :class="{ active: activeTool === t }" 
                @click="setTool(t)"
                class="tool-btn">
          {{ t.charAt(0).toUpperCase() + t.slice(1) }}
        </button>
      </div>
      <div class="chart-controls">
        <label class="mask-toggle">
          <input type="checkbox" v-model="isMasking" @change="toggleMasking"> Mask Data
        </label>
        <button @click="clearRoi" class="btn secondary">🗑️ Clear</button>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container" style="height: 400px;"></div>
    
    <div class="roi-info" v-if="selectedRegion">
      Selected: <strong>{{ selectedRegion.tool }}</strong> ({{ selectedRegion.id.substring(0,8) }})
      <span v-if="selectedRegion.points">Points: {{ selectedRegion.points.length }}</span>
    </div>
    <div class="roi-info empty" v-else>
      Select a tool and draw on the chart to define an ROI
    </div>
  </div>
</template>

<style scoped>
@import "../demos.css";

.tool-selector {
  display: flex;
  gap: 8px;
}

.tool-btn {
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: inherit;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.dark .tool-btn {
  background: rgba(255, 255, 255, 0.05);
}

.tool-btn.active {
  background: #00f2ff;
  color: #000;
  border-color: #00f2ff;
  font-weight: 600;
}

.mask-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 12px;
}

.roi-info {
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(0, 242, 255, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #00f2ff;
  display: flex;
  justify-content: space-between;
}

.roi-info.empty {
  color: #666;
  background: rgba(255, 255, 255, 0.02);
}
</style>
