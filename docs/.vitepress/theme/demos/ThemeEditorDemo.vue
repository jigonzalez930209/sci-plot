<template>
  <div class="theme-editor-demo">
    <div class="editor-panel">
      <h3>THEME PRESETS</h3>
      <div class="presets-grid">
        <button 
          v-for="preset in presets" 
          :key="preset.name"
          :class="{ active: currentPreset === preset.name }"
          @click="applyPreset(preset)"
        >
          <div class="preset-colors">
            <span v-for="(color, i) in preset.colors" :key="i" :style="{ background: color }"></span>
          </div>
          <span class="preset-name">{{ preset.name }}</span>
        </button>
      </div>
      
      <h3>CUSTOMIZE COLORS</h3>
      <div class="color-groups">
        <div class="color-group">
          <h4>Background</h4>
          <div class="color-row">
            <label>Background</label>
            <input type="color" v-model="currentTheme.background" @input="updateChartTheme" />
          </div>
          <div class="color-row">
            <label>Plot Area</label>
            <input type="color" v-model="currentTheme.plotArea" @input="updateChartTheme" />
          </div>
        </div>
        <div class="color-group">
          <h4>Series</h4>
          <div class="color-row">
            <label>Series 1</label>
            <input type="color" v-model="currentTheme.series1" @input="updateChartTheme" />
          </div>
          <div class="color-row">
            <label>Series 2</label>
            <input type="color" v-model="currentTheme.series2" @input="updateChartTheme" />
          </div>
          <div class="color-row">
            <label>Series 3</label>
            <input type="color" v-model="currentTheme.series3" @input="updateChartTheme" />
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button class="export-btn" @click="exportTheme">📋 Export JSON</button>
      </div>
    </div>
    
    <div class="preview-panel">
      <h3>Live Preview</h3>
      <div ref="chartContainer" class="chart-preview"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'

const chartContainer = ref<HTMLDivElement | null>(null)
let chart: any = null

const currentPreset = ref('Dark')

const presets = [
  { name: 'Dark', colors: ['#1a1a2e', '#00f2ff', '#4ecdc4'] },
  { name: 'Light', colors: ['#ffffff', '#2563eb', '#4f46e5'] },
  { name: 'Midnight', colors: ['#0f172a', '#3b82f6', '#8b5cf6'] },
  { name: 'Scientific', colors: ['#fafafa', '#1f2937', '#059669'] },
  { name: 'Electrochem', colors: ['#0d1117', '#00f2ff', '#ff6b6b'] },
  { name: 'High Contrast', colors: ['#000000', '#ffff00', '#00ffff'] },
]

const currentTheme = reactive({
  background: '#1a1a2e',
  plotArea: '#16213e',
  series1: '#00f2ff',
  series2: '#4ecdc4',
  series3: '#ff6b6b',
})

const themeValues: Record<string, typeof currentTheme> = {
  Dark: {
    background: '#1a1a2e', plotArea: '#16213e', series1: '#00f2ff',
    series2: '#4ecdc4', series3: '#ff6b6b',
  },
  Light: {
    background: '#ffffff', plotArea: '#f8fafc', series1: '#2563eb',
    series2: '#7c3aed', series3: '#db2777',
  },
  Midnight: {
    background: '#0f172a', plotArea: '#1e293b', series1: '#3b82f6',
    series2: '#8b5cf6', series3: '#ec4899',
  },
  Scientific: {
    background: '#fafafa', plotArea: '#ffffff', series1: '#1f2937',
    series2: '#059669', series3: '#dc2626',
  },
  Electrochem: {
    background: '#0d1117', plotArea: '#161b22', series1: '#00f2ff',
    series2: '#ff6b6b', series3: '#4ecdc4',
  },
  'High Contrast': {
    background: '#000000', plotArea: '#0a0a0a', series1: '#ffff00',
    series2: '#00ffff', series3: '#ff00ff',
  },
}

function applyPreset(preset: { name: string }) {
  currentPreset.value = preset.name
  const values = themeValues[preset.name]
  if (values) {
    Object.assign(currentTheme, values)
    updateChartTheme()
  }
}

function updateChartTheme() {
  if (!chart) return
  
  // Update background and plot area colors
  chart.setTheme({
    ...chart.theme,
    backgroundColor: currentTheme.background,
    plotAreaBackground: currentTheme.plotArea,
  })

  const series = chart.getAllSeries()
  const colors = [currentTheme.series1, currentTheme.series2, currentTheme.series3]
  series.forEach((s: any, i: number) => {
    if (i < colors.length) {
      s.setStyle({ color: colors[i] })
    }
  })
  
  chart.render()
}

function exportTheme() {
  const json = JSON.stringify(currentTheme, null, 2)
  navigator.clipboard?.writeText(json)
  alert('Theme JSON copied to clipboard!')
}

function generateWave(points: number, freq: number, phase: number) {
  const x = new Float32Array(points)
  const y = new Float32Array(points)
  
  for (let i = 0; i < points; i++) {
    x[i] = i / 10
    y[i] = Math.sin((i / 10) * freq + phase) + (Math.random() - 0.5) * 0.1
  }
  
  return { x, y }
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  const { createChart } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time' },
    yAxis: { label: 'Value' },
    theme: 'midnight',
    showControls: true,
  })
  
  const wave1 = generateWave(200, 0.5, 0)
  const wave2 = generateWave(200, 0.3, 1)
  const wave3 = generateWave(200, 0.7, 2)
  
  chart.addSeries({
    id: 'wave1', name: 'Signal A', type: 'line',
    data: { x: wave1.x, y: wave1.y },
    style: { color: currentTheme.series1, width: 2 },
  })
  
  chart.addSeries({
    id: 'wave2', name: 'Signal B', type: 'line',
    data: { x: wave2.x, y: wave2.y },
    style: { color: currentTheme.series2, width: 2 },
  })
  
  chart.addSeries({
    id: 'wave3', name: 'Signal C', type: 'line',
    data: { x: wave3.x, y: wave3.y },
    style: { color: currentTheme.series3, width: 2 },
  })
  
  chart.autoScale(false)
  chart.render()
})

onUnmounted(() => {
  chart?.destroy()
})
</script>

<style scoped>
.theme-editor-demo {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
}

@media (max-width: 768px) {
  .theme-editor-demo {
    grid-template-columns: 1fr;
  }
}

.editor-panel {
  background: #16213e;
  border-radius: 8px;
  padding: 16px;
  max-height: 450px;
  overflow-y: auto;
}

.editor-panel h3 {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #00f2ff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.presets-grid button {
  background: #1a1a2e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.presets-grid button:hover {
  border-color: #00f2ff;
}

.presets-grid button.active {
  border-color: #00f2ff;
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
}

.preset-colors {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.preset-colors span {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.preset-name {
  color: #a0aec0;
  font-size: 11px;
}

.color-group {
  margin-bottom: 16px;
}

.color-group h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #00f2ff;
}

.color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.color-row label {
  color: #a0aec0;
  font-size: 12px;
}

.color-row input[type="color"] {
  width: 30px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #333;
}

.export-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #00f2ff20, #4ecdc420);
  border: 1px solid #00f2ff;
  border-radius: 6px;
  color: #00f2ff;
  cursor: pointer;
  font-size: 13px;
}

.export-btn:hover {
  background: linear-gradient(135deg, #00f2ff30, #4ecdc430);
}

.preview-panel {
  background: #16213e;
  border-radius: 8px;
  padding: 16px;
}

.preview-panel h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #a0aec0;
}

.chart-preview {
  width: 100%;
  height: 350px;
  border-radius: 6px;
  overflow: hidden;
}
</style>
