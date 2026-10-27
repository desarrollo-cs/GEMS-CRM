<template>
  <div class="p-6">
    <!-- Header -->
  <!-- ...existing code... -->

    <!-- Tabs -->
    <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-purple-500/20">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-px',
            activeTab === tab.id
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          ]"
        >
          <i :class="tab.icon" class="mr-2"></i>
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <!-- Total Ingresos -->
      <div class="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl p-6 border border-green-500/20">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-green-400 text-sm font-medium">Ingresos Totales</p>
            <p class="text-2xl font-bold text-white">${{ formatCurrency(totalIngresos) }}</p>
          </div>
          <div class="p-3 bg-green-500/20 rounded-full">
            <i class="fas fa-arrow-up text-green-400 text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Total Egresos -->
      <div class="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-2xl p-6 border border-red-500/20">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-red-400 text-sm font-medium">Egresos Totales</p>
            <p class="text-2xl font-bold text-white">${{ formatCurrency(totalEgresos) }}</p>
          </div>
          <div class="p-3 bg-red-500/20 rounded-full">
            <i class="fas fa-arrow-down text-red-400 text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Balance -->
      <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-blue-400 text-sm font-medium">Balance Neto</p>
            <p :class="[
              'text-2xl font-bold',
              balance >= 0 ? 'text-white' : 'text-red-400'
            ]">${{ formatCurrency(balance) }}</p>
          </div>
          <div class="p-3 bg-blue-500/20 rounded-full">
            <i class="fas fa-balance-scale text-blue-400 text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Pagos Pendientes -->
      <div class="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-2xl p-6 border border-yellow-500/20">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-yellow-400 text-sm font-medium">Pagos Pendientes</p>
            <p class="text-2xl font-bold text-white">{{ summaryData.pagos_pendientes.length }}</p>
          </div>
          <div class="p-3 bg-yellow-500/20 rounded-full">
            <i class="fas fa-clock text-yellow-400 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="activeTab === 'summary'" class="motion-content-in">
      <AccountingSummary 
        :summary="summaryData"
        @markAsPaid="markRecurringPaymentAsPaid"
      />
    </div>

    <div v-else-if="activeTab === 'transactions'" class="motion-content-in">
      <TransactionsList 
        :transactions="transactions"
        :loading="loading"
        @create="openTransactionForm"
        @edit="editTransaction"
        @delete="deleteTransaction"
        @refresh="loadTransactions"
      />
    </div>

    <div v-else-if="activeTab === 'fixed-expenses'" class="motion-content-in">
      <FixedExpensesList 
        :expenses="fixedExpenses"
        :loading="loading"
        @create="openFixedExpenseForm"
        @edit="editFixedExpense"
        @delete="deleteFixedExpense"
        @refresh="loadFixedExpenses"
        @toggleStatus="toggleExpenseStatus"
      />
    </div>

    <div v-else-if="activeTab === 'recurring-payments'" class="motion-content-in">
      <RecurringPaymentsList 
        ref="recurringPaymentsRef"
        @edit="editRecurringPayment"
        @refresh="loadData"
      />
    </div>

    <!-- Transaction Form Modal -->
    <TransactionForm 
      :show="showTransactionForm"
      :editingTransaction="editingTransaction"
      :loading="formLoading"
      @close="closeTransactionForm"
      @submit="handleTransactionSubmit"
    />

    <!-- Fixed Expense Form Modal -->
    <FixedExpenseForm 
      :show="showFixedExpenseForm"
      :editingExpense="editingFixedExpense"
      :loading="formLoading"
      @close="closeFixedExpenseForm"
      @submit="handleFixedExpenseSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { accountingService, type Transaction, type FixedExpense } from '../services/accountingService'
import TransactionsList from './accounting/TransactionsList.vue'
import FixedExpensesList from './accounting/FixedExpensesList.vue'
import RecurringPaymentsList from './accounting/RecurringPaymentsList.vue'
import AccountingSummary from './accounting/AccountingSummary.vue'
import TransactionForm from './accounting/TransactionForm.vue'
import FixedExpenseForm from './accounting/FixedExpenseForm.vue'
import { useNotifications } from '../composables/useNotifications'

// Composables
const { showSuccess, showError, confirmDelete, showLoading, closeLoading } = useNotifications()

const activeTab = ref('summary')
const loading = ref(false)
const formLoading = ref(false)

// Data
const transactions = ref<Transaction[]>([])
const fixedExpenses = ref<FixedExpense[]>([])
const summaryData = ref({
  ingresos: 0,
  egresos: 0,
  balance: 0,
  gastos_fijos_mensuales: 0,
  pagos_pendientes: []
})

// Modals
const showTransactionForm = ref(false)
const showFixedExpenseForm = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const editingFixedExpense = ref<FixedExpense | null>(null)

// Refs
const recurringPaymentsRef = ref(null)

const tabs = [
  { id: 'summary', name: 'Resumen', icon: 'fas fa-chart-pie' },
  { id: 'transactions', name: 'Transacciones', icon: 'fas fa-exchange-alt' },
  { id: 'fixed-expenses', name: 'Gastos Fijos', icon: 'fas fa-calendar-check' },
  { id: 'recurring-payments', name: 'Pagos Recurrentes', icon: 'fas fa-repeat' }
]

// Computed
const totalIngresos = computed(() => {
  return summaryData.value.ingresos
})

const totalEgresos = computed(() => {
  return summaryData.value.egresos
})

const balance = computed(() => {
  return summaryData.value.balance
})

const totalGastosFijos = computed(() => {
  return summaryData.value.gastos_fijos_mensuales
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const loadTransactions = async () => {
  try {
    loading.value = true
    transactions.value = await accountingService.getAllTransactions()
  } catch (error) {
    console.error('Error loading transactions:', error)
  } finally {
    loading.value = false
  }
}

const loadFixedExpenses = async () => {
  try {
    loading.value = true
    fixedExpenses.value = await accountingService.getAllFixedExpenses()
  } catch (error) {
    console.error('Error loading fixed expenses:', error)
  } finally {
    loading.value = false
  }
}

const loadSummary = async () => {
  try {
    summaryData.value = await accountingService.getSummary()
  } catch (error) {
    console.error('Error loading summary:', error)
  }
}

const loadData = async () => {
  await Promise.all([loadTransactions(), loadFixedExpenses(), loadSummary()])
}

// Transaction methods
const openTransactionForm = () => {
  editingTransaction.value = null
  showTransactionForm.value = true
}

const editTransaction = (transaction: Transaction) => {
  editingTransaction.value = transaction
  showTransactionForm.value = true
}

const closeTransactionForm = () => {
  showTransactionForm.value = false
  editingTransaction.value = null
}

const handleTransactionSubmit = async (transactionData: Omit<Transaction, '_id'>) => {
  try {
    formLoading.value = true
    if (editingTransaction.value) {
      await accountingService.updateTransaction(editingTransaction.value._id!, transactionData)
      showSuccess('¡Transacción actualizada!', 'La transacción ha sido actualizada exitosamente')
    } else {
      await accountingService.createTransaction(transactionData)
      showSuccess('¡Transacción creada!', 'La transacción ha sido creada exitosamente')
    }
    closeTransactionForm()
    loadData() // Cargar todo incluyendo summary
  } catch (error) {
    showError('Error al guardar transacción', error instanceof Error ? error.message : 'Error desconocido')
  } finally {
    formLoading.value = false
  }
}

const deleteTransaction = async (id: string) => {
  const transaction = transactions.value.find(t => t._id === id)
  const transactionName = transaction?.concepto || 'esta transacción'
  
  const result = await confirmDelete(transactionName, 'transacción')
  
  if (result.isConfirmed) {
    try {
      showLoading('Eliminando transacción...')
      await accountingService.deleteTransaction(id)
      loadData() // Cargar todo incluyendo summary
      closeLoading()
      showSuccess('¡Transacción eliminada!', 'La transacción ha sido eliminada exitosamente')
    } catch (error) {
      closeLoading()
      showError('Error al eliminar transacción', error instanceof Error ? error.message : 'Error desconocido')
    }
  }
}

// Fixed Expense methods
const openFixedExpenseForm = () => {
  editingFixedExpense.value = null
  showFixedExpenseForm.value = true
}

const editFixedExpense = (expense: FixedExpense) => {
  editingFixedExpense.value = expense
  showFixedExpenseForm.value = true
}

const closeFixedExpenseForm = () => {
  showFixedExpenseForm.value = false
  editingFixedExpense.value = null
}

const handleFixedExpenseSubmit = async (expenseData: Omit<FixedExpense, '_id'>) => {
  try {
    formLoading.value = true
    if (editingFixedExpense.value) {
      await accountingService.updateFixedExpense(editingFixedExpense.value._id!, expenseData)
      showSuccess('¡Gasto fijo actualizado!', 'El gasto fijo ha sido actualizado exitosamente')
    } else {
      await accountingService.createFixedExpense(expenseData)
      showSuccess('¡Gasto fijo creado!', 'El gasto fijo ha sido creado exitosamente')
    }
    closeFixedExpenseForm()
    loadData() // Cargar todo incluyendo summary
  } catch (error) {
    showError('Error al guardar gasto fijo', error instanceof Error ? error.message : 'Error desconocido')
  } finally {
    formLoading.value = false
  }
}

const deleteFixedExpense = async (id: string) => {
  const expense = fixedExpenses.value.find(e => e._id === id)
  const expenseName = expense?.concepto || 'este gasto fijo'
  
  const result = await confirmDelete(expenseName, 'gasto fijo')
  
  if (result.isConfirmed) {
    try {
      showLoading('Eliminando gasto fijo...')
      await accountingService.deleteFixedExpense(id)
      loadData() // Cargar todo incluyendo summary
      closeLoading()
      showSuccess('¡Gasto fijo eliminado!', 'El gasto fijo ha sido eliminado exitosamente')
    } catch (error) {
      closeLoading()
      showError('Error al eliminar gasto fijo', error instanceof Error ? error.message : 'Error desconocido')
    }
  }
}

const toggleExpenseStatus = async (expense: FixedExpense) => {
  try {
    const updatedExpense = { ...expense, activo: !expense.activo }
    await accountingService.updateFixedExpense(expense._id!, updatedExpense)
    loadData() // Cargar todo incluyendo summary
  } catch (error) {
    console.error('Error toggling expense status:', error)
  }
}

// Recurring Payment methods
const editRecurringPayment = (payment: Transaction) => {
  editingTransaction.value = payment
  showTransactionForm.value = true
}

const markRecurringPaymentAsPaid = async (payment: any) => {
  if (!payment._id) return
  
  try {
    await accountingService.markPaymentAsPaid(payment._id)
    loadData() // Recargar todo incluyendo summary
  } catch (error) {
    console.error('Error marking payment as paid:', error)
  }
}

onMounted(() => {
  loadData()
})

defineExpose({
  loadData,
  loadTransactions,
  loadFixedExpenses,
  loadSummary
})
</script>
