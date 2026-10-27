<template>
  <!-- Saludo personal + resumen del día en una frase + acciones. -->
  <!-- pl en móvil: deja sitio al botón de menú fijo arriba a la izquierda -->
  <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pl-12 lg:pl-0">
    <div class="min-w-0">
      <div class="flex items-center gap-2 flex-wrap mb-1">
        <span class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{{ dateLabel }}</span>
        <span class="badge badge-slate">{{ roleText }}</span>
        <span v-if="department" class="badge" :class="isLeader ? 'badge-warning' : 'badge-primary'">
          <i v-if="isLeader" class="fas fa-crown text-[9px]"></i>
          {{ department }}
        </span>
      </div>
      <h1 class="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
        {{ greeting }}, {{ firstName }}
      </h1>
      <p class="text-[13px] text-slate-500 mt-1 leading-snug">
        <template v-if="loading"><Skeleton width="320" height="12" wrapper-class="inline-block align-middle" /></template>
        <template v-else>
          <span v-html="summaryHtml"></span>
        </template>
      </p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <button
        type="button"
        title="Actualizar datos"
        @click="$emit('refresh')"
        :disabled="refreshing"
        class="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-colors disabled:opacity-50"
      >
        <i class="fas fa-rotate text-[12px]" :class="{ 'animate-spin': refreshing }"></i>
      </button>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import type { ActivityCounts } from '@/services/dashboardService'
import { greetingByHour, longDate, roleLabel, plural } from './dashboardFormat'

const props = withDefaults(defineProps<{
  name?: string | null
  role?: string | null
  department?: string | null
  isLeader?: boolean
  counts?: ActivityCounts | null
  routines?: { total: number; doneToday: number } | null
  approvalsToReview?: number
  loading?: boolean
  refreshing?: boolean
}>(), {
  name: '',
  role: '',
  department: null,
  isLeader: false,
  counts: null,
  routines: null,
  approvalsToReview: 0,
  loading: false,
  refreshing: false
})

defineEmits<{ (e: 'refresh'): void }>()

const now = new Date()
const greeting = greetingByHour(now)
const dateLabel = longDate(now)
const firstName = computed(() => (props.name || '').trim().split(' ')[0] || 'Usuario')
const roleText = computed(() => roleLabel(props.role))

const strong = (n: number, text: string) => `<strong class="font-semibold text-slate-700">${n} ${text}</strong>`

const summaryHtml = computed(() => {
  const c = props.counts
  if (!c) return 'Cargando tu resumen del día…'
  const parts: string[] = []
  if (c.overdue > 0) parts.push(strong(c.overdue, plural(c.overdue, 'vencida', 'vencidas')))
  if (c.today > 0) parts.push(strong(c.today, plural(c.today, 'para hoy', 'para hoy')))
  if (c.week > 0) parts.push(strong(c.week, 'esta semana'))
  if (props.approvalsToReview > 0) parts.push(strong(props.approvalsToReview, plural(props.approvalsToReview, 'autorización por revisar', 'autorizaciones por revisar')))
  const routines = props.routines
  const routinesLeft = routines ? routines.total - routines.doneToday : 0
  if (routinesLeft > 0) parts.push(strong(routinesLeft, plural(routinesLeft, 'rutina sin marcar', 'rutinas sin marcar')))

  if (parts.length === 0) {
    if (c.active === 0) return 'No tienes actividades asignadas. Buen momento para planear.'
    return `Nada vence hoy. Tienes ${strong(c.active, plural(c.active, 'actividad activa', 'actividades activas'))} en marcha.`
  }
  const list = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1]
  return `Hoy tienes ${list}.`
})
</script>
