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

const chartTheme = computed(() => (isDark.value ? 'midnight' : 'light'))

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return

  const { createChart } = await import('@src/index')
  const { PluginTools } = await import('@src/plugins')

  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time (s)', auto: true },
    yAxis: { label: 'Amplitude', auto: true },
    theme: chartTheme.value,
    showControls: true,
  })

  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initCrosshairDemo()
})

function initCrosshairDemo() {
  const n = 2000
  const x = new Float32Array(n)
  const y1 = new Float32Array(n)
  const y2 = new Float32Array(n)

  for (let i = 0; i < n; i++) {
    const t = i / 50
    x[i] = t
    y1[i] = Math.sin(t) * 1.5 + 2
    y2[i] = Math.cos(t * 0.7) * 1.2 - 1
  }

  chart.addSeries({
    id: 'signal-a',
    name: 'Signal A',
    type: 'line',
    data: { x, y: y1 },
    style: { color: '#00f2ff', width: 2 },
  })

  chart.addSeries({
    id: 'signal-b',
    name: 'Signal B',
    type: 'line',
    data: { x, y: y2 },
    style: { color: '#ff9f1c', width: 1.6, lineDash: [6, 6] },
  })

  chart.enableCursor({
    enabled: true,
    snap: true,
    crosshair: true,
    formatter: (xVal, yVal) => `X: ${xVal.toFixed(2)}\nY: ${yVal.toFixed(2)}`,
  })

  pointCount.value = n * 2

  setTimeout(() => {
    if (chart) {
      chart.resize()
      chart.autoScale(false)
      chart.render()
    }
  }, 100)
}

function resetDemo() {
  if (!chart) return
  chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
  initCrosshairDemo()
}

onUnmounted(() => {
  if (chart) chart.destroy()
})

watch(isDark, () => {
  if (!chart) return
  chart.setTheme(chartTheme.value)
  setTimeout(() => {
    chart.resize()
    chart.render()
  }, 100)
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
          🎯 <strong>{{ fps }}</strong> FPS
        </span>
      </div>
      <div class="chart-controls">
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>
    <p class="chart-hint">Hover to see crosshair • Scroll to zoom • Drag to pan</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
