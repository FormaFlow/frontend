<template>
  <div class="space-y-8">
    <!-- Welcome Section -->
    <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
      <h1 class="text-3xl font-bold mb-4">{{ $t('common.app_title') }}</h1>
      <div class="text-primary-100 flex flex-wrap items-center gap-2">
        <router-link to="/forms" class="px-3 py-1 border border-white/40 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
          {{ $t('forms.title') }}
        </router-link>
        <span>и</span>
        <router-link to="/entries" class="px-3 py-1 border border-white/40 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
          {{ $t('entries.title') }}
        </router-link>
        <span>в одном месте</span>
      </div>
    </div>

    <QuickEntryWidget class="mb-8" />

    <div v-if="loading" class="flex justify-center py-8">
      <AppLoader/>
    </div>

    <div v-else>
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 dark:text-gray-400 text-sm">{{ $t('dashboard.active_forms') }}</p>
              <p class="text-3xl font-bold mt-1">{{ weekSummary?.forms?.length || 0 }}</p>
            </div>
            <svg class="w-12 h-12 text-primary-500 opacity-20" fill="currentColor" viewBox="0 0 20 20">
              <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ $t('dashboard.available_forms') }}</p>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 dark:text-gray-400 text-sm">{{ $t('dashboard.new_entries_week') }}</p>
              <p class="text-3xl font-bold mt-1">{{ weekSummary?.total_entries || 0 }}</p>
            </div>
            <svg class="w-12 h-12 text-green-500 opacity-20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h12a1 1 0 100-2H6z"
                    clip-rule="evenodd"></path>
            </svg>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ $t('dashboard.total_this_week') }}</p>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 dark:text-gray-400 text-sm">{{ $t('settings.profile') }}</p>
              <p class="text-lg font-bold mt-1">{{ user?.name || 'N/A' }}</p>
            </div>
            <svg class="w-12 h-12 text-blue-500 opacity-20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <router-link to="/forms/create" class="card hover:shadow-lg transition">
          <div class="flex items-center gap-4">
            <div class="bg-primary-100 dark:bg-primary-900 p-3 rounded-lg">
              <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">{{ $t('forms.create_form') }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Build a new form</p>
            </div>
          </div>
        </router-link>

        <router-link to="/reports" class="card hover:shadow-lg transition">
          <div class="flex items-center gap-4">
            <div class="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">{{ $t('reports.view_reports') }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('reports.analyze_data') }}</p>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Forms Performance Table -->
      <div class="card">
        <h2 class="text-xl font-bold mb-4">{{ $t('dashboard.forms_performance') }}</h2>
        <div v-if="activeForms.length === 0" class="text-center py-8 text-gray-500">
          {{ $t('forms.no_forms') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead class="table-head">
            <tr>
              <th>{{ $t('forms.form_name') }}</th>
              <th>{{ $t('forms.published') }}</th>
              <th>{{ $t('dashboard.entries_week') }}</th>
              <th></th>
            </tr>
            </thead>
            <tbody class="table-body">
            <tr v-for="form in activeForms.slice(0, 5)" :key="form.id">
              <td>{{ form.name }}</td>
              <td>
                  <span :class="['badge', form.published ? 'badge-success' : 'badge-warning']">
                    {{ form.published ? $t('forms.published') : $t('forms.draft') }}
                  </span>
              </td>
              <td>{{ summaryByForm[form.id] || 0 }}</td>
              <td>
                <router-link :to="`/forms/${form.id}`" class="text-primary-500 hover:underline">
                  {{ $t('common.view') }}
                </router-link>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted} from 'vue'
import AppLoader from '@/components/common/AppLoader.vue'
import QuickEntryWidget from '@/components/dashboard/QuickEntryWidget.vue'
import {useAuthStore} from '@/stores/auth'
import {useReportsStore} from '@/stores/reports'

const authStore = useAuthStore()
const reportsStore = useReportsStore()

const user = computed(() => authStore.user)
const weekSummary = computed(() => reportsStore.weekSummary)
const loading = computed(() => reportsStore.loading)

const activeForms = computed(() => weekSummary.value?.forms || [])
const summaryByForm = computed(() => weekSummary.value?.summary_by_form || {})

onMounted(async () => {
  try {
    await reportsStore.fetchDashboardData()
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})
</script>