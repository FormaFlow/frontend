<template>
  <div class="w-full h-96 bg-white dark:bg-gray-800 rounded-lg p-4">
    <Line v-if="chartData.labels && chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="h-full flex items-center justify-center text-gray-500">
      No data available to display chart
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  labels: string[]
  datasets: { label: string; data: number[]; borderColor?: string; backgroundColor?: string }[]
}>()

const colors = [
  '#32a899', // primary
  '#3b82f6', // blue
  '#ef4444', // red
  '#eab308', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
]

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.datasets.map((dataset, index) => {
    const color = dataset.borderColor || colors[index % colors.length]
    return {
      label: dataset.label,
      backgroundColor: dataset.backgroundColor || color + '33', // 20% opacity approx
      borderColor: color,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: color,
      data: dataset.data,
      fill: false, // Don't fill for multi-line to avoid clutter
      tension: 0.4
    }
  })
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        color: '#9ca3af' // gray-400
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(156, 163, 175, 0.1)' // gray-400 with low opacity
      },
      ticks: {
        color: '#9ca3af'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(156, 163, 175, 0.1)'
      },
      ticks: {
        color: '#9ca3af'
      }
    }
  },
  interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
  }
}
</script>
