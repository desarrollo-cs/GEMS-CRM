<template>
  <div class="flex flex-col gap-4">

    <!-- ══ Saludo + resumen del día ═══════════════════════════════════ -->
    <DashboardGreeting
      :name="authStore.user?.name"
      :role="viewer?.role || authStore.user?.role"
      :department="viewer?.department"
      :is-leader="viewer?.isLeader"
      :counts="summary?.mine"
      :routines="summary?.routines"
      :approvals-to-review="summary?.approvals.toReview || 0"
      :loading="loading && !summary"
      :refreshing="refreshing"
      @refresh="load(true)"
    >
      <template #actions>
        <router-link v-if="authStore.canCreateActivities" to="/activities" class="btn-primary btn-sm !rounded-xl">
          <i class="fas fa-plus text-[10px]"></i>
          <span class="hidden sm:inline">Nueva actividad</span>
          <span class="sm:hidden">Nueva</span>
        </router-link>
      </template>
    </DashboardGreeting>

    <!-- ══ Error ═══════════════════════════════════════════════════════ -->
    <div v-if="error && !summary" class="empty-state">
      <div class="empty-state__icon bg-red-50 text-red-500"><i class="fas fa-triangle-exclamation"></i></div>
      <p class="empty-state__title">No se pudo cargar el resumen</p>
      <p class="empty-state__text">{{ error }}</p>
      <button type="button" class="btn-secondary btn-sm mt-2" @click="load()">Reintentar</button>
    </div>

    <!-- ══ Cargando ═══════════════════════════════════════════════════ -->
    <template v-else-if="loading && !summary">
      <Skeleton preset="stats" :rows="4" />
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-2"><Skeleton preset="list" :rows="6" /></div>
        <Skeleton preset="cards" :rows="2" :cols="1" />
      </div>
    </template>

    <!-- ══ Contenido ═══════════════════════════════════════════════════ -->
    <Transition name="swap">
      <div v-if="summary" class="flex flex-col gap-4 motion-content-in">

        <!-- Mis números: pestañas que cambian la lista de abajo -->
        <div class="grid gap-2.5 motion-stagger" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
          <StatTile label="Vencidas" :value="summary.mine.overdue" icon="fa-triangle-exclamation" tone="danger" :hint="summary.mine.overdue ? 'atender ya' : 'al día'" to="/activities" />
          <StatTile label="Para hoy" :value="summary.mine.today" icon="fa-sun" tone="warning" :hint="summary.mine.inProgress ? `${summary.mine.inProgress} en curso` : ''" to="/activities" />
          <StatTile label="Esta semana" :value="summary.mine.week" icon="fa-calendar-week" tone="primary" :hint="summary.mine.later ? `+${summary.mine.later} después` : ''" to="/activities" />
          <StatTile label="Cerradas 7 días" :value="summary.mine.completedWeek" icon="fa-circle-check" tone="success" :hint="`${summary.mine.active} activas`" to="/activities" />
          <StatTile v-if="summary.approvals.canReview" label="Por autorizar" :value="summary.approvals.toReview" icon="fa-user-shield" tone="warning" :hint="summary.approvals.toReview ? 'esperan tu ok' : 'nada pendiente'" to="/aprobaciones" />
        </div>

        <!-- Accesos rápidos -->
        <QuickActions :actions="quickActions" />

        <!-- Salud de la organización (admin / gerencia) -->
        <OrgPulse v-if="summary.org" :org="summary.org" />

        <!-- Cuerpo: agenda + columna lateral -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div class="xl:col-span-2 flex flex-col gap-4">
            <MyDayList :lists="summary.lists" @open="openActivity" />
            <AIInsightsWidget :summary="summary" />
            <TeamLoad v-if="summary.team" :team="summary.team" :viewer-id="summary.viewer.id" />
            <!-- Sin bloque de equipo (colaborador): rutinas y autorizaciones van debajo de la agenda -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 motion-stagger">
              <RoutinesCard v-if="summary.routines.total > 0" :routines="summary.routines" />
              <ApprovalsCard :approvals="summary.approvals" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 motion-stagger content-start">
            <FocusCard :counts="summary.mine" :approvals-to-review="summary.approvals.toReview" />
            <template v-if="summary.team">
              <RoutinesCard v-if="summary.routines.total > 0" :routines="summary.routines" />
              <ApprovalsCard :approvals="summary.approvals" />
              <ActiveClientsCard :clients="summary.team.clients" :can-open="authStore.canViewClients" />
            </template>
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useActivityModalStore } from '../stores/activityModal'
import { dashboardService, type DashboardSummary, type DashboardActivity } from '../services/dashboardService'
import Skeleton from '../components/ui/Skeleton.vue'
import AIInsightsWidget from '../components/AIInsightsWidget.vue'
import DashboardGreeting from '../components/dashboard/DashboardGreeting.vue'
import StatTile from '../components/dashboard/StatTile.vue'
import QuickActions, { type QuickAction } from '../components/dashboard/QuickActions.vue'
import MyDayList from '../components/dashboard/MyDayList.vue'
import FocusCard from '../components/dashboard/FocusCard.vue'
import RoutinesCard from '../components/dashboard/RoutinesCard.vue'
import ApprovalsCard from '../components/dashboard/ApprovalsCard.vue'
import TeamLoad from '../components/dashboard/TeamLoad.vue'
import ActiveClientsCard from '../components/dashboard/ActiveClientsCard.vue'
import OrgPulse from '../components/dashboard/OrgPulse.vue'

const authStore = useAuthStore()
const activityModalStore = useActivityModalStore()

const summary = ref<DashboardSummary | null>(null)
const loading = ref(false)
const refreshing = ref(false)
const error = ref<string | null>(null)

const viewer = computed(() => summary.value?.viewer || null)

const quickActions = computed<QuickAction[]>(() => {
  const s = summary.value
  const all: (QuickAction & { can: boolean })[] = [
    { label: 'Nueva actividad', hint: 'Tarea, bug o feature', to: '/activities', icon: 'fa-plus-circle', iconBg: 'bg-emerald-50 group-hover:bg-emerald-100', iconColor: 'text-emerald-500', can: authStore.canCreateActivities },
    { label: 'Mi tablero', hint: 'Kanban y lista', to: '/activities', icon: 'fa-columns', iconBg: 'bg-primary-50 group-hover:bg-primary-100', iconColor: 'text-primary-600', can: authStore.canViewActivities },
    { label: 'Autorizaciones', hint: s?.approvals.canReview ? 'Plazos y eliminaciones' : 'Mis solicitudes', to: '/aprobaciones', icon: 'fa-user-shield', iconBg: 'bg-amber-50 group-hover:bg-amber-100', iconColor: 'text-amber-500', badge: s?.approvals.toReview || undefined, can: authStore.canViewActivities },
    { label: 'Nuevo cliente', hint: 'Alta y proyectos', to: '/clients', icon: 'fa-user-plus', iconBg: 'bg-violet-50 group-hover:bg-violet-100', iconColor: 'text-violet-500', can: authStore.canCreateClients },
    { label: 'Tickets', hint: 'Soporte interno', to: '/tickets', icon: 'fa-ticket', iconBg: 'bg-slate-100 group-hover:bg-slate-200', iconColor: 'text-slate-600', can: authStore.canViewTickets },
    { label: 'Equipo', hint: s?.team ? `${s.team.members.length} personas` : 'Personas y áreas', to: '/team', icon: 'fa-users-gear', iconBg: 'bg-sky-50 group-hover:bg-sky-100', iconColor: 'text-sky-600', can: authStore.canViewTeam },
    { label: 'Reportes', hint: 'Rendimiento', to: '/reports', icon: 'fa-chart-column', iconBg: 'bg-rose-50 group-hover:bg-rose-100', iconColor: 'text-rose-500', can: authStore.canViewReports }
  ]
  return all.filter(a => a.can).slice(0, 6)
})

const load = async (isRefresh = false) => {
  if (isRefresh) refreshing.value = true
  else loading.value = true
  try {
    summary.value = await dashboardService.getSummary()
    error.value = null
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Error de conexión'
    console.error('Error cargando el dashboard:', e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const openActivity = (a: DashboardActivity) => {
  activityModalStore.open(a._id, 'activity')
}

// Al cerrar el modal global (posible edición), refrescar los números
watch(() => activityModalStore.isOpen, (open, was) => {
  if (was && !open) load(true)
})

// Refresco silencioso cada 5 minutos mientras la vista esté abierta
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  load()
  timer = setInterval(() => { if (document.visibilityState === 'visible') load(true) }, 5 * 60 * 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>
