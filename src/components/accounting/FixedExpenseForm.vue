<template>
  <!-- Modal Backdrop -->
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
    @click="closeModal"
  >
    <!-- Modal Content -->
    <div
      class="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b border-slate-100">
        <h2 class="text-sm font-extrabold text-slate-800">
          {{ editingExpense ? 'Editar Gasto Fijo' : 'Nuevo gasto fijo' }}
        </h2>
        <button title="Cerrar"
          type="button"
          @click="closeModal"
          class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
        <!-- Nombre -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Nombre del Gasto *
          </label>
          <input
            v-model="form.nombre"
            type="text"
            required
            placeholder="Ej: Arriendo oficina, Servicios públicos, etc."
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
          >
        </div>

        <!-- Monto Mensual -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Monto Mensual *
          </label>
          <div class="relative">
            <input
              v-model.number="form.monto_mensual"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              class="w-full px-3 py-2 pr-14 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
            >
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span class="text-slate-400 text-xs font-semibold">/ mes</span>
            </div>
          </div>
        </div>

        <!-- Estado -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Estado
          </label>
          <div class="space-y-2.5">
            <div class="flex items-center">
              <input
                v-model="form.activo"
                :value="true"
                type="radio"
                id="activo"
                name="estado"
                class="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500/30"
              >
              <label for="activo" class="ml-2.5 flex items-center">
                <span class="text-sm text-slate-700 font-medium">Activo</span>
                <span class="ml-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Se incluye en cálculos
                </span>
              </label>
            </div>
            <div class="flex items-center">
              <input
                v-model="form.activo"
                :value="false"
                type="radio"
                id="inactivo"
                name="estado"
                class="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500/30"
              >
              <label for="inactivo" class="ml-2.5 flex items-center">
                <span class="text-sm text-slate-700 font-medium">Inactivo</span>
                <span class="ml-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  No se incluye en cálculos
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Preview Card -->
        <div v-if="form.nombre && form.monto_mensual > 0"
             class="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <h3 class="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Vista Previa:</h3>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div :class="[
                'w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center',
                form.activo
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  : 'bg-white border-slate-200 text-slate-400'
              ]">
                <i :class="[
                  form.activo ? 'fas fa-check-circle' : 'fas fa-pause-circle'
                ]"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-extrabold text-slate-800 truncate">{{ form.nombre }}</p>
                <span :class="[
                  'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                  form.activo
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-white text-slate-600 border-slate-200'
                ]">
                  {{ form.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
            <div class="text-right shrink-0">
              <p class="text-lg font-black text-slate-800 tabular-nums leading-none">
                ${{ formatCurrency(form.monto_mensual) }}
              </p>
              <p class="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">por mes</p>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-2 pt-2">
          <button
            type="button"
            @click="closeModal"
            class="btn-secondary btn-sm flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary btn-sm flex-1"
          >
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin mr-2"></i>
              Guardando...
            </span>
            <span v-else>
              {{ editingExpense ? 'Actualizar' : 'Crear' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FixedExpense } from '../../services/accountingService'

interface Props {
  show: boolean
  editingExpense?: FixedExpense | null
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [expense: Omit<FixedExpense, '_id'>]
}>()

const form = ref({
  nombre: '',
  monto_mensual: 0,
  activo: true
})

const resetForm = () => {
  form.value = {
    nombre: '',
    monto_mensual: 0,
    activo: true
  }
}

const closeModal = () => {
  emit('close')
}

const handleSubmit = () => {
  const expenseData: Omit<FixedExpense, '_id'> = {
    nombre: form.value.nombre,
    monto_mensual: form.value.monto_mensual,
    activo: form.value.activo
  }
  
  emit('submit', expenseData)
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Watch for editing expense changes
watch(() => props.editingExpense, (newExpense) => {
  if (newExpense) {
    form.value = {
      nombre: newExpense.nombre,
      monto_mensual: newExpense.monto_mensual,
      activo: newExpense.activo
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal show/hide
watch(() => props.show, (newShow) => {
  if (newShow && !props.editingExpense) {
    resetForm()
  }
})
</script>
