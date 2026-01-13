<template>
  <div class="max-w-2xl">
    <div class="card">
      <h1 class="text-2xl font-bold mb-6">{{ $t('settings.profile') }}</h1>

      <form @submit.prevent="updateProfile" class="space-y-6">
        <div>
          <label class="form-label" for="name">{{ $t('auth.name') }}</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="input"
            required
          />
        </div>

        <div>
          <label class="form-label" for="email">{{ $t('auth.email') }}</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="input"
            required
          />
        </div>

        <div>
          <label class="form-label" for="timezone">Timezone</label>
          <select
            id="timezone"
            v-model="form.timezone"
            class="form-select"
          >
            <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
              {{ tz.label }}
            </option>
          </select>
          <p class="text-xs text-gray-500 mt-1">
            Current time: {{ currentTime }}
          </p>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="authStore.loading"
          >
            {{ authStore.loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>

      <div class="divider my-8"></div>

      <div>
        <h2 class="text-lg font-semibold mb-4">{{ $t('settings.theme') }}</h2>
        <div class="space-y-2">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="theme" value="light" :checked="theme === 'light'" @change="setTheme('light')" class="text-primary-600 focus:ring-primary-500"/>
            <span>{{ $t('settings.light') }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="theme" value="dark" :checked="theme === 'dark'" @change="setTheme('dark')" class="text-primary-600 focus:ring-primary-500"/>
            <span>{{ $t('settings.dark') }}</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="theme" value="system" :checked="theme === 'system'"
                   @change="setTheme('system')" class="text-primary-600 focus:ring-primary-500"/>
            <span>{{ $t('settings.system') }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'

const authStore = useAuthStore()
const uiStore = useUiStore()
const { theme, setTheme } = useTheme()

const form = ref({
  name: '',
  email: '',
  timezone: 'UTC'
})

interface TimezoneOption {
  value: string
  label: string
  offset: number
}

const timezones = ref<TimezoneOption[]>([])

onMounted(() => {
  try {
    // @ts-ignore
    if (typeof Intl !== 'undefined' && typeof (Intl as any).supportedValuesOf === 'function') {
      const zones = (Intl as any).supportedValuesOf('timeZone') as string[]
      const mappedZones = zones.map((tz: string) => {
        try {
          const str = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).format(new Date())
          // str is like "1/13/2026, GMT+03:00" or "GMT+3"
          const offsetPart = str.split(', ')[1] || 'GMT+00:00'
          const offsetLabel = offsetPart.replace('GMT', 'UTC')
          
          // Calculate numeric offset for sorting
          const match = offsetPart.match(/([+-])(\d{1,2}):?(\d{2})?/)
          let numericOffset = 0
          if (match) {
            const sign = match[1] === '+' ? 1 : -1
            const hours = parseInt(match[2])
            const minutes = parseInt(match[3] || '0')
            numericOffset = sign * (hours * 60 + minutes)
          }
          
          return { value: tz, label: `(${offsetLabel}) ${tz}`, offset: numericOffset }
        } catch (e) {
          return { value: tz, label: tz, offset: 0 }
        }
      })
      
      timezones.value = mappedZones.sort((a: TimezoneOption, b: TimezoneOption) => a.offset - b.offset)
    } else {
      throw new Error('Intl.supportedValuesOf not supported')
    }
  } catch (e) {
    timezones.value = [
      { value: 'UTC', label: '(UTC+00:00) UTC', offset: 0 },
      { value: 'Europe/Moscow', label: '(UTC+03:00) Europe/Moscow', offset: 180 },
      { value: 'Europe/London', label: '(UTC+00:00) Europe/London', offset: 0 },
      { value: 'America/New_York', label: '(UTC-05:00) America/New_York', offset: -300 },
      { value: 'Asia/Tokyo', label: '(UTC+09:00) Asia/Tokyo', offset: 540 }
    ].sort((a: TimezoneOption, b: TimezoneOption) => a.offset - b.offset)
  }
})

const currentTime = computed(() => {
  try {
    return new Date().toLocaleTimeString('en-US', { timeZone: form.value.timezone })
  } catch (e) {
    return ''
  }
})

// Sync form with user data
watchEffect(() => {
  if (authStore.user) {
    form.value = {
      name: authStore.user.name,
      email: authStore.user.email,
      timezone: authStore.user.timezone || 'Europe/Moscow'
    }
  }
})

const updateProfile = async () => {
  try {
    await authStore.updateProfile(form.value)
    uiStore.addNotification({
      type: 'success',
      message: 'Profile updated successfully'
    })
  } catch (error) {
    uiStore.handleApiError(error, 'Failed to update profile')
  }
}
</script>