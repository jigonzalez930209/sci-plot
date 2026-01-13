<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const pointCount = ref(0)
let chart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  const { createChart } = await import('@src/index')
  const { PluginTools } = await import('@src/plugins')
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time (s)', auto: true },
    yAxis: [
      { id: 'left', label: 'Amperage (µA)', position: 'left' },
      { id: 'right', label: 'Potential (V)', position: 'right' }
    ],
    theme: chartTheme.value,
    showControls: true
  })

  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initMultiAxisDemo()
})

function initMultiAxisDemo() {
  const n = 2000;
  const x = new Float32Array(n);
  const y1 = new Float32Array(n);
  const y2 = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    const t = i / 100;
    x[i] = t;
    y1[i] = Math.sin(t * 2) * 2 + Math.cos(t * 5) * 0.5 + Math.random() * 0.2;
    y2[i] = Math.sin(t * 0.5) * 50 + 100 + Math.random() * 2;
  }
  
  chart.addSeries({
    id: 'current',
    type: 'line',
    yAxisId: 'left',
    data: { x, y: y1 },
    style: { color: '#00f2ff', width: 2 }
  });
  
  chart.addSeries({
    id: 'voltage',
    type: 'line',
    yAxisId: 'right',
    data: { x, y: y2 },
    style: { color: '#ff6b6b', width: 2 }
  });
  
  pointCount.value = n * 2;
}

function resetDemo() {
  if (chart) {
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    initMultiAxisDemo()
  }
}

onUnmounted(() => {
  if (chart) chart.destroy()
})

watch(isDark, (val) => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    setTimeout(() => {
      chart.resize()
      chart.render()
    }, 100)
  }
})
</script>

<template>
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="chart-stats">
        <span class="stat">
          📊 <strong>{{ pointCount.toLocaleString() }}</strong> points
        </span>
        <span class="stat" :class="{ good: fps >= 55, warn: fps >= 30 && fps < 55, bad: fps < 30 }">
          🚀 <strong>{{ fps }}</strong> FPS
        </span>
      </div>
      <div class="chart-controls">
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>
    <p class="chart-hint">Scroll to zoom • Drag to pan • Right-drag for box zoom</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
