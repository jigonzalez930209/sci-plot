<template>
  <div class="drag-edit-demo">
    <div class="demo-controls">
      <h3>Drag & Drop Editing Demo</h3>
      
      <div class="control-group">
        <label>
          <input v-model="enabled" type="checkbox" @change="toggleEnabled" />
          Enable Editing
        </label>
      </div>

      <div class="control-group">
        <label>Constraint Mode:</label>
        <select v-model="constraint" @change="updateConfig">
          <option value="both">Both X and Y</option>
          <option value="x">X Only</option>
          <option value="y">Y Only</option>
          <option value="none">None (locked)</option>
        </select>
      </div>

      <div class="control-group">
        <label>
          <input v-model="snapToGrid" type="checkbox" @change="updateConfig" />
          Snap to Grid
        </label>
      </div>

      <div class="control-group" v-if="snapToGrid">
        <label>Grid Interval: {{ gridInterval }}</label>
        <input v-model.number="gridInterval" type="range" min="0.1" max="2" step="0.1" @input="updateConfig" />
      </div>

      <div class="control-group">
        <label>Highlight Color:</label>
        <input v-model="highlightColor" type="color" @input="updateConfig" />
      </div>

      <button @click="resetData" class="btn-reset">Reset Data</button>
    </div>

    <div ref="chartContainer" class="chart-container" :style="{ height: height || '400px' }"></div>

    <div class="info-panel">
      <h4>Instructions:</h4>
      <p>• Click and drag any point to move it</p>
      <p>• Use constraint mode to limit movement</p>
      <p>• Enable snap to align to grid</p>
      <p v-if="lastEdit">
        Last edit: Point {{ lastEdit.index }} moved by 
        ΔX={{ lastEdit.deltaX.toFixed(2) }}, ΔY={{ lastEdit.deltaY.toFixed(2) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useData } from 'vitepress';

const props = defineProps<{
  height?: string;
}>();

const { isDark } = useData();
const chartContainer = ref<HTMLDivElement | null>(null);
const enabled = ref(true);
const constraint = ref('both');
const snapToGrid = ref(false);
const gridInterval = ref(0.5);
const highlightColor = ref('#ffff00');
const lastEdit = ref<any>(null);

let chart: any = null;
const originalData = {
  x: [1, 2, 3, 4, 5, 6, 7],
  y: [2, 4, 3, 5, 4.5, 3.5, 5.5]
};

function toggleEnabled() {
  if (chart?.dragEdit) {
    if (enabled.value) {
      chart.dragEdit.enable();
    } else {
      chart.dragEdit.disable();
    }
  }
}

function updateConfig() {
  if (chart?.dragEdit) {
    chart.dragEdit.updateConfig({
      constraint: constraint.value,
      snapToGrid: snapToGrid.value,
      snapIntervalX: gridInterval.value,
      snapIntervalY: gridInterval.value,
      highlightColor: highlightColor.value,
    });
  }
}

function resetData() {
  if (chart) {
    chart.updateSeries('editable', {
      x: Float32Array.from(originalData.x),
      y: Float32Array.from(originalData.y),
    });
    lastEdit.value = null;
  }
}

onMounted(async () => {
  if (typeof window === 'undefined') return;

  let attempts = 0;
  while (!chartContainer.value && attempts < 20) {
    await new Promise((r) => setTimeout(r, 50));
    attempts++;
  }

  if (!chartContainer.value) {
    console.error('DragEditDemo: Container not available');
    return;
  }

  try {
    const { createChart, PluginDragEdit } = await import('@src/index');

    chart = createChart({
      container: chartContainer.value,
      theme: isDark.value ? 'dark' : 'light',
    });

    // Disable pan mode to allow drag editing
    chart.setMode('select');

    // Add editable series
    chart.addSeries({
      id: 'editable',
      type: 'line+scatter',
      data: {
        x: Float32Array.from(originalData.x),
        y: Float32Array.from(originalData.y),
      },
      style: {
        color: '#00f2ff',
        width: 2,
        pointSize: 8,
      },
    });

    // Install drag edit plugin
    await chart.use(
      PluginDragEdit({
        enabled: enabled.value,
        constraint: constraint.value as any,
        snapToGrid: snapToGrid.value,
        snapIntervalX: gridInterval.value,
        snapIntervalY: gridInterval.value,
        highlightColor: highlightColor.value,
        onDragEnd: (event: any) => {
          lastEdit.value = event;
        },
      })
    );

    // Auto-scale
    chart.autoScale();
  } catch (err) {
    console.error('DragEditDemo: Error during initialization', err);
  }
});

onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
});
</script>

<style scoped>
.drag-edit-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
}

.demo-controls {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
}

.demo-controls h3 {
  margin: 0 0 1rem 0;
  color: #00f2ff;
  font-size: 1.25rem;
}

.control-group {
  margin-bottom: 1rem;
}

.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #fff;
  font-weight: 500;
}

.control-group select,
.control-group input[type="color"] {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  width: 100%;
  max-width: 200px;
}

.control-group select option {
  background: #1a1a2e;
  color: #fff;
}

input[type='range'] {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #00f2ff;
  border-radius: 50%;
  cursor: pointer;
}

input[type='checkbox'] {
  margin-right: 0.5rem;
}

.btn-reset {
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-reset:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.chart-container {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.info-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
}

.info-panel h4 {
  margin: 0 0 0.75rem 0;
  color: #00f2ff;
  font-size: 1.1rem;
}

.info-panel p {
  margin: 0.5rem 0;
  color: #94a3b8;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}
</style>
