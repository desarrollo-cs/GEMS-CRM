<template>
  <!-- Clientes con más actividad abierta (del área o de toda la organización). -->
  <DashCard eyebrow="Clientes" title="Dónde está el trabajo" icon="fa-briefcase" icon-class="bg-primary-50 text-primary-600" flush>
    <div v-if="clients.length === 0" class="empty-state empty-state--sm border-0 rounded-none py-8">
      <div class="empty-state__icon"><i class="fas fa-briefcase"></i></div>
      <p class="empty-state__title">Sin actividad por cliente</p>
      <p class="empty-state__text">Asigna actividades a un cliente para verlo aquí.</p>
    </div>
    <ul v-else class="divide-y divide-slate-50">
      <li v-for="c in clients" :key="c._id">
        <component :is="canOpen ? 'router-link' : 'div'" :to="canOpen ? `/clients/${c._id}` : undefined"
          class="flex items-center gap-3 px-4 py-2.5 transition-colors" :class="canOpen ? 'hover:bg-slate-50/70' : ''">
          <span class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0">{{ initials(c.name) }}</span>
          <span class="flex-1 min-w-0">
            <span class="block text-[12.5px] font-semibold text-slate-800 truncate">{{ c.name }}</span>
            <span class="block text-[11px] text-slate-400 truncate">{{ c.company || '—' }}</span>
          </span>
          <span class="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
            <span class="block h-full bg-primary-400" :style="{ width: (c.active / max * 100) + '%' }"></span>
          </span>
          <span v-if="c.overdue" class="badge badge-danger" title="Vencidas">{{ c.overdue }}</span>
          <span class="badge badge-primary" title="Activas">{{ c.active }}</span>
        </component>
      </li>
    </ul>
    <template v-if="canOpen" #footer>
      <router-link to="/clients" class="font-semibold text-primary-600 hover:text-primary-700">Ver clientes →</router-link>
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import type { DashboardClientLoad } from '@/services/dashboardService'

const props = withDefaults(defineProps<{ clients: DashboardClientLoad[]; canOpen?: boolean }>(), { canOpen: true })
const max = computed(() => Math.max(1, ...props.clients.map(c => c.active)))
const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]!.toUpperCase()).join('')
</script>
