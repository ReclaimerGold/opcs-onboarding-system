import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import FormWizardView from '../views/FormWizardView.vue'
import SettingsView from '../views/SettingsView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminOnboardingView from '../views/AdminOnboardingView.vue'
import PasswordSetupView from '../views/PasswordSetupView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import ApprovalQueueView from '../views/ApprovalQueueView.vue'
import NotificationPreferences from '../components/NotificationPreferences.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/forms',
    name: 'Forms',
    component: FormWizardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminDashboardView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/setup',
    name: 'AdminSetup',
    component: AdminOnboardingView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/password-setup',
    name: 'PasswordSetup',
    component: PasswordSetupView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/approvals',
    name: 'Approvals',
    component: ApprovalQueueView,
    meta: { requiresAuth: true, requiresManager: true }
  },
  {
    path: '/notifications/preferences',
    name: 'NotificationPreferences',
    component: NotificationPreferences,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth guard
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = localStorage.getItem('authToken')

  // Import auth store
  const { useAuthStore } = await import('../stores/auth.js')
  const authStore = useAuthStore()

  // Fetch user info if authenticated but not loaded
  if (isAuthenticated && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      // If fetch fails, clear auth and redirect to login
      console.error('Failed to fetch user:', error)
      authStore.logout()
      if (to.path !== '/login') {
        next('/login')
        return
      }
    }
  }

  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // User onboarding (dashboard/forms): admins must have password set before accessing
  if (to.meta.requiresAuth && isAuthenticated && (to.path === '/dashboard' || to.path === '/forms')) {
    if (authStore.isAdmin) {
      try {
        const api = (await import('../services/api.js')).default
        const passwordStatus = await api.get('/auth/password-status')
        if (passwordStatus.data.requiresPassword) {
          next('/password-setup')
          return
        }
      } catch (error) {
        console.error('Failed to check password status:', error)
      }
    }
  }

  // Check manager access (managers and admins can access)
  if (to.meta.requiresManager) {
    if (!isAuthenticated) {
      next('/login')
      return
    }
    const { role } = authStore
    if (role !== 'manager' && role !== 'admin' && !authStore.isAdmin) {
      next('/dashboard')
      return
    }
  }

  // Check admin access
  if (to.meta.requiresAdmin) {
    if (!isAuthenticated) {
      next('/login')
      return
    }
    if (!authStore.isAdmin) {
      // Non-admin trying to access admin route
      next('/dashboard')
      return
    }

    // Check if password setup is required (except for password-setup route itself)
    if (to.path !== '/password-setup') {
      try {
        const api = (await import('../services/api.js')).default
        const passwordStatus = await api.get('/auth/password-status')
        if (passwordStatus.data.requiresPassword) {
          next('/password-setup')
          return
        }
      } catch (error) {
        // If check fails, allow access (don't block on error)
        console.error('Failed to check password status:', error)
      }
    }

    // Require admin setup (signature placement) before dashboard/settings; only /admin/setup is allowed until complete
    if (to.path !== '/admin/setup' && to.path !== '/password-setup') {
      try {
        const api = (await import('../services/api.js')).default
        const setupStatus = await api.get('/admin/setup-status')
        if (!setupStatus.data.signaturePlacementComplete || !setupStatus.data.emailAndFormsConfigured) {
          next('/admin/setup')
          return
        }
      } catch (error) {
        console.error('Failed to check admin setup status:', error)
        // On error, allow access so admins are not locked out
      }
    }
  }

  // Redirect authenticated users away from login
  if (to.path === '/login' && isAuthenticated) {
    if (authStore.isAdmin) {
      next('/admin')
    } else {
      next('/dashboard')
    }
    return
  }

  next()
})

export default router

