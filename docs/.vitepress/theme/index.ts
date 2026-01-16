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
import SingleFreqFilterDemo from './demos/2d/SingleFreqFilterDemo.vue'
import RegressionDemo from './demos/RegressionDemo.vue'
import RadarDemo from './demos/RadarDemo.vue'
import MLIntegrationDemo from './demos/MLIntegrationDemo.vue'
import SnapshotDemo from './demos/SnapshotDemo.vue'
import ProcessMonitoringDemo from './demos/2d/ProcessMonitoringDemo.vue'
import ScientificDemo from './demos/ScientificDemo.vue'
import WaterfallDemo from './demos/WaterfallDemo.vue'
import LaTeXDemo from './demos/LaTeXDemo.vue'
import TernaryDemo from './demos/TernaryDemo.vue'
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
    app.component('SingleFreqFilterDemo', SingleFreqFilterDemo)
    app.component('RegressionDemo', RegressionDemo)
    app.component('RadarDemo', RadarDemo)
    app.component('MLIntegrationDemo', MLIntegrationDemo)
    app.component('SnapshotDemo', SnapshotDemo)
    app.component('ProcessMonitoringDemo', ProcessMonitoringDemo)
    app.component('ScientificDemo', ScientificDemo)
    app.component('WaterfallDemo', WaterfallDemo)
    app.component('LaTeXDemo', LaTeXDemo)
    app.component('TernaryDemo', TernaryDemo)
  }
}

