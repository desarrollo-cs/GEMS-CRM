<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 rounded-xl border border-purple-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-700">
        <h2 class="text-2xl font-bold text-white">
          {{ isEditing ? 'Editar Caso' : 'Nuevo Caso' }}
        </h2>
        <button title="Cerrar"
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Información básica -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Título *
            </label>
            <input
              v-model="form.titulo"
              type="text"
              required
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Título del caso"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Tipo *
            </label>
            <CustomSelect
              v-model="form.tipo"
              size="md"
              placeholder="Seleccionar tipo"
              :options="[{ value: '', label: 'Seleccionar tipo' }, { value: 'documento', label: 'Documento' }, { value: 'incidencia', label: 'Incidencia' }, { value: 'seguimiento', label: 'Seguimiento' }]"
            />
          </div>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-purple-200 mb-2">
            Descripción *
          </label>
          <textarea
            v-model="form.descripcion"
            required
            rows="4"
            class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Descripción detallada del caso"
          ></textarea>
        </div>

        <!-- Estado y Prioridad -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Estado *
            </label>
            <CustomSelect
              v-model="form.estado"
              size="md"
              :options="[{ value: 'abierto', label: 'Abierto' }, { value: 'en_progreso', label: 'En Progreso' }, { value: 'resuelto', label: 'Resuelto' }, { value: 'cerrado', label: 'Cerrado' }]"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Prioridad *
            </label>
            <CustomSelect
              v-model="form.prioridad"
              size="md"
              :options="[{ value: 'baja', label: 'Baja' }, { value: 'media', label: 'Media' }, { value: 'alta', label: 'Alta' }, { value: 'critica', label: 'Crítica' }]"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Progreso
            </label>
            <div class="flex items-center space-x-3">
              <input
                v-model.number="form.progreso"
                type="range"
                min="0"
                max="100"
                class="flex-1"
              >
              <span class="text-white min-w-[3rem]">{{ form.progreso }}%</span>
            </div>
          </div>
        </div>

        <!-- Cliente y Asignación -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Cliente
            </label>
            <CustomSelect
              v-model="form.cliente_id"
              size="md"
              searchable
              placeholder="Sin asignar"
              :options="clientOptions"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Asignado a
            </label>
            <CustomSelect
              v-model="form.asignado_a"
              size="md"
              searchable
              placeholder="Sin asignar"
              :options="teamMemberOptions"
            />
          </div>
        </div>

        <!-- Fechas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Fecha límite
            </label>
            <input
              v-model="form.fecha_limite"
              type="date"
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
          </div>

          <div v-if="form.estado === 'resuelto' || form.estado === 'cerrado'">
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Fecha de resolución
            </label>
            <input
              v-model="form.fecha_resolucion"
              type="date"
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
          </div>
        </div>

        <!-- Campos específicos para incidencias -->
        <div v-if="form.tipo === 'incidencia'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Gravedad
            </label>
            <CustomSelect
              :model-value="form.gravedad ?? ''"
              @update:model-value="form.gravedad = $event"
              size="md"
              placeholder="Seleccionar gravedad"
              :options="[{ value: '', label: 'Seleccionar gravedad' }, { value: 'menor', label: 'Menor' }, { value: 'moderada', label: 'Moderada' }, { value: 'mayor', label: 'Mayor' }, { value: 'critica', label: 'Crítica' }]"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Impacto
            </label>
            <CustomSelect
              :model-value="form.impacto ?? ''"
              @update:model-value="form.impacto = $event"
              size="md"
              placeholder="Seleccionar impacto"
              :options="[{ value: '', label: 'Seleccionar impacto' }, { value: 'bajo', label: 'Bajo' }, { value: 'medio', label: 'Medio' }, { value: 'alto', label: 'Alto' }]"
            />
          </div>
        </div>

        <!-- Categoría y Tags -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Categoría
            </label>
            <input
              v-model="form.categoria"
              type="text"
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Categoría del caso"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-purple-200 mb-2">
              Tags
            </label>
            <input
              v-model="tagsInput"
              @keyup.enter="addTag"
              type="text"
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Escribir tag y presionar Enter"
            >
            <div v-if="form.tags.length > 0" class="flex flex-wrap gap-2 mt-2">
              <span
                v-for="(tag, index) in form.tags"
                :key="index"
                class="bg-purple-600 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1"
              >
                <span>{{ tag }}</span>
                <button title="Quitar etiqueta"
                  @click="removeTag(index)"
                  type="button"
                  class="text-purple-200 hover:text-white"
                >
                  <i class="fas fa-times text-xs"></i>
                </button>
              </span>
            </div>
          </div>
        </div>

        <!-- Subida de archivos -->
        <div>
          <label class="block text-sm font-medium text-purple-200 mb-2">
            Subir archivos
          </label>
          <div class="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-6">
            <input
              ref="fileInput"
              type="file"
              multiple
              @change="handleFileSelect"
              class="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.zip,.rar"
            >
            <div class="text-center">
              <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-300 mb-2">Arrastra archivos aquí o</p>
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Seleccionar archivos
              </button>
              <p class="text-xs text-gray-500 mt-2">
                Máximo 10MB por archivo. Formatos: PDF, DOC, XLS, IMG, TXT, ZIP
              </p>
            </div>
          </div>

          <!-- Vista previa de archivos seleccionados -->
          <div v-if="selectedFiles.length > 0" class="mt-4">
            <h4 class="text-white font-medium mb-2">Archivos seleccionados:</h4>
            <div class="space-y-2">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="flex items-center justify-between bg-gray-800 rounded-lg p-3"
              >
                <div class="flex items-center space-x-3">
                  <i :class="getFileIcon(file.name)" class="text-lg"></i>
                  <div>
                    <p class="text-white text-sm">{{ file.name }}</p>
                    <p class="text-gray-400 text-xs">{{ formatFileSize(file.size) }}</p>
                  </div>
                </div>
                <button title="Quitar archivo"
                  @click="removeSelectedFile(index)"
                  type="button"
                  class="text-red-400 hover:text-red-300 transition-colors"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            @click="$emit('close')"
            class="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
          >
            <i v-if="submitting" class="fas fa-spinner fa-spin mr-2"></i>
            {{ isEditing ? 'Actualizar' : 'Crear' }} Caso
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { casesService, type Case } from '../services/casesService'
import CustomSelect from './ui/CustomSelect.vue'

// Props
const props = defineProps<{
  caseItem?: Case | null
}>()

// Emits
const emit = defineEmits<{
  close: []
  saved: []
}>()

// State
const submitting = ref(false)
const selectedFiles = ref<File[]>([])
const tagsInput = ref('')
const clients = ref<any[]>([])
const teamMembers = ref<any[]>([])

const clientOptions = computed(() => [
  { value: '', label: 'Sin asignar' },
  ...clients.value.map((client: any) => ({ value: client._id, label: `${client.nombre} - ${client.empresa}` }))
])
const teamMemberOptions = computed(() => [
  { value: '', label: 'Sin asignar' },
  ...teamMembers.value.map((member: any) => ({ value: member._id, label: `${member.name} - ${member.role}` }))
])

// Form data
const form = ref({
  titulo: '',
  descripcion: '',
  tipo: 'documento' as Case['tipo'],
  estado: 'abierto' as Case['estado'],
  prioridad: 'media' as Case['prioridad'],
  cliente_id: '',
  asignado_a: '',
  fecha_limite: '',
  fecha_resolucion: '',
  gravedad: '' as Case['gravedad'],
  impacto: '' as Case['impacto'],
  categoria: '',
  tags: [] as string[],
  progreso: 0
})

// Computed
const isEditing = computed(() => !!props.caseItem)

// Watchers
watch(() => props.caseItem, (newCase) => {
  if (newCase) {
    form.value = {
      titulo: newCase.titulo,
      descripcion: newCase.descripcion,
      tipo: newCase.tipo,
      estado: newCase.estado,
      prioridad: newCase.prioridad,
      cliente_id: newCase.cliente_id || '',
      asignado_a: newCase.asignado_a || '',
      fecha_limite: newCase.fecha_limite ? formatDateForInput(newCase.fecha_limite) : '',
      fecha_resolucion: newCase.fecha_resolucion ? formatDateForInput(newCase.fecha_resolucion) : '',
      gravedad: newCase.gravedad || undefined,
      impacto: newCase.impacto || undefined,
      categoria: newCase.categoria || '',
      tags: [...(newCase.tags || [])],
      progreso: newCase.progreso || 0
    }
  }
}, { immediate: true })

// Methods
const handleSubmit = async () => {
  try {
    submitting.value = true
    
    const caseData: Partial<Case> = {
      ...form.value,
      fecha_limite: form.value.fecha_limite ? new Date(form.value.fecha_limite) : undefined,
      fecha_resolucion: form.value.fecha_resolucion ? new Date(form.value.fecha_resolucion) : undefined
    }

    // Si hay archivos seleccionados, usar FormData
    if (selectedFiles.value.length > 0) {
      const formData = new FormData()
      
      // Agregar datos del caso como JSON string
      formData.append('titulo', caseData.titulo!)
      formData.append('descripcion', caseData.descripcion!)
      formData.append('tipo', caseData.tipo!)
      formData.append('estado', caseData.estado!)
      formData.append('prioridad', caseData.prioridad!)
      formData.append('progreso', caseData.progreso?.toString() || '0')
      
      if (caseData.cliente_id) formData.append('cliente_id', caseData.cliente_id)
      if (caseData.asignado_a) formData.append('asignado_a', caseData.asignado_a)
      if (caseData.fecha_limite) formData.append('fecha_limite', caseData.fecha_limite.toISOString())
      if (caseData.fecha_resolucion) formData.append('fecha_resolucion', caseData.fecha_resolucion.toISOString())
      if (caseData.gravedad) formData.append('gravedad', caseData.gravedad)
      if (caseData.impacto) formData.append('impacto', caseData.impacto)
      if (caseData.categoria) formData.append('categoria', caseData.categoria)
      
      // Agregar tags como JSON
      if (caseData.tags && caseData.tags.length > 0) {
        formData.append('tags', JSON.stringify(caseData.tags))
      }
      
      // Agregar archivos
      selectedFiles.value.forEach(file => {
        formData.append('archivos', file)
      })
      
      if (isEditing.value) {
        await casesService.update(props.caseItem!._id!, formData)
      } else {
        await casesService.create(formData)
      }
    } else {
      // Sin archivos, usar JSON normal
      if (isEditing.value) {
        await casesService.updateCase(props.caseItem!._id!, caseData)
      } else {
        await casesService.createCase(caseData)
      }
    }
    
    emit('saved')
  } catch (error) {
    console.error('Error saving case:', error)
  } finally {
    submitting.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
  }
}

const removeSelectedFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const addTag = () => {
  const tag = tagsInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagsInput.value = ''
  }
}

const removeTag = (index: number) => {
  form.value.tags.splice(index, 1)
}

const loadClients = async () => {
  try {
    // Aquí deberías cargar los clientes desde tu servicio
    // clients.value = await clientsService.getAllClients()
  } catch (error) {
    console.error('Error loading clients:', error)
  }
}

const loadTeamMembers = async () => {
  try {
    // Aquí deberías cargar los miembros del equipo desde tu servicio
    // teamMembers.value = await teamService.getAllMembers()
  } catch (error) {
    console.error('Error loading team members:', error)
  }
}

// Utilities
const formatDateForInput = (date: Date | string) => {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const createFileList = (files: File[]): FileList => {
  const dt = new DataTransfer()
  files.forEach(file => dt.items.add(file))
  return dt.files
}

const getFileIcon = (fileName: string) => {
  return casesService.getFileIcon(fileName)
}

const formatFileSize = (bytes: number) => {
  return casesService.formatFileSize(bytes)
}

onMounted(() => {
  loadClients()
  loadTeamMembers()
})
</script>
