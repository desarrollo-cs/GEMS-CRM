<template>
  <!-- Ritmo de la semana: anillo con lo completado vs activo, y qué atacar primero. -->
  <DashCard eyebrow="Ritmo" title="Mi semana" icon="fa-bullseye" icon-class="bg-violet-50 text-violet-600">
    <div class="flex items-center gap-4">
      <div class="relative w-[76px] h-[76px] shrink-0">
        <svg viewBox="0 0 76 76" class="w-full h-full -rotate-90">
          <circle cx="38" cy="38" r="32" fill="none" stroke="#f1f5f9" stroke-width="8" />
          <circle cx="38" cy="38" r="32" fill="none" stroke="url(#focusGrad)" stroke-width="8" stroke-linecap="round"
            :stroke-dasharray="circumference" :stroke-dashoffset="circumference * (1 - progress / 100)"
            class="transition-[stroke-dashoffset] duration-700 ease-out-expo" />
          <defs>
            <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#0284c7" />
            </linearGradient>
          </defs>
        </svg>
        <span class="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-slate-900">{{ progress }}%</span>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[13px] font-semibold text-slate-800 leading-snug">{{ headline }}</p>
        <p class="text-[11.5px] text-slate-500 mt-0.5">{{ counts.completedWeek }} {{ plural(counts.completedWeek, 'completada', 'completadas') }} en 7 días · {{ counts.active }} {{ plural(counts.active, 'activa', 'activas') }}</p>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-2 mt-3.5">
      <div v-for="m in minis" :key="m.label" class="rounded-lg bg-slate-50 px-2 py-2 text-center">
        <div class="text-lg font-bold leading-none" :class="m.value ? m.color : 'text-slate-400'">{{ m.value }}</div>
        <div class="text-[10px] font-semibold text-slate-500 mt-1 leading-tight">{{ m.label }}</div>
      </div>
    </div>
    <ul class="mt-3.5 space-y-2">
      <li v-for="(tip, i) in tips" :key="i" class="flex items-start gap-2.5">
        <i :class="['fas', tip.icon, tip.color, 'text-[11px] mt-0.5 shrink-0']"></i>
        <span class="text-[12px] text-slate-600 leading-snug">{{ tip.text }}</span>
      </li>
    </ul>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import type { ActivityCounts } from '@/services/dashboardService'
import { plural } from './dashboardFormat'

const props = defineProps<{ counts: ActivityCounts; approvalsToReview?: number }>()

const circumference = 2 * Math.PI * 32

const progress = computed(() => {
  const done = props.counts.completedWeek
  const total = done + props.counts.active
  if (!total) return 0
  return Math.round((done / total) * 100)
})

const headline = computed(() => {
  if (props.counts.overdue > 0) return 'Primero lo vencido, después lo de hoy.'
  if (props.counts.today > 0) return 'Hoy hay entregas: cierra en bloque.'
  if (progress.value >= 60) return 'Buen ritmo. Sigue cerrando.'
  if (props.counts.active === 0) return 'Sin carga asignada por ahora.'
  return 'Semana en marcha: avanza lo próximo.'
})

const minis = computed(() => [
  { label: 'Vencidas', value: props.counts.overdue, color: 'text-red-500' },
  { label: 'Hoy', value: props.counts.today, color: 'text-amber-500' },
  { label: 'Alta prioridad', value: props.counts.highPriority, color: 'text-primary-600' }
])

const tips = computed(() => {
  const t: { icon: string; color: string; text: string }[] = []
  if (props.counts.overdue > 0) t.push({ icon: 'fa-bolt', color: 'text-amber-500', text: 'Recupera las vencidas antes de abrir frentes nuevos.' })
  if (props.counts.highPriority > 0) t.push({ icon: 'fa-fire', color: 'text-red-500', text: `${props.counts.highPriority} ${plural(props.counts.highPriority, 'actividad urgente o alta', 'actividades urgentes o altas')}: atácalas en bloque.` })
  if ((props.approvalsToReview || 0) > 0) t.push({ icon: 'fa-user-shield', color: 'text-primary-600', text: 'Tu equipo espera autorizaciones tuyas.' })
  if (props.counts.inProgress > 1) t.push({ icon: 'fa-layer-group', color: 'text-slate-500', text: `${props.counts.inProgress} en curso a la vez: cierra una antes de abrir otra.` })
  if (!t.length) t.push({ icon: 'fa-check-circle', color: 'text-emerald-500', text: 'Todo bajo control. Buen momento para planear la próxima semana.' })
  return t.slice(0, 3)
})
</script>
