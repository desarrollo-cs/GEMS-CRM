<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <!-- Resumen Financiero -->
    <div class="lg:col-span-2">
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h3 class="text-sm font-extrabold text-slate-800 mb-4">Resumen Financiero</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Ingresos vs Egresos -->
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <h4 class="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">Flujo de Efectivo</h4>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-slate-600 flex items-center">
                  <i class="fas fa-arrow-up mr-2 text-emerald-500 text-xs"></i>
                  Ingresos
                </span>
                <span class="text-emerald-600 font-bold tabular-nums">
                  ${{ formatCurrency(summary.ingresos) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-600 flex items-center">
                  <i class="fas fa-arrow-down mr-2 text-red-500 text-xs"></i>
                  Egresos
                </span>
                <span class="text-red-600 font-bold tabular-nums">
                  ${{ formatCurrency(summary.egresos) }}
                </span>
              </div>
              <hr class="border-slate-200">
              <div class="flex justify-between items-center">
                <span class="text-slate-800 font-extrabold">Balance</span>
                <span :class="[
                  'font-black text-base tabular-nums',
                  summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
                ]">
                  ${{ formatCurrency(summary.balance) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Gastos Fijos -->
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <h4 class="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">Gastos Fijos</h4>
            <div class="space-y-2.5 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-slate-600 flex items-center">
                  <i class="fas fa-calendar-alt mr-2 text-amber-500 text-xs"></i>
                  Mensuales
                </span>
                <span class="text-amber-600 font-bold tabular-nums">
                  ${{ formatCurrency(summary.gastos_fijos_mensuales) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-600 flex items-center">
                  <i class="fas fa-calendar mr-2 text-amber-500 text-xs"></i>
                  Proyección Anual
                </span>
                <span class="text-amber-600 font-bold tabular-nums">
                  ${{ formatCurrency(summary.gastos_fijos_mensuales * 12) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-600 flex items-center">
                  <i class="fas fa-percentage mr-2 text-slate-400 text-xs"></i>
                  % del Balance
                </span>
                <span class="text-slate-700 font-bold tabular-nums">
                  {{ getFixedExpensePercentage() }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagos Pendientes -->
    <div>
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-sm font-extrabold text-slate-800">Pagos Pendientes</h3>
          <span class="bg-red-50 text-red-700 border border-red-100 rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums">
            {{ summary.pagos_pendientes.length }}
          </span>
        </div>

        <div v-if="summary.pagos_pendientes.length === 0" class="empty-state empty-state--sm">
          <div class="empty-state__icon bg-emerald-50 text-emerald-600"><i class="fas fa-check-circle"></i></div>
          <p class="empty-state__title">¡Todos los pagos al día!</p>
        </div>

        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="pago in summary.pagos_pendientes"
            :key="pago._id"
            class="p-3 bg-slate-50 border border-slate-100 rounded-xl"
          >
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-extrabold text-slate-800 truncate">{{ pago.concepto }}</h4>
                <p v-if="pago.cliente_id" class="text-xs text-slate-500">
                  <i class="fas fa-user mr-1"></i>
                  {{ getClientName(pago.cliente_id) }}
                </p>
                <p v-if="pago.proximo_pago" class="text-xs text-red-600 font-semibold">
                  <i class="fas fa-clock mr-1"></i>
                  Vence: {{ formatDate(pago.proximo_pago) }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-black text-red-600 tabular-nums">
                  ${{ formatCurrency(pago.monto) }}
                </p>
                <button
                  type="button"
                  @click="$emit('markAsPaid', pago)"
                  class="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 text-[11px] font-bold transition-colors"
                >
                  <i class="fas fa-check"></i>
                  Marcar pagado
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface SummaryData {
  ingresos: number
  egresos: number
  balance: number
  gastos_fijos_mensuales: number
  pagos_pendientes: any[]
}

interface Props {
  summary: SummaryData
}

const props = defineProps<Props>()

defineEmits<{
  markAsPaid: [pago: any]
}>()

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

const getClientName = (clientData: any): string => {
  if (typeof clientData === 'object' && clientData !== null) {
    return `${clientData.nombre || ''} ${clientData.apellido || ''}`.trim()
  }
  return 'Cliente no especificado'
}

const getFixedExpensePercentage = (): string => {
  if (props.summary.balance <= 0) return '0'
  const percentage = (props.summary.gastos_fijos_mensuales / Math.abs(props.summary.balance)) * 100
  return percentage.toFixed(1)
}
</script>
