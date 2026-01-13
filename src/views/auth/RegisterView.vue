<template>
  <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div class="card m-4 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary-500">FormaFlow</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">{{ $t('auth.register') }}</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <AppInput
            v-model="form.name"
            :label="$t('auth.name')"
            :placeholder="$t('auth.name')"
            required
            :error="errors.name"
        />

        <AppInput
            v-model="form.email"
            type="email"
            :label="$t('auth.email')"
            :placeholder="$t('auth.email')"
            required
            :error="errors.email"
        />

        <AppInput
            v-model="form.password"
            type="password"
            :label="$t('auth.password')"
            :placeholder="$t('auth.password')"
            required
            :error="errors.password"
        />

        <AppInput
            v-model="form.password_confirmation"
            type="password"
            :label="$t('auth.password_confirmation')"
            :placeholder="$t('auth.password_confirmation')"
            required
            :error="errors.password_confirmation"
        />

        <AppButton type="submit" fullWidth :disabled="loading">
          <span v-if="!loading">{{ $t('auth.register') }}</span>
          <AppLoader v-else/>
        </AppButton>
      </form>

      <div class="mt-6 text-center text-sm">
        <span class="text-gray-600 dark:text-gray-400">{{ $t('auth.have_account') }}</span>
        <router-link to="/login" class="ml-2 text-primary-500 hover:text-primary-600 font-medium">
          {{ $t('auth.login') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive} from 'vue'
import {useRouter} from 'vue-router'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import {useAuth} from '@/composables/useAuth'
import {validateForm, type ValidationRules} from '@/utils/validation'

const router = useRouter()
const {register, loading} = useAuth()

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const rules: ValidationRules = {
  name: {required: true},
  email: [{required: true}, {email: true}],
  password: [{required: true}, {minLength: 6}],
  password_confirmation: {required: true}
}

const handleRegister = async () => {
  const validation = validateForm(form, rules)

  if (!validation.isValid) {
    Object.assign(errors, validation.errors)
    return
  }

  if (form.password !== form.password_confirmation) {
    errors.password_confirmation = 'Passwords do not match'
    return
  }

  try {
    await register(form)
    await router.push('/')
  } catch (error) {
    console.error('Registration error:', error)
  }
}
</script>
