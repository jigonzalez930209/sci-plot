<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const isInitialized = ref(false)

let chart: any = null
let radarApi: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined') return
  
  // Wait for container
  let attempts = 0;
  while (!chartContainer.value && attempts < 20) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  try {
    const { createChart, PluginRadar } = await import('@src/index')
    
    if (!chartContainer.value) {
        console.error('RadarDemo: Container still not available after timeout');
        return;
    }

    chart = createChart({
      container: chartContainer.value,
      theme: chartTheme.value,
      showControls: false,
      loading: false // Disable loading since Radar doesn't use standard series
    })

    const radarPlugin = PluginRadar({
      categories: ['Speed', 'Power', 'Reliability', 'Safety', 'Efficiency', 'Cost'],
      maxValue: 100,
      gridLevels: 5
    })
    
    await chart.use(radarPlugin)
    radarApi = radarPlugin.api
    
    isInitialized.value = true
    initDemo()
  } catch (err) {
    console.error('RadarDemo: Error during initialization', err)
  }
})

function initDemo() {
  if (!radarApi) return

  radarApi.addSeries({
    id: 'product-a',
    name: 'Product A',
    points: [
      { category: 'Speed', value: 80 },
      { category: 'Power', value: 70 },
      { category: 'Reliability', value: 90 },
      { category: 'Safety', value: 60 },
      { category: 'Efficiency', value: 85 },
      { category: 'Cost', value: 40 }
    ],
    style: { 
      color: '#00f2ff', 
      fillColor: 'rgba(0, 242, 255, 0.2)',
      width: 3,
      pointSize: 6
    }
  })

  radarApi.addSeries({
    id: 'product-b',
    name: 'Product B',
    points: [
      { category: 'Speed', value: 60 },
      { category: 'Power', value: 95 },
      { category: 'Reliability', value: 50 },
      { category: 'Safety', value: 90 },
      { category: 'Efficiency', value: 60 },
      { category: 'Cost', value: 80 }
    ],
    style: { 
      color: '#ff6b6b', 
      fillColor: 'rgba(255, 107, 107, 0.2)',
      width: 3,
      pointSize: 6
    }
  })
}

function randomize() {
    if (!radarApi) return
    
    const cats = ['Speed', 'Power', 'Reliability', 'Safety', 'Efficiency', 'Cost']
    
    radarApi.updateSeries('product-a', cats.map(c => ({ category: c, value: 30 + Math.random() * 70 })))
    radarApi.updateSeries('product-b', cats.map(c => ({ category: c, value: 30 + Math.random() * 70 })))
}

watch(isDark, (val) => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    chart.render()
  }
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="radar-demo" :class="{ dark: isDark }">
    <div class="demo-controls">
        <h3 class="title">Competitive Analysis</h3>
        <button @click="randomize" class="btn-random">🎲 Randomize</button>
        <div class="legend">
            <div class="legend-item"><span class="dot a"></span> Product A</div>
            <div class="legend-item"><span class="dot b"></span> Product B</div>
        </div>
    </div>
    <div ref="chartContainer" class="main-chart" :style="{ height: height || '450px' }"></div>
  </div>
</template>

<style scoped>
.radar-demo {
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.demo-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -0.02em;
}

.btn-random {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
}

.btn-random:hover {
    transform: translateY(-2px);
}

.legend {
    display: flex;
    gap: 1.5rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #94a3b8;
}

.dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
}

.dot.a { background: #00f2ff; box-shadow: 0 0 10px rgba(0, 242, 255, 0.5); }
.dot.b { background: #ff6b6b; box-shadow: 0 0 10px rgba(255, 107, 107, 0.5); }

.main-chart {
    background: transparent;
}
</style>
