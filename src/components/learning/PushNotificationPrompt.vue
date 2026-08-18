<template>
  <section
      v-if="supported && !enabled"
      data-testid="push-notification-prompt"
      class="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <p class="font-black">{{ title }}</p>
      <p class="mt-1 text-sm text-amber-900/70">{{ description }}</p>
      <p v-if="error" class="mt-2 text-sm font-semibold text-red-700">{{ error }}</p>
    </div>
    <button type="button" class="shrink-0 rounded-xl bg-amber-900 px-4 py-2.5 font-bold text-white" :disabled="loading" @click="enableNotifications">
      {{ loading ? 'Включаю…' : 'Включить уведомления' }}
    </button>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted} from 'vue'
import {usePushNotifications} from '@/composables/usePushNotifications'

const props = defineProps<{audience: 'guardian' | 'learner'}>()
const {supported, enabled, loading, error, refresh, enable} = usePushNotifications()

const title = computed(() => props.audience === 'guardian'
  ? 'Включите уведомления для родителя'
  : 'Не пропускайте новые задания')
const description = computed(() => props.audience === 'guardian'
  ? 'FormaFlow напомнит, если ученик не начал занятие вовремя.'
  : 'FormaFlow сообщит о новом тесте и времени занятия.')

async function enableNotifications() {
  await enable()
}

onMounted(async () => {
  try {
    await refresh()
  } catch {
    // The explicit button will show a useful browser/API error if enabling fails.
  }
})
</script>
