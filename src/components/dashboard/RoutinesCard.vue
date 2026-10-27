<template>
  <!-- Rutinas diarias (actividades recurrentes): cuántas ya marqué hoy. -->
  <DashCard eyebrow="Rutinas" title="Mis diarias de hoy" icon="fa-sun" icon-class="bg-amber-50 text-amber-500">
    <template #action>
      <span class="badge" :class="routines.doneToday === routines.total ? 'badge-success' : 'badge-warning'">
        {{ routines.doneToday }}/{{ routines.total }}
      </span>
    </template>
    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
      <div class="h-full rounded-full transition-all duration-700 ease-out-expo" :class="routines.doneToday === routines.total ? 'bg-emerald-500' : 'bg-amber-400'" :style="{ width: pct + '%' }"></div>
    </div>
    <ul class="space-y-1.5">
      <li v-for="r in routines.items" :key="r._id" class="flex items-center gap-2.5 text-[12.5px]">
        <span class="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors"
          :class="r.doneToday ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'">
          <i class="fas fa-check text-[9px]"></i>
        </span>
        <span class="truncate" :class="r.doneToday ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'">{{ r.title }}</span>
      </li>
    </ul>
    <template #footer>
      <router-link to="/activities" class="font-semibold text-primary-600 hover:text-primary-700">Marcar en Actividades →</router-link>
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import type { DashboardSummary } from '@/services/dashboardService'

const props = defineProps<{ routines: DashboardSummary['routines'] }>()
const pct = computed(() => props.routines.total ? Math.round((props.routines.doneToday / props.routines.total) * 100) : 0)
</script>
