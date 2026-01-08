import DefaultTheme from 'vitepress/theme'
import ChartDemo from './ChartDemo.vue'
import ChartDemo3D from './ChartDemo3D.vue'
import TenMillionPoints from './TenMillionPoints.vue'
// Standalone Chart Components
import SineWavesChart from './components/charts/SineWavesChart.vue'
import SquareWavesChart from './components/charts/SquareWavesChart.vue'
import TriangleWavesChart from './components/charts/TriangleWavesChart.vue'
import AnalysisAdvancedChart from './components/charts/AnalysisAdvancedChart.vue'
import ComplexFFTDemo from './components/charts/ComplexFFTDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component('ChartDemo', ChartDemo)
    app.component('ChartDemo3D', ChartDemo3D)
    app.component('TenMillionPoints', TenMillionPoints)
    // Standalone chart components - can be used directly without ChartDemo wrapper
    app.component('SineWavesChart', SineWavesChart)
    app.component('SquareWavesChart', SquareWavesChart)
    app.component('TriangleWavesChart', TriangleWavesChart)
    app.component('AnalysisAdvancedChart', AnalysisAdvancedChart)
    app.component('ComplexFFTDemo', ComplexFFTDemo)
  }
}

