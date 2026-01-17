<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;

const selectedFormat = ref<string>('csv');
const exportRange = ref<'all' | 'visible'>('all');
const includeMetadata = ref(true);
const exportResult = ref<string>('');
const exportStatus = ref<string>('');

const formats = [
  { value: 'csv', label: 'CSV' },
  { value: 'tsv', label: 'TSV' },
  { value: 'json', label: 'JSON' },
  { value: 'xlsx', label: 'Excel CSV' },
  { value: 'matlab', label: 'MATLAB' },
  { value: 'python', label: 'Python/NumPy' },
  { value: 'binary', label: 'Binary' },
];

// Generate sample electrochemical data
function generateCVData() {
  const points = 500;
  const x = new Float32Array(points);
  const y = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    const t = (i / points) * 4 * Math.PI - 2 * Math.PI;
    x[i] = Math.sin(t) * 0.5; // Potential (V)
    
    // Simulate CV curve with redox peaks
    const peak1 = Math.exp(-Math.pow(t - 1, 2) * 2) * 0.5;
    const peak2 = -Math.exp(-Math.pow(t + 1, 2) * 2) * 0.4;
    const baseline = t * 0.02;
    y[i] = (peak1 + peak2 + baseline + (Math.random() - 0.5) * 0.02) * 1e-6; // Current (A)
  }
  
  return { x, y };
}

function generateImpedanceData() {
  const points = 200;
  const x = new Float32Array(points);
  const y = new Float32Array(points);
  
  for (let i = 0; i < points; i++) {
    const re = 100 + 50 * Math.cos(i / 20);
    const im = -50 * Math.sin(i / 20) - i * 0.2;
    x[i] = re; // Real impedance
    y[i] = im; // Imaginary impedance
  }
  
  return { x, y };
}

async function handleExport() {
  if (!chart) return;
  
  exportStatus.value = 'Exporting...';
  exportResult.value = '';
  
  try {
    const dataExport = chart.getPlugin('scichart-data-export') || chart.dataExport;
    
    if (!dataExport) {
      exportStatus.value = `❌ Error: Data Export Plugin not found. Available plugins: ${chart.getPluginNames().join(', ')}`;
      return;
    }
    
    const result = dataExport.export(selectedFormat.value, {
      range: exportRange.value,
      includeMetadata: includeMetadata.value,
      precision: 6,
      prettyPrint: true,
      metadata: {
        experiment: 'Demo Export',
        date: new Date().toISOString()
      }
    });
    
    if (result.success) {
      exportStatus.value = `✅ Exported ${result.pointCount} points from ${result.seriesCount} series`;
      
      if (result.content && selectedFormat.value !== 'binary') {
        // Show first 2000 characters
        exportResult.value = result.content.length > 2000 
          ? result.content.substring(0, 2000) + '\n\n... (truncated)'
          : result.content;
      } else if (selectedFormat.value === 'binary') {
        exportResult.value = `Binary data: ${result.blob?.size} bytes`;
      }
    } else {
      exportStatus.value = `❌ Error: ${result.error}`;
    }
  } catch (error) {
    exportStatus.value = `❌ Error: ${(error as Error).message}`;
  }
}

async function handleDownload() {
  if (!chart) return;
  
  try {
    const dataExport = chart.getPlugin('scichart-data-export') || chart.dataExport;
    
    if (!dataExport) {
      exportStatus.value = '❌ Error: Data Export Plugin not found';
      return;
    }
    
    const result = dataExport.download(selectedFormat.value, {
      range: exportRange.value,
      includeMetadata: includeMetadata.value,
      precision: 6
    });
    
    if (result.success) {
      exportStatus.value = `✅ Downloaded: ${result.filename}`;
    }
  } catch (error) {
    exportStatus.value = `❌ Download failed: ${(error as Error).message}`;
  }
}

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return;
  
  const { createChart, PluginDataExport, PluginTools } = await import('@src/index');
  
  chart = createChart({
    container: chartContainer.value,
    title: 'Data Export Demo',
    xAxis: { label: 'Potential (V)' },
    yAxis: { label: 'Current (A)' },
    theme: 'midnight',
    showLegend: true,
    showControls: true,
    plugins: [
      PluginTools({ useEnhancedTooltips: true }),
      PluginDataExport({ defaultFormat: 'csv' })
    ]
  });
  
  // Add CV data
  const cvData = generateCVData();
  chart.addSeries({
    id: 'cv',
    name: 'Cyclic Voltammetry',
    type: 'line',
    data: cvData,
    style: { color: '#00f2ff', width: 2 }
  });
  
  // Add impedance data
  const eisData = generateImpedanceData();
  chart.addSeries({
    id: 'eis',
    name: 'Impedance',
    type: 'scatter',
    data: eisData,
    style: { color: '#ff6b6b', pointSize: 4 }
  });

  setTimeout(() => {
    if (chart) chart.autoScale();
  }, 300);
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="export-demo">
    <div ref="chartContainer" class="chart-container"></div>
    
    <div class="controls">
      <div class="control-row">
        <label>
          <span>Format:</span>
          <select v-model="selectedFormat">
            <option v-for="fmt in formats" :key="fmt.value" :value="fmt.value">
              {{ fmt.label }}
            </option>
          </select>
        </label>
        
        <label>
          <span>Range:</span>
          <select v-model="exportRange">
            <option value="all">All Data</option>
            <option value="visible">Visible Only</option>
          </select>
        </label>
        
        <label class="checkbox">
          <input type="checkbox" v-model="includeMetadata" />
          <span>Include Metadata</span>
        </label>
      </div>
      
      <div class="button-row">
        <button @click="handleExport" class="btn primary">
          📋 Preview Export
        </button>
        <button @click="handleDownload" class="btn secondary">
          💾 Download
        </button>
      </div>
      
      <div v-if="exportStatus" class="status" :class="{ error: exportStatus.includes('❌') }">
        {{ exportStatus }}
      </div>
    </div>
    
    <div v-if="exportResult" class="result">
      <h4>Export Preview:</h4>
      <pre>{{ exportResult }}</pre>
    </div>
  </div>
</template>

<style scoped>
.export-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.controls {
  background: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 8px;
}

.control-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.control-row label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-row select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.checkbox {
  cursor: pointer;
}

.checkbox input {
  margin-right: 0.25rem;
}

.button-row {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn.primary {
  background: linear-gradient(135deg, #00f2ff, #00a8ff);
  color: white;
}

.btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 242, 255, 0.3);
}

.btn.secondary {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.btn.secondary:hover {
  border-color: #00f2ff;
}

.status {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  background: rgba(0, 242, 255, 0.1);
  color: #00f2ff;
}

.status.error {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.result {
  background: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 8px;
}

.result h4 {
  margin: 0 0 0.75rem 0;
  color: var(--vp-c-text-1);
}

.result pre {
  background: var(--vp-c-bg);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 300px;
  margin: 0;
}
</style>
