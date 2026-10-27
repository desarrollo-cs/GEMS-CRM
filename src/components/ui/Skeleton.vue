<template>
  <!--
    Esqueleto de carga reutilizable.

    Uso básico (primitivas):
      <Skeleton />                       línea de texto
      <Skeleton shape="circle" size="40" />
      <Skeleton shape="block" height="120" />

    Presets de pantalla (forma aproximada del contenido real):
      <Skeleton preset="table" :rows="6" />
      <Skeleton preset="cards" :rows="6" />
      <Skeleton preset="stats" :rows="4" />
      <Skeleton preset="detail" />
      <Skeleton preset="form" :rows="5" />
      <Skeleton preset="chat" :rows="5" />
      <Skeleton preset="board" />
      <Skeleton preset="list" :rows="5" />

    El brillo lo da la clase global `.skeleton` (ver styles/motion.css).
  -->
  <div v-if="preset" aria-busy="true" aria-label="Cargando…" role="status" class="motion-stagger" :class="wrapperClass">

    <!-- Tabla: cabecera + filas con celdas de ancho variable -->
    <template v-if="preset === 'table'">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <div v-for="c in cols" :key="c" class="skeleton h-2.5 rounded-full" :style="{ width: colWidth(c) }"></div>
        </div>
        <div v-for="n in rows" :key="n" class="flex items-center gap-4 px-5 py-4 border-t border-slate-50 first:border-t-0">
          <div class="skeleton h-5 w-16 rounded-md shrink-0"></div>
          <div class="flex-1 space-y-2 min-w-0">
            <div class="skeleton h-3 rounded-full" :style="{ width: vary(n, 35, 40) }"></div>
            <div class="skeleton h-2.5 rounded-full" :style="{ width: vary(n * 3, 15, 25) }"></div>
          </div>
          <div class="skeleton hidden md:block h-6 w-6 rounded-full"></div>
          <div class="skeleton hidden md:block h-5 w-20 rounded-md"></div>
          <div class="skeleton hidden lg:block h-5 w-14 rounded-md"></div>
        </div>
      </div>
    </template>

    <!-- Tarjetas en grilla -->
    <template v-else-if="preset === 'cards'">
      <div class="grid gap-3 sm:gap-4" :class="gridCols">
        <div v-for="n in rows" :key="n" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="skeleton w-10 h-10 rounded-xl shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="skeleton h-3 rounded-full" :style="{ width: vary(n, 45, 35) }"></div>
              <div class="skeleton h-2.5 w-1/3 rounded-full"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="skeleton h-2.5 rounded-full w-full"></div>
            <div class="skeleton h-2.5 rounded-full" :style="{ width: vary(n * 7, 50, 40) }"></div>
          </div>
          <div class="flex items-center gap-2 pt-1">
            <div class="skeleton h-5 w-14 rounded-md"></div>
            <div class="skeleton h-5 w-10 rounded-md"></div>
            <div class="skeleton h-6 w-6 rounded-full ml-auto"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Tarjetas de estadísticas (fila de KPIs) -->
    <template v-else-if="preset === 'stats'">
      <div class="grid gap-2.5" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
        <div v-for="n in rows" :key="n" class="bg-white border border-slate-200 rounded-xl px-4 py-3 space-y-2.5">
          <div class="skeleton h-2 w-16 rounded-full"></div>
          <div class="flex items-end justify-between gap-2">
            <div class="skeleton h-6 w-12 rounded-md"></div>
            <div class="skeleton w-8 h-8 rounded-lg"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Página de detalle: portada + título + resumen + panel -->
    <template v-else-if="preset === 'detail'">
      <div class="skeleton h-36 md:h-44 w-full rounded-2xl"></div>
      <div class="space-y-2.5 mt-6">
        <div class="skeleton h-7 w-2/5 rounded-lg"></div>
        <div class="skeleton h-3 w-3/5 rounded-full"></div>
      </div>
      <div class="grid grid-cols-3 gap-3 mt-6">
        <div v-for="n in 3" :key="n" class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div class="skeleton w-2.5 h-2.5 rounded-full shrink-0"></div>
          <div class="space-y-2 flex-1">
            <div class="skeleton h-6 w-10 rounded-md"></div>
            <div class="skeleton h-2 w-20 rounded-full"></div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div class="flex gap-2 p-3 border-b border-slate-100 bg-slate-50">
          <div v-for="n in 4" :key="n" class="skeleton h-9 rounded-lg" :style="{ width: 80 + n * 12 + 'px' }"></div>
        </div>
        <div class="p-6 space-y-3">
          <div class="skeleton h-3 w-1/3 rounded-full"></div>
          <div class="skeleton h-3 w-full rounded-full"></div>
          <div class="skeleton h-3 w-5/6 rounded-full"></div>
          <div class="skeleton h-3 w-2/3 rounded-full"></div>
        </div>
      </div>
    </template>

    <!-- Formulario: etiqueta + campo -->
    <template v-else-if="preset === 'form'">
      <div class="space-y-5">
        <div v-for="n in rows" :key="n" class="space-y-2">
          <div class="skeleton h-2.5 rounded-full" :style="{ width: 60 + ((n * 19) % 50) + 'px' }"></div>
          <div class="skeleton h-10 w-full rounded-xl"></div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <div class="skeleton h-10 w-24 rounded-xl"></div>
          <div class="skeleton h-10 w-32 rounded-xl"></div>
        </div>
      </div>
    </template>

    <!-- Chat: burbujas alternadas -->
    <template v-else-if="preset === 'chat'">
      <div class="space-y-4">
        <div v-for="n in rows" :key="n" class="flex" :class="n % 3 === 0 ? 'justify-end' : 'justify-start'">
          <div class="skeleton rounded-2xl" :style="{ width: vary(n * 5, 35, 35), height: 36 + ((n * 13) % 30) + 'px' }"></div>
        </div>
      </div>
    </template>

    <!-- Lista simple: avatar + dos líneas -->
    <template v-else-if="preset === 'list'">
      <div class="space-y-2">
        <div v-for="n in rows" :key="n" class="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div class="skeleton w-9 h-9 rounded-full shrink-0"></div>
          <div class="flex-1 space-y-2 min-w-0">
            <div class="skeleton h-3 rounded-full" :style="{ width: vary(n, 30, 40) }"></div>
            <div class="skeleton h-2.5 rounded-full" :style="{ width: vary(n * 3, 15, 30) }"></div>
          </div>
          <div class="skeleton h-5 w-16 rounded-md hidden sm:block"></div>
          <div class="skeleton h-7 w-7 rounded-lg"></div>
        </div>
      </div>
    </template>

    <!-- Tablero Kanban: columnas con tarjetas -->
    <template v-else-if="preset === 'board'">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div v-for="(cards, col) in [3, 2, 2, 1]" :key="col" class="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-3 space-y-3">
          <div class="flex items-center gap-3 mb-1">
            <div class="skeleton w-2.5 h-2.5 rounded-full"></div>
            <div class="skeleton h-3 w-24 rounded-full"></div>
            <div class="skeleton h-5 w-7 rounded-md ml-auto"></div>
          </div>
          <div v-for="n in cards" :key="n" class="bg-white rounded-xl p-3 border border-slate-100 space-y-2.5 shadow-sm">
            <div class="skeleton h-2.5 w-14 rounded-full"></div>
            <div class="skeleton h-3.5 rounded-full" :style="{ width: vary(n + col, 55, 35) }"></div>
            <div class="flex items-center gap-2 pt-1">
              <div class="skeleton h-5 w-12 rounded-md"></div>
              <div class="skeleton h-5 w-9 rounded-md"></div>
              <div class="skeleton h-6 w-6 rounded-full ml-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Primitiva suelta -->
  <span
    v-else
    class="skeleton block"
    :class="[
      shape === 'circle' ? 'rounded-full' : shape === 'block' ? 'rounded-xl' : 'rounded-full',
      wrapperClass
    ]"
    :style="primitiveStyle"
    aria-hidden="true"
  ></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  preset?: 'table' | 'cards' | 'stats' | 'detail' | 'form' | 'chat' | 'list' | 'board'
  shape?: 'line' | 'circle' | 'block'
  /** Ancho (px o cualquier unidad css). Para `line`, default 100%. */
  width?: string | number
  /** Alto (px o cualquier unidad css). */
  height?: string | number
  /** Atajo para círculos: ancho = alto = size */
  size?: string | number
  rows?: number
  cols?: number
  wrapperClass?: string
}>(), {
  shape: 'line',
  rows: 5,
  cols: 5,
  wrapperClass: ''
})

const toUnit = (v: string | number | undefined) => (v === undefined ? undefined : typeof v === 'number' || /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v)

const primitiveStyle = computed(() => {
  if (props.shape === 'circle') {
    const s = toUnit(props.size ?? props.width ?? 32)
    return { width: s, height: s }
  }
  return {
    width: toUnit(props.width) ?? '100%',
    height: toUnit(props.height) ?? (props.shape === 'block' ? '96px' : '12px')
  }
})

const gridCols = computed(() => (props.cols >= 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : props.cols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'))

/** Ancho pseudoaleatorio pero determinista (sin saltos entre renders). */
const vary = (seed: number, base: number, range: number) => `${base + ((seed * 37) % range)}%`
const colWidth = (c: number) => `${50 + ((c * 29) % 60)}px`
</script>
