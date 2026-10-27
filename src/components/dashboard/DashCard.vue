<template>
  <!-- Tarjeta plana del dashboard: título pequeño y cuerpo libre.
       `flush` quita el padding del cuerpo (listas que llegan al borde). -->
  <section class="bg-white border border-slate-200 rounded-2xl flex flex-col min-w-0 overflow-hidden" :class="wrapperClass">
    <header v-if="title || $slots.action" class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 pt-4 pb-3 shrink-0">
      <div class="min-w-0">
        <p v-if="eyebrow" class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 leading-none mb-1">{{ eyebrow }}</p>
        <h3 class="text-[15px] font-semibold text-slate-900 leading-tight truncate">{{ title }}</h3>
      </div>
      <div class="flex items-center gap-2 shrink-0 ml-auto max-w-full">
        <slot name="action"></slot>
      </div>
    </header>
    <div class="flex-1 min-h-0" :class="flush ? '' : 'px-5 pb-4'">
      <slot></slot>
    </div>
    <footer v-if="$slots.footer" class="px-5 py-3 border-t border-slate-100 text-[12px] text-slate-500">
      <slot name="footer"></slot>
    </footer>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  eyebrow?: string
  flush?: boolean
  wrapperClass?: string
}>(), {
  flush: false,
  wrapperClass: ''
})
</script>
