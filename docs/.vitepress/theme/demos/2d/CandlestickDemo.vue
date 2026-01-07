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
  
  chart = createChart({
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true
  })

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initDemo()
})

function initDemo() {
  const n = 100;
  const x = new Float32Array(n);
  const open = new Float32Array(n);
  const high = new Float32Array(n);
  const low = new Float32Array(n);
  const close = new Float32Array(n);
  
  let current = 100;
  for (let i = 0; i < n; i++) {
    x[i] = i;
    open[i] = current;
    const change = (Math.random() - 0.5) * 10;
    close[i] = current + change;
    high[i] = Math.max(open[i], close[i]) + Math.random() * 5;
    low[i] = Math.min(open[i], close[i]) - Math.random() * 5;
    current = close[i];
  }
  
  chart.addSeries({
    id: 'candles',
    type: 'candlestick',
    data: { x, open, high, low, close },
    style: {
      bullishColor: '#26a69a',
      bearishColor: '#ef5350',
      barWidth: 0.7
    }
  });
  
  pointCount.value = n;
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
    <p class="chart-hint">Scroll to zoom • Drag to pan • Stock market candlesticks</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
