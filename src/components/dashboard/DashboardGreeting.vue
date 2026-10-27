<template>
  <!-- Saludo de una línea con el resumen del día. -->
  <!-- pl en móvil: deja sitio al botón de menú fijo arriba a la izquierda -->
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pl-12 lg:pl-0">
    <div class="min-w-0">
      <h1 class="text-[22px] font-semibold text-slate-900 tracking-tight leading-tight">{{ greeting }}, {{ firstName }}</h1>
      <p class="text-[13px] text-slate-500 mt-1 leading-snug">
        <span class="text-slate-400">{{ dateLabel }}.</span>
        <Skeleton v-if="loading" width="260" height="12" wrapper-class="inline-block align-middle ml-1" />
        <span v-else v-html="summaryHtml"></span>
      </p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import type { ActivityCounts } from '@/services/dashboardService'
import { greetingByHour, longDate, plural } from './dashboardFormat'

const props = withDefaults(defineProps<{
  name?: string | null
  counts?: ActivityCounts | null
  routines?: { total: number; doneToday: number } | null
  approvalsToReview?: number
  loading?: boolean
}>(), {
  name: '',
  counts: null,
  routines: null,
  approvalsToReview: 0,
  loading: false
})

const now = new Date()
const greeting = greetingByHour(now)
const dateLabel = longDate(now)
const firstName = computed(() => (props.name || '').trim().split(' ')[0] || 'Usuario')

const strong = (n: number, text: string) => `<strong class="font-semibold text-slate-700">${n} ${text}</strong>`

const summaryHtml = computed(() => {
  const c = props.counts
  if (!c) return ''
  const parts: string[] = []
  if (c.overdue > 0) parts.push(strong(c.overdue, plural(c.overdue, 'vencida', 'vencidas')))
  if (c.today > 0) parts.push(strong(c.today, 'para hoy'))
  if (c.week > 0) parts.push(strong(c.week, 'esta semana'))
  if (props.approvalsToReview > 0) parts.push(strong(props.approvalsToReview, plural(props.approvalsToReview, 'autorización por revisar', 'autorizaciones por revisar')))
  const routinesLeft = props.routines ? props.routines.total - props.routines.doneToday : 0
  if (routinesLeft > 0) parts.push(strong(routinesLeft, plural(routinesLeft, 'rutina sin marcar', 'rutinas sin marcar')))

  if (parts.length === 0) {
    if (c.active === 0) return 'No tienes actividades asignadas.'
    return `Nada vence hoy. ${strong(c.active, plural(c.active, 'actividad activa', 'actividades activas'))}.`
  }
  const list = parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1]
  return `Tienes ${list}.`
})
</script>
