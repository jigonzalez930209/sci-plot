<template>
  <div class="backpressure-demo">
    <div class="info-header">
      <h3>Streaming Backpressure Demo</h3>
      <p>Watch how the buffer handles high-speed data with different overflow strategies</p>
    </div>
    
    <div class="controls">
      <div class="control-group">
        <label>Overflow Strategy</label>
        <select v-model="strategy" @change="resetDemo">
          <option value="drop-oldest">Drop Oldest</option>
          <option value="drop-newest">Drop Newest</option>
          <option value="sample">Sample (1 in N)</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>Data Rate</label>
        <input type="range" v-model.number="dataRate" min="100" max="5000" step="100">
        <span>{{ dataRate.toLocaleString() }} pts/s</span>
      </div>
      
      <div class="control-group">
        <label>Buffer Size</label>
        <input type="range" v-model.number="bufferSize" min="100" max="2000" step="100">
        <span>{{ bufferSize.toLocaleString() }}</span>
      </div>
      
      <button :class="{ active: isStreaming }" @click="toggleStream">
        {{ isStreaming ? '⏹ Stop' : '▶ Start' }} Stream
      </button>
    </div>
    
    <div class="dashboard">
      <div class="metrics">
        <div class="metric" :class="healthClass">
          <div class="metric-value">{{ bufferFill }}%</div>
          <div class="metric-label">Buffer Fill</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: bufferFill + '%' }"></div>
          </div>
        </div>
        
        <div class="metric">
          <div class="metric-value">{{ incomingRate.toLocaleString() }}</div>
          <div class="metric-label">Incoming/s</div>
        </div>
        
        <div class="metric">
          <div class="metric-value">{{ processedRate.toLocaleString() }}</div>
          <div class="metric-label">Processed/s</div>
        </div>
        
        <div class="metric warning">
          <div class="metric-value">{{ droppedCount.toLocaleString() }}</div>
          <div class="metric-label">Dropped</div>
        </div>
        
        <div class="metric">
          <div class="metric-value">{{ isStreaming ? 'ACTIVE' : 'STOPPED' }}</div>
          <div class="metric-label">Stream State</div>
        </div>
      </div>
      
      <div ref="chartContainer" class="chart"></div>
    </div>
    
    <div class="health-indicator">
      <span class="health-label">Buffer Health:</span>
      <span class="health-status" :class="healthClass">{{ healthStatus }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const chartContainer = ref<HTMLDivElement | null>(null)
let chart: any = null
let streamInterval: number | null = null
let consumeInterval: number | null = null
let CircularBufferClass: any = null

const strategy = ref('drop-oldest')
const dataRate = ref(1000)
const bufferSize = ref(500)
const isStreaming = ref(false)

const bufferFill = ref(0)
const incomingRate = ref(0)
const processedRate = ref(0)
const droppedCount = ref(0)
const healthStatus = ref('Healthy')

let buffer: any = null
let chartData: { x: number[]; y: number[] } = { x: [], y: [] }
let time = 0
let incomingCounter = 0
let processedCounter = 0
let lastStatTime = 0

const healthClass = computed(() => {
  if (bufferFill.value < 50) return 'healthy'
  if (bufferFill.value < 80) return 'degraded'
  return 'critical'
})

function resetDemo() {
  stopStream()
  
  if (CircularBufferClass) {
    buffer = new CircularBufferClass(bufferSize.value)
  }
  
  chartData = { x: [], y: [] }
  time = 0
  bufferFill.value = 0
  droppedCount.value = 0
  incomingRate.value = 0
  processedRate.value = 0
  healthStatus.value = 'Healthy'
  incomingCounter = 0
  processedCounter = 0
  lastStatTime = Date.now()
  
  if (chart) {
    chart.getAllSeries().forEach((s: any) => chart.removeSeries(s.getId()))
    chart.addSeries({
      id: 'stream',
      type: 'line',
      data: { x: new Float32Array(0), y: new Float32Array(0) },
      style: { color: '#00f2ff', width: 1.5 },
    })
    chart.render()
  }
}

function toggleStream() {
  if (isStreaming.value) {
    stopStream()
  } else {
    startStream()
  }
}

function startStream() {
  if (!buffer) resetDemo()
  isStreaming.value = true
  lastStatTime = Date.now()
  
  const pointsPerTick = Math.ceil(dataRate.value / 60)
  
  // Generate data
  streamInterval = window.setInterval(() => {
    if (!buffer) return
    
    for (let i = 0; i < pointsPerTick; i++) {
      time += 0.01
      const value = Math.sin(time * 2) + Math.sin(time * 5) * 0.3 + (Math.random() - 0.5) * 0.2
      
      const point = { x: time, y: value }
      
      if (buffer.isFull()) {
        if (strategy.value === 'drop-oldest') {
          buffer.pushOverwrite(point)
          droppedCount.value++
        } else if (strategy.value === 'drop-newest') {
          droppedCount.value++
          continue
        } else if (strategy.value === 'sample') {
          if (i % 4 === 0) {
            buffer.pushOverwrite(point)
            droppedCount.value++
          } else {
            droppedCount.value++
          }
          continue
        }
      } else {
        buffer.push(point)
      }
      
      incomingCounter++
    }
    
    bufferFill.value = Math.round(buffer.fillLevel() * 100)
    
    // Update health status
    if (bufferFill.value < 50) healthStatus.value = 'Healthy'
    else if (bufferFill.value < 80) healthStatus.value = 'Degraded'
    else healthStatus.value = 'Critical'
    
    // Calculate rates every second
    const now = Date.now()
    if (now - lastStatTime >= 1000) {
      incomingRate.value = incomingCounter
      processedRate.value = processedCounter
      incomingCounter = 0
      processedCounter = 0
      lastStatTime = now
    }
  }, 16)
  
  // Consume data and update chart
  consumeInterval = window.setInterval(() => {
    if (!buffer || !chart) return
    
    const toConsume = Math.min(buffer.count, 30)
    const consumed = buffer.shiftMany(toConsume)
    
    processedCounter += consumed.length
    
    for (const point of consumed) {
      chartData.x.push(point.x)
      chartData.y.push(point.y)
    }
    
    // Keep last 500 points
    while (chartData.x.length > 500) {
      chartData.x.shift()
      chartData.y.shift()
    }
    
    // Update chart using updateSeries API
    if (chartData.x.length > 0) {
      chart.updateSeries('stream', {
        x: new Float32Array(chartData.x),
        y: new Float32Array(chartData.y),
      })
      chart.autoScale(false)
      chart.render()
    }
  }, 50)
}

function stopStream() {
  isStreaming.value = false
  if (streamInterval) {
    clearInterval(streamInterval)
    streamInterval = null
  }
  if (consumeInterval) {
    clearInterval(consumeInterval)
    consumeInterval = null
  }
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  const module = await import('@src/index')
  CircularBufferClass = module.CircularBuffer
  
  chart = module.createChart({
    container: chartContainer.value,
    xAxis: { label: 'Time' },
    yAxis: { label: 'Value' },
    theme: 'midnight',
    showControls: false,
  })
  
  resetDemo()
})

onUnmounted(() => {
  stopStream()
  chart?.destroy()
})
</script>

<style scoped>
.backpressure-demo {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
}

.info-header {
  margin-bottom: 16px;
}

.info-header h3 {
  margin: 0 0 4px 0;
  color: #fff;
  font-size: 16px;
}

.info-header p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.controls {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  color: #a0aec0;
  font-size: 12px;
  white-space: nowrap;
}

.control-group select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #16213e;
  color: #fff;
  font-size: 12px;
}

.control-group input[type="range"] {
  width: 80px;
  accent-color: #00f2ff;
}

.control-group span {
  color: #00f2ff;
  font-size: 11px;
  min-width: 60px;
}

.controls button {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #16213e;
  color: #a0aec0;
  cursor: pointer;
  margin-left: auto;
}

.controls button.active {
  background: linear-gradient(135deg, #ff6b6b20, #ff000020);
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.dashboard {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric {
  background: #16213e;
  border-radius: 6px;
  padding: 8px 12px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.metric-label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
}

.metric.healthy .metric-value { color: #4ecdc4; }
.metric.degraded .metric-value { color: #ffd93d; }
.metric.critical .metric-value { color: #ff6b6b; }
.metric.warning .metric-value { color: #ff9800; }

.progress-bar {
  height: 4px;
  background: #333;
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #00f2ff);
  transition: width 0.2s;
}

.metric.degraded .progress-fill { background: linear-gradient(90deg, #ffd93d, #ff9800); }
.metric.critical .progress-fill { background: linear-gradient(90deg, #ff6b6b, #ff0000); }

.chart {
  width: 100%;
  height: 250px;
  background: #16213e;
  border-radius: 6px;
  overflow: hidden;
}

.health-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #2a2a4a;
}

.health-label {
  color: #666;
  font-size: 12px;
}

.health-status {
  font-weight: 600;
  font-size: 13px;
}

.health-status.healthy { color: #4ecdc4; }
.health-status.degraded { color: #ffd93d; }
.health-status.critical { color: #ff6b6b; }
</style>
