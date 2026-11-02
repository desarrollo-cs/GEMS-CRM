<template>
  <!-- Cabecera compacta de página (misma que Equipo / Autorizaciones) -->
  <div class="flex-shrink-0 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <div class="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center shrink-0">
        <i :class="icon" class="text-sm"></i>
      </div>
      <div class="min-w-0">
        <h1 class="text-base font-black text-slate-800 tracking-tight leading-tight">{{ title }}</h1>
        <p v-if="subtitle || $slots.subtitle" class="text-xs text-slate-500 truncate">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon: string; title: string; subtitle?: string }>()
</script>
