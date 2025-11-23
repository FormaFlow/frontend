<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-3xl font-bold">{{ $t('entries.title') }}</h1>
      <router-link to="/entries/create" class="btn-primary">
        + {{ $t('entries.create_entry') }}
      </router-link>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="flex flex-col sm:flex-row gap-4">
        <input
            v-model="searchQuery"
            type="search"
            :placeholder="$t('common.search')"
            class="form-input flex-1"
            @input="handleSearch"
        />
        <AppSelect
            v-model="selectedFormId"
            :options="formOptions"
            :placeholder="$t('forms.title')"
            @update:modelValue="handleFormFilter"
        />
      </div>
    </div>

    <!-- Entries List -->
    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else-if="entries.length === 0" class="card text-center py-12">
      <p class="text-gray-600 dark:text-gray-400">{{ $t('entries.no_entries') }}</p>
    </div>
    <div v-else class="space-y-4">
      <div v-for="entry in entries" :key="entry.id" class="card">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex gap-2 mb-2">
              <span v-for="tag in entry.tags" :key="tag" class="badge badge-success">
                {{ tag }}
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Created: {{ formatDateTime(entry.created_at) }}
            </p>
          </div>
          <div class="flex gap-2">
            <router-link :to="`/entries/${entry.id}/edit`" class="btn-secondary btn-sm">
              {{ $t('common.edit') }}
            </router-link>
            <button type="button" class="btn-danger btn-sm" @click="handleDelete(entry.id)">
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import AppLoader from '@/components/common/AppLoader.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'
import {debounce, formatDateTime} from '@/utils/helpers'

const {entries, loading, fetchEntries, deleteEntry} = useEntries()
const {forms, fetchForms} = useForms()
const {showSuccess, showError} = useNotification()

const searchQuery = ref('')
const selectedFormId = ref('')

const formOptions = computed(() =>
    forms.map(f => ({label: f.name, value: f.id}))
)

const handleSearch = debounce(async () => {
  await fetchEntries(1)
}, 500)

const handleFormFilter = async () => {
  await fetchEntries(1)
}

const handleDelete = async (id: string) => {
  if (confirm('Are you sure?')) {
    try {
      await deleteEntry(id)
      showSuccess('Entry deleted successfully')
    } catch (error) {
      showError('Failed to delete entry')
    }
  }
}

onMounted(async () => {
  await fetchForms()
  await fetchEntries()
})
</script>
