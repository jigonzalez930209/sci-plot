<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const containerWidth = ref('100%')
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

  const n = 100
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    x[i] = i
    y[i] = Math.random() * 10
  }
  chart.addSeries({
    id: 's1',
    type: 'scatter',
    data: { x, y },
    style: { color: '#4ecdc4', pointSize: 5 }
  })
})

function setWidth(w: string) {
  containerWidth.value = w
  setTimeout(() => {
    if (chart) chart.resize()
  }, 300) // matches transition
}

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="chart-controls">
        <button @click="setWidth('100%')" class="btn">Full Width</button>
        <button @click="setWidth('50%')" class="btn">50% Width</button>
        <button @click="setWidth('300px')" class="btn">Mobile (300px)</button>
      </div>
    </div>
    <div 
        style="transition: width 0.3s ease; border: 1px dashed #666; margin: 0 auto; overflow: hidden;"
        :style="{ width: containerWidth }"
    >
        <div ref="chartContainer" class="chart-container" :style="{ height: height || '300px' }"></div>
    </div>
    <p class="chart-hint">The chart automatically adapts to container resize events.</p>
  </div>
</template>

<style scoped>
@import "../../demos.css";
</style>
