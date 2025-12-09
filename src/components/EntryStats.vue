<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-if="error">{{ error }}</div>
    <div v-if="stats">
      <p>Today: {{ stats.sum_today }}</p>
      <p>This month: {{ stats.sum_month }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { entriesApi, type EntryStats } from '@/api/entries'

const props = defineProps<{
  formId: string
}>()

const stats = ref<EntryStats | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await entriesApi.stats(props.formId)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>
