<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <h1 class="text-3xl font-bold">{{ $t('reports.title') }}</h1>
      <div class="w-full md:w-1/3">
        <label class="form-label mb-1">{{ $t('reports.custom.select_form') }}</label>
        <select v-model="selectedFormId" class="form-select">
          <option disabled value="">{{ $t('reports.custom.select_form') }}</option>
          <option v-for="form in forms" :key="form.id" :value="form.id">{{ form.name }}</option>
        </select>
      </div>
    </div>

    <div v-if="!selectedFormId" class="text-center text-gray-500 py-12">
      <p class="text-lg">{{ $t('reports.select_form_hint') }}</p>
    </div>

    <div v-else class="space-y-8 animate-fade-in">
      <!-- Summary Cards -->
      <section>
        <h2 class="text-xl font-bold mb-4">{{ $t('reports.summary') }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Entries -->
          <div class="card p-6 flex flex-col items-center justify-center text-center">
            <p class="text-sm text-gray-500 font-medium uppercase tracking-wider">{{ $t('reports.total_entries') }}</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {{ summaryData?.total_entries ?? '-' }}
            </p>
          </div>

          <!-- Numeric Field Summaries -->
          <div v-for="stat in summaryData?.stats" :key="stat.field" class="card p-6 flex flex-col text-center">
            <p class="text-sm text-gray-500 font-medium uppercase tracking-wider truncate" :title="stat.label">
              {{ stat.label }}
            </p>
            <div class="mt-2">
              <span class="text-2xl font-bold text-primary-600">{{ stat.sum }}</span>
              <span class="text-xs text-gray-400 block mt-1">{{ $t('reports.total_sum') }}</span>
            </div>
            <!-- Optional: Show Avg/Min/Max on hover or as small text -->
             <div class="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
               <div>
                 <span class="block font-bold">{{ stat.avg.toFixed(1) }}</span>
                 <span class="text-[10px]">{{ $t('reports.avg') }}</span>
               </div>
               <div>
                 <span class="block font-bold">{{ stat.min }}</span>
                 <span class="text-[10px]">{{ $t('reports.min') }}</span>
               </div>
               <div>
                 <span class="block font-bold">{{ stat.max }}</span>
                 <span class="text-[10px]">{{ $t('reports.max') }}</span>
               </div>
             </div>
          </div>
        </div>
      </section>

      <!-- Time Series Chart -->
      <section class="card">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 class="text-xl font-bold">{{ $t('reports.time_series.title') }}</h2>
          <div class="flex items-center gap-2 mt-4 md:mt-0">
             <label class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ $t('reports.time_series.period') }}:</label>
             <div class="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
               <button 
                v-for="p in ['daily', 'weekly', 'monthly']" 
                :key="p"
                @click="period = p as any"
                :class="[
                  'px-3 py-1 text-sm rounded-md transition-all',
                  period === p 
                    ? 'bg-white dark:bg-gray-700 shadow text-primary-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
               >
                 {{ $t(`reports.time_series.${p}`) }}
               </button>
             </div>
          </div>
        </div>

        <div v-if="loadingChart" class="h-96 flex items-center justify-center">
           <div class="animate-spin-custom rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
        <div v-else-if="timeSeriesData.labels.length" class="mt-2">
          <TimeSeriesChart 
            :labels="formattedLabels" 
            :datasets="chartDatasets"
          />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-gray-500">
          {{ $t('reports.no_data') }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import reportsApi, { type SummaryResponse } from '@/api/reports'
import { useFormsStore } from '@/stores/forms'
import TimeSeriesChart from '@/components/common/TimeSeriesChart.vue'
import { formatPeriod } from '@/utils/date'

const formsStore = useFormsStore()
const forms = computed(() => formsStore.forms)

const selectedFormId = ref('')
const period = ref<'daily' | 'weekly' | 'monthly'>('daily')

const summaryData = ref<SummaryResponse | null>(null)
const timeSeriesData = ref<{ labels: string[], datasets: Record<string, number>[] }>({ labels: [], datasets: [] })
const timeSeriesFields = ref<{name: string, label: string}[]>([])
const loadingChart = ref(false)

const chartDatasets = computed(() => {
  // Convert backend data structure to ChartJS datasets
  // Backend returns: data: [{date: '...', field1: 10, field2: 20}, ...], fields: [...]
  // We need: [{label: 'Field 1', data: [10, ...]}, ...]
  
  return timeSeriesFields.value.map(field => {
    return {
      label: field.label,
      data: timeSeriesData.value.datasets.map(d => d[field.name] || 0)
    }
  })
})

const formattedLabels = computed(() => {
  return timeSeriesData.value.labels.map(d => formatPeriod(d, period.value))
})

// Watchers
watch(selectedFormId, async (newId) => {
  if (newId) {
    await fetchSummary()
    await fetchTimeSeries()
  } else {
    summaryData.value = null
    timeSeriesData.value = { labels: [], datasets: [] }
  }
})

watch(period, async () => {
  if (selectedFormId.value) {
    await fetchTimeSeries()
  }
})

async function fetchSummary() {
  if (!selectedFormId.value) return
  try {
    const res = await reportsApi.summary({ form_id: selectedFormId.value })
    summaryData.value = res
  } catch (e) {
    console.error(e)
  }
}

async function fetchTimeSeries() {
  if (!selectedFormId.value) return
  loadingChart.value = true
  try {
    const res = await reportsApi.multiTimeSeries({
      form_id: selectedFormId.value,
      period: period.value
    })
    
    // Process response
    // res.data is [{date: '...', field1: val, ...}, ...]
    timeSeriesFields.value = res.fields
    
    // Extract labels (dates)
    const labels = res.data.map(d => d.date as string)
    // Keep full data objects for mapping in computed
    const datasets = res.data.map(d => d as unknown as Record<string, number>) // cast for simplicity

    timeSeriesData.value = { labels, datasets }
  } catch (e) {
    console.error(e)
  } finally {
    loadingChart.value = false
  }
}

onMounted(() => {
  if (!forms.value.length) {
    formsStore.fetchForms()
  }
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>