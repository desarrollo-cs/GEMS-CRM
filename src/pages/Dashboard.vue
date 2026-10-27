<template>
  <div class="flex flex-col gap-5">

    <!-- Saludo de una línea -->
    <DashboardGreeting
      :name="authStore.user?.name"
      :counts="summary?.mine"
      :routines="summary?.routines"
      :approvals-to-review="summary?.approvals.toReview || 0"
      :loading="loading && !summary"
    >
      <template #actions>
        <router-link v-if="authStore.canCreateActivities" to="/activities" class="btn-primary btn-sm !rounded-xl">
          <i class="fas fa-plus text-[10px]"></i>
          Nueva actividad
        </router-link>
      </template>
    </DashboardGreeting>

    <!-- Error -->
    <div v-if="error && !summary" class="empty-state">
      <p class="empty-state__title">No se pudo cargar el resumen</p>
      <p class="empty-state__text">{{ error }}</p>
      <button type="button" class="btn-secondary btn-sm mt-2" @click="load()">Reintentar</button>
    </div>

    <!-- Cargando -->
    <template v-else-if="loading && !summary">
      <Skeleton preset="stats" :rows="3" />
      <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div class="xl:col-span-3"><Skeleton preset="list" :rows="5" /></div>
        <div class="xl:col-span-2"><Skeleton preset="list" :rows="4" /></div>
      </div>
    </template>

    <!-- Contenido -->
    <Transition name="swap">
      <div v-if="summary" class="flex flex-col gap-5 motion-content-in">

        <!-- Números clave: cada uno lleva a su vista filtrada -->
        <div class="grid gap-3 motion-stagger" :class="summary.approvals.canReview ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'">
          <StatTile label="Para hoy" :value="summary.mine.today" :hint="summary.mine.inProgress ? `${summary.mine.inProgress} en curso` : ''" to="/activities" />
          <StatTile label="Vencidas" :value="summary.mine.overdue" tone="danger" to="/activities?status=overdue" />
          <StatTile label="Esta semana" :value="summary.mine.week" :hint="summary.mine.completedWeek ? `${summary.mine.completedWeek} cerradas` : ''" to="/activities" />
          <StatTile v-if="summary.approvals.canReview" label="Por aprobar" :value="summary.approvals.toReview" to="/aprobaciones" />
        </div>

        <!-- Cuerpo: mi día + un bloque secundario según rol -->
        <div class="grid grid-cols-1 gap-5" :class="summary.team ? 'xl:grid-cols-5' : 'xl:grid-cols-3'">
          <div class="flex flex-col gap-5" :class="summary.team ? 'xl:col-span-3' : 'xl:col-span-2'">
            <MyDayList :lists="summary.lists" @open="openActivity" />
          </div>
          <div class="flex flex-col gap-5" :class="summary.team ? 'xl:col-span-2' : ''">
            <AIInsightsWidget :summary="summary" />
            <TeamLoad v-if="summary.team" :team="summary.team" :viewer-id="summary.viewer.id" />
          </div>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useActivityModalStore } from '../stores/activityModal'
import { dashboardService, type DashboardSummary, type DashboardActivity } from '../services/dashboardService'
import Skeleton from '../components/ui/Skeleton.vue'
import AIInsightsWidget from '../components/AIInsightsWidget.vue'
import DashboardGreeting from '../components/dashboard/DashboardGreeting.vue'
import StatTile from '../components/dashboard/StatTile.vue'
import MyDayList from '../components/dashboard/MyDayList.vue'
import TeamLoad from '../components/dashboard/TeamLoad.vue'

const authStore = useAuthStore()
const activityModalStore = useActivityModalStore()

const summary = ref<DashboardSummary | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const load = async (silent = false) => {
  if (!silent) loading.value = true
  try {
    summary.value = await dashboardService.getSummary()
    error.value = null
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Error de conexión'
    console.error('Error cargando el dashboard:', e)
  } finally {
    loading.value = false
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
