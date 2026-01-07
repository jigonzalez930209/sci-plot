<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'

const props = defineProps<{
  type: string
  height?: string
  points?: number
}>()

const demoComponent = computed(() => {
  switch (props.type) {
    case 'basic': return defineAsyncComponent(() => import('./demos/2d/BasicDemo.vue'))
    case 'realtime': return defineAsyncComponent(() => import('./demos/2d/RealtimeDemo.vue'))
    case 'large-dataset': return defineAsyncComponent(() => import('./demos/2d/LargeDatasetDemo.vue'))
    case 'scatter': return defineAsyncComponent(() => import('./demos/2d/ScatterDemo.vue'))
    case 'multi-series': return defineAsyncComponent(() => import('./demos/2d/MultiSeriesDemo.vue'))
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
</script>

<template>
  <component :is="demoComponent" :height="height" :points="points" />
</template>
