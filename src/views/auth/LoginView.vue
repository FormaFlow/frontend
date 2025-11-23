<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div class="card m-4 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary-500">FormaFlow</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">{{ $t('auth.login') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
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

        <div class="flex items-center justify-between text-sm">
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded" />
            <span class="text-gray-700 dark:text-gray-300">{{ $t('auth.remember_me') }}</span>
          </label>
          <a href="#" class="text-primary-500 hover:text-primary-600">{{ $t('auth.forgot_password') }}</a>
        </div>

        <AppButton type="submit" fullWidth :disabled="loading">
          <span v-if="!loading">{{ $t('auth.login') }}</span>
          <AppLoader v-else />
        </AppButton>
      </form>

      <div class="mt-6 text-center text-sm">
        <span class="text-gray-600 dark:text-gray-400">{{ $t('auth.no_account') }}</span>
        <router-link to="/register" class="ml-2 text-primary-500 hover:text-primary-600 font-medium">
          {{ $t('auth.register') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import { useAuth } from '@/composables/useAuth'
import { validateForm, type ValidationRules } from '@/utils/validation'

const router = useRouter()
const { login, loading } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const rules: ValidationRules = {
  email: [{ required: true }, { email: true }],
  password: { required: true }
}

const handleLogin = async () => {
  const validation = validateForm(form, rules)
  
  if (!validation.isValid) {
    Object.assign(errors, validation.errors)
    return
  }

  try {
    await login({
      email: form.email,
      password: form.password
    })
    await router.push('/')
  } catch (error) {
    console.error('Login error:', error)
  }
}
</script>
