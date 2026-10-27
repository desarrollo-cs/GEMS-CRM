<template>
  <!-- Sugerencias de IA: franja discreta con 1 o 2 líneas accionables para esta persona. -->
  <div class="rounded-2xl bg-slate-50 px-5 py-4">
    <div class="flex items-center justify-between gap-3 mb-2">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 leading-none">Sugerencias para {{ firstName }}</p>
      <button type="button" @click="generate(true)" :disabled="loading" class="text-[11px] font-medium text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-40">
        {{ loading ? 'Generando…' : 'Actualizar' }}
      </button>
    </div>

    <Transition name="swap" mode="out-in">
      <div v-if="loading" key="loading" class="space-y-2" aria-busy="true">
        <Skeleton height="11" width="85%" />
        <Skeleton height="11" width="65%" />
      </div>

      <ul v-else-if="insights.length" key="list" class="space-y-1.5">
        <li v-for="(it, i) in insights" :key="i" class="flex items-start gap-2.5">
          <span class="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" :class="it.tone"></span>
          <p class="text-[13px] text-slate-700 leading-snug">{{ it.text }}</p>
        </li>
      </ul>

      <p v-else-if="error" key="error" class="text-[12px] text-slate-400">
        {{ error }}
        <button type="button" @click="generate(true)" class="font-medium text-primary-600 hover:text-primary-700 ml-1">Reintentar</button>
      </p>

      <p v-else key="empty" class="text-[12px] text-slate-400">Nada que sugerir por ahora: vas al día.</p>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { API_CONFIG } from '@/config/api'
import Skeleton from './ui/Skeleton.vue'
import type { DashboardSummary } from '@/services/dashboardService'
import { relativeDue, roleLabel } from './dashboard/dashboardFormat'

const props = defineProps<{ summary: DashboardSummary }>()

interface Insight { text: string; tone: string }

const authStore = useAuthStore()
const firstName = computed(() => authStore.user?.name?.split(' ')[0] || 'ti')

const loading = ref(false)
const error = ref('')
const insights = ref<Insight[]>([])

// La caché cambia cuando cambian los números que importan (y cada día)
const cacheKey = computed(() => {
  const s = props.summary
  return `crm_ai_insights_v5_${s.viewer.id}_${s.today}_${s.mine.overdue}_${s.mine.today}_${s.approvals.toReview}_${s.team?.totals.overdue ?? 0}`
})
const CACHE_MS = 30 * 60 * 1000

const readCache = (): string[] | null => {
  try {
    const raw = localStorage.getItem(cacheKey.value)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (Date.now() - p.timestamp > CACHE_MS) { localStorage.removeItem(cacheKey.value); return null }
    return p.lines
  } catch { return null }
}
const writeCache = (lines: string[]) => { try { localStorage.setItem(cacheKey.value, JSON.stringify({ lines, timestamp: Date.now() })) } catch {} }

// Punto rojo si la frase habla de vencidas; el resto, color de acento
const decorate = (text: string): Insight => ({ text, tone: /vencid|atras|retras/i.test(text) ? 'bg-red-500' : 'bg-primary-500' })

// Sin IA (o mientras no responde): sugerencias calculadas con los mismos datos
const fallback = (): string[] => {
  const s = props.summary
  const out: string[] = []
  if (s.mine.overdue > 0) {
    const first = s.lists.overdue[0]
    out.push(`Tienes ${s.mine.overdue} vencida${s.mine.overdue === 1 ? '' : 's'}; empieza por "${first?.title}" (${relativeDue(first?.dueDate)}).`)
  }
  if (s.approvals.toReview > 0) out.push(`${s.approvals.toReview} ${s.approvals.toReview === 1 ? 'autorización de tu equipo espera' : 'autorizaciones de tu equipo esperan'} tu revisión: resuélvelas para no frenar entregas.`)
  if (s.mine.today > 0 && out.length < 2) out.push(s.mine.today === 1 ? 'Hoy vence 1; ciérrala antes de abrir frentes nuevos.' : `Hoy vencen ${s.mine.today}; cierra primero la de mayor prioridad antes de abrir frentes nuevos.`)
  if (s.team && out.length < 2) {
    const loaded = [...s.team.members].sort((a, b) => b.stats.overdue - a.stats.overdue)[0]
    if (loaded && loaded.stats.overdue > 0 && loaded._id !== s.viewer.id) out.push(`${loaded.name.split(' ')[0]} acumula ${loaded.stats.overdue} vencida${loaded.stats.overdue === 1 ? '' : 's'}: vale una conversación corta hoy.`)
  }
  return out.slice(0, 2)
}

const buildPrompt = (): string => {
  const s = props.summary
  const fmt = (a: DashboardSummary['lists']['overdue'][number]) => `"${a.title}"${a.client ? ` (${a.client.name})` : ''} [${relativeDue(a.dueDate)}]`
  const lines = [
    `Eres un asistente de productividad de un CRM. Responde SOLO con 2 líneas, cada una empieza con "Insight1:" o "Insight2:". Cada línea máximo 140 caracteres, concreta, en español, con una acción clara para HOY. Nada de saludos ni explicaciones.`,
    `PERSONA: ${firstName.value} | Rol: ${roleLabel(s.viewer.role)} | Alcance: ${s.viewer.scope}${s.viewer.department ? ` | Área: ${s.viewer.department}` : ''}`,
    `VENCIDAS (${s.mine.overdue}): ${s.lists.overdue.slice(0, 4).map(fmt).join(' | ') || 'ninguna'}`,
    `HOY (${s.mine.today}): ${s.lists.today.slice(0, 4).map(fmt).join(' | ') || 'ninguna'}`,
    `EN CURSO: ${s.mine.inProgress} | ALTA PRIORIDAD: ${s.mine.highPriority} | CERRADAS 7 DÍAS: ${s.mine.completedWeek}`,
    `AUTORIZACIONES: por revisar ${s.approvals.toReview}, mías en espera ${s.approvals.mine}`
  ]
  if (s.team) {
    const top = [...s.team.members].sort((a, b) => b.stats.overdue - a.stats.overdue).slice(0, 3)
    lines.push(`EQUIPO (${s.team.members.length} personas, vencidas ${s.team.totals.overdue}): ${top.map(m => `${m.name}: ${m.stats.active} activas / ${m.stats.overdue} vencidas`).join(' | ')}`)
  }
  if (s.org) lines.push(`ORGANIZACIÓN: clientes activos ${s.org.clients.active}, tickets abiertos ${s.org.tickets.open}, autorizaciones pendientes ${s.org.approvals.pending}`)
  lines.push('Prioriza: vencidas > autorizaciones pendientes > carga de hoy > equipo. Si todo está al día, una sola línea de planificación.')
  return lines.join('\n')
}

const generate = async (force = false) => {
  error.value = ''
  if (!force) {
    const cached = readCache()
    if (cached) { insights.value = cached.map(decorate); return }
  }
  loading.value = true
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/ai/gemini-generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: buildPrompt() })
    })
    if (!res.ok) throw new Error(`Error ${res.status}`)
    const data = await res.json()
    const lines = String(data.text || '').split('\n').map(l => l.trim())
      .filter(l => /^insight\s*\d\s*:/i.test(l))
      .map(l => l.substring(l.indexOf(':') + 1).trim().replace(/^["“]|["”]$/g, ''))
      .filter(l => l.length > 8)
      .slice(0, 2)
    const final = lines.length ? lines : fallback()
    insights.value = final.map(decorate)
    writeCache(final)
  } catch (e) {
    // Sin IA: mostramos lo calculado localmente; si no hay nada, aviso discreto
    const local = fallback()
    insights.value = local.map(decorate)
    if (!local.length) error.value = 'La IA no está disponible ahora.'
    console.warn('AI insights:', e)
  } finally {
    loading.value = false
  }
}

watch(cacheKey, () => generate(false), { immediate: true })
</script>
