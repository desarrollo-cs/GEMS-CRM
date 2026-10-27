<template>
  <!-- Accesos rápidos: una fila de tarjetas chicas con icono teñido. -->
  <div class="grid gap-2.5 motion-stagger" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
    <component
      :is="qa.to ? 'router-link' : 'button'"
      v-for="qa in actions"
      :key="qa.label"
      :to="qa.to"
      :type="qa.to ? undefined : 'button'"
      @click="qa.onClick?.()"
      class="card-interactive text-left flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 group"
    >
      <span class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors" :class="qa.iconBg">
        <i :class="['fas', qa.icon, qa.iconColor, 'text-[14px]']"></i>
      </span>
      <span class="min-w-0">
        <span class="block text-[12.5px] font-semibold text-slate-800 truncate">{{ qa.label }}</span>
        <span v-if="qa.hint" class="block text-[10.5px] text-slate-400 truncate">{{ qa.hint }}</span>
      </span>
      <span v-if="qa.badge" class="ml-auto badge badge-warning">{{ qa.badge }}</span>
    </component>
  </div>
</template>

<script setup lang="ts">
export interface QuickAction {
  label: string
  icon: string
  iconBg: string
  iconColor: string
  to?: string
  onClick?: () => void
  hint?: string
  badge?: number | string
}

defineProps<{ actions: QuickAction[] }>()
</script>
