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
  const { PluginAnalysis, PluginAnnotations, PluginTools } = await import('@src/plugins')
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time (s)', auto: true },
    yAxis: { label: 'Value', auto: true },
    theme: chartTheme.value,
    showControls: true,
    showStatistics: true
  })

  // Explicitly enable required plugins
  await chart.use(PluginAnalysis())
  await chart.use(PluginAnnotations())
  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initAnalysisDemo()
})

function initAnalysisDemo() {
  const n = 100
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  const peakCenter = 0.5
  const peakWidth = 0.08
  const peakHeight = 10
  
  for (let i = 0; i < n; i++) {
    const val = i / (n - 1)
    x[i] = val
    const gaussian = peakHeight * Math.exp(-Math.pow(val - peakCenter, 2) / (2 * Math.pow(peakWidth, 2)))
    const baseline = 2 * val + 1
    y[i] = gaussian + baseline + (Math.random() - 0.5) * 0.1
  }

  const x1 = 0.15
  const x2 = 0.85
  const i1 = Math.floor(x1 * n)
  const i2 = Math.floor(x2 * n)
  const y1 = y[i1]
  const y2 = y[i2]

  const slope = (y2 - y1) / (x[i2] - x[i1])
  const intercept = y1 - slope * x[i1]
  
  const yBaseline = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    yBaseline[i] = slope * x[i] + intercept
  }

  const bandX = x.slice(i1, i2 + 1)
  const bandY = y.slice(i1, i2 + 1)
  const bandBaseline = yBaseline.slice(i1, i2 + 1)

  chart.addSeries({
    id: 'peak-fill',
    type: 'band',
    data: { x: bandX, y: bandY, y2: bandBaseline },
    style: { color: '#ffcc00', opacity: 0.4 }
  })
  
  chart.addSeries({
    id: 'raw-data',
    type: 'line',
    data: { x, y },
    style: { color: '#ffcc00', width: 2.5 }
  })

  chart.addSeries({
    id: 'baseline-line',
    type: 'line',
    data: { x: new Float32Array([x1, x2]), y: new Float32Array([y1, y2]) },
    style: { color: '#00f2ff', width: 2, lineDash: [5, 5], opacity: 1 }
  })

  chart.addSeries({
    id: 'anchors',
    type: 'scatter',
    data: { x: new Float32Array([x1, x2]), y: new Float32Array([y1, y2]) },
    style: { color: '#00f2ff', pointSize: 8, symbol: 'circle' }
  })

  const totalArea = chart.analysis.integrate(x, y, x1, x2)
  const baselineArea = (x2 - x1) * (y1 + y2) / 2
  const peakArea = totalArea - baselineArea

  chart.addAnnotation({
    type: 'text',
    x: peakCenter,
    y: 12,
    text: `Peak Area: ${peakArea.toFixed(4)}\n(Background Subtracted)`,
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    anchor: 'bottom-center',
    borderRadius: 4
  })

  pointCount.value = n
  
  // Ensure proper rendering after lazy loading
  setTimeout(() => {
    if (chart) {
      chart.resize()
      chart.autoScale(false)
      chart.render()
    }
  }, 100)
}

function resetDemo() {
  if (chart) {
    chart.clearAnnotations?.()
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    initAnalysisDemo()
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
