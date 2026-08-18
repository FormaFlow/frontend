<template>
  <fieldset class="space-y-3">
    <legend class="sr-only">{{ question.prompt }}</legend>
    <template v-if="question.type === 'single_choice'">
      <label v-for="option in question.options" :key="option.value" class="answer-option" :class="modelValue === option.value && 'answer-option--selected'">
        <input class="h-5 w-5" type="radio" :name="question.id" :value="option.value" :checked="modelValue === option.value" @change="emit('update:modelValue', option.value)">
        <MathText :text="option.label" />
      </label>
    </template>
    <template v-else-if="question.type === 'multiple_choice'">
      <label v-for="option in question.options" :key="option.value" class="answer-option" :class="selected(option.value) && 'answer-option--selected'">
        <input class="h-5 w-5" type="checkbox" :checked="selected(option.value)" @change="toggle(option.value)">
        <MathText :text="option.label" />
      </label>
    </template>
    <div v-else-if="question.type === 'boolean'" class="grid grid-cols-2 gap-3">
      <button v-for="choice in booleanChoices" :key="String(choice.value)" type="button" class="answer-option justify-center" :class="modelValue === choice.value && 'answer-option--selected'" @click="emit('update:modelValue', choice.value)">{{ choice.label }}</button>
    </div>
    <input v-else :value="modelValue ?? ''" :type="question.type === 'number' ? 'text' : 'text'" :inputmode="question.type === 'number' ? 'decimal' : 'text'" class="form-input text-lg" :placeholder="question.type === 'number' ? 'Введи число' : 'Напиши ответ'" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)">
  </fieldset>
</template>

<script setup lang="ts">
import type {LearningQuestion} from '@/types/learning'
import MathText from '@/components/learning/MathText.vue'

const props = defineProps<{question: LearningQuestion; modelValue: unknown}>()
const emit = defineEmits<{(event: 'update:modelValue', value: unknown): void}>()
const booleanChoices = [{label: 'Да', value: true}, {label: 'Нет', value: false}]
const selected = (value: string) => Array.isArray(props.modelValue) && props.modelValue.includes(value)
const toggle = (value: string) => {
  const values = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const index = values.indexOf(value)
  if (index >= 0) values.splice(index, 1)
  else values.push(value)
  emit('update:modelValue', values)
}
</script>
