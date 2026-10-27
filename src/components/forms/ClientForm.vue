<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Información básica -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Nombre Completo *
        </label>
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Ej: Juan Pérez"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Email *
        </label>
        <input
          v-model="form.email"
          type="email"
          required
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Ej: juan@empresa.com"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Teléfono
        </label>
        <input
          v-model="form.phone"
          type="tel"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Ej: +1 234 567 8900"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Empresa
        </label>
        <input
          v-model="form.company"
          type="text"
          class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Ej: ABC Corp"
        />
      </div>
    </div>

    <!-- Estado -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">
        Estado
      </label>
      <CustomSelect
        :model-value="form.status ?? ''"
        @update:model-value="form.status = $event"
        :options="[
          { value: 'prospect', label: 'Prospecto' },
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' }
        ]"
        size="md"
      />
    </div>

    <!-- Dirección -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">
        Dirección
      </label>
      <textarea
        v-model="form.address"
        rows="3"
        class="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
        placeholder="Dirección completa del cliente"
      ></textarea>
    </div>

    <!-- Error message -->
    <div v-if="error" class="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-6 py-3 text-gray-400 hover:text-white transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        :disabled="loading"
        class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/25"
      >
        <span v-if="loading" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Guardando...
        </span>
        <span v-else>
          {{ mode === 'create' ? 'Crear Cliente' : 'Actualizar Cliente' }}
        </span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import CustomSelect from '../ui/CustomSelect.vue'
import { clientService, type ClientData } from '../../services/clientService'

// Props
const props = defineProps<{
  item?: ClientData | null
  mode: 'create' | 'edit'
}>()

// Emits
const emit = defineEmits(['save', 'cancel'])

// Reactive data
const loading = ref(false)
const error = ref('')

const form = reactive<Partial<ClientData>>({
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'prospect',
  address: ''
})

// Methods
const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    if (props.mode === 'create') {
      await clientService.create({
        name: form.name!,
        email: form.email!,
        phone: form.phone,
        company: form.company,
        status: form.status || 'prospect',
        address: form.address
      })
    } else if (props.item?._id) {
      await clientService.update(props.item._id, form)
    }

    emit('save')
  } catch (err: any) {
    error.value = err.message || 'Error al guardar el cliente'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'prospect',
    address: ''
  })
}

const loadForm = () => {
  if (props.item && props.mode === 'edit') {
    Object.assign(form, {
      name: props.item.name || '',
      email: props.item.email || '',
      phone: props.item.phone || '',
      company: props.item.company || '',
      status: props.item.status || 'prospect',
      address: props.item.address || ''
    })
  } else {
    resetForm()
  }
}

// Load form data on mount
onMounted(() => {
  loadForm()
})

// Watch for changes in props
watch(() => props.item, () => {
  loadForm()
})

watch(() => props.mode, () => {
  loadForm()
})
</script>
