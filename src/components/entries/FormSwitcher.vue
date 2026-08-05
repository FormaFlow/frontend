<template>
  <div class="flex w-full items-center gap-2 sm:w-auto">
    <button
        type="button"
        class="btn-secondary flex h-10 shrink-0 items-center gap-1 overflow-hidden px-2 sm:w-28"
        :class="compactMobile ? 'w-10 justify-center sm:justify-start' : 'w-16'"
        :disabled="options.length <= 1"
        :title="`${$t('common.previous')}: ${previousName}`"
        :aria-label="`${$t('common.previous')}: ${previousName}`"
        @click="selectAdjacent(-1)"
    >
      <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="form-neighbor-name min-w-0 text-xs" :class="{'hidden sm:block': compactMobile}">{{ previousName }}</span>
    </button>

    <AppSelect
        :model-value="modelValue"
        :options="options"
        :placeholder="placeholder"
        class="min-w-0 flex-1 sm:w-64"
        @update:model-value="selectForm"
    />

    <button
        type="button"
        class="btn-secondary flex h-10 shrink-0 items-center justify-end gap-1 overflow-hidden px-2 sm:w-28"
        :class="compactMobile ? 'w-10 justify-center sm:justify-end' : 'w-16'"
        :disabled="options.length <= 1"
        :title="`${$t('common.next')}: ${nextName}`"
        :aria-label="`${$t('common.next')}: ${nextName}`"
        @click="selectAdjacent(1)"
    >
      <span class="form-neighbor-name min-w-0 text-xs" :class="{'hidden sm:block': compactMobile}">{{ nextName }}</span>
      <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import AppSelect from '@/components/common/AppSelect.vue'

interface Option {
  label: string
  value: string | number | boolean
}

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder: string
  compactMobile?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedIndex = computed(() =>
  props.options.findIndex(option => String(option.value) === props.modelValue)
)

const adjacentOption = (direction: -1 | 1) => {
  if (props.options.length <= 1) return null

  const startIndex = selectedIndex.value === -1
    ? (direction === -1 ? 0 : -1)
    : selectedIndex.value
  const adjacentIndex = (startIndex + direction + props.options.length) % props.options.length

  return props.options[adjacentIndex]
}

const previousName = computed(() => adjacentOption(-1)?.label || '')
const nextName = computed(() => adjacentOption(1)?.label || '')

const selectForm = (value: string) => {
  emit('update:modelValue', value)
}

const selectAdjacent = (direction: -1 | 1) => {
  const option = adjacentOption(direction)
  if (option) {
    selectForm(String(option.value))
  }
}
</script>

<style scoped>
.form-neighbor-name {
  overflow: hidden;
  white-space: nowrap;
  opacity: 0.8;
  mask-image: linear-gradient(to right, #000 65%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, #000 65%, transparent 100%);
}
</style>
