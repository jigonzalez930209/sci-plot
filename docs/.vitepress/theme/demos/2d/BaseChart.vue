<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  options?: any
  height?: string
}>()

const emit = defineEmits(['init', 'render'])

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const isRunning = ref(false)

let chart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  const { createChart } = await import('@src/index')
  
  const chartOptions = {
    container: chartContainer.value,
    theme: chartTheme.value,
    showControls: true,
    showStatistics: false,
    ...props.options
  }

  chart = createChart(chartOptions)
  
  const { PluginTools, PluginAnnotations } = await import('@src/plugins')
  await chart.use(PluginTools({ useEnhancedTooltips: true }))
  await chart.use(PluginAnnotations())
  
  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
    emit('render', e)
  })
  
  emit('init', chart)
})

onUnmounted(() => {
  if (chart) chart.destroy()
})

watch(isDark, (val) => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    // Multiple attempts to handle CSS transitions in VitePress
    setTimeout(() => chart.resize(), 50)
    setTimeout(() => chart.resize(), 300)
  }
})

defineExpose({
  getChart: () => chart
})
</script>

<template>
  <div class="demo-wrapper">
    <div 
      ref="chartContainer" 
      class="chart-container"
      :style="{ height: height || '400px' }"
    ></div>
    
    <div class="demo-stats" v-if="fps > 0">
      <span>{{ fps }} FPS</span>
    </div>

    <slot name="controls"></slot>
  </div>
</template>

<style scoped>
.demo-wrapper {
  position: relative;
  width: 100%;
  margin: 1rem 0;
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.chart-container {
  width: 100%;
}

.demo-stats {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
}
</style>
