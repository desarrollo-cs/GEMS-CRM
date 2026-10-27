<template>
  <!-- Carga del equipo: quién tiene vencidas y cuánto lleva cada persona. -->
  <DashCard :eyebrow="eyebrow" title="Carga del equipo" flush>
    <div v-if="rows.length === 0" class="empty-state empty-state--sm border-0 rounded-none py-10">
      <p class="empty-state__title">Sin personas en tu área</p>
      <p class="empty-state__text">Agrega miembros desde Equipo para ver su carga aquí.</p>
    </div>
    <ul v-else class="divide-y divide-slate-100">
      <li v-for="m in rows" :key="m._id" class="flex items-center gap-3 px-5 py-2.5">
        <PersonAvatar :name="m.name" :photo="m.photo" :letters="2" class="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-[13px] font-medium text-slate-800 truncate">{{ m.name }}<span v-if="m._id === viewerId" class="text-slate-400 font-normal"> (tú)</span></span>
            <span class="text-[12px] shrink-0" :class="m.stats.overdue ? 'text-red-600 font-medium' : 'text-slate-400'">
              <template v-if="m.stats.overdue">{{ m.stats.overdue }} {{ plural(m.stats.overdue, 'vencida', 'vencidas') }} · </template>{{ m.stats.active }} activas
            </span>
          </div>
          <div class="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden flex">
            <span class="h-full bg-red-500" :style="{ width: pct(m.stats.overdue) }"></span>
            <span class="h-full bg-primary-400" :style="{ width: pct(m.stats.active - m.stats.overdue) }"></span>
          </div>
        </div>
      </li>
    </ul>
    <template #footer>
      <div class="flex items-center justify-between gap-2">
        <span>{{ team.totals.overdue }} vencidas · {{ team.totals.active }} activas en {{ team.members.length }} personas</span>
        <router-link to="/team" class="font-medium text-primary-600 hover:text-primary-700">Ver equipo</router-link>
      </div>
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import PersonAvatar from '@/components/ui/PersonAvatar.vue'
import type { DashboardSummary } from '@/services/dashboardService'
import { plural } from './dashboardFormat'

const props = defineProps<{ team: NonNullable<DashboardSummary['team']>; viewerId: string }>()

// Primero quien más vencidas tiene, luego por carga; máximo 6 filas
const rows = computed(() => [...props.team.members]
  .sort((a, b) => b.stats.overdue - a.stats.overdue || b.stats.active - a.stats.active)
  .slice(0, 6))

const maxActive = computed(() => Math.max(1, ...props.team.members.map(m => m.stats.active)))
const pct = (n: number) => `${Math.max(0, (n / maxActive.value) * 100)}%`

const eyebrow = computed(() => props.team.scope === 'leader' ? `Mi área · ${props.team.department}` : 'Equipo')
</script>
