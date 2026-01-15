<template>
  <div class="max-w-2xl">
    <div class="flex gap-4 items-center mb-6">
      <router-link to="/entries" class="text-primary-500 hover:underline">
        ← {{ $t('common.back') }}
      </router-link>
      <h1 class="text-2xl font-bold">{{ $t('entries.edit_entry') }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader/>
    </div>
    <div v-else-if="currentEntry" class="card">
      <form @submit.prevent="handleUpdate" class="space-y-6">
        <!-- Entry Data -->
        <div>
          <h2 class="text-lg font-semibold mb-4">{{ $t('common.data') }}</h2>
          <div v-if="currentForm" class="space-y-4">
            <div v-for="field in currentForm.fields" :key="field.id">
              <AppInput
                  v-if="['text', 'number', 'email', 'date', 'currency'].includes(field.type)"
                  v-model="(currentEntry.data[field.id] as string | number)"
                  :label="field.label"
                  :type="field.type"
                  :required="field.required"
                  :placeholder="field.placeholder"
              />
              <AppSelect
                  v-if="field.type === 'select'"
                  v-model="(currentEntry.data[field.id] as string | number | boolean)"
                  :label="field.label"
                  :required="field.required"
                  :options="field.options || []"
              />
              <!-- TODO: Add support for other field types -->
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label class="form-label">{{ $t('entries.tags') }}</label>
          <div class="flex gap-2">
            <span v-for="tag in currentEntry.tags || []" :key="tag" class="badge badge-success">
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="flex gap-4">
          <AppButton type="submit" :disabled="updateLoading">
            {{ updateLoading ? $t('common.loading') : $t('common.save') }}
          </AppButton>
          <router-link to="/entries" class="btn-secondary">
            {{ $t('common.cancel') }}
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import AppLoader from '@/components/common/AppLoader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {useNotification} from '@/composables/useNotification'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const {showSuccess} = useNotification()
const {currentEntry, loading, fetchEntry, updateEntry} = useEntries()
const {currentForm, fetchForm} = useForms()
const updateLoading = ref(false)

const handleUpdate = async () => {
  if (!currentEntry.value) return

  updateLoading.value = true
  try {
    await updateEntry(
        currentEntry.value.id, {
      data: currentEntry.value.data,
      tags: currentEntry.value.tags
    })
    showSuccess(t('entries.entry_updated'))
    await router.push('/entries')
  } finally {
    updateLoading.value = false
  }
}

onMounted(async () => {
  await fetchEntry(route.params.id as string)
  if (currentEntry.value) {
    await fetchForm(currentEntry.value.form_id)
  }
})

onUnmounted(() => {
  currentEntry.value = null
  currentForm.value = null
})
</script>
