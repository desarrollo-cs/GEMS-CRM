const WppVinculacion = () => import('./pages/WppVinculacion.vue')
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

// Pages
const Dashboard = () => import('./pages/Dashboard.vue')
import Login from './pages/Login.vue'
const Clients = () => import('./pages/Clients.vue')
const Activities = () => import('./pages/Activities.vue')
const ReportsView = () => import('./pages/ReportsView.vue')
const Team = () => import('./pages/Team.vue')
const TeamActivities = () => import('./pages/TeamActivities.vue')
const AccountingView = () => import('./components/AccountingView.vue')
const CasesView = () => import('./components/CasesView.vue')
const ProfileView = () => import('./pages/ProfileView.vue')
const ChatPage = () => import('./pages/ChatPage.vue')
const ClientDetail = () => import('./pages/ClientDetail.vue')
const ProjectDetail = () => import('./pages/ProjectDetail.vue')
const BoardsPage = () => import('./pages/BoardsPage.vue')
const BoardView = () => import('./pages/BoardView.vue')
const TasksBoard = () => import('./pages/TasksBoard.vue')
const InternalTickets = () => import('./pages/tickets/InternalTickets.vue')
const ExternalTickets = () => import('./pages/tickets/ExternalTickets.vue')
const DailyScrum = () => import('./pages/DailyScrum.vue')
const Prospects = () => import('./pages/Prospects.vue')
const TaskApprovals = () => import('./pages/TaskApprovals.vue')

const routes = [
  {
    path: '/aprobaciones',
    name: 'TaskApprovals',
    component: TaskApprovals,
    meta: {
      requiresAuth: true,
      requiredPermissions: ['view-activities']
    }
  },
  {
    path: '/daily-scrum',
    name: 'DailyScrum',
    component: DailyScrum,
    meta: { 
      requiresAuth: true,
      requiredPermissions: ['view-team', 'view-activities'] 
    }
  },
  {
    path: '/vincular-wpp',
    name: 'WppVinculacion',
    component: WppVinculacion,
    meta: { requiresAuth: true }
  },
  {
    path: '/support',
    name: 'Support',
    component: ExternalTickets
  },
  {
    path: '/tickets',
    name: 'Tickets',
    component: InternalTickets,
    meta: {
      requiresAuth: true,
      // Colaborador (employee) NO tiene acceso a Tickets
      requiredRoles: ['admin', 'manager', 'support']
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/clients/:id',
    name: 'ClientDetail',
    component: ClientDetail,
    meta: { requiresAuth: true, requiredPermissions: ['view-clients'] }
  },
  {
    path: '/clients/:clientId/projects/:projectId',
    name: 'ProjectDetail',
    component: ProjectDetail,
    meta: { requiresAuth: true, requiredPermissions: ['view-clients'] }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/clients',
    name: 'Clients',
    component: Clients,
    meta: {
      requiresAuth: true,
      requiredPermissions: ['view-clients']
    }
  },
  {
    path: '/prospectos',
    name: 'Prospects',
    component: Prospects,
    meta: {
      requiresAuth: true,
      requiredPermissions: ['view-clients']
    }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: Activities,
    meta: { 
      requiresAuth: true,
      requiredPermissions: ['view-activities']
    }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: ReportsView,
    meta: { 
      requiresAuth: true,
      requiredRoles: ['admin', 'manager']
    }
  },
  {
    path: '/accounting',
    name: 'Accounting',
    component: AccountingView,
    meta: { 
      requiresAuth: true,
      requiredRoles: ['admin', 'manager']
    }
  },
  {
    path: '/cases',
    name: 'Cases',
    component: CasesView,
    meta: { 
      requiresAuth: true,
      requiredPermissions: ['view-cases']
    }
  },
  {
    path: '/team',
    name: 'Team',
    component: Team,
    meta: { 
      requiresAuth: true,
      requiredPermissions: ['view-team']
    }
  },
  {
    path: '/team-activities',
    name: 'TeamActivities',
    component: TeamActivities,
    meta: { 
      requiresAuth: true,
      requiredPermissions: ['view-activities', 'view-team']
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { 
      requiresAuth: true
    }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatPage,
    meta: { 
      requiresAuth: true
    }
  },
  {
    path: '/boards',
    name: 'Boards',
    component: BoardsPage,
    meta: { 
      requiresAuth: true,
      requiredPermissions: ['view-activities']
    }
  },
  {
    path: '/boards/:id',
    name: 'BoardView',
    component: BoardView,
    meta: { 
      requiresAuth: true,
      requiredPermissions: ['view-activities']
    }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: TasksBoard,
    meta: { 
      requiresAuth: true,
      requiredPermissions: ['view-activities']
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Global navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Always allow access to login and support pages
  if (to.path === '/login' || to.path === '/support') {
    // If already authenticated and trying to access login, redirect to dashboard
    if (to.path === '/login' && authStore.isAuthenticated) {
      const redirectPath = authStore.user?.role === 'client' ? '/support' : '/';
      next(redirectPath)
      return
    }

    next()
    return
  }
  
  // For all other routes, check authentication
  if (!authStore.isAuthenticated) {
    // Try to restore session from localStorage
    const restored = await authStore.checkAuth()
    
    if (!restored) {
      next('/login')
      return
    }
  }
  
  // Check role-based permissions (legacy support)
  if (to.meta.requiredRoles && authStore.user) {
    const userRole = authStore.user.role
    const requiredRoles = to.meta.requiredRoles as string[]
    
    if (!requiredRoles.includes(userRole)) {
      // Redirect to dashboard if user doesn't have permission
      next('/')
      return
    }
  }
  
  // Check permission-based access (new system)
  if (to.meta.requiredPermissions && authStore.user) {
    const requiredPermissions = to.meta.requiredPermissions as string[]
    const hasPermission = requiredPermissions.some(permission => {
      switch (permission) {
        case 'view-clients':
          return authStore.canViewClients
        case 'view-activities':
          return authStore.canViewActivities
        case 'view-team':
          return authStore.canViewTeam
        case 'view-accounting':
          return authStore.canViewAccounting
        case 'view-reports':
          return authStore.canViewReports
        case 'view-cases':
          return authStore.canViewCases
        default:
          return false
      }
    })
    
    if (!hasPermission) {
      // If client hits unauthorized page (like /dashboard), redirect to /support
      const redirectPath = authStore.isClient ? '/support' : '/';
      next(redirectPath)
      return
    }

  }
  
  next()
})

// Las páginas se cargan bajo demanda; cuando el navegador queda libre después
// de la primera navegación se precargan las más usadas para que abrirlas sea inmediato.
const PREFETCH = [Dashboard, Activities, Clients, TasksBoard, ProjectDetail, ClientDetail, TaskApprovals, Team]
let prefetched = false
router.afterEach(() => {
  if (prefetched) return
  prefetched = true
  const run = () => PREFETCH.forEach(load => load().catch(() => {}))
  const idle = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => void) | undefined
  idle ? idle(run, { timeout: 4000 }) : setTimeout(run, 2000)
})

export default router
