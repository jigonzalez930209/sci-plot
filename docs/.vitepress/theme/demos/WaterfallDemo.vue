<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  height?: string
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const isInitialized = ref(false)
const datasetType = ref<'financial' | 'budget' | 'inventory'>('financial')
const showConnectors = ref(true)

// Stats
const netChange = ref(0)
const totalPositive = ref(0)
const totalNegative = ref(0)

let chart: any = null

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

// Sample waterfall datasets
const datasets = {
  financial: {
    name: 'Q4 Revenue Analysis',
    categories: ['Q3 Revenue', 'New Sales', 'Renewals', 'Refunds', 'Discounts', 'Operating Costs', 'Marketing', 'Q4 Revenue'],
    values: [850, 320, 180, -75, -120, -280, -95, 0],
    isSubtotal: [false, false, false, false, false, false, false, true]
  },
  budget: {
    name: 'Project Budget Flow',
    categories: ['Initial Budget', 'Phase 1', 'Phase 2', 'Contingency Used', 'Scope Change', 'Delay Costs', 'Subtotal', 'Phase 3', 'Final'],
    values: [500, 85, 120, -45, 65, -30, 0, 75, 0],
    isSubtotal: [false, false, false, false, false, false, true, false, true]
  },
  inventory: {
    name: 'Inventory Movement',
    categories: ['Opening', 'Received', 'Returns', 'Damaged', 'Sold', 'Transferred', 'Closing'],
    values: [1200, 450, 80, -35, -520, -175, 0],
    isSubtotal: [false, false, false, false, false, false, true]
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  
  let attempts = 0;
  while (!chartContainer.value && attempts < 20) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  try {
    const { createChart, PluginTools, PluginAnnotations } = await import('@src/index')
    
    chart = createChart({
      container: chartContainer.value!,
      theme: chartTheme.value,
      showControls: true
    })

    await chart.use(PluginTools({ useEnhancedTooltips: true }))
    await chart.use(PluginAnnotations())

    isInitialized.value = true
    loadDataset()
  } catch (err) {
    console.error('WaterfallDemo: Error during initialization', err)
  }
})

function loadDataset() {
  if (!chart || !isInitialized.value) return
  
  // Clear existing series
  chart.clearAllSeries?.() || chart.series?.forEach((s: any) => chart.removeSeries(s.getId()))
  
  const ds = datasets[datasetType.value]
  const n = ds.values.length
  
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i + 1
    y[i] = ds.values[i]
  }
  
  chart.addSeries({
    id: 'waterfall-data',
    name: ds.name,
    type: 'waterfall',
    data: { x, y },
    style: {
      barWidth: 0.6,
      positiveColor: '#22c55e',
      negativeColor: '#ef4444',
      subtotalColor: '#3b82f6',
      connectorColor: '#64748b',
      showConnectors: showConnectors.value,
      isSubtotal: ds.isSubtotal
    }
  })
  
  // Calculate stats
  let running = 0
  let pos = 0
  let neg = 0
  
  for (let i = 0; i < n; i++) {
    if (!ds.isSubtotal[i]) {
      if (ds.values[i] >= 0) pos += ds.values[i]
      else neg += ds.values[i]
      running += ds.values[i]
    }
  }
  
  netChange.value = running
  totalPositive.value = pos
  totalNegative.value = neg
  
  chart.autoScale()
  chart.render()
}

watch([datasetType, showConnectors, isDark], () => {
  if (chart) {
    chart.setTheme(chartTheme.value)
    loadDataset()
  }
})

onUnmounted(() => {
  if (chart) chart.destroy()
})
</script>

<template>
  <div class="waterfall-demo" :class="{ dark: isDark }">
    <!-- Controls -->
    <div class="demo-controls">
      <div class="control-group">
        <label>Dataset</label>
        <select v-model="datasetType" :disabled="!isInitialized">
          <option value="financial">📈 Revenue Analysis</option>
          <option value="budget">💼 Project Budget</option>
          <option value="inventory">📦 Inventory Movement</option>
        </select>
      </div>

      <div class="control-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="showConnectors" />
          Show Connectors
        </label>
      </div>

      <div class="control-group">
        <button @click="loadDataset()" class="btn-refresh" :disabled="!isInitialized">
          🎲 Regenerate
        </button>
      </div>

      <!-- Stats Panel -->
      <div class="stats-box" v-if="isInitialized">
        <div class="stat-item positive">
          <span class="label">Positive</span>
          <span class="value">+{{ totalPositive.toLocaleString() }}</span>
        </div>
        <div class="stat-item negative">
          <span class="label">Negative</span>
          <span class="value">{{ totalNegative.toLocaleString() }}</span>
        </div>
        <div class="stat-item net" :class="{ positive: netChange >= 0, negative: netChange < 0 }">
          <span class="label">Net Change</span>
          <span class="value">{{ netChange >= 0 ? '+' : '' }}{{ netChange.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div ref="chartContainer" class="main-chart" :style="{ height: height || '450px' }"></div>
    
    <!-- Legend -->
    <div class="waterfall-legend">
      <div class="legend-item">
        <span class="swatch positive-swatch"></span>
        <span>Positive Change</span>
      </div>
      <div class="legend-item">
        <span class="swatch negative-swatch"></span>
        <span>Negative Change</span>
      </div>
      <div class="legend-item">
        <span class="swatch subtotal-swatch"></span>
        <span>Subtotal</span>
      </div>
    </div>

    <!-- Info Footer -->
    <div class="bottom-info">
      <p>
        <strong>Waterfall Charts</strong> visualize cumulative effect of sequential values. 
        Ideal for financial analysis, budget tracking, and inventory management.
      </p>
    </div>
  </div>
</template>

<style scoped>
.waterfall-demo {
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.demo-controls {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #e2e8f0;
  font-size: 0.85rem;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

select {
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid #334155;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
}

.btn-refresh {
  background: #334155;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #475569;
}

.stats-box {
  display: flex;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 18px;
  border-radius: 10px;
  margin-left: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
}

.stat-item .value {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 1rem;
  font-weight: 800;
}

.stat-item.positive .value {
  color: #22c55e;
}

.stat-item.negative .value {
  color: #ef4444;
}

.stat-item.net .value {
  color: #3b82f6;
}

.stat-item.net.positive .value {
  color: #22c55e;
}

.stat-item.net.negative .value {
  color: #ef4444;
}

.main-chart {
  background: linear-gradient(180deg, #020617 0%, #0f172a 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.waterfall-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.positive-swatch {
  background: #22c55e;
}

.negative-swatch {
  background: #ef4444;
}

.subtotal-swatch {
  background: #3b82f6;
}

.bottom-info {
  font-size: 0.8rem;
  color: #64748b;
  text-align: center;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.bottom-info strong {
  color: #00f2ff;
}
</style>
