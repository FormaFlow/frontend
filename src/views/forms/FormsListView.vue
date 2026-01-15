<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-3xl font-bold">{{ $t('forms.title') }}</h1>
      <router-link to="/forms/create" class="btn-primary">
        + {{ $t('forms.create_form') }}
      </router-link>
    </div>

    <!-- Search and Filters -->
    <div class="card">
      <div class="flex flex-col sm:flex-row gap-4">
        <input
            v-model="searchQuery"
            type="search"
            :placeholder="$t('common.search')"
            class="form-input flex-1"
            @input="handleSearch"
        />
      </div>
    </div>

    <!-- Forms List -->
    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else-if="!filteredForms || filteredForms.length === 0" class="card text-center py-12">
      <p class="text-gray-600 dark:text-gray-400">{{ $t('forms.no_forms') }}</p>
    </div>
    <div v-else class="space-y-4">
      <div v-for="form in filteredForms" :key="form.id" class="card hover:shadow-lg transition">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold mb-2">{{ form.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">{{ form.description }}</p>
            <div class="flex gap-2">
              <span :class="['badge', form.published ? 'badge-success' : 'badge-warning']">
                {{ form.published ? $t('forms.published') : $t('forms.draft') }}
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ form.entries_count }} {{ $t('forms.entries_count') }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <router-link :to="`/forms/${form.id}`" class="btn-secondary btn-sm">
              {{ $t('common.view') }}
            </router-link>
            <router-link :to="`/forms/${form.id}/edit`" class="btn-secondary btn-sm">
              {{ $t('common.edit') }}
            </router-link>
            <button type="button" class="btn-danger btn-sm" @click="handleDelete(form.id)">
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.last_page > 1" class="flex justify-center gap-2">
      <button
          type="button"
          class="btn-secondary"
          :disabled="pagination.current_page === 1"
          @click="goToPage(pagination.current_page - 1)"
      >
        {{ $t('common.previous') }}
      </button>
      <div class="flex items-center gap-2">
        <span class="text-sm">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
      </div>
      <button
          type="button"
          class="btn-secondary"
          :disabled="pagination.current_page === pagination.last_page"
          @click="goToPage(pagination.current_page + 1)"
      >
        {{ $t('common.next') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import AppLoader from '@/components/common/AppLoader.vue'
import {useI18n} from 'vue-i18n'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'
import {debounce} from '@/utils/helpers'
import {storeToRefs} from "pinia";
import {useFormsStore} from "@/stores/forms";

const { t } = useI18n()
const {
  forms,
  loading,
  pagination,
} = storeToRefs(useFormsStore())
const {fetchForms, deleteForm} = useForms()
const {showSuccess, showError} = useNotification()

const filteredForms = computed(() => {
  if (!Array.isArray(forms.value)) {
    return []
  }
  return forms.value
})

const searchQuery = ref('')

const handleSearch = debounce(async () => {
  await fetchForms(1, searchQuery.value)
}, 500)

const handleDelete = async (id: string) => {
  if (confirm(t('common.confirm_delete'))) {
    try {
      await deleteForm(id)
      showSuccess(t('forms.form_deleted'))
    } catch {
      // Error handled by composable
    }
  }
}

const goToPage = async (page: number) => {
  await fetchForms(page, searchQuery.value)
}

onMounted(async () => {
  await fetchForms()
})
</script>
