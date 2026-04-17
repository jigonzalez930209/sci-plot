<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createChart, PluginVideoRecorder } from '@src/index';

const chartContainer = ref<HTMLDivElement | null>(null);
let chart: any = null;
const isRecording = ref(false);
const videoUrl = ref<string | null>(null);
const duration = ref(0);
const isMP4Supported = ref(false);
let timer: any = null;

const initChart = async () => {
  if (!chartContainer.value) return;

  chart = createChart({
    container: chartContainer.value,
    theme: 'dark',
  });

  await chart.use(PluginVideoRecorder({
    fps: 60,
    bitrate: 4000000,
    filename: 'sci-plot-demo',
    debug: true
  }));

  isMP4Supported.value = MediaRecorder.isTypeSupported('video/mp4;codecs=h264');

  // Animated series
  chart.addSeries({ id: 'anim', type: 'line', color: '#ffea00' });
  
  let frame = 0;
  const update = () => {
      if (!chart) return;
      const count = 200;
      const x = new Float32Array(count);
      const y = new Float32Array(count);
      for(let i=0; i<count; i++) {
          x[i] = i;
          y[i] = Math.sin(i * 0.1 + frame * 0.05) * 5 + Math.sin(i * 0.02 + frame * 0.1) * 2;
      }
      chart.updateSeries('anim', { x, y });
      frame++;
      requestAnimationFrame(update);
  };
  update();

  // Initial auto-scale to frame the waves
  setTimeout(() => {
    if (chart) chart.autoScale();
  }, 300);
};

const startRecording = () => {
    const videoRecorder = chart.getPlugin('sci-plot-video-recorder') || chart.videoRecorder;
    if (!videoRecorder) {
        console.error('Video Recorder plugin not found');
        return;
    }
    videoRecorder.start();
    isRecording.value = true;
    duration.value = 0;
    timer = setInterval(() => duration.value++, 1000);
};

const stopRecording = async () => {
    const videoRecorder = chart.getPlugin('sci-plot-video-recorder') || chart.videoRecorder;
    if (!videoRecorder) return;
    const blob = await videoRecorder.stop();
    isRecording.value = false;
    clearInterval(timer);
    
    if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
    videoUrl.value = URL.createObjectURL(blob);
};

onMounted(() => {
  initChart();
});

onUnmounted(() => {
  if (chart) chart.destroy();
  if (timer) clearInterval(timer);
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
});
</script>

<template>
  <div class="demo-card glass">
    <div class="demo-header">
      <h3>Native Video Recording</h3>
      <div class="demo-controls">
        <button v-if="!isRecording" @click="startRecording" class="btn-record">
          Start Recording
        </button>
        <button v-else @click="stopRecording" class="btn-stop">
          Stop ({{ duration }}s)
        </button>
      </div>
    </div>

    <div ref="chartContainer" class="chart-container"></div>
    
    <div v-if="videoUrl" class="video-result">
        <h4>Preview Last Recording:</h4>
        <video :src="videoUrl" controls class="preview-video"></video>
        <div class="video-actions">
            <a :href="videoUrl" :download="'sci-plot-recording.' + (isMP4Supported ? 'mp4' : 'webm')" class="btn-download">Download Video</a>
        </div>
    </div>
  </div>
</template>

<style scoped>
.demo-card {
  background: #121212;
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
  color: white;
  border: 1px solid rgba(255, 234, 0, 0.2);
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
  background: #000;
  border-radius: 8px;
  margin-bottom: 20px;
}

.video-result {
    margin-top: 25px;
    padding-top: 25px;
    border-top: 1px solid rgba(255, 234, 0, 0.1);
}

.preview-video {
    width: 100%;
    border-radius: 8px;
    background: #000;
    margin: 10px 0;
}

.video-actions { display: flex; justify-content: flex-end; }

.btn-record { background: #ff4d4d; color: white; border: none; padding: 10px 20px; border-radius: 50px; cursor: pointer; font-weight: bold; position: relative; padding-left: 40px; }
.btn-record::before { content: ''; position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: white; border-radius: 50%; }

.btn-stop { background: white; color: black; border: none; padding: 10px 20px; border-radius: 50px; cursor: pointer; font-weight: bold; }

.btn-download { background: #ffea00; color: black; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.9rem; }
</style>
