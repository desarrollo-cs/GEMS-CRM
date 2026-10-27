<template>
  <!-- Tarjeta plana del dashboard: encabezado con eyebrow + título y cuerpo libre.
       `flush` quita el padding del cuerpo (listas que llegan al borde). -->
  <section class="bg-white border border-slate-200 rounded-2xl shadow-card flex flex-col min-w-0 overflow-hidden" :class="wrapperClass">
    <header v-if="title || $slots.action" class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 border-b border-slate-100 shrink-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <div v-if="icon" class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :class="iconClass">
          <i :class="['fas', icon, 'text-[12px]']"></i>
        </div>
        <div class="min-w-0">
          <p v-if="eyebrow" class="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">{{ eyebrow }}</p>
          <h3 class="text-[13px] font-bold text-slate-900 leading-tight truncate">{{ title }}</h3>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 ml-auto max-w-full">
        <slot name="action"></slot>
      </div>
    </header>
    <div class="flex-1 min-h-0" :class="flush ? '' : 'px-4 py-3.5'">
      <slot></slot>
    </div>
    <footer v-if="$slots.footer" class="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 text-[12px] text-slate-500">
      <slot name="footer"></slot>
    </footer>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  eyebrow?: string
  icon?: string
  iconClass?: string
  flush?: boolean
  wrapperClass?: string
}>(), {
  iconClass: 'bg-primary-50 text-primary-600',
  flush: false,
  wrapperClass: ''
})
</script>
