<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const isInitialized = ref(false)
const isPredicting = ref(false)

let chart: any = null
let mlApi: any = null

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
    const { createChart, PluginMLIntegration, PluginTools, calculateStats, linearRegression } = await import('@src/index')
    
    chart = createChart({
      container: chartContainer.value!,
      theme: chartTheme.value,
      showControls: true
    })

    await chart.use(PluginTools())
    
    const mlPlugin = PluginMLIntegration({
      defaultVisualization: {
        showConfidenceInterval: true,
        intervalOpacity: 0.15,
        lineStyle: { width: 3, color: '#3b82f6' }
      }
    })
    
    await chart.use(mlPlugin)
    mlApi = mlPlugin.api
    
    // Register a Real Statistical Predictor
    mlApi.registerModel({
        id: 'trend-predictor',
        name: 'Scientific Trend Predictor',
        type: 'regression',
        async predict(data: { x: number[], y: number[] }) {
            // Simulate processing time
            await new Promise(r => setTimeout(r, 600));
            
            // Use engine's linear regression for internal model
            const result = linearRegression({
                x: new Float32Array(data.x),
                y: new Float32Array(data.y)
            });
            
            const lastX = data.x[data.x.length - 1];
            const futureX = [];
            const futureY = [];
            const confidence = [];
            
            const stats = calculateStats(new Float32Array(data.y));
            const stdDev = Math.sqrt(stats.variance);

            for (let i = 1; i <= 50; i++) {
                const nextX = lastX + i * 0.1;
                futureX.push(nextX);
                // Linear projection: y = mx + b
                const m = result.parameters.parameters[0];
                const b = result.parameters.parameters[1] || 0;
                futureY.push(m * nextX + b);
                // Confidence band based on variance and distance from historical data
                confidence.push(stdDev * (1 + i * 0.05));
            }
            
            return { x: futureX, y: futureY, confidence };
        }
    })

    isInitialized.value = true
    initDemo()
  } catch (err) {
    console.error('MLDemo: Error during initialization', err)
  }
})

function initDemo() {
  if (!chart) return

  const x = [];
  const y = [];
  for (let i = 0; i < 100; i++) {
    const val = i * 0.1;
    x.push(val);
    y.push(Math.sin(val * 2) * 5 + Math.random());
  }

  chart.addSeries({
    id: 'historical-data',
    name: 'Historical Data',
    type: 'line',
    data: { x, y },
    style: { color: isDark.value ? '#94a3b8' : '#64748b', width: 2 }
  })
}

async function runInference() {
    if (!mlApi || isPredicting.value) return;
    
    isPredicting.value = true;
    try {
        const result = await mlApi.runInference('trend-predictor', 'historical-data');
        mlApi.visualizeResults(result, {
            showConfidenceInterval: true,
            lineStyle: { color: '#3b82f6', width: 3 }
        });
    } catch (err) {
        console.error('Inference failed', err);
    } finally {
        isPredicting.value = false;
    }
}

function clear() {
    mlApi?.clearResults();
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
  <div class="ml-demo" :class="{ dark: isDark }">
    <div class="demo-controls">
        <div class="info">
            <h3 class="title">AI Forecasting</h3>
            <p class="desc">Neural Network prediction based on historical data.</p>
        </div>
        <div class="actions">
            <button @click="runInference" :disabled="isPredicting" class="btn-api primary">
                {{ isPredicting ? '⌛ Predicting...' : '🧠 Run Inference' }}
            </button>
            <button @click="clear" class="btn-api secondary">🗑️ Clear</button>
        </div>
    </div>
    <div ref="chartContainer" class="main-chart" :style="{ height: height || '400px' }"></div>
  </div>
</template>

<style scoped>
.ml-demo {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.demo-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 800;
    color: #fff;
    background: linear-gradient(to right, #60a5fa, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.desc {
    margin: 4px 0 0 0;
    font-size: 0.85rem;
    color: #94a3b8;
}

.actions {
    display: flex;
    gap: 0.75rem;
}

.btn-api {
    border: none;
    padding: 10px 18px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-api:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-api.primary {
    background: #3b82f6;
    color: white;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
}

.btn-api.primary:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-api.secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-api.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.main-chart {
    background: transparent;
    border-radius: 16px;
    overflow: hidden;
}
</style>
