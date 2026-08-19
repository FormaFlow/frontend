import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {useAuthStore} from '@/stores/auth'
import {useWorkspaceStore} from '@/stores/workspace'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: {layout: 'auth'}
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: {layout: 'auth'}
  },
  {
    path: '/accept-invitation',
    name: 'accept-invitation',
    component: () => import('@/views/auth/AcceptInvitationView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/learn',
    name: 'learning-home',
    component: () => import('@/views/learning/LearningHomeView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/learn/assignments/:assignmentId',
    name: 'learning-attempt',
    component: () => import('@/views/learning/AttemptView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/learn/review',
    name: 'learning-review',
    component: () => import('@/views/learning/ReviewView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/admin',
    name: 'learning-admin',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: {requiresAuth: true, requiresManager: true}
  },
  {
    path: '/admin/learners',
    name: 'admin-learners',
    component: () => import('@/views/admin/LearnersView.vue'),
    meta: {requiresAuth: true, requiresManager: true}
  },
  {
    path: '/admin/learners/:learnerId/history',
    name: 'admin-learner-history',
    component: () => import('@/views/admin/LearnerHistoryView.vue'),
    meta: {requiresAuth: true, requiresManager: true}
  },
  {
    path: '/admin/content',
    name: 'admin-content',
    component: () => import('@/views/admin/ContentView.vue'),
    meta: {requiresAuth: true, requiresManager: true}
  },
  {
    path: '/admin/content/:assessmentId',
    name: 'admin-assessment-editor',
    component: () => import('@/views/admin/AssessmentEditorView.vue'),
    meta: {requiresAuth: true, requiresManager: true}
  },
  {
    path: '/admin/assignments',
    name: 'admin-assignments',
    component: () => import('@/views/admin/AssignmentsView.vue'),
    meta: {requiresAuth: true, requiresManager: true}
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/ReportsView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/payments',
    name: 'payments',
    component: () => import('@/views/PaymentsView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/quizzes',
    name: 'quizzes',
    component: () => import('@/views/quizzes/QuizzesView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/forms',
    name: 'forms-list',
    component: () => import('@/views/forms/FormsListView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/forms/create',
    name: 'form-create',
    component: () => import('@/views/forms/FormCreateView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/forms/:id',
    name: 'form-details',
    component: () => import('@/views/forms/FormDetailsView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/forms/:id/edit',
    name: 'form-edit',
    component: () => import('@/views/forms/FormEditView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/entries',
    name: 'entries-list',
    component: () => import('@/views/entries/EntriesListView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/entries/create',
    name: 'entry-create',
    component: () => import('@/views/entries/EntryCreateView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/entries/:id/edit',
    name: 'entry-edit',
    component: () => import('@/views/entries/EntryEditView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/entries/:id/result',
    name: 'entry-result',
    component: () => import('@/views/entries/EntryResultView.vue'),
    meta: {requiresAuth: false}
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: {requiresAuth: true}
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  console.log('Navigation guard:', {
    to: to.name,
    from: from.name,
    isAuthenticated: authStore.isAuthenticated,
    hasToken: !!authStore.token,
    hasUser: !!authStore.user
  })

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({name: 'login', query: {redirect: to.fullPath}})
  } else if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next({name: 'dashboard'})
  } else if (to.meta.requiresManager) {
    try {
      const workspaceStore = useWorkspaceStore()
      await workspaceStore.load()
      if (workspaceStore.isManager) next()
      else next({name: 'dashboard'})
    } catch {
      next({name: 'dashboard'})
    }
  } else {
    next()
  }
})

export default router
