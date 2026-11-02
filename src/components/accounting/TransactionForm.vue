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
          {{ editingTransaction ? 'Editar Transacción' : 'Nueva transacción' }}
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
        <!-- Tipo -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Tipo de Transacción *
          </label>
          <CustomSelect
            v-model="form.tipo"
            :options="[
              { value: '', label: 'Seleccionar tipo' },
              { value: 'ingreso', label: 'Ingreso' },
              { value: 'egreso', label: 'Egreso' }
            ]"
            placeholder="Seleccionar tipo"
            size="md"
          />
        </div>

        <!-- Concepto -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Concepto *
          </label>
          <input
            v-model="form.concepto"
            type="text"
            required
            placeholder="Descripción de la transacción"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
          >
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Monto *
          </label>
          <input
            v-model.number="form.monto"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
          >
        </div>

        <!-- Fecha -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Fecha *
          </label>
          <input
            v-model="form.fecha"
            type="date"
            required
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
          >
        </div>

        <!-- Método de Pago -->
        <div>
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Método de Pago
          </label>
          <CustomSelect
            v-model="form.metodo"
            :options="[
              { value: '', label: 'Seleccionar método' },
              { value: 'efectivo', label: 'Efectivo' },
              { value: 'transferencia', label: 'Transferencia' },
              { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
              { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'pse', label: 'PSE' },
              { value: 'nequi', label: 'Nequi' },
              { value: 'daviplata', label: 'Daviplata' }
            ]"
            placeholder="Seleccionar método"
            size="md"
          />
        </div>

        <!-- Cliente (solo si hay clientes disponibles) -->
        <div v-if="clients.length > 0">
          <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            Cliente (opcional)
          </label>
          <CustomSelect
            v-model="form.cliente_id"
            :options="clientOptions"
            placeholder="Sin cliente asignado"
            size="md"
            searchable
          />
        </div>

        <!-- Pago Recurrente (solo para ingresos) -->
        <div v-if="form.tipo === 'ingreso'">
          <div class="flex items-center mb-3">
            <input
              v-model="form.es_recurrente"
              type="checkbox"
              id="es_recurrente"
              class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30"
            >
            <label for="es_recurrente" class="ml-2.5 text-sm text-slate-700 font-medium">
              Es un pago recurrente
            </label>
          </div>

          <!-- Frecuencia (solo si es recurrente) -->
          <div v-if="form.es_recurrente">
            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Frecuencia de Pago *
            </label>
            <CustomSelect
              v-model="form.frecuencia"
              :options="[
                { value: '', label: 'Seleccionar frecuencia' },
                { value: 'mensual', label: 'Mensual' },
                { value: 'trimestral', label: 'Trimestral' },
                { value: 'semestral', label: 'Semestral' },
                { value: 'anual', label: 'Anual' }
              ]"
              placeholder="Seleccionar frecuencia"
              size="md"
            />
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
              {{ editingTransaction ? 'Actualizar' : 'Crear' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import type { Transaction } from '../../services/accountingService'
import { clientService, type Client } from '../../services/clientService'

interface Props {
  show: boolean
  editingTransaction?: Transaction | null
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: [transaction: Omit<Transaction, '_id'>]
}>()

const clients = ref<Client[]>([])

const clientOptions = computed(() => [
  { value: '', label: 'Sin cliente asignado' },
  ...clients.value.map((client: Client) => ({
    value: client._id,
    label: `${client.nombre} ${client.apellido}`
  }))
])

const form = ref({
  tipo: '' as 'ingreso' | 'egreso' | '',
  concepto: '',
  monto: 0,
  fecha: '',
  metodo: '',
  cliente_id: '',
  es_recurrente: false,
  frecuencia: '',
  estado_pago: 'pendiente'
})

const resetForm = () => {
  form.value = {
    tipo: '',
    concepto: '',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    metodo: '',
    cliente_id: '',
    es_recurrente: false,
    frecuencia: '',
    estado_pago: 'pendiente'
  }
}

const closeModal = () => {
  emit('close')
}

const handleSubmit = () => {
  const transactionData: Omit<Transaction, '_id'> = {
    tipo: form.value.tipo as 'ingreso' | 'egreso',
    concepto: form.value.concepto,
    monto: form.value.monto,
    fecha: form.value.fecha,
    metodo: form.value.metodo || undefined,
    cliente_id: form.value.cliente_id || undefined,
    es_recurrente: form.value.es_recurrente,
    frecuencia: form.value.es_recurrente ? form.value.frecuencia : undefined,
    estado_pago: form.value.estado_pago as 'pendiente' | 'pagado' | 'vencido'
  }
  
  emit('submit', transactionData)
}

const loadClients = async () => {
  try {
    clients.value = await clientService.getClients()
  } catch (error) {
    console.error('Error loading clients:', error)
    clients.value = []
  }
}

// Watch for editing transaction changes
watch(() => props.editingTransaction, (newTransaction) => {
  if (newTransaction) {
    form.value = {
      tipo: newTransaction.tipo,
      concepto: newTransaction.concepto,
      monto: newTransaction.monto,
      fecha: newTransaction.fecha,
      metodo: newTransaction.metodo || '',
      cliente_id: newTransaction.cliente_id || '',
      es_recurrente: newTransaction.es_recurrente || false,
      frecuencia: newTransaction.frecuencia || '',
      estado_pago: newTransaction.estado_pago || 'pendiente'
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal show/hide
watch(() => props.show, (newShow) => {
  if (newShow && !props.editingTransaction) {
    resetForm()
  }
})

onMounted(() => {
  loadClients()
  resetForm()
})
</script>
