<template>
  <div class="mx-auto max-w-lg py-16 text-center"><div class="card"><div class="text-5xl">🤝</div><h1 class="mt-4 text-2xl font-black">Присоединиться к семье</h1><p class="mt-2 text-gray-500">Приглашение добавит текущее взрослое аккаунт в семейное пространство.</p><p v-if="message" class="mt-5 rounded-xl p-3" :class="success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">{{ message }}</p><button v-if="!success" class="btn-primary mt-6 w-full" :disabled="busy || !token" @click="accept">{{ busy ? 'Проверяю…' : 'Принять приглашение' }}</button><router-link v-else to="/admin" class="btn-primary mt-6 block">Открыть учебную админку</router-link></div></div>
</template>
<script setup lang="ts">
import {ref} from 'vue'; import {useRoute} from 'vue-router'; import {workspaceApi} from '@/api/learning'
const route = useRoute(); const token = String(route.query.token || ''); const busy = ref(false); const success = ref(false); const message = ref(token ? '' : 'В ссылке отсутствует токен приглашения.')
async function accept() { busy.value = true; try { await workspaceApi.acceptInvitation(token); success.value = true; message.value = 'Готово. Вы присоединились к семейному пространству.'; localStorage.removeItem('workspace_id') } catch (caught) { message.value = (caught as Error).message } finally { busy.value = false } }
</script>
