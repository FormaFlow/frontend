<template>
  <div class="max-w-2xl">
    <div class="flex gap-4 items-center mb-6">
      <router-link to="/entries" class="text-primary-500 hover:underline">
        ← {{ $t('common.back') }}
      </router-link>
      <h1 class="text-2xl font-bold">{{ $t('entries.edit_entry') }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppLoader />
    </div>
    <div v-else-if="currentEntry" class="card">
      <form @submit.prevent="handleUpdate" class="space-y-6">
        <!-- Entry Data -->
        <div>
          <h2 class="text-lg font-semibold mb-4">{{ $t('common.data') }}</h2>
          <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">{{ JSON.stringify(currentEntry.data, null, 2) }}</pre>
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
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLoader from '@/components/common/AppLoader.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useEntries } from '@/composables/useEntries'

const route = useRoute()
const router = useRouter()
const { currentEntry, loading, fetchEntry, updateEntry } = useEntries()
const updateLoading = ref(false)

const handleUpdate = async () => {
  if (!currentEntry.value) return

  updateLoading.value = true
  try {
    await updateEntry(currentEntry.value.id, {
      data: currentEntry.value.data,
      tags: currentEntry.value.tags
    })
    await router.push('/entries')
  } finally {
    updateLoading.value = false
  }
}

onMounted(async () => {
  await fetchEntry(route.params.id as string)
})
</script>
