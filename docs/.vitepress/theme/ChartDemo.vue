<script setup lang="ts">
import { computed, ref } from 'vue'

// Eager imports for all demos
import BasicDemo from './demos/2d/BasicDemo.vue'
import RealtimeDemo from './demos/2d/RealtimeDemo.vue'
import LargeDatasetDemo from './demos/2d/LargeDatasetDemo.vue'
import ScatterDemo from './demos/2d/ScatterDemo.vue'
import MultiSeriesDemo from './demos/2d/MultiSeriesDemo.vue'
import StepDemo from './demos/2d/StepDemo.vue'
import ErrorBarsDemo from './demos/2d/ErrorBarsDemo.vue'
import SymbolsDemo from './demos/2d/SymbolsDemo.vue'
import FittingDemo from './demos/2d/FittingDemo.vue'
import AreaDemo from './demos/2d/AreaDemo.vue'
import BarDemo from './demos/2d/BarDemo.vue'
import HeatmapDemo from './demos/2d/HeatmapDemo.vue'
import CandlestickDemo from './demos/2d/CandlestickDemo.vue'
import StackedDemo from './demos/2d/StackedDemo.vue'
import AnalysisDemo from './demos/2d/AnalysisDemo.vue'
import SpectralDemo from './demos/2d/SpectralDemo.vue'
import FFTWaveformsDemo from './demos/2d/FFTWaveformsDemo.vue'
import StatisticsDemo from './demos/2d/StatisticsDemo.vue'
import AnnotationsDemo from './demos/2d/AnnotationsDemo.vue'
import MultiAxisDemo from './demos/2d/MultiAxisDemo.vue'
import TooltipsDemo from './demos/2d/TooltipsDemo.vue'
import CrosshairDemo from './demos/2d/CrosshairDemo.vue'
import ResponsiveDemo from './demos/2d/ResponsiveDemo.vue'
import PersistenceDemo from './demos/2d/PersistenceDemo.vue'
import SelectionDemo from './demos/2d/SelectionDemo.vue'
import CyclicVoltammetryDemo from './demos/2d/CyclicVoltammetryDemo.vue'

interface CrosshairConfig {
  valueDisplayMode?: 'disabled' | 'corner' | 'floating'
  cornerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  snapToData?: boolean
}

const props = defineProps<{
  type: string
  height?: string
  points?: number
  crosshairConfig?: CrosshairConfig
}>()

// Charts are now visible by default. The core ChartInitQueue handles sequential loading.
const isVisible = ref(true)
const containerRef = ref<HTMLElement | null>(null)

const demoComponent = computed(() => {
  switch (props.type) {
    case 'basic': return BasicDemo
    case 'realtime': return RealtimeDemo
    case 'large-dataset':
    case 'large': return LargeDatasetDemo
    case 'scatter': return ScatterDemo
    case 'multi-series':
    case 'multi': return MultiSeriesDemo
    case 'step': return StepDemo
    case 'error-bars':
    case 'errorbars': return ErrorBarsDemo
    case 'symbols': return SymbolsDemo
    case 'fitting': return FittingDemo
    case 'area': return AreaDemo
    case 'bar': return BarDemo
    case 'heatmap': return HeatmapDemo
    case 'candlestick': return CandlestickDemo
    case 'stacked': return StackedDemo
    case 'analysis': return AnalysisDemo
    case 'spectral': return SpectralDemo
    case 'fft-waveforms': return FFTWaveformsDemo
    case 'statistics': return StatisticsDemo
    case 'annotations': return AnnotationsDemo
    case 'multi-axis':
    case 'multiaxis': return MultiAxisDemo
    case 'tooltips': return TooltipsDemo
    case 'crosshair': return CrosshairDemo
    case 'responsive': return ResponsiveDemo
    case 'persistence': return PersistenceDemo
    case 'selection': return SelectionDemo
    case 'cyclic-voltammetry':
    case 'cv': return CyclicVoltammetryDemo
    default: return BasicDemo
  }
})
</script>

<template>
  <div ref="containerRef" :style="{ minHeight: height || '400px' }">
    <component 
      v-if="isVisible" 
      :is="demoComponent" 
      :height="height" 
      :points="points"
      :crosshairConfig="crosshairConfig"
    />
    <div v-else class="chart-placeholder" :style="{ height: height || '400px' }">
      <div class="loading-indicator">
        <span>📊</span>
        <p>Loading chart...</p>
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

