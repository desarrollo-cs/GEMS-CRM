<template>
  <div id="app">
    <!-- Show login page if not authenticated -->
    <router-view v-if="!authStore.isAuthenticated || $route.path === '/login'" />
    
    <!-- Show main app if authenticated -->
  <div v-else class="min-h-screen bg-slate-50">
      <!-- Barra lateral (escritorio: colapsable; móvil: drawer con overlay) -->
      <AppSidebar
        :modules="availableModules"
        :user="authStore.user"
        :open="sidebarOpen"
        v-model:mini="isSidebarMini"
        :is-desktop="isDesktop"
        :approvals-to-review="approvalsToReview"
        @close="sidebarOpen = false"
        @logout="handleLogout"
      />

      <!-- Botón de menú (móvil) -->
      <div class="lg:hidden fixed top-3 left-4 z-30">
        <button
          type="button"
          title="Abrir menú"
          aria-label="Abrir menú"
          @click="sidebarOpen = true"
          class="w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-sm text-slate-600 border border-slate-200 flex items-center justify-center hover:text-primary-600 hover:border-primary-300"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
            <path d="M4 7h16M4 12h16M4 17h16"></path>
          </svg>
        </button>
      </div>

      <!-- Main Content -->
      <div 
        class="flex flex-col h-screen transition-all duration-300 ease-in-out"
        :class="isSidebarMini ? 'lg:ml-[72px]' : 'lg:ml-[248px]'"
      >
        <!-- Main Content Area -->
        <main class="p-4 pb-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <router-view v-slot="{ Component, route: viewRoute }">
            <!-- Cada página entra con un fade + subida suave (motion.css) -->
            <div :key="viewRoute.path" class="motion-page h-full">
              <component :is="Component" />
            </div>
          </router-view>
        </main>
      </div>

  <!-- Global toast for nuevos mensajes (Hidden by user request) -->
  <!-- <NewMessageToast /> -->

  <!-- Notification Bell flotante (inferior derecha) -->
  <NotificationBell />

  <!-- Modal global "Refinar Tarea" — se abre al clickear notificaciones, etc. -->
  <ActivityFormModal
    v-if="activityModalStore.isOpen"
    :activity="activityModalStore.editingActivity"
    :clients="activityModalStore.clients"
    :team-members="activityModalStore.teamMembers"
    @close="activityModalStore.close"
    @saved="activityModalStore.close"
  />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { taskApprovalService, APPROVALS_CHANGED_EVENT, APPROVALS_REFRESH_EVENT, type ApprovalSummary } from './services/taskApprovalService'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useChatStore } from './stores/chatStore'
import AppSidebar from './components/AppSidebar.vue'
import NewMessageToast from './components/NewMessageToast.vue'
import NotificationBell from './components/NotificationBell.vue'
import ActivityFormModal from './components/forms/ActivityFormModal.vue'
import { useActivityModalStore } from './stores/activityModal'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const activityModalStore = useActivityModalStore()

// Reactive data
const sidebarOpen = ref(true)
const isSidebarMini = ref(localStorage.getItem('crm:sidebar-mini') === '1')
watch(isSidebarMini, v => localStorage.setItem('crm:sidebar-mini', v ? '1' : '0'))
const isDesktop = ref(true)
// Removed navbar mini-popup; use NewMessageToast instead

// Computed properties
const availableModules = computed(() => authStore.getAvailableModules)

// Contador del menú "Autorizaciones": solicitudes que el usuario debe aprobar.
// Se refresca al navegar (aprobar desde la página también navega/recarga).
const approvalsToReview = ref(0)
async function refreshApprovalsCount() {
  if (!authStore.user || !availableModules.value.some(m => m.id === 'task-approvals')) {
    approvalsToReview.value = 0
    return
  }
  try {
    approvalsToReview.value = (await taskApprovalService.summary()).toReview
  } catch {
    // Sin conexión o sin organización: el menú simplemente no muestra el contador
  }
}
watch(() => route.fullPath, refreshApprovalsCount)

// Enlace compartido a una tarea (?openActivity=<id> o ?openTask=<id>): se abre
// en cualquier página. Actividades lo maneja su propia vista; si ya hay un modal
// mostrando esa tarea (el modal pone el parámetro al abrirse), no se abre otro.
watch(
  () => [route.query.openActivity, route.query.openTask, authStore.user?._id],
  () => {
    if (!authStore.user || route.path.startsWith('/activities')) return
    const activityId = typeof route.query.openActivity === 'string' ? route.query.openActivity : ''
    const taskId = typeof route.query.openTask === 'string' ? route.query.openTask : ''
    const id = activityId || taskId
    if (!id || activityModalStore.isOpen || activityModalStore.shownIds.has(id)) return
    activityModalStore.open(id, activityId ? 'activity' : 'task')
  },
  { immediate: true }
)
const onApprovalsChanged = (e: Event) => {
  approvalsToReview.value = (e as CustomEvent<ApprovalSummary>).detail?.toReview ?? approvalsToReview.value
}
onMounted(() => {
  window.addEventListener(APPROVALS_CHANGED_EVENT, onApprovalsChanged)
  window.addEventListener(APPROVALS_REFRESH_EVENT, refreshApprovalsCount)
})
onBeforeUnmount(() => {
  window.removeEventListener(APPROVALS_CHANGED_EVENT, onApprovalsChanged)
  window.removeEventListener(APPROVALS_REFRESH_EVENT, refreshApprovalsCount)
})

const currentModule = computed(() => {
  const current = availableModules.value.find(m => m.path === route.path)
  return current?.id || 'dashboard'
})

// Methods
const getCurrentModuleName = () => {
  return availableModules.value.find(m => m.path === route.path)?.name || 'Dashboard'
}

const getCurrentModuleDescription = () => {
  const descriptions: Record<string, string> = {
    dashboard: 'Resumen general del CRM',
    clients: 'Gestión de clientes y contactos',
    activities: 'Actividades y tareas del equipo',
    reports: 'Análisis de rendimiento y métricas de productividad',
    accounting: 'Transacciones, pagos y gastos fijos',
    tickets: 'Gestión de incidencias y soporte técnico',
    cases: 'Documentos, incidencias y seguimientos',
    team: 'Gestión de usuarios y equipo',
    profile: 'Configuración de perfil de usuario'
  }
  return descriptions[currentModule.value] || 'Panel de control principal'
}

const handleLogout = async () => {
  await authStore.logout()
}

// Handle responsive sidebar
const handleResize = () => {
  isDesktop.value = window.innerWidth >= 1024
  if (isDesktop.value) {
    sidebarOpen.value = true
  } else {
    sidebarOpen.value = false
  }
}

onMounted(async () => {
  // El guard del router ya restaura la sesión; solo se verifica si no lo hizo (evita un /verify duplicado)
  if (!authStore.isAuthenticated) await authStore.checkAuth()
  
  handleResize()
  window.addEventListener('resize', handleResize)

  // Initialize chat in background for unread badge (Disabled by user request)
  /* if (authStore.isAuthenticated) {
    try { await chatStore.initializeChat() } catch {}
  } */
})

// Removed navbar popup listener; NewMessageToast handles notifications globally
</script>

<style>

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Los estilos de scrollbar globales se gestionan en style.css para mayor consistencia */
</style>
