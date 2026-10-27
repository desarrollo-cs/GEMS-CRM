<template>
  <!-- Indicador compacto: etiqueta, número grande e icono teñido. Si trae `to`
       es un enlace; si trae `active` se marca como seleccionado (pestaña). -->
  <component
    :is="to ? 'router-link' : (clickable ? 'button' : 'div')"
    :to="to"
    :type="to ? undefined : (clickable ? 'button' : undefined)"
    class="text-left bg-white border rounded-xl px-3.5 py-3 flex flex-col gap-2 min-w-0 w-full"
    :class="[
      (to || clickable) ? 'card-interactive cursor-pointer' : '',
      active ? tone.activeRing : 'border-slate-200'
    ]"
    :aria-pressed="clickable ? active : undefined"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">{{ label }}</span>
      <span class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" :class="tone.iconBg">
        <i :class="['fas', icon, 'text-[11px]', tone.iconText]"></i>
      </span>
    </div>
    <div class="flex items-baseline gap-2 min-w-0">
      <span class="text-2xl font-bold leading-none tracking-tight motion-pop" :key="String(value)" :class="value && tone.strong ? tone.strong : 'text-slate-900'">{{ value }}</span>
      <span v-if="hint" class="text-[11px] font-semibold truncate" :class="tone.hint">{{ hint }}</span>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type StatTone = 'slate' | 'primary' | 'danger' | 'warning' | 'success' | 'violet'

const props = withDefaults(defineProps<{
  label: string
  value: number | string
  icon: string
  tone?: StatTone
  hint?: string
  to?: string
  clickable?: boolean
  active?: boolean
}>(), {
  tone: 'slate',
  clickable: false,
  active: false
})

const TONES: Record<StatTone, { iconBg: string; iconText: string; hint: string; strong: string; activeRing: string }> = {
  slate:   { iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   hint: 'text-slate-400',   strong: '',               activeRing: 'border-slate-400 ring-4 ring-slate-100' },
  primary: { iconBg: 'bg-primary-50',  iconText: 'text-primary-600', hint: 'text-primary-600', strong: '',               activeRing: 'border-primary-300 ring-4 ring-primary-600/10' },
  danger:  { iconBg: 'bg-red-50',      iconText: 'text-red-500',     hint: 'text-red-500',     strong: 'text-red-600',   activeRing: 'border-red-300 ring-4 ring-red-100' },
  warning: { iconBg: 'bg-amber-50',    iconText: 'text-amber-500',   hint: 'text-amber-600',   strong: 'text-amber-600', activeRing: 'border-amber-300 ring-4 ring-amber-100' },
  success: { iconBg: 'bg-emerald-50',  iconText: 'text-emerald-500', hint: 'text-emerald-600', strong: '',               activeRing: 'border-emerald-300 ring-4 ring-emerald-100' },
  violet:  { iconBg: 'bg-violet-50',   iconText: 'text-violet-500',  hint: 'text-violet-600',  strong: '',               activeRing: 'border-violet-300 ring-4 ring-violet-100' }
}

const tone = computed(() => TONES[props.tone])
</script>
