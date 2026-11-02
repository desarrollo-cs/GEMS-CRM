<template>
  <div class="bg-white border border-slate-200 rounded-2xl">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
        <i class="fas fa-link text-slate-300 text-xs"></i>Casos y wiki vinculados
      </h3>
      <span v-if="!loading" class="badge badge-slate">{{ rows.length }}</span>
    </div>

    <div v-if="loading" class="p-3"><Skeleton preset="list" :rows="3" /></div>

    <div v-else-if="rows.length === 0" class="empty-state empty-state--sm">
      <div class="empty-state__icon"><i class="fas fa-link"></i></div>
      <p class="empty-state__title">Nada vinculado todavía</p>
      <p class="empty-state__text">Desde Casos puedes vincular un caso o artículo a este proyecto.</p>
    </div>

    <div v-else class="divide-y divide-slate-100">
      <router-link
        v-for="row in rows"
        :key="row.kind + row.id"
        :to="row.to"
        class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group"
      >
        <span
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
          :class="row.kind === 'case' ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-violet-50 border-violet-100 text-violet-600'"
        >
          <i :class="row.kind === 'case' ? 'fas fa-folder-open' : 'fas fa-book'" class="text-xs"></i>
        </span>
        <span class="flex-1 min-w-0 text-sm font-bold text-slate-800 truncate group-hover:text-primary-700">{{ row.title }}</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0" :class="row.pillClass">{{ row.pill }}</span>
        <i class="fas fa-chevron-right text-[9px] text-slate-300 group-hover:text-primary-400 shrink-0"></i>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { casesService, type Case } from '@/services/casesService'
import { wikiService, type WikiArticle } from '@/services/wikiService'
import Skeleton from '@/components/ui/Skeleton.vue'

const props = defineProps<{ clientId: string; projectId?: string }>()

const loading = ref(true)
const cases = ref<Case[]>([])
const wikis = ref<WikiArticle[]>([])

const ESTADO_PILL: Record<string, string> = {
  abierto: 'bg-amber-50 text-amber-700 border-amber-100',
  en_progreso: 'bg-primary-50 text-primary-700 border-primary-100',
  resuelto: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cerrado: 'bg-slate-100 text-slate-600 border-slate-200'
}

const rows = computed(() => [
  ...cases.value.map(c => ({
    kind: 'case', id: c._id!, title: c.titulo, to: `/cases?case=${c._id}`,
    pill: (c.estado || '').replace('_', ' '), pillClass: ESTADO_PILL[c.estado] || ESTADO_PILL.cerrado
  })),
  ...wikis.value.map(w => ({
    kind: 'wiki', id: w._id!, title: w.titulo, to: `/cases?wiki=${w._id}`,
    pill: w.categoria || 'otros', pillClass: 'bg-violet-50 text-violet-700 border-violet-100'
  }))
])

const load = async () => {
  loading.value = true
  const filters = { cliente_id: props.clientId, proyecto_id: props.projectId || undefined }
  try {
    // shortcut: el listado de casos pagina (limit 100 aquí); subirlo si un cliente acumula más casos vinculados
    const [c, w] = await Promise.all([
      casesService.getAll({ ...filters, limit: 100 }),
      wikiService.getAll(filters)
    ])
    cases.value = c
    wikis.value = w
  } catch (err) {
    console.error('Error cargando vinculados:', err)
    cases.value = []
    wikis.value = []
  } finally {
    loading.value = false
  }
}

watch(() => [props.clientId, props.projectId], load, { immediate: true })
</script>
