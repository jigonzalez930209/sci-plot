<template>
  <div class="i18n-demo">
    <div class="locale-selector">
      <label>Select Locale:</label>
      <div class="locale-buttons">
        <button 
          v-for="loc in locales" 
          :key="loc.code"
          :class="{ active: currentLocale === loc.code }"
          @click="setLocale(loc.code)"
        >
          <span class="flag">{{ loc.flag }}</span>
          <span class="name">{{ loc.name }}</span>
        </button>
      </div>
    </div>
    
    <div class="format-examples">
      <div class="example-group">
        <h4>Number Formatting</h4>
        <div class="example">
          <span class="label">Large Number:</span>
          <span class="value">{{ formattedNumber }}</span>
        </div>
        <div class="example">
          <span class="label">Scientific:</span>
          <span class="value">{{ formattedScientific }}</span>
        </div>
        <div class="example">
          <span class="label">Percentage:</span>
          <span class="value">{{ formattedPercent }}</span>
        </div>
      </div>
      
      <div class="example-group">
        <h4>Date/Time Formatting</h4>
        <div class="example">
          <span class="label">Date:</span>
          <span class="value">{{ formattedDate }}</span>
        </div>
        <div class="example">
          <span class="label">Time:</span>
          <span class="value">{{ formattedTime }}</span>
        </div>
        <div class="example">
          <span class="label">Full:</span>
          <span class="value">{{ formattedFull }}</span>
        </div>
      </div>
      
      <div class="example-group">
        <h4>Axis Labels</h4>
        <div class="labels-list">
          <span v-for="tick in axisTicks" :key="tick" class="tick">{{ tick }}</span>
        </div>
      </div>
    </div>
    
    <div ref="chartContainer" class="chart"></div>
    
    <div class="code-preview">
      <pre><code>// Set locale for number/date formatting
import { setGlobalLocale } from 'sci-plot';
setGlobalLocale('{{ currentLocale }}');

// Formats:
// 1234567.89 → "{{ formattedNumber }}"
// 0.00000123 → "{{ formattedScientific }}"</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const chartContainer = ref<HTMLDivElement | null>(null)
let chart: any = null

const currentLocale = ref('en-US')
const now = new Date()

const locales = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
]

const formattedNumber = computed(() => {
  return new Intl.NumberFormat(currentLocale.value).format(1234567.89)
})

const formattedScientific = computed(() => {
  return new Intl.NumberFormat(currentLocale.value, { notation: 'scientific' }).format(0.00000123)
})

const formattedPercent = computed(() => {
  return new Intl.NumberFormat(currentLocale.value, { style: 'percent', maximumFractionDigits: 1 }).format(0.7532)
})

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat(currentLocale.value, { dateStyle: 'medium' }).format(now)
})

const formattedTime = computed(() => {
  return new Intl.DateTimeFormat(currentLocale.value, { timeStyle: 'medium' }).format(now)
})

const formattedFull = computed(() => {
  return new Intl.DateTimeFormat(currentLocale.value, { dateStyle: 'short', timeStyle: 'short' }).format(now)
})

const axisTicks = computed(() => {
  const formatter = new Intl.NumberFormat(currentLocale.value)
  return [0, 250000, 500000, 750000, 1000000].map(n => formatter.format(n))
})

function setLocale(code: string) {
  currentLocale.value = code
  updateChart()
}

function updateChart() {
  if (chart) {
    chart.render()
  }
}

function generateData() {
  const points = 100
  const x = new Float32Array(points)
  const y = new Float32Array(points)
  
  for (let i = 0; i < points; i++) {
    x[i] = i * 10000
    y[i] = Math.sin(i / 10) * 500000 + 500000
  }
  
  return { x, y }
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  const { createChart } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time (ms)' },
    yAxis: { label: 'Value' },
    theme: 'midnight',
    showControls: true,
  })
  
  const data = generateData()
  chart.addSeries({
    id: 'data',
    type: 'line',
    data: { x: data.x, y: data.y },
    style: { color: '#00f2ff', width: 1.5 },
  })
  
  chart.autoScale(false)
  chart.render()
})

onUnmounted(() => {
  chart?.destroy()
})
</script>

<style scoped>
.i18n-demo {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
}

.locale-selector {
  margin-bottom: 20px;
}

.locale-selector label {
  display: block;
  color: #a0aec0;
  font-size: 13px;
  margin-bottom: 8px;
}

.locale-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.locale-buttons button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #16213e;
  color: #a0aec0;
  cursor: pointer;
  transition: all 0.2s;
}

.locale-buttons button:hover {
  border-color: #00f2ff;
}

.locale-buttons button.active {
  background: linear-gradient(135deg, #00f2ff20, #4ecdc420);
  border-color: #00f2ff;
  color: #00f2ff;
}

.flag {
  font-size: 18px;
}

.name {
  font-size: 12px;
}

.format-examples {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .format-examples {
    grid-template-columns: 1fr;
  }
}

.example-group {
  background: #16213e;
  border-radius: 6px;
  padding: 12px;
}

.example-group h4 {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #00f2ff;
  text-transform: uppercase;
}

.example {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}

.example .label {
  color: #666;
}

.example .value {
  color: #fff;
  font-family: monospace;
}

.labels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tick {
  background: #1a1a2e;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #a0aec0;
  font-family: monospace;
}

.chart {
  width: 100%;
  height: 200px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
}

.code-preview {
  background: #0d1117;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
}

.code-preview pre {
  margin: 0;
}

.code-preview code {
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: #a0aec0;
  line-height: 1.5;
}
</style>
