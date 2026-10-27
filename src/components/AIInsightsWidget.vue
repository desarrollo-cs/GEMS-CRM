<template>
  <!-- Insights de IA, versión compacta: 1 o 2 sugerencias accionables para esta
       persona, calculadas a partir del resumen del dashboard (sin cargar nada más). -->
  <DashCard eyebrow="IA" :title="`Sugerencias para ${firstName}`" icon="fa-wand-magic-sparkles" icon-class="bg-primary-50 text-primary-600">
    <template #action>
      <button
        type="button"
        title="Volver a generar"
        @click="generate(true)"
        :disabled="loading"
        class="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-200 transition-colors disabled:opacity-40"
      >
        <i class="fas fa-rotate text-[10px]" :class="{ 'animate-spin': loading }"></i>
      </button>
    </template>

    <Transition name="swap" mode="out-in">
      <!-- Cargando -->
      <div v-if="loading" key="loading" class="space-y-2.5" aria-busy="true">
        <div v-for="n in 2" :key="n" class="flex items-start gap-3">
          <Skeleton shape="circle" size="22" />
          <div class="flex-1 space-y-1.5 pt-1">
            <Skeleton height="10" :width="n === 1 ? '70%' : '55%'" />
            <Skeleton height="10" width="90%" />
          </div>
        </div>
      </div>

      <!-- Insights -->
      <ul v-else-if="insights.length" key="list" class="space-y-2.5">
        <li v-for="(it, i) in insights" :key="i" class="flex items-start gap-3">
          <span class="w-[22px] h-[22px] rounded-md flex items-center justify-center shrink-0 text-[10px] mt-px" :class="it.tone.bg">
            <i :class="['fas', it.icon, it.tone.text]"></i>
          </span>
          <p class="text-[12.5px] text-slate-700 leading-snug">{{ it.text }}</p>
        </li>
      </ul>

      <!-- Error discreto -->
      <p v-else-if="error" key="error" class="text-[12px] text-slate-400 flex items-center gap-2">
        <i class="fas fa-circle-info text-[11px]"></i>
        {{ error }}
        <button type="button" @click="generate(true)" class="font-semibold text-primary-600 hover:text-primary-700">Reintentar</button>
      </p>

      <!-- Vacío -->
      <p v-else key="empty" class="text-[12px] text-slate-400 flex items-center gap-2">
        <i class="fas fa-check text-[11px] text-emerald-500"></i>
        Nada que sugerir por ahora: vas al día.
      </p>
    </Transition>
  </DashCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { API_CONFIG } from '@/config/api'
import DashCard from './dashboard/DashCard.vue'
import Skeleton from './ui/Skeleton.vue'
import type { DashboardSummary } from '@/services/dashboardService'
import { relativeDue, roleLabel } from './dashboard/dashboardFormat'

const props = defineProps<{ summary: DashboardSummary }>()

interface Insight { text: string; icon: string; tone: { bg: string; text: string } }

const TONES = {
  danger: { bg: 'bg-red-50', text: 'text-red-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-500' },
  primary: { bg: 'bg-primary-50', text: 'text-primary-600' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-500' }
}

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

// Icono y tono según de qué habla la frase
const decorate = (text: string): Insight => {
  const t = text.toLowerCase()
  if (/vencid|atras|retras/.test(t)) return { text, icon: 'fa-triangle-exclamation', tone: TONES.danger }
  if (/autoriz|aprob|plazo/.test(t)) return { text, icon: 'fa-user-shield', tone: TONES.warning }
  if (/hoy|urgente|en curso/.test(t)) return { text, icon: 'fa-sun', tone: TONES.warning }
  if (/equipo|carga|persona|área|area/.test(t)) return { text, icon: 'fa-users', tone: TONES.primary }
  if (/cliente|proyecto/.test(t)) return { text, icon: 'fa-briefcase', tone: TONES.primary }
  return { text, icon: 'fa-lightbulb', tone: TONES.success }
}

// Sin IA (o mientras no responde): sugerencias calculadas con los mismos datos
const fallback = (): string[] => {
  const s = props.summary
  const out: string[] = []
  if (s.mine.overdue > 0) {
    const first = s.lists.overdue[0]
    out.push(`Tienes ${s.mine.overdue} vencida${s.mine.overdue === 1 ? '' : 's'}; empieza por "${first?.title}" (${relativeDue(first?.dueDate)}).`)
  }
  if (s.approvals.toReview > 0) out.push(`${s.approvals.toReview} autorización${s.approvals.toReview === 1 ? '' : 'es'} de tu equipo espera${s.approvals.toReview === 1 ? '' : 'n'} tu revisión: resuélvelas para no frenar entregas.`)
  if (s.mine.today > 0 && out.length < 2) out.push(`Hoy vencen ${s.mine.today}; cierra primero la de mayor prioridad antes de abrir frentes nuevos.`)
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
