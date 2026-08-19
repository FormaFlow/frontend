<template>
  <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div class="card m-4 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary-500">Forma Школа</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Учёба без лишнего стресса</p>
      </div>

      <div class="mb-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
        <button type="button" class="rounded-lg px-3 py-2 text-sm font-semibold" :class="mode === 'parent' ? 'bg-white text-primary-600 shadow dark:bg-gray-800' : 'text-gray-500'" @click="mode = 'parent'">Родитель</button>
        <button type="button" class="rounded-lg px-3 py-2 text-sm font-semibold" :class="mode === 'child' ? 'bg-white text-primary-600 shadow dark:bg-gray-800' : 'text-gray-500'" @click="mode = 'child'">Ученик</button>
      </div>

      <form v-if="mode === 'parent'" @submit.prevent="handleLogin" class="space-y-4">
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
            <input type="checkbox" class="rounded"/>
            <span class="text-gray-700 dark:text-gray-300">{{ $t('auth.remember_me') }}</span>
          </label>
          <a href="#" class="text-primary-500 hover:text-primary-600">{{ $t('auth.forgot_password') }}</a>
        </div>

        <AppButton type="submit" fullWidth :disabled="loading">
          <span v-if="!loading">{{ $t('auth.login') }}</span>
          <AppLoader v-else/>
        </AppButton>
      </form>

      <form v-else @submit.prevent="handleManagedLogin" class="space-y-4">
        <AppInput v-model="childForm.workspace" label="Код семьи" placeholder="Например, семья-ивановых" required/>
        <AppInput v-model="childForm.login" label="Логин" placeholder="misha" required/>
        <AppInput v-model="childForm.pin" type="password" label="PIN" placeholder="••••" required/>
        <p v-if="managedError" class="text-sm text-red-600">{{ managedError }}</p>
        <AppButton type="submit" fullWidth :disabled="loading">
          <span v-if="!loading">Начать учиться</span><AppLoader v-else/>
        </AppButton>
      </form>

      <div v-if="mode === 'parent'" class="mt-6 text-center text-sm">
        <span class="text-gray-600 dark:text-gray-400">{{ $t('auth.no_account') }}</span>
        <router-link to="/register" class="ml-2 text-primary-500 hover:text-primary-600 font-medium">
          {{ $t('auth.register') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppLoader from '@/components/common/AppLoader.vue'
import {useAuth} from '@/composables/useAuth'
import {useNotification} from '@/composables/useNotification'
import {validateForm, type ValidationRules} from '@/utils/validation'
import {useAuthStore} from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const {login, loading} = useAuth()
const {showSuccess} = useNotification()
const authStore = useAuthStore()
const mode = ref<'parent' | 'child'>('parent')
const managedError = ref('')

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

const childForm = reactive({workspace: '', login: '', pin: ''})

const rules: ValidationRules = {
  email: [{required: true}, {email: true}],
  password: {required: true}
}

const handleLogin = async () => {
  const validation = validateForm(form, rules)

  if (!validation.isValid) {
    Object.assign(errors, validation.errors)
    return
  }

  try {
    const success = await login({
      email: form.email,
      password: form.password
    })
    
    if (success) {
      showSuccess(t('auth.login_success'))
      await router.push('/admin')
    }

  } catch (error) {
    console.error('Login error:', error)
  }
}

const handleManagedLogin = async () => {
  managedError.value = ''
  if (!childForm.workspace || !childForm.login || !/^\d{4,8}$/.test(childForm.pin)) {
    managedError.value = 'Заполни код семьи, логин и PIN из 4–8 цифр.'
    return
  }
  try {
    await authStore.managedLogin(childForm)
    showSuccess('Вход выполнен')
    await router.push('/learn')
  } catch (error) {
    managedError.value = (error as Error).message
  }
}
</script>
