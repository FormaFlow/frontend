import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { layout: 'auth' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { layout: 'auth' }
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/forms',
    name: 'forms-list',
    component: () => import('@/views/forms/FormsListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/forms/create',
    name: 'form-create',
    component: () => import('@/views/forms/FormCreateView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/forms/:id',
    name: 'form-details',
    component: () => import('@/views/forms/FormDetailsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/forms/:id/edit',
    name: 'form-edit',
    component: () => import('@/views/forms/FormEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/entries',
    name: 'entries-list',
    component: () => import('@/views/entries/EntriesListView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/entries/create',
    name: 'entry-create',
    component: () => import('@/views/entries/EntryCreateView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/entries/:id/edit',
    name: 'entry-edit',
    component: () => import('@/views/entries/EntryEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
