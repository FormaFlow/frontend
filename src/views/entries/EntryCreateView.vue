<template>
  <div class="max-w-2xl">
    <div class="flex gap-4 items-center mb-6">
      <router-link to="/entries" class="text-primary-500 hover:underline">
        ← {{ $t('common.back') }}
      </router-link>
      <h1 class="text-2xl font-bold">{{ $t('entries.create_entry') }}</h1>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Form Selection -->
        <AppSelect
            v-model="selectedFormId"
            :label="$t('forms.title')"
            :options="formOptions"
            required
            :error="errors.form"
        />

        <!-- Form Fields (Dynamic) -->
        <template v-if="selectedForm && selectedForm.fields.length">
          <component
              v-for="field in selectedForm.fields"
              :key="field.id"
              :is="getFieldComponent(field.type)"
              v-model="formData[field.name]"
              :field="field"
          />
        </template>

        <!-- Tags -->
        <div class="form-group">
          <label class="form-label">{{ $t('entries.tags') }}</label>
          <div class="flex gap-2 mb-2">
            <input
                v-model="newTag"
                type="text"
                :placeholder="$t('entries.add_tag')"
                class="form-input flex-1"
                @keypress.enter="addTag"
            />
            <button type="button" class="btn-secondary" @click="addTag">Add</button>
          </div>
          <div class="flex gap-2">
            <span v-for="tag in tags" :key="tag" class="badge badge-success">
              {{ tag }}
              <button type="button" @click="removeTag(tag)" class="ml-1">×</button>
            </span>
          </div>
        </div>

        <div class="flex gap-4">
          <AppButton type="submit" :disabled="loading">
            {{ loading ? $t('common.loading') : $t('common.create') }}
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
import {computed, onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import AppSelect from '@/components/common/AppSelect.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import {useEntries} from '@/composables/useEntries'
import {useForms} from '@/composables/useForms'
import {validateForm, type ValidationRules} from '@/utils/validation'

const router = useRouter()
const {loading, createEntry} = useEntries()
const {forms, fetchForms} = useForms()

const selectedFormId = ref('')
const tags = ref<string[]>([])
const newTag = ref('')
const formData = reactive<Record<string, any>>({})

const errors = reactive({
  form: ''
})

const rules: ValidationRules = {
  form: {required: true}
}

const formOptions = computed(() =>
    forms.map(f => ({label: f.name, value: f.id}))
)

const selectedForm = computed(() =>
    forms.find(f => f.id === selectedFormId.value)
)

const getFieldComponent = (type: string) => {
  const components: Record<string, string> = {
    text: 'AppInput',
    email: 'AppInput',
    number: 'AppInput',
    date: 'AppInput',
    select: 'AppSelect',
    boolean: 'div', // Would be a checkbox
    currency: 'AppInput'
  }
  return components[type] || 'AppInput'
}

const addTag = () => {
  if (newTag.value && !tags.value.includes(newTag.value)) {
    tags.value.push(newTag.value)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const idx = tags.value.indexOf(tag)
  if (idx !== -1) {
    tags.value.splice(idx, 1)
  }
}

const handleSubmit = async () => {
  const validation = validateForm({form: selectedFormId.value}, rules)

  if (!validation.isValid) {
    Object.assign(errors, validation.errors)
    return
  }

  try {
    await createEntry({
      form_id: selectedFormId.value,
      data: formData,
      tags: tags.value
    })
    await router.push('/entries')
  } catch (error) {
    console.error('Failed to create entry:', error)
  }
}

onMounted(async () => {
  await fetchForms()
})
</script>
