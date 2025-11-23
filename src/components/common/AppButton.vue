<template>
  <button
    :class="[
      'font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses,
      sizeClasses,
      fullWidth && 'w-full'
    ]"
    v-bind="$attrs"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  fullWidth: false
})

const variantClasses = computed(() => {
  const variants: Record<Variant, string> = {
    primary: 'px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600',
    danger: 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white'
  }
  return variants[props.variant]
})

const sizeClasses = computed(() => {
  const sizes: Record<Size, string> = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  return sizes[props.size]
})
</script>
