<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-center gap-3">
      <div>
        <h2 class="text-sm font-extrabold text-slate-800">Transacciones</h2>
        <p class="text-xs text-slate-500">Registra ingresos y egresos</p>
      </div>
      <button
        type="button"
        @click="$emit('create')"
        class="btn-primary btn-sm"
      >
        <i class="fas fa-plus text-[10px]"></i>
        Nueva transacción
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 shadow-sm">
      <div class="relative flex-1 min-w-[180px]">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Buscar por concepto..."
          class="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
        >
      </div>
      <div class="w-44">
        <CustomSelect
          v-model="typeFilter"
          :options="[
            { value: '', label: 'Todos los tipos' },
            { value: 'ingreso', label: 'Ingresos' },
            { value: 'egreso', label: 'Egresos' }
          ]"
          placeholder="Todos los tipos"
          size="sm"
        />
      </div>
      <input
        v-model="dateFilter"
        type="month"
        class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
      >
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <AppLoader label="Cargando transacciones…" :padded="false" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTransactions.length === 0" class="empty-state">
      <div class="empty-state__icon"><i class="fas fa-exchange-alt"></i></div>
      <p class="empty-state__title">No se encontraron transacciones</p>
    </div>

    <!-- Transactions List -->
    <div v-else class="space-y-3">
      <div
        v-for="transaction in filteredTransactions"
        :key="transaction._id"
        class="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:border-primary-200 hover:shadow-md transition-all"
      >
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <!-- Transaction Info -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div :class="[
              'w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center',
              transaction.tipo === 'ingreso'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : 'bg-red-50 border-red-100 text-red-600'
            ]">
              <i :class="[
                'text-sm',
                transaction.tipo === 'ingreso' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'
              ]"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-extrabold text-slate-800 truncate">{{ transaction.concepto }}</h3>
              <div class="flex flex-wrap gap-3 text-xs text-slate-500 mt-0.5">
                <span>
                  <i class="fas fa-calendar mr-1"></i>
                  {{ formatDate(transaction.fecha) }}
                </span>
                <span v-if="transaction.metodo">
                  <i class="fas fa-credit-card mr-1"></i>
                  {{ transaction.metodo }}
                </span>
                <span v-if="transaction.cliente_id">
                  <i class="fas fa-user mr-1"></i>
                  Cliente: {{ transaction.cliente_id }}
                </span>
              </div>
            </div>
          </div>

          <!-- Amount -->
          <div class="flex items-center gap-4">
            <div :class="[
              'text-right',
              transaction.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600'
            ]">
              <p class="text-lg font-black tabular-nums leading-none">
                {{ transaction.tipo === 'ingreso' ? '+' : '-' }}${{ formatCurrency(transaction.monto) }}
              </p>
              <p class="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{{ transaction.tipo }}</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button title="Editar transacción"
                type="button"
                @click="$emit('edit', transaction)"
                class="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-colors"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button title="Eliminar transacción"
                type="button"
                @click="$emit('delete', transaction._id!)"
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
import type { Transaction } from '../../services/accountingService'

interface Props {
  transactions: Transaction[]
  loading: boolean
}

const searchTerm = ref('')
const typeFilter = ref('')
const dateFilter = ref('')

const filteredTransactions = computed(() => {
  return props.transactions.filter(transaction => {
    const matchesSearch = transaction.concepto.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesType = !typeFilter.value || transaction.tipo === typeFilter.value
    const matchesDate = !dateFilter.value || 
      new Date(transaction.fecha).toISOString().slice(0, 7) === dateFilter.value
    
    return matchesSearch && matchesType && matchesDate
  })
})

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const props = defineProps<Props>()
</script>
