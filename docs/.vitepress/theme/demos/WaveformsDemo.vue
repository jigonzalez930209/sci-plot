<template>
  <div class="waveforms-demo">
    <div class="controls">
      <div class="control-group">
        <label>Waveform Type</label>
        <select v-model="waveformType" @change="updateChart">
          <option value="sine">Sine Wave</option>
          <option value="square">Square Wave</option>
          <option value="triangle">Triangle Wave</option>
          <option value="sawtooth">Sawtooth Wave</option>
          <option value="cv">Cyclic Voltammogram</option>
          <option value="nyquist">EIS Nyquist Plot</option>
        </select>
      </div>
      
      <div class="control-group" v-if="showWaveformControls">
        <label>Frequency</label>
        <input type="range" v-model.number="frequency" min="0.5" max="5" step="0.5" @input="updateChart">
        <span>{{ frequency }} Hz</span>
      </div>
      
      <div class="control-group" v-if="showWaveformControls">
        <label>Noise</label>
        <input type="range" v-model.number="noise" min="0" max="0.5" step="0.05" @input="updateChart">
        <span>{{ (noise * 100).toFixed(0) }}%</span>
      </div>
      
      <div class="control-group" v-if="waveformType === 'cv'">
        <label>Cycles</label>
        <input type="range" v-model.number="cycles" min="1" max="5" step="1" @input="updateChart">
        <span>{{ cycles }}</span>
      </div>
    </div>
    
    <div ref="chartContainer" class="chart"></div>
    
    <div class="stats">
      <div class="stat">
        <span class="label">Points</span>
        <span class="value">{{ pointCount.toLocaleString() }}</span>
      </div>
      <div class="stat">
        <span class="label">Min</span>
        <span class="value">{{ minValue.toFixed(4) }}</span>
      </div>
      <div class="stat">
        <span class="label">Max</span>
        <span class="value">{{ maxValue.toFixed(4) }}</span>
      </div>
      <div class="stat">
        <span class="label">Generator</span>
        <span class="value code">{{ generatorName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const chartContainer = ref<HTMLDivElement | null>(null)
let chart: any = null
let generators: any = null

const waveformType = ref('sine')
const frequency = ref(2)
const noise = ref(0.1)
const cycles = ref(2)

const pointCount = ref(1000)
const minValue = ref(0)
const maxValue = ref(0)

const showWaveformControls = computed(() => 
  ['sine', 'square', 'triangle', 'sawtooth'].includes(waveformType.value)
)

const generatorName = computed(() => {
  switch (waveformType.value) {
    case 'sine': return 'generateSineWave()'
    case 'square': return 'generateSquareWave()'
    case 'triangle': return 'generateTriangleWave()'
    case 'sawtooth': return 'generateSawtoothWave()'
    case 'cv': return 'generateCVData()'
    case 'nyquist': return 'generateNyquistData()'
    default: return ''
  }
})

async function updateChart() {
  if (!chart || !generators) return
  
  let data: { x: Float32Array; y: Float32Array }
  let seriesColor = '#00f2ff'
  let seriesType = 'line'
  
  switch (waveformType.value) {
    case 'sine':
      data = generators.generateSineWave({
        pointCount: 1000,
        frequency: frequency.value,
        noise: noise.value,
        xStart: 0,
        xEnd: 10,
      })
      break
      
    case 'square':
      data = generators.generateSquareWave({
        pointCount: 1000,
        frequency: frequency.value,
        noise: noise.value,
        xStart: 0,
        xEnd: 10,
      })
      break
      
    case 'triangle':
      data = generators.generateTriangleWave({
        pointCount: 1000,
        frequency: frequency.value,
        noise: noise.value,
        xStart: 0,
        xEnd: 10,
      })
      break
      
    case 'sawtooth':
      data = generators.generateSawtoothWave({
        pointCount: 1000,
        frequency: frequency.value,
        noise: noise.value,
        xStart: 0,
        xEnd: 10,
      })
      break
      
    case 'cv':
      data = generators.generateCVData({
        pointCount: 500,
        vMin: -0.5,
        vMax: 0.5,
        cycles: cycles.value,
        peakCurrent: 10e-6,
        noise: 0.02,
      })
      seriesColor = '#ff6b6b'
      break
      
    case 'nyquist':
      data = generators.generateNyquistData({
        pointCount: 50,
        rSolution: 100,
        rCharge: 1000,
      })
      seriesColor = '#4ecdc4'
      seriesType = 'scatter'
      break
      
    default:
      data = generators.generateSineWave({ pointCount: 1000 })
  }
  
  // Update stats
  pointCount.value = data.x.length
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < data.y.length; i++) {
    if (data.y[i] < min) min = data.y[i]
    if (data.y[i] > max) max = data.y[i]
  }
  minValue.value = min
  maxValue.value = max
  
  // Clear and add new series
  chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
  
  chart.addSeries({
    id: 'waveform',
    type: seriesType,
    data: { x: data.x, y: data.y },
    style: { 
      color: seriesColor, 
      width: seriesType === 'scatter' ? 0 : 1.5,
      pointSize: seriesType === 'scatter' ? 6 : 0,
    },
  })
  
  chart.autoScale(false)
  chart.render()
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  const module = await import('@src/index')
  
  generators = {
    generateSineWave: module.generateSineWave,
    generateSquareWave: module.generateSquareWave,
    generateTriangleWave: module.generateTriangleWave,
    generateSawtoothWave: module.generateSawtoothWave,
    generateCVData: module.generateCVData,
    generateNyquistData: module.generateNyquistData,
  }
  
  chart = module.createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time (s)' },
    yAxis: { label: 'Amplitude' },
    theme: 'midnight',
    showControls: true,
  })
  
  await updateChart()
})

onUnmounted(() => {
  chart?.destroy()
})
</script>

<style scoped>
.waveforms-demo {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
}

.controls {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  color: #a0aec0;
  font-size: 13px;
  white-space: nowrap;
}

.control-group select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #16213e;
  color: #fff;
  font-size: 13px;
}

.control-group input[type="range"] {
  width: 100px;
  accent-color: #00f2ff;
}

.control-group span {
  color: #00f2ff;
  font-size: 12px;
  min-width: 50px;
}

.chart {
  width: 100%;
  height: 300px;
  border-radius: 6px;
  overflow: hidden;
}

.stats {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #2a2a4a;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat .label {
  color: #666;
  font-size: 11px;
  text-transform: uppercase;
}

.stat .value {
  color: #a0aec0;
  font-size: 14px;
}

.stat .value.code {
  font-family: monospace;
  color: #00f2ff;
  font-size: 12px;
}
</style>
