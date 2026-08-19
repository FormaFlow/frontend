import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {workspaceApi} from '@/api/learning'
import {useAuthStore} from '@/stores/auth'
import type {WorkspaceSummary} from '@/types/learning'

export const useWorkspaceStore = defineStore('workspace', () => {
  const current = ref<WorkspaceSummary | null>(null)
  const workspaces = ref<WorkspaceSummary[]>([])
  const loading = ref(false)
  const isManager = computed(() => ['owner', 'admin'].includes(current.value?.role || ''))
  const isGuardian = computed(() => current.value?.role === 'guardian')
  const canViewLearning = computed(() => isManager.value || isGuardian.value)
  const isLearner = computed(() => current.value?.role === 'learner')

  async function load() {
    if (current.value) return current.value
    loading.value = true
    try {
      const managed = useAuthStore().loginWorkspace
      if (managed) {
        current.value = {...managed, modules: managed.modules || {learning: true}}
        workspaces.value = [current.value]
        return current.value
      }
      const response = await workspaceApi.list()
      workspaces.value = response.workspaces
      const remembered = localStorage.getItem('workspace_id')
      current.value = response.workspaces.find(item => item.id === remembered) || response.workspaces[0] || null
      if (current.value) localStorage.setItem('workspace_id', current.value.id)
      return current.value
    } finally {
      loading.value = false
    }
  }

  function select(workspace: WorkspaceSummary) {
    current.value = workspace
    localStorage.setItem('workspace_id', workspace.id)
  }

  return {current, workspaces, loading, isManager, isGuardian, canViewLearning, isLearner, load, select}
})
