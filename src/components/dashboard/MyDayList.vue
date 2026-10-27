<template>
  <!-- Mi día: vencidas primero y luego lo de hoy, en una sola lista. -->
  <DashCard eyebrow="Mi día" :title="title" flush>
    <div v-if="items.length === 0" class="empty-state empty-state--sm border-0 rounded-none py-10">
      <p class="empty-state__title">Nada vence hoy</p>
      <p class="empty-state__text">
        <template v-if="lists.upcoming.length">Lo próximo: {{ lists.upcoming[0].title }} ({{ relativeDue(lists.upcoming[0].dueDate) }}).</template>
        <template v-else>Aprovecha para adelantar lo que viene.</template>
      </p>
    </div>
    <ul v-else class="divide-y divide-slate-100 max-h-[520px] overflow-y-auto custom-scrollbar">
      <li v-for="a in items" :key="a._id">
        <button type="button" @click="$emit('open', a)" class="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
          <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="isOverdue(a) ? 'bg-red-500' : 'bg-primary-500'"></span>
          <span class="flex-1 min-w-0">
            <span class="block text-[13.5px] font-medium text-slate-800 truncate group-hover:text-primary-700 transition-colors">{{ a.title }}</span>
            <span class="block text-[12px] text-slate-400 truncate">
              {{ a.client?.name || 'Sin cliente' }}<template v-if="a.project"> · {{ a.project.name }}</template>
            </span>
          </span>
          <span class="shrink-0 text-[12px] font-medium" :class="isOverdue(a) ? 'text-red-600' : 'text-slate-500'">{{ relativeDue(a.dueDate) }}</span>
        </button>
      </li>
    </ul>

    <template #footer>
      <div class="flex items-center justify-between gap-2">
        <span v-if="lists.upcoming.length">{{ lists.upcoming.length }} {{ plural(lists.upcoming.length, 'próxima esta semana', 'próximas esta semana') }}</span>
        <span v-else>Sin más entregas esta semana</span>
        <router-link to="/activities" class="font-medium text-primary-600 hover:text-primary-700">Ver todas</router-link>
      </div>
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashCard from './DashCard.vue'
import type { DashboardActivity, DashboardSummary } from '@/services/dashboardService'
import { relativeDue, statusBadge, plural } from './dashboardFormat'

const props = defineProps<{ lists: DashboardSummary['lists'] }>()
defineEmits<{ (e: 'open', activity: DashboardActivity): void }>()

const items = computed(() => [...props.lists.overdue, ...props.lists.today])
const isOverdue = (a: DashboardActivity) => statusBadge(a).label === 'Vencida'

const title = computed(() => {
  const o = props.lists.overdue.length, t = props.lists.today.length
  if (!o && !t) return 'Lo que me toca'
  const parts: string[] = []
  if (o) parts.push(`${o} ${plural(o, 'vencida', 'vencidas')}`)
  if (t) parts.push(`${t} para hoy`)
  return parts.join(' · ')
})
</script>
