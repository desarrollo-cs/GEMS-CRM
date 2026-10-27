<template>
  <div class="relative" ref="selectContainer" @keydown="onKeydown">
    <!-- Disparador (mismo lenguaje que .select de la plataforma CT) -->
    <button
      type="button"
      ref="triggerButton"
      @click="toggle"
      :disabled="disabled"
      role="combobox"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-controls="listId"
      :aria-activedescendant="isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      :class="[
        'w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-800 hover:border-slate-300 focus:outline-none focus-visible:bg-white focus-visible:border-primary-600 focus-visible:shadow-ring transition-all duration-200 flex items-center justify-between group',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'dense' ? 'px-3.5 py-2.5 text-xs' : 'px-3.5 py-[9px] text-[13.5px]',
        { 'bg-white border-primary-600 shadow-ring': isOpen },
        { 'opacity-60 cursor-not-allowed bg-slate-100 hover:border-slate-200': disabled }
      ]"
    >
      <div class="flex items-center gap-2 truncate">
        <span v-if="selectedOption?.icon" v-html="selectedOption.icon" class="text-slate-400 group-hover:text-slate-500 transition-colors"></span>
        <transition name="fade" mode="out-in">
          <span
            :key="String(selectedOption?.value ?? '__placeholder')"
            :class="[selectedOption?.specialClass || 'font-medium truncate', !selectedOption ? 'text-slate-400' : '']"
          >
            {{ selectedOption?.label || placeholder }}
          </span>
        </transition>
      </div>
      <svg
        v-if="!loading"
        class="w-3.5 h-3.5 shrink-0 ml-2 text-slate-400 transition-all duration-300 ease-out group-hover:text-slate-500"
        :class="{ 'rotate-180 text-primary-600': isOpen }"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
      ><path d="M6 9l6 6 6-6" /></svg>
      <span v-else class="w-3.5 h-3.5 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin shrink-0 ml-2"></span>
    </button>

    <!-- Menú (cs-menu de CT: 16px, borde suave, sombra flotante, entrada menuIn) -->
    <transition name="pop">
      <div
        v-if="isOpen"
        class="absolute z-50 w-full min-w-[180px] mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-menu overflow-hidden flex flex-col"
      >
        <!-- Buscador -->
        <div v-if="searchable" class="p-2 border-b border-slate-100">
          <div class="relative">
            <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Buscar…"
              autocomplete="off"
              aria-label="Buscar opción"
              class="w-full pl-7 pr-7 py-[7px] bg-slate-50 border border-slate-200 rounded-[10px] text-[12.5px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
              @click.stop
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
              @click.stop="searchQuery = ''"
              tabindex="-1"
              aria-label="Limpiar búsqueda"
            >
              <i class="fas fa-times text-[8px]"></i>
            </button>
          </div>
        </div>

        <ul
          :id="listId"
          ref="listEl"
          role="listbox"
          class="max-h-[300px] overflow-y-auto p-1 custom-scrollbar"
        >
          <li
            v-if="filteredOptions.length === 0"
            class="px-3 py-2.5 text-xs italic text-slate-400 text-center"
          >
            Sin resultados
          </li>
          <li
            v-for="(option, idx) in filteredOptions"
            :key="String(option.value)"
            :id="optionId(idx)"
            role="option"
            :aria-selected="option.value === modelValue"
            @click="selectOption(option)"
            @mousemove="activeIndex = idx"
            :class="[
              'rounded-xl cursor-pointer transition-colors duration-100 flex items-center justify-between gap-2.5 group/item select-none whitespace-nowrap',
              size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-[9px]',
              option.value === modelValue
                ? 'bg-primary-50 text-primary-700 font-semibold'
                : activeIndex === idx
                  ? 'bg-slate-50 text-slate-900'
                  : 'text-slate-800'
            ]"
          >
            <div class="flex items-center gap-2 truncate">
              <span v-if="option.icon" v-html="option.icon" :class="option.value === modelValue ? 'text-primary-600' : 'text-slate-400 group-hover/item:text-slate-600'"></span>
              <span :class="[
                option.specialClass || (option.value === modelValue ? 'font-semibold' : 'font-medium'),
                size === 'sm' ? 'text-xs' : 'text-[13px]'
              ]">{{ option.label }}</span>
            </div>

            <svg
              v-if="option.value === modelValue"
              class="w-3.5 h-3.5 shrink-0 text-primary-600 motion-pop"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            ><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface SelectOption {
  value: string | number | null
  label: string
  icon?: string
  specialClass?: string
}

const props = withDefaults(defineProps<{
  modelValue: string | number | null
  options: SelectOption[]
  placeholder?: string
  // dense: misma altura que md con texto más pequeño (formularios densos)
  size?: 'sm' | 'md' | 'dense'
  searchable?: boolean
  disabled?: boolean
  loading?: boolean
}>(), {
  placeholder: 'Seleccionar...',
  size: 'md',
  searchable: false,
  disabled: false,
  loading: false
})

const emit = defineEmits(['update:modelValue', 'change'])

const uid = `cs-${Math.random().toString(36).slice(2, 9)}`
const listId = `${uid}-list`
const optionId = (idx: number) => `${uid}-opt-${idx}`

const isOpen = ref(false)
const searchQuery = ref('')
const activeIndex = ref(-1)
const selectContainer = ref<HTMLElement | null>(null)
const triggerButton = ref<HTMLButtonElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(opt => opt.label.toLowerCase().includes(q))
})

const toggle = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const selectOption = (option: SelectOption) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
  searchQuery.value = ''
  triggerButton.value?.focus()
}

const scrollActiveIntoView = () => {
  nextTick(() => {
    const el = listEl.value?.querySelector<HTMLElement>(`#${optionId(activeIndex.value)}`)
    el?.scrollIntoView({ block: 'nearest' })
  })
}

const moveActive = (delta: number) => {
  const n = filteredOptions.value.length
  if (n === 0) return
  const next = activeIndex.value < 0
    ? (delta > 0 ? 0 : n - 1)
    : (activeIndex.value + delta + n) % n
  activeIndex.value = next
  scrollActiveIntoView()
}

// Escribir letras (sin buscador): salta a la primera opción que empiece así
let typeahead = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | null = null
const typeaheadJump = (char: string) => {
  typeahead += char.toLowerCase()
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => { typeahead = '' }, 600)
  const idx = filteredOptions.value.findIndex(o => o.label.toLowerCase().startsWith(typeahead))
  if (idx >= 0) {
    activeIndex.value = idx
    scrollActiveIntoView()
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return
  const inSearch = e.target === searchInput.value

  if (!isOpen.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      isOpen.value = true
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      isOpen.value = true
      nextTick(() => typeaheadJump(e.key))
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault(); moveActive(1); break
    case 'ArrowUp':
      e.preventDefault(); moveActive(-1); break
    case 'Home':
      if (inSearch) return
      e.preventDefault(); activeIndex.value = 0; scrollActiveIntoView(); break
    case 'End':
      if (inSearch) return
      e.preventDefault(); activeIndex.value = filteredOptions.value.length - 1; scrollActiveIntoView(); break
    case 'Enter':
      e.preventDefault()
      if (activeIndex.value >= 0 && filteredOptions.value[activeIndex.value]) {
        selectOption(filteredOptions.value[activeIndex.value])
      }
      break
    case 'Escape':
      e.preventDefault(); e.stopPropagation()
      isOpen.value = false
      triggerButton.value?.focus()
      break
    case 'Tab':
      isOpen.value = false
      break
    default:
      if (!inSearch && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        typeaheadJump(e.key)
      }
  }
}

watch(isOpen, (val) => {
  if (val) {
    const idx = filteredOptions.value.findIndex(o => o.value === props.modelValue)
    activeIndex.value = idx
    if (props.searchable) nextTick(() => searchInput.value?.focus())
    if (idx >= 0) scrollActiveIntoView()
  } else {
    searchQuery.value = ''
    activeIndex.value = -1
  }
})

watch(searchQuery, () => {
  // Al filtrar, la primera coincidencia queda lista para Enter
  activeIndex.value = filteredOptions.value.length ? 0 : -1
})

const handleClickOutside = (event: MouseEvent) => {
  if (selectContainer.value && !selectContainer.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.7);
}
</style>
