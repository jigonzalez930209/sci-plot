<script setup lang="ts">
import { defineAsyncComponent, computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  type: string
  height?: string
  points?: number
}>()

const isVisible = ref(false)
const containerRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const demoComponent = computed(() => {
  switch (props.type) {
    case 'basic': return defineAsyncComponent(() => import('./demos/2d/BasicDemo.vue'))
    case 'realtime': return defineAsyncComponent(() => import('./demos/2d/RealtimeDemo.vue'))
    case 'large-dataset':
    case 'large': return defineAsyncComponent(() => import('./demos/2d/LargeDatasetDemo.vue'))
    case 'scatter': return defineAsyncComponent(() => import('./demos/2d/ScatterDemo.vue'))
    case 'multi-series':
    case 'multi': return defineAsyncComponent(() => import('./demos/2d/MultiSeriesDemo.vue'))
    case 'step': return defineAsyncComponent(() => import('./demos/2d/StepDemo.vue'))
    case 'error-bars':
    case 'errorbars': return defineAsyncComponent(() => import('./demos/2d/ErrorBarsDemo.vue'))
    case 'symbols': return defineAsyncComponent(() => import('./demos/2d/SymbolsDemo.vue'))
    case 'fitting': return defineAsyncComponent(() => import('./demos/2d/FittingDemo.vue'))
    case 'area': return defineAsyncComponent(() => import('./demos/2d/AreaDemo.vue'))
    case 'bar': return defineAsyncComponent(() => import('./demos/2d/BarDemo.vue'))
    case 'heatmap': return defineAsyncComponent(() => import('./demos/2d/HeatmapDemo.vue'))
    case 'candlestick': return defineAsyncComponent(() => import('./demos/2d/CandlestickDemo.vue'))
    case 'stacked': return defineAsyncComponent(() => import('./demos/2d/StackedDemo.vue'))
    case 'analysis': return defineAsyncComponent(() => import('./demos/2d/AnalysisDemo.vue'))
    case 'spectral': return defineAsyncComponent(() => import('./demos/2d/SpectralDemo.vue'))
    case 'statistics': return defineAsyncComponent(() => import('./demos/2d/StatisticsDemo.vue'))
    case 'annotations': return defineAsyncComponent(() => import('./demos/2d/AnnotationsDemo.vue'))
    case 'multi-axis':
    case 'multiaxis': return defineAsyncComponent(() => import('./demos/2d/MultiAxisDemo.vue'))
    case 'tooltips': return defineAsyncComponent(() => import('./demos/2d/TooltipsDemo.vue'))
    case 'responsive': return defineAsyncComponent(() => import('./demos/2d/ResponsiveDemo.vue'))
    case 'persistence': return defineAsyncComponent(() => import('./demos/2d/PersistenceDemo.vue'))
    case 'selection': return defineAsyncComponent(() => import('./demos/2d/SelectionDemo.vue'))
    default: return defineAsyncComponent(() => import('./demos/2d/BasicDemo.vue'))
  }
})

onMounted(() => {
  if (typeof window === 'undefined' || !containerRef.value) return
  
  // Use Intersection Observer for lazy loading
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          // Add a small delay to ensure DOM is ready
          setTimeout(() => {
            isVisible.value = true
          }, 50)
          // Once loaded, disconnect observer to prevent re-loading
          if (observer) {
            observer.disconnect()
          }
        }
      })
    },
    {
      // Load when element is 200px from viewport
      rootMargin: '200px',
      threshold: 0
    }
  )
  
  observer.observe(containerRef.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <div ref="containerRef" :style="{ minHeight: height || '400px' }">
    <component v-if="isVisible" :is="demoComponent" :height="height" :points="points" />
    <div v-else class="chart-placeholder" :style="{ height: height || '400px' }">
      <div class="loading-indicator">
        <span>📊</span>
        <p>Chart will load when visible...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.02);
  border: 1px dashed rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.dark .chart-placeholder {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.1);
}

.loading-indicator {
  text-align: center;
  color: #666;
}

.dark .loading-indicator {
  color: #999;
}

.loading-indicator span {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.loading-indicator p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
