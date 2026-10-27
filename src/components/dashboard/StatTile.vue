<template>
  <!-- Número clave: etiqueta, cifra y enlace a la vista filtrada. -->
  <router-link
    :to="to"
    class="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex flex-col gap-1.5 min-w-0 w-full card-interactive"
  >
    <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">{{ label }}</span>
    <span class="flex items-baseline gap-2 min-w-0">
      <span class="text-[28px] font-semibold leading-none tracking-tight motion-pop" :key="String(value)" :class="value && tone === 'danger' ? 'text-red-600' : 'text-slate-900'">{{ value }}</span>
      <span v-if="hint" class="text-[12px] text-slate-400 truncate">{{ hint }}</span>
    </span>
  </router-link>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: number
  to: string
  hint?: string
  tone?: 'slate' | 'danger'
}>(), { tone: 'slate', hint: '' })
</script>
