<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-center gap-3">
      <div>
        <h2 class="text-sm font-extrabold text-slate-800">Pagos Recurrentes</h2>
        <p class="text-xs text-slate-500">Gestiona pagos mensuales de clientes</p>
      </div>
      <button
        type="button"
        @click="refreshPayments"
        class="btn-secondary btn-sm"
      >
        <i class="fas fa-sync-alt text-[10px]"></i>
        Actualizar
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <AppLoader label="Cargando pagos recurrentes…" :padded="false" />
    </div>

    <!-- Empty State -->
    <div v-else-if="payments.length === 0" class="empty-state">
      <div class="empty-state__icon"><i class="fas fa-calendar-check"></i></div>
      <p class="empty-state__title">No hay pagos recurrentes pendientes</p>
    </div>

    <!-- Payments List -->
    <div v-else class="space-y-3">
      <div
        v-for="payment in payments"
        :key="payment._id"
        class="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:border-primary-200 hover:shadow-md transition-all"
      >
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <!-- Payment Info -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <i class="fas fa-calendar-alt text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-extrabold text-slate-800 truncate">{{ payment.concepto }}</h3>
              <div class="flex flex-wrap gap-3 text-xs text-slate-500 mt-0.5">
                <span v-if="payment.cliente_id">
                  <i class="fas fa-user mr-1"></i>
                  {{ getClientName(payment.cliente_id) }}
                </span>
                <span>
                  <i class="fas fa-repeat mr-1"></i>
                  {{ formatFrequency(payment.frecuencia) }}
                </span>
                <span v-if="payment.proximo_pago">
                  <i class="fas fa-clock mr-1"></i>
                  Próximo: {{ formatDate(payment.proximo_pago) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Amount and Actions -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <!-- Amount -->
            <div class="text-right">
              <p class="text-lg font-black text-emerald-600 tabular-nums leading-none">
                ${{ formatCurrency(payment.monto) }}
              </p>
              <p class="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{{ formatFrequency(payment.frecuencia) }}</p>
            </div>

            <!-- Status Badge -->
            <div class="flex items-center gap-2">
              <span :class="[
                'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                getStatusClass(payment)
              ]">
                {{ getStatusText(payment) }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                type="button"
                @click="markAsPaid(payment)"
                :disabled="processingPayment === payment._id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <i v-if="processingPayment === payment._id" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-check"></i>
                Marcar pagado
              </button>
              <button title="Editar pago"
                type="button"
                @click="$emit('edit', payment)"
                class="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-colors"
              >
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Payment History (if available) -->
        <div v-if="payment.estado_pago === 'pagado'" class="mt-3 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
          <div class="flex items-center gap-2 text-emerald-700">
            <i class="fas fa-check-circle"></i>
            <span class="text-xs font-semibold">Último pago registrado: {{ formatDate(payment.fecha) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppLoader from '@/components/ui/AppLoader.vue'
import { ref, onMounted } from 'vue'
import { accountingService, type Transaction } from '../../services/accountingService'

defineEmits<{
  edit: [payment: Transaction]
  refresh: []
}>()

const payments = ref<Transaction[]>([])
const loading = ref(false)
const processingPayment = ref<string | null>(null)

const loadPayments = async () => {
  try {
    loading.value = true
    payments.value = await accountingService.getRecurringPayments()
  } catch (error) {
    console.error('Error loading recurring payments:', error)
  } finally {
    loading.value = false
  }
}

const refreshPayments = () => {
  loadPayments()
}

const markAsPaid = async (payment: Transaction) => {
  if (!payment._id) return
  
  try {
    processingPayment.value = payment._id
    await accountingService.markPaymentAsPaid(payment._id)
    await loadPayments() // Reload to get updated data
  } catch (error) {
    console.error('Error marking payment as paid:', error)
  } finally {
    processingPayment.value = null
  }
}

const getClientName = (clientData: any): string => {
  if (typeof clientData === 'object' && clientData !== null) {
    return `${clientData.nombre || ''} ${clientData.apellido || ''}`.trim()
  }
  return 'Cliente no especificado'
}

const formatFrequency = (frequency?: string): string => {
  const frequencies: Record<string, string> = {
    mensual: 'Mensual',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual'
  }
  return frequency ? frequencies[frequency] || frequency : 'No especificado'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const getStatusClass = (payment: Transaction): string => {
  if (!payment.proximo_pago) return 'bg-slate-50 text-slate-600 border-slate-200'
  
  const nextPayment = new Date(payment.proximo_pago)
  const today = new Date()
  const daysDiff = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff < 0) {
    return 'bg-red-50 text-red-700 border-red-100' // Vencido
  } else if (daysDiff <= 7) {
    return 'bg-amber-50 text-amber-700 border-amber-100' // Próximo a vencer
  } else {
    return 'bg-emerald-50 text-emerald-700 border-emerald-100' // Al día
  }
}

const getStatusText = (payment: Transaction): string => {
  if (!payment.proximo_pago) return 'Sin fecha'
  
  const nextPayment = new Date(payment.proximo_pago)
  const today = new Date()
  const daysDiff = Math.ceil((nextPayment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff < 0) {
    return `Vencido (${Math.abs(daysDiff)} días)`
  } else if (daysDiff <= 7) {
    return `Vence en ${daysDiff} días`
  } else {
    return 'Al día'
  }
}

onMounted(() => {
  loadPayments()
})

defineExpose({
  loadPayments,
  refreshPayments
})
</script>
