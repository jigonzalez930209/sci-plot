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
    theme: chartTheme.value,
    showControls: true
  })

  await chart.use(PluginTools({ useEnhancedTooltips: true }))

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initDemo()
})

function initDemo() {
  const w = 50;
  const h = 50;
  const x = new Float32Array(w).map((_, i) => i);
  const y = new Float32Array(h).map((_, i) => i);
  const z = new Float32Array(w * h);
  
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const dx = (i - w / 2) / 5;
      const dy = (j - h / 2) / 5;
      z[j * w + i] = Math.cos(dx * dx + dy * dy) * Math.exp(-(dx * dx + dy * dy) / 10);
    }
  }
  
  chart.addHeatmap({
    id: 'heatmap',
    data: { xValues: x, yValues: y, zValues: z },
    style: {
      colorScale: { 
        name: 'viridis',
        min: -1,
        max: 1
      },
      interpolation: 'bilinear'
    }
  });
  
  chart.zoom({ x: [0, w-1], y: [0, h-1] });
  pointCount.value = w * h;
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
    <p class="chart-hint">Scroll to zoom • Drag to pan • Heatmap with bilinear interpolation</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
