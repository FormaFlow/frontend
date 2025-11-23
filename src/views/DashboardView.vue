<template>
  <div class="space-y-8">
    <!-- Welcome Section -->
    <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
      <h1 class="text-3xl font-bold mb-2">{{ $t('common.app_title') }}</h1>
      <p class="text-primary-100">{{ $t('forms.title') }} и {{ $t('entries.title') }} в одном месте</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">{{ $t('forms.title') }}</p>
            <p class="text-3xl font-bold mt-1">{{ forms.length }}</p>
          </div>
          <svg class="w-12 h-12 text-primary-500 opacity-20" fill="currentColor" viewBox="0 0 20 20">
            <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 dark:text-gray-400 text-sm">{{ $t('entries.title') }}</p>
            <p class="text-3xl font-bold mt-1">{{ entries.length }}</p>
          </div>
          <svg class="w-12 h-12 text-green-500 opacity-20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h12a1 1 0 100-2H6z"
                  clip-rule="evenodd"></path>
          </svg>
        </div>
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <router-link to="/entries/create" class="card hover:shadow-lg transition">
        <div class="flex items-center gap-4">
          <div class="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
            <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold">{{ $t('entries.create_entry') }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">Create a new entry</p>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Recent Forms -->
    <div class="card">
      <h2 class="text-xl font-bold mb-4">{{ $t('forms.title') }}</h2>
      <div v-if="formsLoading" class="flex justify-center py-8">
        <AppLoader/>
      </div>
      <div v-else-if="forms.length === 0" class="text-center py-8 text-gray-500">
        {{ $t('forms.no_forms') }}
      </div>
      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead class="table-head">
          <tr>
            <th>{{ $t('forms.form_name') }}</th>
            <th>{{ $t('forms.published') }}</th>
            <th>{{ $t('forms.entries_count') }}</th>
            <th></th>
          </tr>
          </thead>
          <tbody class="table-body">
          <tr v-for="form in forms.slice(0, 5)" :key="form.id">
            <td>{{ form.name }}</td>
            <td>
                <span :class="['badge', form.published ? 'badge-success' : 'badge-warning']">
                  {{ form.published ? $t('forms.published') : $t('forms.draft') }}
                </span>
            </td>
            <td>{{ form.entries_count }}</td>
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
</template>

<script setup lang="ts">
import {computed, onMounted} from 'vue'
import AppLoader from '@/components/common/AppLoader.vue'
import {useAuthStore} from '@/stores/auth'
import {useFormsStore} from '@/stores/forms'
import {useEntriesStore} from '@/stores/entries'

const authStore = useAuthStore()
const formsStore = useFormsStore()
const entriesStore = useEntriesStore()

const user = computed(() => authStore.user)
const forms = computed(() => formsStore.forms)
const entries = computed(() => entriesStore.entries)
const formsLoading = computed(() => formsStore.loading)

onMounted(async () => {
  try {
    await formsStore.fetchForms()
    await entriesStore.fetchEntries()
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})
</script>
