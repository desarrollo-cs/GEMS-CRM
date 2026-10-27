<template>
  <!-- Carga por persona: barra apilada (vencidas / hoy / resto) y conteos.
       El admin filtra por departamento; todos ordenan por carga, vencidas o nombre. -->
  <DashCard :eyebrow="eyebrow" :title="title" icon="fa-users" icon-class="bg-violet-50 text-violet-600" flush>
    <template #action>
      <CustomSelect v-if="departmentOptions.length > 2" v-model="department" :options="departmentOptions" size="sm" />
      <CustomSelect v-model="sortBy" :options="sortOptions" size="sm" />
    </template>

    <div v-if="rows.length === 0" class="empty-state empty-state--sm border-0 rounded-none py-10">
      <div class="empty-state__icon"><i class="fas fa-user-group"></i></div>
      <p class="empty-state__title">Sin personas en esta vista</p>
      <p class="empty-state__text">Agrega miembros al área desde Equipo para ver su carga aquí.</p>
    </div>

    <ul v-else class="divide-y divide-slate-50 max-h-[460px] overflow-y-auto custom-scrollbar">
      <li v-for="m in rows" :key="m._id" class="px-4 py-2.5 hover:bg-slate-50/70 transition-colors">
        <div class="flex items-center gap-3">
          <span class="relative shrink-0">
            <PersonAvatar :name="m.name" :photo="m.photo" :letters="2" class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold" />
            <span v-if="m.departmentRole === 'leader'" title="Líder de área" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
              <i class="fas fa-crown text-[6px] text-white"></i>
            </span>
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[12.5px] font-semibold text-slate-800 truncate" :class="{ 'text-primary-700': m._id === viewerId }">
                {{ m.name }}<span v-if="m._id === viewerId" class="text-slate-400 font-medium"> (tú)</span>
              </span>
              <span class="text-[11px] text-slate-400 shrink-0 hidden sm:inline">{{ m.department || '—' }}</span>
            </div>
            <div class="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
              <span class="h-full bg-red-500 transition-all duration-500" :style="{ width: pct(m.stats.overdue) }"></span>
              <span class="h-full bg-amber-400 transition-all duration-500" :style="{ width: pct(m.stats.today) }"></span>
              <span class="h-full bg-primary-400 transition-all duration-500" :style="{ width: pct(m.stats.active - m.stats.overdue - m.stats.today) }"></span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="badge" :class="m.stats.overdue ? 'badge-danger' : 'badge-slate'" title="Vencidas">{{ m.stats.overdue }}</span>
            <span class="badge" :class="m.stats.today ? 'badge-warning' : 'badge-slate'" title="Para hoy">{{ m.stats.today }}</span>
            <span class="badge badge-primary w-[52px] justify-center" title="Activas">{{ m.stats.active }} act.</span>
          </div>
        </div>
      </li>
    </ul>

    <template #footer>
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1"><i class="w-2 h-2 rounded-full bg-red-500 inline-block"></i>Vencidas {{ totals.overdue }}</span>
          <span class="inline-flex items-center gap-1"><i class="w-2 h-2 rounded-full bg-amber-400 inline-block"></i>Hoy {{ totals.today }}</span>
          <span class="inline-flex items-center gap-1"><i class="w-2 h-2 rounded-full bg-primary-400 inline-block"></i>Activas {{ totals.active }}</span>
        </span>
        <router-link to="/team" class="font-semibold text-primary-600 hover:text-primary-700">Ver equipo →</router-link>
      </div>
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DashCard from './DashCard.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import PersonAvatar from '@/components/ui/PersonAvatar.vue'
import type { DashboardSummary } from '@/services/dashboardService'

const props = defineProps<{ team: NonNullable<DashboardSummary['team']>; viewerId: string }>()

const sortBy = ref<'load' | 'overdue' | 'name'>('load')
const department = ref<string>('')

const sortOptions = [
  { value: 'load', label: 'Más carga' },
  { value: 'overdue', label: 'Más vencidas' },
  { value: 'name', label: 'Nombre' }
]

const departmentOptions = computed(() => {
  const set = new Map<string, string>()
  for (const m of props.team.members) {
    const d = (m.department || '').trim()
    if (d) set.set(d.toLowerCase(), d)
  }
  return [{ value: '', label: 'Todas las áreas' }, ...[...set.values()].sort().map(d => ({ value: d.toLowerCase(), label: d }))]
})

const filtered = computed(() => props.team.members.filter(m => !department.value || (m.department || '').toLowerCase() === department.value))

const rows = computed(() => [...filtered.value].sort((a, b) => {
  if (sortBy.value === 'name') return a.name.localeCompare(b.name, 'es')
  if (sortBy.value === 'overdue') return b.stats.overdue - a.stats.overdue || b.stats.active - a.stats.active
  return b.stats.active - a.stats.active || b.stats.overdue - a.stats.overdue
}))

const maxActive = computed(() => Math.max(1, ...filtered.value.map(m => m.stats.active)))
const pct = (n: number) => `${Math.max(0, (n / maxActive.value) * 100)}%`

const totals = computed(() => filtered.value.reduce((acc, m) => ({
  overdue: acc.overdue + m.stats.overdue, today: acc.today + m.stats.today, active: acc.active + m.stats.active
}), { overdue: 0, today: 0, active: 0 }))

const eyebrow = computed(() => props.team.scope === 'leader' ? `Mi área · ${props.team.department}` : 'Equipo')
const title = computed(() => props.team.scope === 'leader' ? 'Carga de mi equipo' : 'Carga por persona')
</script>
