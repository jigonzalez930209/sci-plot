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
    xAxis: { label: 'Time (s)', auto: true },
    yAxis: { label: 'Value', auto: true },
    theme: chartTheme.value,
    showControls: true
  })

  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })

  initTooltipsDemo()
})

function initTooltipsDemo() {
  const n = 1000;
  const x = new Float32Array(n);
  const y1 = new Float32Array(n);
  const y2 = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    x[i] = i / 20;
    y1[i] = Math.sin(x[i] * 0.5) * 5 + 10;
    y2[i] = Math.cos(x[i] * 0.8) * 3 + 5;
  }
  
  chart.addSeries({
    id: 'primary',
    name: 'Primary Sensor',
    type: 'line',
    data: { x, y: y1 },
    style: { color: '#00f2ff', width: 2 }
  });
  
  chart.addSeries({
    id: 'secondary',
    name: 'Secondary Input',
    type: 'scatter',
    data: { x, y: y2 },
    style: { color: '#ff6b6b', pointSize: 6 }
  });

  chart.addAnnotation({
    type: 'horizontal-line',
    y: 10,
    color: 'rgba(255, 255, 255, 0.2)',
    label: 'Threshold',
    tooltip: 'Standard operation threshold'
  });

  chart.tooltip.configure({
    enabled: true,
    theme: chartTheme.value === 'midnight' ? 'glass' : 'light',
    followCursor: true,
    showDelay: 0,
    dataPoint: {
      snapToPoint: true,
      hitRadius: 25
    }
  });

  pointCount.value = n * 2;
}

function resetDemo() {
  if (chart) {
    chart.clearAnnotations?.()
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    initTooltipsDemo()
  }
}

onUnmounted(() => {
  if (chart) chart.destroy()
})

watch(isDark, (val) => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    chart.tooltip.configure({
        theme: val ? 'glass' : 'light'
    })
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
    <p class="chart-hint">Hover to see tooltips • Scroll to zoom • Drag to pan</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
