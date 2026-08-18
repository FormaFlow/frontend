<template>
  <span class="math-text">
    <template v-for="(segment, index) in segments" :key="index">
      <span v-if="segment.kind === 'text'">{{ segment.value }}</span>
      <span
          v-else
          :class="segment.display ? 'my-3 block overflow-x-auto py-1 text-center' : 'inline-block max-w-full align-middle'"
          v-html="segment.html"
      />
    </template>
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

type Segment =
  | {kind: 'text'; value: string}
  | {kind: 'math'; html: string; display: boolean}

const props = defineProps<{text: string}>()

const segments = computed<Segment[]>(() => {
  const result: Segment[] = []
  const expression = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = expression.exec(props.text)) !== null) {
    if (match.index > cursor) result.push({kind: 'text', value: props.text.slice(cursor, match.index)})
    const display = match[1] !== undefined
    result.push({
      kind: 'math',
      display,
      html: katex.renderToString((display ? match[1] : match[2]) ?? '', {
        displayMode: display,
        output: 'htmlAndMathml',
        throwOnError: false,
        trust: false,
        strict: 'warn',
        maxSize: 10,
        maxExpand: 100,
      }),
    })
    cursor = expression.lastIndex
  }

  if (cursor < props.text.length) result.push({kind: 'text', value: props.text.slice(cursor)})
  return result.length ? result : [{kind: 'text', value: props.text}]
})
</script>

<style scoped>
.math-text :deep(.katex) {
  color: inherit;
}
</style>
