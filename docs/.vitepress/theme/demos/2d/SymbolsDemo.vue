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
  const { PluginTools, PluginAnnotations } = await import('@src/plugins')
  
  chart = createChart({
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true
  })

  // Explicitly enable required plugins
  await chart.use(PluginAnnotations())
  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initDemo()
})

function initDemo() {
  const symbols: any[] = ['circle', 'square', 'triangle', 'diamond', 'cross', 'plus']
  const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a855f7', '#ff9f43', '#00f2ff']
  
  symbols.forEach((sym, i) => {
    const n = 20
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    for (let j = 0; j < n; j++) {
      x[j] = j
      y[j] = i * 2 + Math.sin(j * 0.5) * 0.5
    }
    chart.addSeries({
      id: `sym-${sym}`,
      type: 'scatter',
      data: { x, y },
      style: { color: colors[i % colors.length], pointSize: 10, symbol: sym }
    })
    
    chart.addAnnotation({
        type: 'text',
        x: -2,
        y: i * 2,
        text: sym.charAt(0).toUpperCase() + sym.slice(1),
        fontSize: 12
    })
  })
  
  pointCount.value = symbols.length * 20
}

function resetDemo() {
  if (chart) {
    chart.clearAnnotations?.()
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    initDemo()
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
    <p class="chart-hint">Scroll to zoom • Drag to pan • Supported symbols</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
