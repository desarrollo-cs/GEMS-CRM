<template>
  <!-- Mis actividades con fecha: vencidas / hoy / próximas / sin fecha. -->
  <DashCard eyebrow="Mi agenda" title="Lo que me toca" icon="fa-calendar-check" flush>
    <template #action>
      <div class="seg">
        <button v-for="t in tabs" :key="t.key" type="button" :aria-pressed="tab === t.key" @click="tab = t.key" class="flex items-center gap-1.5">
          {{ t.label }}
          <span v-if="t.count" class="text-[10px] font-bold px-1.5 py-px rounded-full" :class="tab === t.key ? t.activeCount : 'bg-slate-100 text-slate-500'">{{ t.count }}</span>
        </button>
      </div>
    </template>

    <Transition name="tab" mode="out-in">
      <div v-if="items.length === 0" :key="'empty-' + tab" class="empty-state empty-state--sm border-0 rounded-none py-10">
        <div class="empty-state__icon" :class="empty.iconClass"><i :class="['fas', empty.icon]"></i></div>
        <p class="empty-state__title">{{ empty.title }}</p>
        <p class="empty-state__text">{{ empty.text }}</p>
      </div>
      <ul v-else :key="tab" class="divide-y divide-slate-50 max-h-[440px] overflow-y-auto custom-scrollbar">
        <li v-for="a in items" :key="a._id">
          <button type="button" @click="$emit('open', a)" class="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/70 transition-colors group">
            <span class="w-2 h-2 rounded-full shrink-0" :class="PRIORITY_DOT[a.priority || 'medium']" :title="'Prioridad ' + (PRIORITY_LABEL[a.priority || 'medium'] || '')"></span>
            <span class="flex-1 min-w-0">
              <span class="block text-[12.5px] font-semibold text-slate-800 truncate group-hover:text-primary-700 transition-colors">{{ a.title }}</span>
              <span class="block text-[11px] text-slate-400 truncate">
                {{ a.client?.name || 'Sin cliente' }}<template v-if="a.project"> · {{ a.project.name }}</template>
                <template v-if="a.tags.length"> · <span class="text-slate-500">#{{ a.tags[0] }}</span></template>
              </span>
            </span>
            <span class="badge shrink-0" :class="statusBadge(a).cls">{{ statusBadge(a).label }}</span>
            <span class="shrink-0 hidden sm:inline-flex items-center gap-1 text-[11px] font-medium w-[118px] justify-end" :class="dueTone(a)">
              <i class="fas fa-clock text-[10px]"></i>{{ relativeDue(a.dueDate) }}
            </span>
          </button>
        </li>
      </ul>
    </Transition>

    <template #footer>
      <div class="flex items-center justify-between gap-2">
        <span>{{ footerText }}</span>
        <router-link to="/activities" class="font-semibold text-primary-600 hover:text-primary-700">Ver actividades →</router-link>
      </div>
    </template>
  </DashCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DashCard from './DashCard.vue'
import type { DashboardActivity, DashboardSummary } from '@/services/dashboardService'
import { PRIORITY_DOT, PRIORITY_LABEL, relativeDue, statusBadge, plural } from './dashboardFormat'

type TabKey = 'overdue' | 'today' | 'upcoming' | 'noDate'

const props = defineProps<{ lists: DashboardSummary['lists'] }>()
defineEmits<{ (e: 'open', activity: DashboardActivity): void }>()

const tab = ref<TabKey>('today')

const tabs = computed(() => [
  { key: 'overdue' as TabKey, label: 'Vencidas', count: props.lists.overdue.length, activeCount: 'bg-red-100 text-red-700' },
  { key: 'today' as TabKey, label: 'Hoy', count: props.lists.today.length, activeCount: 'bg-amber-100 text-amber-700' },
  { key: 'upcoming' as TabKey, label: 'Próximas', count: props.lists.upcoming.length, activeCount: 'bg-primary-100 text-primary-700' },
  ...(props.lists.noDate.length ? [{ key: 'noDate' as TabKey, label: 'Sin fecha', count: props.lists.noDate.length, activeCount: 'bg-slate-200 text-slate-700' }] : [])
])

// Arranca en la pestaña con más urgencia que tenga algo
watch(() => props.lists, (l) => {
  if (l.overdue.length) tab.value = 'overdue'
  else if (l.today.length) tab.value = 'today'
  else if (l.upcoming.length) tab.value = 'upcoming'
  else tab.value = 'today'
}, { immediate: true })

const items = computed(() => props.lists[tab.value] || [])

const EMPTY: Record<TabKey, { icon: string; iconClass: string; title: string; text: string }> = {
  overdue: { icon: 'fa-check-double', iconClass: 'bg-emerald-50 text-emerald-600', title: 'Nada vencido', text: 'Vas al día con tus fechas de entrega.' },
  today: { icon: 'fa-mug-hot', iconClass: '', title: 'Nada vence hoy', text: 'Aprovecha para adelantar lo que viene.' },
  upcoming: { icon: 'fa-calendar-plus', iconClass: '', title: 'Sin próximas entregas', text: 'Cuando te asignen actividades con fecha aparecerán aquí.' },
  noDate: { icon: 'fa-calendar', iconClass: '', title: 'Todo tiene fecha', text: 'No tienes actividades sin fecha de entrega.' }
}
const empty = computed(() => EMPTY[tab.value])

const dueTone = (a: DashboardActivity) => {
  const b = statusBadge(a).label
  if (b === 'Vencida') return 'text-red-500'
  if (b === 'Hoy' || b === 'En curso') return 'text-amber-600'
  return 'text-slate-400'
}

const footerText = computed(() => {
  const total = props.lists.overdue.length + props.lists.today.length + props.lists.upcoming.length + props.lists.noDate.length
  if (!total) return 'Sin actividades activas'
  return `${total} ${plural(total, 'actividad activa', 'actividades activas')} · clic para abrir`
})
</script>
