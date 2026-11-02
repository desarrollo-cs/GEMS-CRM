<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-center gap-3">
      <div>
        <h2 class="text-sm font-extrabold text-slate-800">Gastos Fijos</h2>
        <p class="text-xs text-slate-500">Administra gastos recurrentes mensuales</p>
      </div>
      <button
        type="button"
        @click="$emit('create')"
        class="btn-primary btn-sm"
      >
        <i class="fas fa-plus text-[10px]"></i>
        Nuevo gasto fijo
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 shadow-sm">
      <div class="relative flex-1 min-w-[180px]">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por nombre..."
          class="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
        >
      </div>
      <div class="w-44">
        <CustomSelect
          v-model="statusFilter"
          :options="[
            { value: '', label: 'Todos los estados' },
            { value: 'true', label: 'Activos' },
            { value: 'false', label: 'Inactivos' }
          ]"
          placeholder="Todos los estados"
          size="sm"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <AppLoader label="Cargando gastos fijos…" :padded="false" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredExpenses.length === 0" class="empty-state">
      <div class="empty-state__icon"><i class="fas fa-repeat"></i></div>
      <p class="empty-state__title">No se encontraron gastos fijos</p>
    </div>

    <!-- Summary Card -->
    <div v-else class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div class="text-center">
        <h3 class="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Total Gastos Fijos Activos</h3>
        <p class="text-2xl font-black text-slate-800 tabular-nums leading-none">
          ${{ formatCurrency(totalActiveExpenses) }} <span class="text-sm font-bold text-slate-400">/ mes</span>
        </p>
        <p class="text-xs text-slate-500 mt-2">
          {{ activeExpensesCount }} gastos activos de {{ filteredExpenses.length }} totales
        </p>
      </div>
    </div>

    <!-- Expenses List -->
    <div class="space-y-3">
      <div
        v-for="expense in filteredExpenses"
        :key="expense._id"
        class="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:border-primary-200 hover:shadow-md transition-all"
      >
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <!-- Expense Info -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div :class="[
              'w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center',
              expense.activo
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            ]">
              <i :class="[
                'text-sm',
                expense.activo ? 'fas fa-check-circle' : 'fas fa-pause-circle'
              ]"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-extrabold text-slate-800 truncate">{{ expense.nombre }}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span :class="[
                  'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                  expense.activo
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                ]">
                  {{ expense.activo ? 'Activo' : 'Inactivo' }}
                </span>
                <span class="text-slate-500 text-xs">Mensual</span>
              </div>
            </div>
          </div>

          <!-- Amount -->
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-lg font-black text-slate-800 tabular-nums leading-none">
                ${{ formatCurrency(expense.monto_mensual) }}
              </p>
              <p class="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">por mes</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                type="button"
                @click="toggleStatus(expense)"
                :class="[
                  'w-8 h-8 inline-flex items-center justify-center rounded-lg border transition-colors',
                  expense.activo
                    ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                ]"
                :title="expense.activo ? 'Desactivar' : 'Activar'"
              >
                <i :class="expense.activo ? 'fas fa-pause' : 'fas fa-play'"></i>
              </button>
              <button title="Editar gasto"
                type="button"
                @click="$emit('edit', expense)"
                class="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-colors"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button title="Eliminar gasto"
                type="button"
                @click="$emit('delete', expense._id!)"
                class="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppLoader from '@/components/ui/AppLoader.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import { ref, computed } from 'vue'
import type { FixedExpense } from '../../services/accountingService'

interface Props {
  expenses: FixedExpense[]
  loading: boolean
}

const searchTerm = ref('')
const statusFilter = ref('')

const filteredExpenses = computed(() => {
  return props.expenses.filter(expense => {
    const matchesSearch = expense.nombre.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesStatus = statusFilter.value === '' || 
      expense.activo.toString() === statusFilter.value
    
    return matchesSearch && matchesStatus
  })
})

const totalActiveExpenses = computed(() => {
  return filteredExpenses.value
    .filter(expense => expense.activo)
    .reduce((total, expense) => total + expense.monto_mensual, 0)
})

const activeExpensesCount = computed(() => {
  return filteredExpenses.value.filter(expense => expense.activo).length
})

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const toggleStatus = (expense: FixedExpense) => {
  emit('toggleStatus', expense)
}

const props = defineProps<Props>()
const emit = defineEmits<{
  create: []
  edit: [expense: FixedExpense]
  delete: [id: string]
  refresh: []
  toggleStatus: [expense: FixedExpense]
}>()
</script>
